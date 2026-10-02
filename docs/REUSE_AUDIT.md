# ChangeLens Architecture & Engineering Reuse Audit

**Project:** ChangeLens (AWS Change Impact & Operational Memory)  
**Date:** October 2026  
**Author:** Lead Engineer / Srinivas BJ Project Family Reference  

---

## 1. Executive Summary

ChangeLens is a brand-new, independent AWS-native operational intelligence application. It is **not** OpenMesh, does not fork OpenMesh, is not OpenMesh Sentinel, and does not duplicate generic observability tooling. 

However, prior projects developed by the creator—specifically **OpenMesh**, **OpenMesh Sentinel**, and **BuildMesh**—established valuable architectural patterns for event normalization, governance workflows, and forensic evidence tracking. This document audits the inspection of those reference repositories, identifies which conceptual patterns were synthesized into ChangeLens, and delineates what remains strictly independent.

---

## 2. Comparative Matrix

| Source Project | Component / Pattern Inspected | Concept Reused in ChangeLens | Why It Is Relevant to ChangeLens | What Was Intentionally NOT Reused |
|---|---|---|---|---|
| **OpenMesh** | Multi-source event modeling & normalization | Normalized `Change` schema for CloudTrail events with actor classification | Telemetry and changes arrive from heterogeneous AWS logs; normalized typing enables unified correlation | OpenMesh SDK, agent registry, broker, trace storage engine, OpenMesh branding, CLI/TUI |
| **OpenMesh** | Graph-oriented dependency representation | `BlastRadiusGraph` (`GraphNode`, `GraphEdge`) showing topological impact | An incident blast radius must show the path from changed resource to dependent services and business metrics | OpenMesh-specific graph store, Neo4j dependencies, agent mesh orchestration |
| **OpenMesh Sentinel** | Governance & approval state tracking | Minimal `Approval` model (`approved`, `rejected`, `missing`, `not_required`) | Changes performed without approval (especially by autonomous agents) represent higher operational risk in the impact score | Full enterprise policy engine, RBAC directories, complex approval consensus workflows |
| **OpenMesh Sentinel** | Agent action accountability | Normalized `AgentAction` model (`agent_id`, `capability`, `requested_action`, `approval_status`) | Autonomous AI agents are modifying AWS infrastructure; operators require operational accountability | Agent sandbox execution, agent proxy interception, multi-tenant agent control plane |
| **BuildMesh** | Forensic evidence integrity | SHA-256 content hashing on `EvidenceArtifact` and `EvidencePack` | Change hypotheses must be defendable with verifiable, tamper-evident cryptographic hashes | BuildMesh build forensics, CI/CD pipeline analyzers, container layer verification |
| **BuildMesh** | Phased validation methodology | Strict quality gates, deterministic demo datasets, and unit test suites | CloudTrail events can suffer 5-15 minute propagation delays; deterministic offline validation ensures demo reliability | BuildMesh release gates, artifact registries |
| **Hindsight** | Agent Memory System (retain, recall, reflect) | "Operational Memory" layer in ChangeLens connecting past incidents to current changes | Solves the core question: *"Have we seen this operational pattern before?"* without conflating history with live evidence | Chatbot conversational history, raw vector store replacement, internal Hindsight source code |

---

## 3. Explicit Implementation Independence

1. **Zero Code Duplication:** No code has been copy-pasted or forked from OpenMesh, OpenMesh Sentinel, or BuildMesh. ChangeLens models are defined cleanly with Pydantic v2 and TypeScript interfaces.
2. **Dedicated AWS Focus:** OpenMesh focused broadly on multi-agent communication and mesh observability. ChangeLens is strictly focused on the AWS operational stack (CloudTrail, CloudWatch, Lambda, API Gateway, DynamoDB, S3, EventBridge).
3. **Evidence-Weighted Scoring:** The correlation engine uses an explainable, transparent formula (`0.35 * metric_severity + 0.25 * temporal_proximity + 0.20 * dependency_weight + 0.10 * actor_context + 0.10 * historical_similarity`) rather than black-box models or generic trace span aggregators.
4. **Hindsight as Dedicated External Dependency:** Hindsight is integrated strictly via its documented client SDK / API to implement `OperationalMemory`, keeping historical patterns strictly segregated from live telemetry evidence.
