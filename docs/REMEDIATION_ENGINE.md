# ChangeLens Actionable Remediation & Automated Rollback Engine

**Release:** v1.2.0 (October 24, 2026)  
**Target Environment:** AWS us-east-2 (Ohio)  
**Primary Integration:** AWS Control Plane (AWS CloudTrail, Amazon CloudWatch, AWS Lambda, Amazon API Gateway, Amazon DynamoDB)

---

## 1. Overview & Purpose

When operational anomalies occur following an infrastructure modification, diagnosing the root cause is only the first half of the battle. On-call site reliability engineers and operators require **immediate, safe, and verifiable remediation guidance** without context switching between documentation wikis and terminal commands.

ChangeLens v1.2.0 introduces the **Actionable Remediation & Automated Rollback Runbook Engine**, which automatically:
1. Synthesizes a deterministic rollback procedure from the verified control-plane change.
2. Formulates exact, copyable AWS CLI commands with pre-populated resource names, regions, and parameters.
3. Computes a pre-flight risk rating (`LOW`, `MEDIUM`, `HIGH`) based on dependency blast radius.
4. Generates a multi-step execution runbook with safety checklists and expected validation outputs.
5. Emits direct AWS Console deep-links (`us-east-2`) into CloudTrail, CloudWatch, Lambda, API Gateway, and DynamoDB consoles.

---

## 2. Core Workflow & Architecture

```
                 Active Investigation (inv_live_001)
                                │
             ┌──────────────────┴──────────────────┐
             ▼                                     ▼
   Root Cause Mutation                  Dependency Blast Radius
(PutFunctionConcurrency)            (Lambda ➔ API Gateway ➔ DynamoDB)
             │                                     │
             └──────────────────┬──────────────────┘
                                │
                                ▼
                   Remediation Engine Evaluation
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  Primary Rollback CLI     4-Step Sequential      Pre-Flight Safety
      Command                  Procedure              Checklist
(aws lambda delete-       (Metric Validation,       (Capacity check,
 function-concurrency)     Quota Purge, Normalization) IAM Auth, Memory)
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                                ▼
                 Direct AWS Console Deep-Links
                (CloudTrail, CloudWatch, Lambda,
                  API Gateway, DynamoDB in us-east-2)
```

---

## 3. Live Incident Remediation Runbook (checkout-function)

For the verified live incident (`inv_live_001`), where `PutFunctionConcurrency` on `checkout-function` restricted concurrency to `1`, the engine outputs:

### A. Primary Rollback Command
```bash
aws lambda delete-function-concurrency \
  --function-name checkout-function \
  --region us-east-2
```

### B. Sequential Execution Procedure

1. **Step 1: Verify Active Throttling Telemetry**
   - **Command:** `aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Throttles --dimensions Name=FunctionName,Value=checkout-function --period 60 --statistics Sum ...`
   - **Expected Result:** Confirm `Throttles` sum > 0 correlates with the change timestamp (+29s temporal proximity).
   - **Safety Check:** Ensure traffic volume is authentic and not a malicious flood.

2. **Step 2: Execute Concurrency Rollback**
   - **Command:** `aws lambda delete-function-concurrency --function-name checkout-function --region us-east-2`
   - **Expected Result:** HTTP 200 OK with empty response confirming concurrency reservation has been deleted.
   - **Safety Check:** Verify regional unreserved concurrency pool has >= 100 available execution units.

3. **Step 3: Verify Concurrency Quota Release**
   - **Command:** `aws lambda get-function-concurrency --function-name checkout-function --region us-east-2`
   - **Expected Result:** Return `{}` confirming function uses unreserved shared pool.
   - **Safety Check:** Confirm no other functions in the account are consuming regional concurrency limits.

4. **Step 4: Monitor Downstream Telemetry Normalization**
   - **Command:** `aws cloudwatch get-metric-statistics --namespace AWS/ApiGateway --metric-name 5XXError --dimensions Name=ApiName,Value=changelens-checkout-api --period 60 --statistics Sum ...`
   - **Expected Result:** `5XXError` and Lambda `Errors` drop back to 0 within 60 seconds.
   - **Safety Check:** Ensure order transactions resume in DynamoDB `checkout-table` without latency surge.

---

## 4. Direct AWS Console Deep-Links

ChangeLens surfaces direct launcher links into the AWS Management Console:

| Target Console | Resource | Link Pattern |
|---|---|---|
| **AWS CloudTrail** | `checkout-function` | `https://us-east-2.console.aws.amazon.com/cloudtrail/home?region=us-east-2#/events?ResourceName=checkout-function` |
| **Amazon CloudWatch** | Metrics & Alarms | `https://us-east-2.console.aws.amazon.com/cloudwatch/home?region=us-east-2#metricsV2...` |
| **AWS Lambda** | Function Concurrency | `https://us-east-2.console.aws.amazon.com/lambda/home?region=us-east-2#/functions/checkout-function?tab=configure` |
| **Amazon API Gateway** | `changelens-checkout-api` | `https://us-east-2.console.aws.amazon.com/apigateway/main/apis/pihaacms70/resources?region=us-east-2` |
| **Amazon DynamoDB** | `checkout-table` | `https://us-east-2.console.aws.amazon.com/dynamodbv2/home?region=us-east-2#table?name=checkout-table` |

---

## 5. REST API Endpoint

Reviewers and external systems can query remediation plans via:

```http
GET /api/investigations/{investigation_id}/remediation
```

**Response Header:**
```http
Cache-Control: no-store, no-cache, must-revalidate, max-age=0
Pragma: no-cache
```
