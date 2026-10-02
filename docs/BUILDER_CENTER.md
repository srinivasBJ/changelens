# AWS Builder Center Submission: ChangeLens

**Hackathon:** AWS Builder Center — Zero to Shipped  
**Date:** October 2026  
**Category:** `#workplace-efficiency`  
**Lane:** `#startups`  

---

## Project Metadata

- **Project Title:** ChangeLens — AWS Change Impact & Operational Memory
- **Tagline:** An evidence-driven operational intelligence layer above AWS observability.
- **Short Description (<200 chars):**  
  An evidence-driven AWS operational intelligence layer connecting infrastructure changes, telemetry, dependencies, agent actions, and historical incidents into an explainable impact graph.
- **Repository URL:** `https://github.com/srinivasBJ/changelens` *(or workspace repo)*
- **Live Demo URL:** `http://localhost:3000` *(or deployed CloudFront/ALB URL)*

---

## Long Description

AWS provides world-class observability through CloudWatch, CloudTrail, Application Signals, and AWS Config. However, during an operational incident, engineering context remains fragmented across disparate browser tabs and logs:
- **CloudTrail** shows that a configuration changed.
- **CloudWatch** shows that error rates spiked.
- **Service topologies** show that services communicate.
- **IAM** shows that an autonomous agent or human executed the change.
- **Incident histories** live locked in postmortem documents or tribal engineer memory.

Engineers are forced to manually correlate:
*"What changed, what did it likely affect, what evidence supports that conclusion, and have we seen this operational pattern before?"*

### The ChangeLens Solution
ChangeLens introduces an evidence-backed intelligence layer directly above AWS observability:
1. **Change Ingestion:** Ingests CloudTrail infrastructure modifications and classifies actors as human, automation, or autonomous AI agents.
2. **Telemetry Correlation:** Correlates changes with subsequent CloudWatch metric anomalies and business metric drops.
3. **Topological Blast Radius:** Visualizes the blast radius from changed resource → dependent service → API operation → downstream business impact.
4. **Explainable Impact Scoring:** Uses an evidence-weighted, transparent scoring formula (`0.35 * metric_severity + 0.25 * temporal_proximity + 0.20 * dependency_weight + 0.10 * actor_context + 0.10 * historical_similarity`).
5. **Hindsight Operational Memory:** Integrates Hindsight (`retain`, `recall`, `reflect`) in a dedicated memory bank (`changelens-operational-memory`) to identify whether similar operational patterns have occurred in past incidents—while rigorously keeping historical memory separated from live evidence.
6. **Auditable Evidence Packs:** Generates tamper-evident Evidence Packs with SHA-256 integrity hashes for forensic accountability.

---

## Coding Agent Story

ChangeLens was designed and implemented end-to-end by **Google Antigravity**, an autonomous agentic pair-programming system.
1. The agent inspected prior architecture references (`OpenMesh`, `OpenMesh Sentinel`, `BuildMesh`) to extract event normalization, governance, and forensic verification patterns.
2. The agent integrated the official `hindsight-client` Python SDK with strict memory defense and sanitization.
3. The agent implemented the entire FastAPI backend, Pydantic v2 data models, correlation engine, and test suite.
4. The agent constructed the interactive Next.js dashboard featuring React Flow dependency graphs, multi-lane timelines, and separate live vs. historical evidence panels.

---

## AWS Services Utilized

- **AWS CloudTrail:** Ingestion and actor attribution for infrastructure configuration changes.
- **Amazon CloudWatch:** Telemetry monitoring, metric statistics, and baseline deviation detection.
- **AWS Lambda:** Serverless compute for the demo checkout workload (`changelens-checkout-function`).
- **Amazon API Gateway:** REST API frontend exposing `/checkout`.
- **Amazon DynamoDB:** NoSQL database storing orders (`changelens-orders`).
- **Amazon S3:** Object storage for generated Evidence Packs.
- **Amazon EventBridge:** Event routing for infrastructure change events.

---

## Deterministic Demo Narrative (13-Step Story)

1. **Baseline Health:** The demo checkout workload (`API Gateway -> Lambda -> DynamoDB`) processes normal requests (142 orders/min, <1% errors).
2. **Dashboard Overview:** ChangeLens `/dashboard` shows 0 active incidents and 100% healthy telemetry.
3. **Operational Change:** An operator reduces Lambda reserved concurrency on `checkout-function` to `1`.
4. **CloudTrail Recording:** CloudTrail records `UpdateFunctionConfiguration` with principal attribution.
5. **Traffic Flow:** Customer traffic arrives at the `/checkout` API Gateway.
6. **Telemetry Anomaly:** `checkout-function` throttles surge +340% within 9 seconds; errors surge +180%.
7. **Downstream API Failure:** API Gateway `5XXError` increases +27% as requests cannot obtain Lambda concurrency.
8. **Business Metric Degradation:** `OrdersCreated` drops by -18%.
9. **ChangeLens Detection:** ChangeLens correlates the change with the telemetry spike.
10. **Blast Radius Mapping:** Graph shows `checkout-function` → `checkout-api` → `POST /checkout` → `OrdersCreated`.
11. **Hindsight Operational Memory Match:** ChangeLens recalls 2 similar historical incidents from the `changelens-operational-memory` bank (similarity score: 81%).
12. **Evidence-Weighted Hypothesis:** ChangeLens presents an impact score of `0.92 (HIGH Confidence)` with a confidence-aware explanation.
13. **Evidence Pack Generation:** Operator exports an auditable Evidence Pack with SHA-256 checksums and recommended investigation runbooks.

---

## Known Limitations

- **MVP Scope:** Focused on single-account, single-region (`us-east-2`) operations.
- **Observability Augmentation, Not Replacement:** Does not replace CloudWatch logs or distributed APM traces; ChangeLens is the intelligence synthesis layer above them.
- **No Automatic Remediation:** Remediation actions are presented as recommendations; destructive automatic rollback is intentionally deferred for safety.
