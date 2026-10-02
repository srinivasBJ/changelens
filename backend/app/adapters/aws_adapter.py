"""AWS service adapter — READ-ONLY access to CloudTrail and CloudWatch.

This adapter NEVER performs write operations against AWS.
It reads telemetry and change events for correlation.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import boto3
from botocore.exceptions import ClientError, NoCredentialsError

from app.models.core import ActorType, Anomaly, Change

logger = logging.getLogger(__name__)


class AWSAdapter:
    """Read-only AWS adapter for CloudTrail and CloudWatch data retrieval."""

    # CloudTrail configuration change actions we care about
    CONFIG_CHANGE_ACTIONS = {
        "UpdateFunctionConfiguration",
        "UpdateFunctionCode",
        "PutFunctionConcurrency",
        "DeleteFunctionConcurrency",
        "UpdateTable",
        "UpdateStage",
        "UpdateRestApi",
        "PutBucketPolicy",
        "PutBucketAcl",
        "PutObject",
        "DeleteObject",
        "PutRule",
        "DeleteRule",
        "TagResource",
        "UntagResource",
    }

    def __init__(self, region: str = "us-east-2", profile: Optional[str] = None):
        self.region = region
        try:
            session_kwargs = {"region_name": region}
            if profile:
                session_kwargs["profile_name"] = profile
            self.session = boto3.Session(**session_kwargs)
            self.cloudtrail = self.session.client("cloudtrail")
            self.cloudwatch = self.session.client("cloudwatch")
            self._available = True
            logger.info("AWS adapter initialized (region=%s)", region)
        except (NoCredentialsError, ClientError) as e:
            logger.warning("AWS credentials not available: %s", e)
            self._available = False

    @property
    def is_available(self) -> bool:
        return self._available

    def _classify_actor(self, event: dict) -> tuple[ActorType, str]:
        """Classify the actor type from a CloudTrail event."""
        user_identity = event.get("userIdentity", event.get("UserIdentity", {}))
        if isinstance(user_identity, str):
            return ActorType.SERVICE, user_identity

        identity_type = user_identity.get("type", "")
        arn = user_identity.get("arn", user_identity.get("principalId", "unknown"))

        if identity_type == "AssumedRole":
            session = user_identity.get("sessionContext", {})
            session_issuer = session.get("sessionIssuer", {})
            if "agent" in session_issuer.get("userName", "").lower():
                return ActorType.AI_AGENT, arn
            if session.get("attributes", {}).get("mfaAuthenticated") == "true":
                return ActorType.HUMAN, arn
            return ActorType.AUTOMATION, arn
        elif identity_type == "IAMUser":
            return ActorType.HUMAN, arn
        elif identity_type in ("AWSService", "AWSAccount"):
            return ActorType.SERVICE, arn
        else:
            return ActorType.AUTOMATION, arn

    async def get_recent_cloudtrail_events(
        self, minutes: int = 60, resource_name: Optional[str] = None
    ) -> List[Change]:
        """Retrieve recent CloudTrail configuration change events.

        READ-ONLY: Uses LookupEvents API.
        """
        if not self._available:
            return []

        try:
            end_time = datetime.now(timezone.utc)
            start_time = end_time - timedelta(minutes=minutes)

            lookup_kwargs = {
                "StartTime": start_time,
                "EndTime": end_time,
                "MaxResults": 50,
            }

            if resource_name:
                lookup_kwargs["LookupAttributes"] = [
                    {
                        "AttributeKey": "ResourceName",
                        "AttributeValue": resource_name,
                    }
                ]

            response = self.cloudtrail.lookup_events(**lookup_kwargs)
            events = response.get("Events", [])

            changes = []
            for event in events:
                event_name = event.get("EventName", "")
                if event_name not in self.CONFIG_CHANGE_ACTIONS:
                    continue

                actor_type, actor_id = self._classify_actor(event)

                # Extract resource info
                resources = event.get("Resources", [])
                resource_name_val = ""
                resource_id_val = ""
                service = "unknown"

                for res in resources:
                    resource_name_val = res.get("ResourceName", "")
                    resource_id_val = res.get("ResourceType", "")
                    # Infer service from resource type
                    rt = resource_id_val.lower()
                    if "lambda" in rt or "function" in rt:
                        service = "lambda"
                    elif "dynamodb" in rt or "table" in rt:
                        service = "dynamodb"
                    elif "apigateway" in rt or "restapi" in rt:
                        service = "apigateway"
                    elif "s3" in rt or "bucket" in rt:
                        service = "s3"
                    break

                change = Change(
                    timestamp=event.get("EventTime", datetime.now(timezone.utc)),
                    service=service,
                    action=event_name,
                    resource_id=resource_id_val or event.get("EventId", ""),
                    resource_name=resource_name_val or event_name,
                    actor_type=actor_type,
                    actor_id=actor_id,
                    region=self.region,
                    source="cloudtrail",
                    raw_event_ref=event.get("EventId", ""),
                    account_id=event.get("AccountId"),
                )
                changes.append(change)

            logger.info("Retrieved %d CloudTrail changes in last %d minutes", len(changes), minutes)
            return changes

        except ClientError as e:
            logger.error("CloudTrail lookup failed: %s", e)
            return []

    async def get_lambda_metrics(
        self, function_name: str, minutes: int = 30
    ) -> List[Anomaly]:
        """Retrieve Lambda metrics and detect anomalies.

        READ-ONLY: Uses GetMetricData API.
        Compares recent metrics against a baseline period.
        """
        if not self._available:
            return []

        try:
            end_time = datetime.now(timezone.utc)
            start_time = end_time - timedelta(minutes=minutes)
            baseline_start = start_time - timedelta(minutes=minutes)

            metrics_to_check = [
                ("Throttles", "AWS/Lambda", "Sum"),
                ("Errors", "AWS/Lambda", "Sum"),
                ("Duration", "AWS/Lambda", "Average"),
                ("Invocations", "AWS/Lambda", "Sum"),
            ]

            anomalies = []
            for metric_name, namespace, stat in metrics_to_check:
                try:
                    # Get recent period
                    recent = self.cloudwatch.get_metric_statistics(
                        Namespace=namespace,
                        MetricName=metric_name,
                        Dimensions=[
                            {"Name": "FunctionName", "Value": function_name}
                        ],
                        StartTime=start_time,
                        EndTime=end_time,
                        Period=60,
                        Statistics=[stat],
                    )

                    # Get baseline period
                    baseline = self.cloudwatch.get_metric_statistics(
                        Namespace=namespace,
                        MetricName=metric_name,
                        Dimensions=[
                            {"Name": "FunctionName", "Value": function_name}
                        ],
                        StartTime=baseline_start,
                        EndTime=start_time,
                        Period=60,
                        Statistics=[stat],
                    )

                    recent_points = recent.get("Datapoints", [])
                    baseline_points = baseline.get("Datapoints", [])

                    if not recent_points or not baseline_points:
                        continue

                    stat_key = stat if stat != "Average" else "Average"
                    recent_avg = sum(p.get(stat_key, 0) for p in recent_points) / len(recent_points)
                    baseline_avg = sum(p.get(stat_key, 0) for p in baseline_points) / len(baseline_points)

                    if baseline_avg == 0:
                        if recent_avg > 0:
                            deviation_pct = 100.0
                        else:
                            continue
                    else:
                        deviation_pct = ((recent_avg - baseline_avg) / baseline_avg) * 100

                    # Only report significant deviations
                    if abs(deviation_pct) > 20:
                        severity = min(abs(deviation_pct) / 500, 1.0)
                        anomaly = Anomaly(
                            timestamp=max(recent_points, key=lambda p: p["Timestamp"])["Timestamp"],
                            resource_id=function_name,
                            resource_name=function_name,
                            service="lambda",
                            metric_name=metric_name,
                            metric_namespace=namespace,
                            baseline_value=round(baseline_avg, 2),
                            anomaly_value=round(recent_avg, 2),
                            deviation_pct=round(deviation_pct, 1),
                            severity=round(severity, 2),
                        )
                        anomalies.append(anomaly)

                except ClientError as e:
                    logger.warning("Failed to get metric %s: %s", metric_name, e)

            return anomalies

        except Exception as e:
            logger.error("Lambda metrics retrieval failed: %s", e)
            return []

    async def get_api_gateway_metrics(
        self, api_name: str, minutes: int = 30
    ) -> List[Anomaly]:
        """Retrieve API Gateway metrics and detect anomalies.

        READ-ONLY: Uses GetMetricData API.
        """
        if not self._available:
            return []

        try:
            end_time = datetime.now(timezone.utc)
            start_time = end_time - timedelta(minutes=minutes)
            baseline_start = start_time - timedelta(minutes=minutes)

            metrics_to_check = [
                ("5xx", "AWS/ApiGateway", "Sum"),
                ("5XXError", "AWS/ApiGateway", "Sum"),
                ("4xx", "AWS/ApiGateway", "Sum"),
                ("4XXError", "AWS/ApiGateway", "Sum"),
                ("Latency", "AWS/ApiGateway", "Average"),
            ]

            anomalies = []
            for metric_name, namespace, stat in metrics_to_check:
                for dim_name in ["ApiName", "ApiId"]:
                    try:
                        recent = self.cloudwatch.get_metric_statistics(
                            Namespace=namespace,
                            MetricName=metric_name,
                            Dimensions=[{"Name": dim_name, "Value": api_name}],
                            StartTime=start_time,
                            EndTime=end_time,
                            Period=60,
                            Statistics=[stat],
                        )

                        baseline = self.cloudwatch.get_metric_statistics(
                            Namespace=namespace,
                            MetricName=metric_name,
                            Dimensions=[{"Name": dim_name, "Value": api_name}],
                            StartTime=baseline_start,
                            EndTime=start_time,
                            Period=60,
                            Statistics=[stat],
                        )

                        recent_points = recent.get("Datapoints", [])
                        baseline_points = baseline.get("Datapoints", [])

                        if not recent_points or not baseline_points:
                            continue

                        stat_key = stat if stat != "Average" else "Average"
                        recent_avg = sum(p.get(stat_key, 0) for p in recent_points) / len(recent_points)
                        baseline_avg = sum(p.get(stat_key, 0) for p in baseline_points) / len(baseline_points)

                        if baseline_avg == 0:
                            if recent_avg > 0:
                                deviation_pct = 100.0
                            else:
                                continue
                        else:
                            deviation_pct = ((recent_avg - baseline_avg) / baseline_avg) * 100

                        if abs(deviation_pct) > 20:
                            severity = min(abs(deviation_pct) / 500, 1.0)
                            anomaly = Anomaly(
                                timestamp=max(recent_points, key=lambda p: p["Timestamp"])["Timestamp"],
                                resource_id=api_name,
                                resource_name=api_name,
                                service="apigateway",
                                metric_name=metric_name,
                                metric_namespace=namespace,
                                baseline_value=round(baseline_avg, 2),
                                anomaly_value=round(recent_avg, 2),
                                deviation_pct=round(deviation_pct, 1),
                                severity=round(severity, 2),
                            )
                            anomalies.append(anomaly)
                            break  # Found datapoints for this metric with this dimension
                    except ClientError as e:
                        logger.debug("Failed to get API GW metric %s with %s: %s", metric_name, dim_name, e)

            return anomalies

        except Exception as e:
            logger.error("API Gateway metrics retrieval failed: %s", e)
            return []

    async def get_dynamodb_metrics(
        self, table_name: str, minutes: int = 30
    ) -> List[Anomaly]:
        """Retrieve DynamoDB metrics and detect anomalies for checkout-table.

        READ-ONLY: Uses GetMetricStatistics API.
        """
        if not self._available:
            return []

        try:
            end_time = datetime.now(timezone.utc)
            start_time = end_time - timedelta(minutes=minutes)
            baseline_start = start_time - timedelta(minutes=minutes)

            metrics_to_check = [
                ("ReadThrottleEvents", "AWS/DynamoDB", "Sum"),
                ("WriteThrottleEvents", "AWS/DynamoDB", "Sum"),
                ("SystemErrorsForOperations", "AWS/DynamoDB", "Sum"),
                ("UserErrors", "AWS/DynamoDB", "Sum"),
            ]

            anomalies = []
            for metric_name, namespace, stat in metrics_to_check:
                try:
                    recent = self.cloudwatch.get_metric_statistics(
                        Namespace=namespace,
                        MetricName=metric_name,
                        Dimensions=[{"Name": "TableName", "Value": table_name}],
                        StartTime=start_time,
                        EndTime=end_time,
                        Period=60,
                        Statistics=[stat],
                    )

                    baseline = self.cloudwatch.get_metric_statistics(
                        Namespace=namespace,
                        MetricName=metric_name,
                        Dimensions=[{"Name": "TableName", "Value": table_name}],
                        StartTime=baseline_start,
                        EndTime=start_time,
                        Period=60,
                        Statistics=[stat],
                    )

                    recent_points = recent.get("Datapoints", [])
                    baseline_points = baseline.get("Datapoints", [])

                    if not recent_points or not baseline_points:
                        continue

                    stat_key = stat if stat != "Average" else "Average"
                    recent_avg = sum(p.get(stat_key, 0) for p in recent_points) / len(recent_points)
                    baseline_avg = sum(p.get(stat_key, 0) for p in baseline_points) / len(baseline_points)

                    if baseline_avg == 0:
                        if recent_avg > 0:
                            deviation_pct = 100.0
                        else:
                            continue
                    else:
                        deviation_pct = ((recent_avg - baseline_avg) / baseline_avg) * 100

                    if abs(deviation_pct) > 20:
                        severity = min(abs(deviation_pct) / 500, 1.0)
                        anomaly = Anomaly(
                            timestamp=max(recent_points, key=lambda p: p["Timestamp"])["Timestamp"],
                            resource_id=table_name,
                            resource_name=table_name,
                            service="dynamodb",
                            metric_name=metric_name,
                            metric_namespace=namespace,
                            baseline_value=round(baseline_avg, 2),
                            anomaly_value=round(recent_avg, 2),
                            deviation_pct=round(deviation_pct, 1),
                            severity=round(severity, 2),
                        )
                        anomalies.append(anomaly)

                except ClientError as e:
                    logger.debug("Failed to get DynamoDB metric %s: %s", metric_name, e)

            return anomalies

        except Exception as e:
            logger.error("DynamoDB metrics retrieval failed: %s", e)
            return []
