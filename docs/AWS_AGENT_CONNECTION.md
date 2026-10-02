# AWS Agent Connection Verification

**Project:** ChangeLens (AWS Change Impact & Operational Memory)  
**Hackathon:** AWS Builder Center — Zero to Shipped (October 2026)  
**Category:** `#workplace-efficiency`  
**Lane:** `#startups`  
**Coding Agent:** Google Antigravity (Advanced Agentic Coding)  
**Date:** October 2, 2026  
**Primary Region:** `us-east-2`  

---

## 1. Overview & Verification Requirement

To fulfill the AWS Builder Center "Zero to Shipped" criteria:
1. An autonomous coding agent must be connected to AWS.
2. Documented proof of that operational connection must be recorded.
3. The application must interact with live AWS infrastructure or deploy AWS-native resources.

---

## 2. Agent Connection Details

| Attribute | Value / Description |
|---|---|
| **Autonomous Coding Agent** | Google Antigravity (DeepMind Advanced Agentic Coding) |
| **AWS SDK / Integration** | `boto3` v1.36.2 / `botocore` v1.36.2 |
| **Target AWS Region** | `us-east-2` (Ohio) |
| **Execution Environment** | macOS Darwin 24 (Apple Silicon / Python 3.14 / Node v26) |
| **Target AWS Services** | CloudTrail, CloudWatch, AWS Lambda, API Gateway, DynamoDB, S3, EventBridge |

---

## 3. Operational Telemetry & Connection Validation

The coding agent established programmatic connectivity to AWS via the `AWSAdapter` module. The connection interacts with AWS CloudTrail and CloudWatch via the following verified calls:

### A. CloudTrail Event Ingestion (`LookupEvents`)
```python
response = cloudtrail.lookup_events(
    StartTime=start_time,
    EndTime=end_time,
    LookupAttributes=[{"AttributeKey": "ResourceName", "AttributeValue": "changelens-checkout-function"}],
    MaxResults=50
)
```
*Validation Result:* Successfully parsed AWS CloudTrail event streams into normalized `Change` data structures with actor classification (`human`, `automation`, `ai_agent`).

### B. CloudWatch Telemetry Query (`GetMetricStatistics`)
```python
recent = cloudwatch.get_metric_statistics(
    Namespace="AWS/Lambda",
    MetricName="Throttles",
    Dimensions=[{"Name": "FunctionName", "Value": "changelens-checkout-function"}],
    StartTime=start_time,
    EndTime=end_time,
    Period=60,
    Statistics=["Sum"]
)
```
*Validation Result:* Successfully queried CloudWatch metrics and baseline deviation statistics to compute severity scores for `Throttles`, `Errors`, and API Gateway `5XXError`.

### C. CloudFormation Demo Workload Template
The agent authored a CloudFormation template in `infrastructure/demo-workload.yaml` provisioning:
- `AWS::Lambda::Function` (`changelens-checkout-function`)
- `AWS::ApiGateway::RestApi` (`changelens-checkout-api`)
- `AWS::DynamoDB::Table` (`changelens-orders`)
- `AWS::IAM::Role` (`changelens-checkout-function-role`)

---

## 4. Security & Credential Hygiene
- Zero AWS credentials, secret keys, or session tokens are hardcoded in the codebase or committed to Git.
- Read-only AWS observation is enforced by default in the `AWSAdapter`.
- CloudTrail events are sanitized of account numbers prior to Hindsight retention.
