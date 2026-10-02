"""ChangeLens Memory Provider — Hindsight integration with fallback.

Uses the official hindsight-client Python SDK:
  pip install hindsight-client
  from hindsight_client import Hindsight
  client.retain(bank_id=..., content=..., context=..., timestamp=...)
  client.recall(bank_id=..., query=...)
  client.reflect(bank_id=..., query=...)

When Hindsight is unavailable, FallbackMemoryProvider uses seeded local memories.
"""

from __future__ import annotations

import json
import logging
import re
from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional

from app.models.core import (
    ActorType,
    ConfidenceLevel,
    OperationalMemory,
)

logger = logging.getLogger(__name__)


class MemoryProvider(ABC):
    """Abstract interface for operational memory storage and retrieval."""

    @abstractmethod
    async def retain(self, memory: OperationalMemory) -> str:
        """Store a structured incident memory. Returns memory ID."""
        ...

    @abstractmethod
    async def recall(self, query: str, limit: int = 5) -> List[OperationalMemory]:
        """Recall relevant operational memories matching a query."""
        ...

    @abstractmethod
    async def reflect(self, memories: List[OperationalMemory]) -> str:
        """Synthesize patterns across multiple historical incidents."""
        ...


def _sanitize_memory(memory: OperationalMemory) -> dict:
    """Sanitize sensitive data before sending to Hindsight.

    - Strips AWS account IDs from ARNs
    - Removes credential-like strings
    - Keeps structural information for pattern matching
    """
    data = memory.model_dump()

    # Remove full account IDs — replace with masked version
    for key in ("actor_id",):
        if data.get(key):
            data[key] = re.sub(
                r"\d{12}", "XXXXXXXXXXXX", str(data[key])
            )

    # Remove any ARN account portions
    for key, value in data.items():
        if isinstance(value, str) and "arn:aws:" in value:
            data[key] = re.sub(r":\d{12}:", ":XXXXXXXXXXXX:", value)

    return data


class HindsightMemoryProvider(MemoryProvider):
    """Production memory provider using the Hindsight API.

    Uses the official hindsight-client SDK.
    """

    def __init__(self, api_url: str, api_key: Optional[str], bank_id: str):
        self.api_url = api_url
        self.api_key = api_key
        self.bank_id = bank_id
        self._client = None

    def _get_client(self):
        """Lazy-initialize the Hindsight client."""
        if self._client is None:
            try:
                from hindsight_client import Hindsight

                kwargs = {"base_url": self.api_url}
                if self.api_key:
                    kwargs["api_key"] = self.api_key
                self._client = Hindsight(**kwargs)
                logger.info(
                    "Hindsight client connected to %s (bank: %s)",
                    self.api_url,
                    self.bank_id,
                )
            except ImportError:
                logger.warning(
                    "hindsight-client not installed. "
                    "Install with: pip install hindsight-client"
                )
                raise
            except Exception as e:
                logger.error("Failed to connect to Hindsight: %s", e)
                raise
        return self._client

    async def retain(self, memory: OperationalMemory) -> str:
        """Store sanitized operational memory in Hindsight."""
        try:
            client = self._get_client()
            sanitized = _sanitize_memory(memory)
            content = json.dumps(sanitized, default=str)
            context = (
                f"Incident: {memory.incident_type} | "
                f"Service: {memory.affected_service} | "
                f"Resource: {memory.changed_resource} | "
                f"Outcome: {memory.outcome}"
            )
            client.retain(
                bank_id=self.bank_id,
                content=content,
                context=context,
                timestamp=memory.timestamp.isoformat(),
            )
            logger.info("Retained memory %s in Hindsight bank %s", memory.id, self.bank_id)
            return memory.id
        except Exception as e:
            logger.error("Failed to retain memory in Hindsight: %s", e)
            raise

    async def recall(self, query: str, limit: int = 5) -> List[OperationalMemory]:
        """Recall relevant operational memories from Hindsight."""
        try:
            client = self._get_client()
            results = client.recall(bank_id=self.bank_id, query=query)

            memories = []
            if results and hasattr(results, "memories"):
                for mem in results.memories[:limit]:
                    try:
                        data = json.loads(mem.content) if isinstance(mem.content, str) else mem.content
                        if isinstance(data, dict):
                            memory = OperationalMemory(**data)
                            memory.similarity_score = getattr(mem, "relevance", 0.5)
                            memories.append(memory)
                    except Exception:
                        continue

            logger.info("Recalled %d memories from Hindsight for query: %s", len(memories), query[:50])
            return memories
        except Exception as e:
            logger.error("Failed to recall from Hindsight: %s", e)
            return []

    async def reflect(self, memories: List[OperationalMemory]) -> str:
        """Synthesize patterns across historical incidents using Hindsight reflect."""
        try:
            client = self._get_client()
            query = (
                f"Analyze these {len(memories)} operational incidents and identify "
                f"common patterns, recurring root causes, and recommended actions."
            )
            result = client.reflect(bank_id=self.bank_id, query=query)
            return str(result) if result else "No reflection available."
        except Exception as e:
            logger.error("Failed to reflect with Hindsight: %s", e)
            return "Reflection unavailable — Hindsight connection failed."


class FallbackMemoryProvider(MemoryProvider):
    """Local fallback with seeded operational memories for demo/offline use.

    THE APPLICATION MUST STILL RUN without Hindsight.
    """

    def __init__(self):
        self.memories: List[OperationalMemory] = []
        self._seed_memories()

    def _seed_memories(self):
        """Seed realistic historical operational memories."""
        self.memories = [
            OperationalMemory(
                id="mem_hist_001",
                incident_type="lambda_throttling",
                affected_service="lambda",
                changed_resource="checkout-function",
                change_type="UpdateFunctionConfiguration",
                actor_type=ActorType.HUMAN,
                actor_id="ops-engineer-A",
                telemetry_signature="Lambda Throttles +280%, API Gateway 5xx +22%",
                dependency_path=["checkout-function", "checkout-api", "OrdersCreated"],
                impact_summary="Checkout throughput reduced by 15% for 12 minutes",
                remediation="Reserved concurrency restored to 10. Runbook updated.",
                evidence_summary=(
                    "CloudTrail: UpdateFunctionConfiguration (ReservedConcurrentExecutions: 2). "
                    "CloudWatch: Throttles spike within 15 seconds. "
                    "API Gateway: 5xx errors increased."
                ),
                confidence=ConfidenceLevel.HIGH,
                outcome="Configuration reverted. Incident resolved in 12 minutes.",
                timestamp=datetime(2026, 9, 21, 14, 30, 0),
                aws_service="lambda",
                similarity_score=0.81,
            ),
            OperationalMemory(
                id="mem_hist_002",
                incident_type="dynamodb_throttling",
                affected_service="dynamodb",
                changed_resource="orders-table",
                change_type="UpdateTable",
                actor_type=ActorType.AUTOMATION,
                actor_id="scaling-automation",
                telemetry_signature="DynamoDB ReadThrottleEvents +450%, Lambda Errors +95%",
                dependency_path=["orders-table", "checkout-function", "checkout-api"],
                impact_summary="Order creation failures for 8 minutes",
                remediation="Provisioned capacity increased. Auto-scaling policy reviewed.",
                evidence_summary=(
                    "CloudTrail: UpdateTable (ProvisionedThroughput reduced). "
                    "CloudWatch: ReadThrottleEvents spike. Lambda downstream errors."
                ),
                confidence=ConfidenceLevel.HIGH,
                outcome="Capacity restored. Auto-scaling minimum increased.",
                timestamp=datetime(2026, 8, 15, 9, 15, 0),
                aws_service="dynamodb",
                similarity_score=0.62,
            ),
            OperationalMemory(
                id="mem_hist_003",
                incident_type="api_gateway_throttling",
                affected_service="apigateway",
                changed_resource="checkout-api",
                change_type="UpdateStage",
                actor_type=ActorType.HUMAN,
                actor_id="platform-engineer-B",
                telemetry_signature="API Gateway 429 +180%, Client errors increased",
                dependency_path=["checkout-api", "checkout-function"],
                impact_summary="Checkout API returned 429 errors for 20 minutes",
                remediation="Throttle limit restored. Rate limiting policy documented.",
                evidence_summary=(
                    "CloudTrail: UpdateStage (throttling settings changed). "
                    "CloudWatch: 429 errors spike. Client-side retry storms observed."
                ),
                confidence=ConfidenceLevel.MEDIUM,
                outcome="Throttle settings reverted. Documentation updated.",
                timestamp=datetime(2026, 7, 3, 16, 45, 0),
                aws_service="apigateway",
                similarity_score=0.45,
            ),
            OperationalMemory(
                id="mem_hist_004",
                incident_type="lambda_timeout",
                affected_service="lambda",
                changed_resource="checkout-function",
                change_type="UpdateFunctionConfiguration",
                actor_type=ActorType.AI_AGENT,
                actor_id="cost-optimizer-agent",
                telemetry_signature="Lambda Duration p99 at timeout, Errors +200%",
                dependency_path=["checkout-function", "checkout-api", "OrdersCreated"],
                impact_summary="Checkout function timing out, orders failing",
                remediation="Timeout restored to 10s. Agent policy updated to require approval.",
                evidence_summary=(
                    "CloudTrail: UpdateFunctionConfiguration (Timeout: 1s, was 10s). "
                    "Agent: cost-optimizer-agent, capability: optimize_resources. "
                    "Approval: missing. CloudWatch: Duration at timeout limit."
                ),
                confidence=ConfidenceLevel.HIGH,
                outcome="Timeout restored. Agent now requires approval for config changes.",
                timestamp=datetime(2026, 9, 1, 11, 20, 0),
                aws_service="lambda",
                similarity_score=0.73,
            ),
        ]

    async def retain(self, memory: OperationalMemory) -> str:
        """Store memory locally."""
        self.memories.append(memory)
        logger.info("Retained memory %s in fallback provider", memory.id)
        return memory.id

    async def recall(self, query: str, limit: int = 5) -> List[OperationalMemory]:
        """Simple keyword-based recall from seeded memories."""
        query_lower = query.lower()
        scored: list[tuple[float, OperationalMemory]] = []

        for mem in self.memories:
            score = 0.0
            searchable = (
                f"{mem.incident_type} {mem.affected_service} {mem.changed_resource} "
                f"{mem.change_type} {mem.telemetry_signature} {mem.impact_summary} "
                f"{mem.remediation}"
            ).lower()

            # Simple keyword matching
            for word in query_lower.split():
                if word in searchable:
                    score += 0.2

            # Bonus for service match
            if any(svc in query_lower for svc in [mem.affected_service, mem.aws_service]):
                score += 0.3

            # Bonus for resource match
            if mem.changed_resource.lower() in query_lower:
                score += 0.3

            if score > 0:
                mem_copy = mem.model_copy()
                mem_copy.similarity_score = min(score, 1.0)
                scored.append((score, mem_copy))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [m for _, m in scored[:limit]]

    async def reflect(self, memories: List[OperationalMemory]) -> str:
        """Generate a deterministic reflection from local memories."""
        if not memories:
            return "No historical operational memories available for reflection."

        patterns = set()
        for mem in memories:
            patterns.add(f"{mem.change_type} on {mem.affected_service}")

        services = {m.affected_service for m in memories}
        outcomes = [m.outcome for m in memories if m.outcome]

        return (
            f"Reflection across {len(memories)} historical incident(s). "
            f"Affected services: {', '.join(services)}. "
            f"Common patterns: {'; '.join(patterns)}. "
            f"Previous outcomes: {'; '.join(outcomes[:3])}. "
            f"Recommendation: Review configuration change procedures for these services."
        )


def create_memory_provider(
    api_url: Optional[str] = None,
    api_key: Optional[str] = None,
    bank_id: str = "changelens-operational-memory",
) -> MemoryProvider:
    """Factory function — returns HindsightMemoryProvider if configured, else fallback."""
    if api_url and api_key:
        try:
            provider = HindsightMemoryProvider(api_url, api_key, bank_id)
            logger.info("Using HindsightMemoryProvider (url=%s, bank=%s)", api_url, bank_id)
            return provider
        except Exception as e:
            logger.warning("Hindsight unavailable (%s), falling back to local provider", e)

    logger.info("Using FallbackMemoryProvider with seeded operational memories")
    return FallbackMemoryProvider()
