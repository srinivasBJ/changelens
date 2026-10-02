# Hindsight Integration: ChangeLens Operational Memory

**Reference Repository:** [vectorize-io/hindsight](https://github.com/vectorize-io/hindsight)  
**Package:** `hindsight-client` (Python) / `@vectorize-io/hindsight-client` (Node.js)  
**Dedicated Memory Bank:** `changelens-operational-memory`  

---

## 1. Role in ChangeLens

ChangeLens integrates Hindsight not as a generic conversational chatbot buffer, but as a specialized **Operational Memory** system. When incident investigations occur, operators need to know:

> *"Have we seen this operational pattern before, and what did we learn?"*

Hindsight enables ChangeLens to:
1. **Recall** historical incidents when a new change or anomaly occurs.
2. **Compare** live AWS telemetry signatures against learned historical patterns.
3. **Reflect** across recurring operational incidents to identify systemic risks and preventative runbook improvements.
4. **Retain** structured post-incident postmortems once an investigation is closed.

---

## 2. Core Workflows

### A. Recall Workflow (During Active Investigation)
When a new investigation is triggered by a CloudTrail change (e.g. `UpdateFunctionConfiguration` on `checkout-function`), ChangeLens queries Hindsight:

```python
from hindsight_client import Hindsight

client = Hindsight(base_url="https://api.hindsight.vectorize.io", api_key="...")

# Query using the incident context and affected services
recalled_memories = client.recall(
    bank_id="changelens-operational-memory",
    query="Lambda UpdateFunctionConfiguration concurrency reduction throttling checkout-function"
)
```

The recalled incidents are displayed in a **dedicated, visually distinct Historical Memory panel** in the UI. 

> [!IMPORTANT]
> **Strict Separation Rule:** Historical Hindsight memories are **never** treated as causal proof of the active incident. They are weighted at `0.10` in the evidence-weighted impact score and clearly badged as `HISTORICAL CONTEXT`.

### B. Retain Workflow (On Investigation Resolution)
When an investigation is resolved or closed by an operator, ChangeLens sanitizes and retains the structured postmortem:

```python
sanitized_payload = {
    "incident_type": "lambda_throttling",
    "affected_service": "lambda",
    "changed_resource": "checkout-function",
    "change_type": "UpdateFunctionConfiguration",
    "actor_type": "human",
    "actor_id": "arn:aws:iam::XXXXXXXXXXXX:user/ops-engineer",
    "telemetry_signature": "Lambda Throttles +340%, API Gateway 5xx +27%",
    "dependency_path": ["checkout-function", "checkout-api", "OrdersCreated"],
    "impact_summary": "Orders dropped 18% due to concurrency cap",
    "remediation": "Restored reserved concurrency to 10",
    "evidence_summary": "CloudTrail event ct_event_001 corroborated by CloudWatch Throttles",
    "confidence": "high",
    "outcome": "Resolved in 12m after parameter reversion",
    "timestamp": "2026-10-02T14:02:11Z",
    "aws_service": "lambda",
    "region": "us-east-2"
}

client.retain(
    bank_id="changelens-operational-memory",
    content=json.dumps(sanitized_payload),
    context="Lambda concurrency reduction causing downstream API Gateway 5xx errors",
    timestamp="2026-10-02T14:02:11Z"
)
```

### C. Reflect Workflow (Periodic Synthesis & Runbook Generation)
Operators can request Hindsight reflection across recent incidents to identify chronic operational weaknesses:

```python
reflection = client.reflect(
    bank_id="changelens-operational-memory",
    query="What common failure modes exist across Lambda and DynamoDB configuration updates?"
)
```

---

## 3. Privacy, Sanitization & Memory Defense

ChangeLens enforces zero-credential leakage before retaining any data to Hindsight:
1. **AWS Account ID Masking:** 12-digit AWS account IDs in ARNs are regex-replaced with `XXXXXXXXXXXX`.
2. **Access Key Redaction:** Any access key ID (`AKIA...`), session tokens, or Authorization headers are stripped.
3. **Hindsight Memory Defense:** ChangeLens configures the `changelens-operational-memory` bank with Hindsight's built-in **Memory Defense** policy to automatically block/redact 45+ credential and PII patterns at ingestion.

---

## 4. Fallback Architecture (`FallbackMemoryProvider`)

To ensure ChangeLens **never fails** if the Hindsight API or local container is offline, ChangeLens implements a clean `MemoryProvider` interface:

```
                  ┌────────────────────────┐
                  │     MemoryProvider     │
                  │ (retain/recall/reflect)│
                  └───────────┬────────────┘
                              │
             ┌────────────────┴────────────────┐
             ▼                                 ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│ HindsightMemoryProvider │       │ FallbackMemoryProvider  │
│ (HTTP/SDK to Hindsight) │       │ (Local seeded incident  │
│                         │       │  memory repository)     │
└─────────────────────────┘       └─────────────────────────┘
```

The fallback provider includes 4 realistic pre-seeded operational memories (Lambda throttling, DynamoDB capacity reduction, API Gateway stage limits, and AI Agent unapproved timeout modifications) so that offline evaluation and demonstrations execute with 100% determinism.
