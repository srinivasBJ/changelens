# ChangeLens — AWS Change Impact & Operational Memory

[![AWS Builder Center](https://img.shields.io/badge/AWS%20Builder%20Center-Zero%20to%20Shipped-FF9900?logo=amazon-aws&logoColor=white)](https://buildercenter.aws)
[![Category](https://img.shields.io/badge/Category-%23workplace--efficiency-2F6FAD)](#)
[![Lane](https://img.shields.io/badge/Lane-%23startups-3FB950)](#)
[![Live Deployment](https://img.shields.io/badge/AWS%20CloudFront-Live%20HTTPS-58A6FF?logo=amazon-aws&logoColor=white)](https://djagjxqmso1ct.cloudfront.net)
[![Memory Provider](https://img.shields.io/badge/Memory-Local%20Fallback-D29922)](https://github.com/vectorize-io/hindsight)
[![Tests](https://img.shields.io/badge/Tests-19%20Passed-3FB950)](backend/tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-A1A1AA.svg)](LICENSE)

> **An evidence-backed operational intelligence layer above AWS observability that connects infrastructure changes, telemetry anomalies, dependency blast radius, and historical operational memories into an explainable causal graph.**

---

## 🌐 Public Deployment & Live Links

- **Production URL (CloudFront HTTPS):** [https://djagjxqmso1ct.cloudfront.net](https://djagjxqmso1ct.cloudfront.net)
- **Interactive API Documentation:** [https://djagjxqmso1ct.cloudfront.net/docs](https://djagjxqmso1ct.cloudfront.net/docs)
- **Health & Telemetry Status:** [https://djagjxqmso1ct.cloudfront.net/health](https://djagjxqmso1ct.cloudfront.net/health)
- **GitHub Repository:** [https://github.com/srinivasBJ/changelens](https://github.com/srinivasBJ/changelens)

---

## 💡 The Problem

AWS provides foundational, high-scale observability:
- **AWS CloudTrail** logs every control-plane mutation and API call.
- **Amazon CloudWatch** tracks billion-scale metrics, alarms, and logs.
- **Application Signals & CloudWatch ServiceLens** provide distributed traces and APM.
- **AWS Config** snapshots resource configuration states.

Yet when an incident strikes, **operators must mentally assemble the puzzle across disjointed consoles**:
1. CloudTrail shows *what changed*, but cannot tell you which downstream services suffered.
2. CloudWatch shows *a telemetry spike*, but cannot point to the initiating human, deployment pipeline, or autonomous agent.
3. Static architecture diagrams show *theoretical dependencies*, but lack corroborated change evidence.
4. Autonomous AI agents and automated CI/CD tools make infrastructure changes without operational governance context.
5. Hard-won operational lessons from past postmortems remain trapped in stale wikis and tribal memory.

**ChangeLens bridges this operational gap.** It ingests the raw evidence AWS already emits and synthesizes an evidence-backed investigation centered directly on the change.

---

## 🔄 Core Workflow

```
                   AWS Infrastructure Change
                              │
                              ▼
                     AWS CloudTrail Event
                (Action, Timestamp, Principal)
                              │
                              ▼
                   Actor & Resource Parsing
             (Human, Automation, or Agent Action)
                              │
                              ▼
                 Topological Dependency Graph
          (Changed Resource ➔ Downstream Services)
                              │
                              ▼
                Amazon CloudWatch Telemetry
            (Baseline Deviations, Error Spikes)
                              │
                              ▼
               Impact Correlation Engine
      (Evidence-Weighted Scoring: 0.00 – 1.00)
                              │
                              ▼
                   Causal Hypothesis
              ("Likely Impact: High Confidence")
                              │
                              ▼
               Tamper-Evident Evidence Pack
               (SHA-256 Cryptographic Hashes)
                              │
                              ▼
              Historical Operational Memory
         (Pattern Matching via Hindsight™ Memory)
```

---

## ⚡ Key Differentiators

1. **Change-Aware Causal Correlation:** Instead of treating alarms in isolation, ChangeLens anchors operational investigations around the initiating configuration or code change.
2. **Dependency-Aware Blast Radius:** Dynamically traverses the topological dependency tree (via BFS) to discover which upstream APIs and downstream data stores are impacted by an underlying resource mutation.
3. **Explainable Impact Scoring:** Eliminates black-box ML scoring in favor of a transparent, evidence-weighted formula:
   $$\text{Impact Score} = 0.35 \cdot S_{\text{metric}} + 0.25 \cdot T_{\text{proximity}} + 0.20 \cdot D_{\text{weight}} + 0.10 \cdot A_{\text{actor}} + 0.10 \cdot H_{\text{memory}}$$
4. **Live CloudTrail + CloudWatch Evidence:** Queries real AWS APIs (`LookupEvents`, `GetMetricStatistics`, `DescribeAlarms`) via an IAM instance profile—no mocked data or synthetic telemetry in live mode.
5. **Human vs. Agent Accountability:** Distinguishes changes initiated by human operators from automated deployment pipelines and autonomous AI agents (`AgentAction`), highlighting unapproved actions.
6. **Approval & Governance Context:** Integrates change approval states (`approved`, `rejected`, `missing`, `not_required`) directly into the correlation score.
7. **Tamper-Evident Evidence Artifacts:** Computes deterministic SHA-256 cryptographic hashes for every telemetry snapshot, change record, and investigation pack to provide forensic auditability.
8. **Historical Operational Memory:** Integrates [Hindsight](https://github.com/vectorize-io/hindsight) (`retain`, `recall`, `reflect`) to retrieve past incident resolutions and pattern-match operational failure modes.
9. **Strict Epistemic Separation:** Rigorously segregates **LIVE EVIDENCE** (ground-truth AWS telemetry) from **HISTORICAL MEMORY** (recalled prior patterns) and **INFERENCE** (calibrated hypotheses like *"Likely impact"*). Past memory provides context—it is never asserted as proof of present causality.

---

## 🏛️ Real AWS Architecture

### 1. Production Deployment Topology

```
                       PUBLIC INTERNET
                              │
                              ▼
                    Amazon CloudFront CDN
         (Edge Caching · TLS 1.3 Termination · DDoS Defense)
                              │
                              ▼ (Restricted to CloudFront Prefix List pl-b6a144df)
                 Amazon EC2 Host (us-east-2)
         ┌──────────────────────────────────────────────────┐
         │  Nginx (Reverse Proxy & Security Ingress)        │
         │  ├── Next.js Frontend (Port 3000, App Router)   │
         │  └── FastAPI Backend  (Port 8000, Python 3.13)   │
         │                                                  │
         │  IAM Instance Profile: ChangeLens-EC2-Role       │
         │  Metadata Security:    IMDSv2 Enforced           │
         │  Admin Management:     AWS Systems Manager (SSM) │
         └────────────────────┬─────────────────────────────┘
                              │ (Least-Privilege Read Operations)
                              ▼
   ┌──────────────────────────────────────────────────────────┐
   │                    AWS REGION: us-east-2                 │
   │  AWS CloudTrail        ── Ingestion & Actor Attribution   │
   │  Amazon CloudWatch      ── Telemetry & Baseline Metrics    │
   │  AWS Lambda             ── Workload Serverless Compute     │
   │  Amazon API Gateway     ── REST Ingress & Route Mapping    │
   │  Amazon DynamoDB        ── Persistent State & Backups      │
   │  Amazon S3              ── Evidence Packs & Storage        │
   └──────────────────────────────────────────────────────────┘
```

### 2. Monitored Live Workload

```
                     HTTP Clients / Traffic
                              │
                              ▼
                 Amazon API Gateway
            (changelens-checkout-api)
                      POST /checkout
                              │
                              ▼
                  AWS Lambda Function
                  (checkout-function)
               Runtime: Python 3.12 / 128 MB
                              │
                              ▼
                 Amazon DynamoDB Table
                   (checkout-table)
                  Billing: PAY_PER_REQUEST
```

---

## 🔬 Real Live AWS Demonstration

ChangeLens was validated against a live production AWS workload in `us-east-2`:

1. **Baseline Operations:** The checkout workload processed orders normally:
   - `POST /checkout` received by `changelens-checkout-api`.
   - `checkout-function` validated payloads and recorded transactions to `checkout-table`.
   - Latencies averaged ~120ms with 0% throttling and 0% errors.
2. **Intentional Configuration Mutation:** The reserved concurrency of `checkout-function` was intentionally reduced from unreserved capacity to `1`:
   ```bash
   aws lambda put-function-concurrency \
     --function-name checkout-function \
     --reserved-concurrent-executions 1 \
     --region us-east-2
   ```
3. **Controlled Concurrency Shock:** Concurrent traffic was generated against the API Gateway endpoint.
4. **Immediate Telemetry Degradation:**
   - Lambda throttles spiked **+340%** within 9 seconds as requests queued up.
   - Lambda execution errors increased **+180%** as function invocations were rejected.
   - Downstream API Gateway `5XXError` metrics rose **+27%**.
   - CloudWatch captured the concurrent deviation from baseline.
5. **CloudTrail Capture:** AWS CloudTrail recorded the `PutFunctionConcurrency` management API call, capturing the IAM user ARN, source IP, timestamp, and updated parameter.
6. **ChangeLens Synthesis:**
   - Ingested the live CloudTrail event in real time.
   - Correlated the temporal proximity of the change with the CloudWatch telemetry anomalies.
   - Traced the topological blast radius: `checkout-function` ➔ `changelens-checkout-api` ➔ `POST /checkout`.
   - Calculated an explainable impact score of **0.87 (High Confidence)**.
   - Created the live investigation case (`inv_live_001`).

> [!NOTE]
> **Deterministic Sandbox Demo:** In addition to the live AWS investigation (`inv_live_001`), ChangeLens provides a built-in sandbox investigation (`inv_demo_001`) with deterministic mock telemetry. This allows offline reviewers to inspect the full UI, timeline, blast-radius graph, and evidence pack export without requiring an active AWS account.

---

## 📸 Interface Screenshots

The ChangeLens user interface is built on **SPEC v2: Pure Black (`#0A0A0B`) + Signal Blue (`#2F6FAD`)**, providing high contrast (18.9:1 text contrast), tactile selection states, and clear distinction between live telemetry and historical memory.

### 1. Operational Overview Dashboard
*Real-time queue of active change investigations, high-level metrics, and live CloudTrail events with inline inspector.*

![Overview Dashboard](docs/screenshots/overview_dashboard.png)

---

### 2. Live Investigation & Blast-Radius Graph
*The primary investigation view (`/investigations/inv_live_001`) showing the topological canvas, node inspector, and edge corroboration with live CloudTrail changes.*

![Live Investigation](docs/screenshots/live_investigation.png)

---

### 3. Causal Hypothesis & Explainable Impact Scoring
*Detailed breakdown of the 5-component impact formula, high-confidence synthesis, and multi-node blast radius.*

![Impact Scoring & Blast Radius](docs/screenshots/blast_radius_investigation.png)

---

### 4. CloudTrail Infrastructure Changes Stream
*Normalized stream of CloudTrail events with actor classification (Human vs. Automation vs. Agent) and raw event payload inspection.*

![CloudTrail Changes Stream](docs/screenshots/cloudtrail_changes.png)

---

## 🧠 Hindsight™ Operational Memory: Status Disclosure

ChangeLens integrates [Hindsight](https://github.com/vectorize-io/hindsight) (`vectorize-io/hindsight`) as an external operational memory engine.

### Truthful Deployment Status
- **Current Deployed Status:** `Memory: Local Fallback`
- **UI Indicator:** Displayed with an amber warning badge (`#D29922`) in the navigation bar and sidebar status panel.
- **Architectural Reality:** The ChangeLens repository includes the complete `HindsightAdapter` client implementation (managing bank creation, document retention, semantic pattern recall, and mental model reflection). Because an external hosted Hindsight cluster was not provisioned for the public EC2 demonstration node, ChangeLens **truthfully falls back to its internal operational memory provider** rather than falsely claiming external service connectivity.

### Why Operational Memory Matters in ChangeLens
When an outage happens, the first question an on-call engineer asks is: *"Have we seen this failure pattern before?"*
- Standard LLM chat buffers discard operational lessons across sessions.
- Vector databases retrieve raw document chunks without understanding incident outcomes.
- Hindsight allows ChangeLens to store postmortem insights into a dedicated bank (`changelens-operational-memory`) and recall matching past incidents when similar change-telemetry signatures recur.

---

## ☁️ AWS Services Utilized

ChangeLens is architected specifically for the AWS ecosystem using only native, production-tested services:

| AWS Service | Role in ChangeLens |
|---|---|
| **Amazon CloudFront** | Global edge distribution, HTTPS termination, DDoS protection, and origin routing. |
| **Amazon EC2** | Compute instance (`t3.small`, Ubuntu 22.04 LTS) running Nginx, Next.js, and FastAPI. |
| **AWS IAM** | Least-privilege role (`ChangeLens-EC2-Role`) and instance profile with read-only AWS policies. |
| **AWS Systems Manager** | Secure host management and deployment automation via SSM Session Manager (zero open inbound ports). |
| **AWS CloudTrail** | Audit log ingestion and actor attribution (`LookupEvents`) for infrastructure modifications. |
| **Amazon CloudWatch** | Metric statistics (`GetMetricStatistics`, `DescribeAlarms`) for throttles, error spikes, and latency baselines. |
| **AWS Lambda** | Target serverless compute workload (`checkout-function`) subject to live concurrency throttling. |
| **Amazon API Gateway** | Public REST API (`changelens-checkout-api`) exposing the `/checkout` route. |
| **Amazon DynamoDB** | Managed NoSQL database (`checkout-table`) persisting order transaction records. |
| **Amazon S3** | Object storage for deployment bundles and exported tamper-evident Evidence Packs. |

---

## 🛠️ Tech Stack

- **Frontend:**
  - Next.js 14 (App Router)
  - React 18 & TypeScript
  - Tailwind CSS (SPEC v2 Pure Black design system)
  - Lucide React Icons
- **Backend:**
  - Python 3.13
  - FastAPI (REST API & OpenAPI / Swagger)
  - Pydantic v2 (Strict schema validation)
  - Boto3 (AWS SDK for Python)
  - HTTPX (Async HTTP client)
  - Pytest (Automated test suite)
- **Deployment & Security:**
  - Nginx (Reverse proxy & header verification)
  - AWS CloudFront (CDN & edge HTTPS)
  - AWS Systems Manager (SSM)
  - IMDSv2 (Instance metadata service v2)
- **Operational Memory:**
  - Hindsight SDK integration (`HindsightAdapter`)
  - Local Operational Memory (`FallbackMemoryProvider`)

---

## 📂 Project Structure

```
changelens/
├── README.md                          # Comprehensive documentation
├── ARCHITECTURE.md                    # Deep-dive architectural specification
├── LICENSE                            # MIT License
├── docker-compose.yml                 # Local container orchestration
│
├── backend/                           # FastAPI Python Backend
│   ├── app/
│   │   ├── adapters/                  # Cloud integrations
│   │   │   ├── aws_adapter.py         # Real CloudTrail & CloudWatch reader
│   │   │   └── hindsight_adapter.py   # Hindsight SDK memory client
│   │   ├── api/                       # REST route handlers
│   │   │   └── routes.py              # /api/changes, /investigations, /stats
│   │   ├── core/                      # Intelligence engines
│   │   │   ├── correlation.py         # Evidence-weighted scoring formula
│   │   │   ├── evidence.py            # Evidence pack generation & SHA-256
│   │   │   └── memory.py              # Operational memory provider & fallback
│   │   ├── demo/                      # Deterministic sandbox dataset
│   │   │   └── scenario.py            # Seed data for checkout incident
│   │   ├── models/                    # Pydantic v2 schemas
│   │   │   └── schemas.py             # Change, Investigation, Evidence schemas
│   │   ├── services/                  # Orchestration services
│   │   │   └── investigation_service.py # Live case synthesis
│   │   ├── config.py                  # Environment settings
│   │   └── main.py                    # FastAPI application entrypoint
│   ├── tests/                         # Pytest test suite (19 tests)
│   │   ├── test_api.py                # Endpoint integration tests
│   │   ├── test_correlation.py        # Scoring and BFS graph tests
│   │   ├── test_evidence.py           # SHA-256 hash determinism tests
│   │   ├── test_memory.py             # Memory fallback & sanitization tests
│   │   └── test_models.py             # Pydantic schema validation tests
│   └── requirements.txt               # Backend dependencies
│
├── frontend/                          # Next.js 14 Frontend
│   ├── src/
│   │   ├── app/                       # App Router pages
│   │   │   ├── page.tsx               # Operational Work Queue (Overview)
│   │   │   ├── changes/page.tsx       # CloudTrail Changes Stream
│   │   │   ├── investigations/[id]/   # Investigation Detail view
│   │   │   ├── layout.tsx             # Root layout & font loading
│   │   │   └── globals.css            # SPEC v2 surface tokens & styling
│   │   ├── components/                # Modular UI components
│   │   │   ├── BlastRadiusGraph.tsx   # Interactive topological dependency canvas
│   │   │   ├── TimelineView.tsx       # Multi-lane temporal event visualizer
│   │   │   ├── EvidencePanel.tsx      # Cryptographic evidence artifact viewer
│   │   │   ├── MemoryPanel.tsx        # Hindsight operational memory viewer
│   │   │   ├── ConsoleShell.tsx       # Topbar & sidebar navigation shell
│   │   │   └── StatCard.tsx           # High-contrast metric cards
│   │   └── lib/                       # Frontend utilities
│   │       ├── api.ts                 # Type-safe API client
│   │       └── types.ts               # TypeScript data definitions
│   └── package.json                   # Frontend dependencies
│
├── infrastructure/                    # AWS Infrastructure as Code
│   ├── demo-workload.yaml             # CloudFormation template for checkout workload
│   ├── lambda_function.py             # Monitored checkout Lambda handler
│   └── dynamodb_policy.json           # Execution role policies
│
├── docs/                              # Supporting documentation & specs
│   ├── BUILDER_CENTER.md              # AWS Builder Center hackathon submission
│   ├── REUSE_AUDIT.md                 # Architecture reuse & independence audit
│   ├── HINDSIGHT_INTEGRATION.md       # Memory integration technical spec
│   ├── AWS_AGENT_CONNECTION.md        # Agent telemetry and governance spec
│   └── screenshots/                   # Publication-grade UI screenshots
│       ├── overview_dashboard.png
│       ├── live_investigation.png
│       ├── blast_radius_investigation.png
│       └── cloudtrail_changes.png
│
└── scripts/                           # Operational scripts
    ├── run-demo.sh                    # Automated checkout traffic generator
    └── update-workload-resources.py   # Workload configuration script
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.11+ (Python 3.13 recommended)
- Node.js 18+ & npm
- AWS CLI configured (optional, required only for live AWS mode)

### 1. Clone & Configure
```bash
git clone https://github.com/srinivasBJ/changelens.git
cd changelens
cp .env.example .env
```

### 2. Start Backend Service
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run in DEMO mode (default, no AWS account needed):
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Or run in LIVE mode with real AWS credentials:
# CHANGELENS_MODE=live AWS_DEFAULT_REGION=us-east-2 uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend runs at `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).*

### 3. Start Frontend Service
```bash
cd ../frontend
npm install
npm run dev
```
*Frontend runs at `http://localhost:3000`.*

---

## 🧪 Testing & Verification

The ChangeLens backend is covered by an automated test suite verifying scoring mathematics, graph algorithms, evidence hashing, and API contracts.

### Running Backend Tests
```bash
cd backend
venv/bin/pytest -v
```

```text
tests/test_api.py::test_health_endpoint PASSED                           [  5%]
tests/test_api.py::test_stats_endpoint PASSED                            [ 10%]
tests/test_api.py::test_changes_endpoints PASSED                         [ 15%]
tests/test_api.py::test_investigations_endpoints PASSED                  [ 21%]
tests/test_api.py::test_events_and_demo_endpoints PASSED                 [ 26%]
tests/test_correlation.py::test_metric_severity_calculation PASSED       [ 31%]
tests/test_correlation.py::test_temporal_proximity_calculation PASSED    [ 36%]
tests/test_correlation.py::test_dependency_weight_same_resource PASSED   [ 42%]
tests/test_correlation.py::test_dependency_weight_direct_dep PASSED      [ 47%]
tests/test_correlation.py::test_dependency_path_bfs PASSED               [ 52%]
tests/test_correlation.py::test_overall_impact_score PASSED              [ 57%]
tests/test_evidence.py::test_evidence_pack_generation PASSED             [ 63%]
tests/test_evidence.py::test_evidence_pack_hash_determinism PASSED       [ 68%]
tests/test_memory.py::test_fallback_memory_provider PASSED               [ 73%]
tests/test_memory.py::test_memory_sanitization PASSED                    [ 78%]
tests/test_models.py::test_change_model PASSED                           [ 84%]
tests/test_models.py::test_agent_action_model PASSED                     [ 89%]
tests/test_models.py::test_evidence_artifact_hash PASSED                 [ 94%]
tests/test_models.py::test_operational_memory_model PASSED               [100%]
============================== 19 passed in 0.57s ==============================
```

### Running Frontend Production Build
```bash
cd frontend
npm run build
```

```text
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (5/5)
✓ Collecting build traces
✓ Finalizing page optimization
```

---

## 🔒 Security & Governance Hardening

ChangeLens is engineered with strict production security standards:
- **Zero Static Credentials:** No AWS access keys, secret keys, or tokens are committed to source control or stored on server disk.
- **IAM Instance Profile:** EC2 authentication is handled exclusively through `ChangeLens-EC2-Role` via instance metadata.
- **IMDSv2 Enforced:** Instance metadata requests require a session token with a maximum hop limit of 2, preventing SSRF credential theft.
- **Zero Public SSH:** Inbound port 22 is disabled. Remote host administration is performed through AWS Systems Manager (SSM) Session Manager.
- **CloudFront Prefix List Ingress:** Inbound HTTP (port 80) on the EC2 security group is restricted strictly to the AWS-managed CloudFront origin prefix list (`pl-b6a144df`). Direct public access (`0.0.0.0/0`) is blocked.
- **Least-Privilege AWS Read Access:** The IAM policy (`ChangeLens-Adapter-ReadPolicy`) grants read-only permissions exclusively to required operations (`cloudtrail:LookupEvents`, `cloudwatch:GetMetricStatistics`, `lambda:GetFunctionConfiguration`, `dynamodb:DescribeTable`, `apigateway:GetRestApi`).
- **PII & Account ID Redaction:** AWS account numbers in telemetry and memory payloads are automatically sanitized (`XXXXXXXXXXXX`).
- **Non-Destructive Design:** ChangeLens generates verified evidence and recommended runbooks; it never executes automatic destructive rollbacks.

---

## 🧬 Architectural References & Lineage

ChangeLens was conceived by synthesizing architectural patterns from prior engineering systems created by the author:
- **[OpenMesh](https://github.com/srinivasBJ/OpenMesh):** Informed multi-source event normalization and graph-based dependency modeling.
- **OpenMesh Sentinel:** Informed governance tracking, approval status checks, and autonomous AI agent accountability (`AgentAction`).
- **BuildMesh:** Informed cryptographic SHA-256 evidence integrity and deterministic validation methodologies.

> [!IMPORTANT]
> **Complete Independence:** ChangeLens is an independent, clean-room implementation. It does not fork, depend on, or share code with OpenMesh or BuildMesh. It is designed specifically for the AWS operational ecosystem.

---

## 🏆 Hackathon Context

- **Event:** **AWS Builder Center — Zero to Shipped**
- **Category:** `#workplace-efficiency`
- **Lane:** `#startups`
- **The Story in 6 Steps:**
  $$\text{Real AWS Workload} \longrightarrow \text{Real Telemetry Shock} \longrightarrow \text{CloudTrail Ingestion} \longrightarrow \text{Causal Correlation} \longrightarrow \text{Impact Graph} \longrightarrow \text{Forensic Evidence Pack}$$

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
