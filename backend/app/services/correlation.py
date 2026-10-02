"""ChangeLens Correlation Engine.

Evidence-weighted impact scoring with transparent component breakdown.
This is NOT a statistically validated causal inference model.
It is an evidence-weighted impact score using explainable factors.
"""

from __future__ import annotations

from collections import deque
from datetime import datetime
from typing import List, Optional

from app.models.core import (
    Anomaly,
    AgentAction,
    Approval,
    ApprovalStatus,
    Change,
    ConfidenceLevel,
    ImpactEdge,
    ImpactScore,
    OperationalMemory,
)


class CorrelationEngine:
    """Computes evidence-weighted impact scores for change-anomaly correlations.

    Scoring weights:
        0.35 * metric_severity
        0.25 * temporal_proximity
        0.20 * dependency_weight
        0.10 * actor_context
        0.10 * historical_similarity
    """

    # Maximum time window for temporal correlation (seconds)
    MAX_TEMPORAL_WINDOW = 300  # 5 minutes

    # Scoring weights
    W_METRIC = 0.35
    W_TEMPORAL = 0.25
    W_DEPENDENCY = 0.20
    W_ACTOR = 0.10
    W_HISTORICAL = 0.10

    def calculate_impact_score(
        self,
        change: Change,
        anomalies: List[Anomaly],
        edges: List[ImpactEdge],
        memories: List[OperationalMemory],
        agent_actions: Optional[List[AgentAction]] = None,
        approvals: Optional[List[Approval]] = None,
    ) -> ImpactScore:
        """Calculate the evidence-weighted impact score for a change.

        Returns a transparent breakdown of all scoring components.
        """
        agent_actions = agent_actions or []
        approvals = approvals or []

        # 1. Metric severity: normalized max anomaly deviation
        metric_severity = self._calculate_metric_severity(anomalies)

        # 2. Temporal proximity: how close anomalies are to the change
        temporal_proximity = self._calculate_temporal_proximity(
            change.timestamp, anomalies
        )

        # 3. Dependency weight: relationship between changed resource and anomaly resources
        dependency_weight = self._calculate_dependency_weight(
            change.resource_name, anomalies, edges
        )

        # 4. Actor context: risk factors from actor type and approval state
        actor_context = self._calculate_actor_context(
            change, agent_actions, approvals
        )

        # 5. Historical similarity: match quality with previous incidents
        historical_similarity = self._calculate_historical_similarity(memories)

        # Weighted overall score
        overall = (
            self.W_METRIC * metric_severity
            + self.W_TEMPORAL * temporal_proximity
            + self.W_DEPENDENCY * dependency_weight
            + self.W_ACTOR * actor_context
            + self.W_HISTORICAL * historical_similarity
        )

        # Determine confidence level
        confidence = self._determine_confidence(overall)

        # Generate explanation using confidence-aware language
        explanation = self._generate_explanation(
            overall, confidence, change, anomalies, memories
        )

        return ImpactScore(
            overall=round(overall, 2),
            metric_severity=round(metric_severity, 2),
            temporal_proximity=round(temporal_proximity, 2),
            dependency_weight=round(dependency_weight, 2),
            actor_context=round(actor_context, 2),
            historical_similarity=round(historical_similarity, 2),
            confidence=confidence,
            explanation=explanation,
        )

    def _calculate_metric_severity(self, anomalies: List[Anomaly]) -> float:
        """Normalized maximum anomaly severity (0.0 - 1.0)."""
        if not anomalies:
            return 0.0
        return min(max(a.severity for a in anomalies), 1.0)

    def _calculate_temporal_proximity(
        self, change_time: datetime, anomalies: List[Anomaly]
    ) -> float:
        """Score based on how quickly anomalies appeared after the change.

        Higher score = anomalies appeared sooner after the change.
        """
        if not anomalies:
            return 0.0

        min_delta = float("inf")
        for anomaly in anomalies:
            delta = abs(
                (anomaly.timestamp - change_time).total_seconds()
            )
            min_delta = min(min_delta, delta)

        if min_delta >= self.MAX_TEMPORAL_WINDOW:
            return 0.0

        return round(1.0 - (min_delta / self.MAX_TEMPORAL_WINDOW), 2)

    def _calculate_dependency_weight(
        self,
        change_resource: str,
        anomalies: List[Anomaly],
        edges: List[ImpactEdge],
    ) -> float:
        """Score based on dependency relationship between change and anomalies.

        1.0 = same resource
        0.8 = direct dependency (1 hop)
        0.5 = second-hop dependency
        0.2 = broader service/account correlation
        """
        if not anomalies:
            return 0.0

        max_weight = 0.0
        for anomaly in anomalies:
            if anomaly.resource_name == change_resource:
                max_weight = max(max_weight, 1.0)
            else:
                path = self.find_dependency_path(
                    change_resource, anomaly.resource_name, edges
                )
                if path is not None:
                    hops = len(path) - 1
                    if hops == 1:
                        max_weight = max(max_weight, 0.8)
                    elif hops == 2:
                        max_weight = max(max_weight, 0.5)
                    else:
                        max_weight = max(max_weight, 0.2)
                else:
                    max_weight = max(max_weight, 0.2)

        return max_weight

    def _calculate_actor_context(
        self,
        change: Change,
        agent_actions: List[AgentAction],
        approvals: List[Approval],
    ) -> float:
        """Score based on actor type and approval state.

        Higher risk for agents with missing approvals.
        """
        score = 0.5  # baseline

        # Agent with missing approval is higher risk
        for action in agent_actions:
            if action.approval_status == ApprovalStatus.MISSING:
                score = max(score, 0.9)
            elif action.approval_status == ApprovalStatus.REJECTED:
                score = max(score, 0.95)

        # Human change with no associated approval
        if change.actor_type == "human":
            has_approval = any(
                a.change_id == change.id and a.status == ApprovalStatus.APPROVED
                for a in approvals
            )
            if not has_approval:
                score = max(score, 0.7)

        return score

    def _calculate_historical_similarity(
        self, memories: List[OperationalMemory]
    ) -> float:
        """Maximum similarity score from historical operational memories."""
        if not memories:
            return 0.0
        scores = [
            m.similarity_score for m in memories if m.similarity_score is not None
        ]
        return max(scores) if scores else 0.0

    def _determine_confidence(self, overall: float) -> ConfidenceLevel:
        """Map overall score to confidence level."""
        if overall >= 0.75:
            return ConfidenceLevel.HIGH
        elif overall >= 0.5:
            return ConfidenceLevel.MEDIUM
        elif overall >= 0.25:
            return ConfidenceLevel.LOW
        return ConfidenceLevel.INSUFFICIENT

    def _generate_explanation(
        self,
        overall: float,
        confidence: ConfidenceLevel,
        change: Change,
        anomalies: List[Anomaly],
        memories: List[OperationalMemory],
    ) -> str:
        """Generate confidence-aware explanation. Never claims causal certainty."""
        parts = []
        parts.append(
            f"Evidence-weighted impact score: {overall:.2f} ({confidence.value} confidence)."
        )

        if anomalies:
            max_anomaly = max(anomalies, key=lambda a: a.severity)
            parts.append(
                f"Highest severity anomaly: {max_anomaly.metric_name} "
                f"on {max_anomaly.resource_name} "
                f"({max_anomaly.deviation_pct:+.0f}% deviation)."
            )

        if memories:
            parts.append(
                f"{len(memories)} similar historical incident(s) found, "
                f"suggesting a high-confidence correlation with known patterns."
            )

        parts.append(
            f"The change '{change.action}' on '{change.resource_name}' "
            f"is the most likely contributing factor based on available evidence."
        )

        return " ".join(parts)

    def find_dependency_path(
        self,
        source: str,
        target: str,
        edges: List[ImpactEdge],
    ) -> Optional[List[str]]:
        """BFS to find shortest dependency path between two resources."""
        if source == target:
            return [source]

        # Build adjacency list
        adjacency: dict[str, list[str]] = {}
        for edge in edges:
            adjacency.setdefault(edge.source, []).append(edge.target)
            # Also traverse reverse for undirected search
            adjacency.setdefault(edge.target, []).append(edge.source)

        # BFS
        visited = {source}
        queue: deque[list[str]] = deque([[source]])

        while queue:
            path = queue.popleft()
            current = path[-1]

            for neighbor in adjacency.get(current, []):
                if neighbor == target:
                    return path + [neighbor]
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(path + [neighbor])

        return None
