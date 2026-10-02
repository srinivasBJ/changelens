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

    @staticmethod
    def _resolve_cli_v2_credentials() -> Optional[dict]:
        """Attempt to read temporary credentials from AWS CLI v2 device-auth login cache.

        AWS CLI v2 'aws configure login' stores STS credentials in
        ~/.aws/login/cache/*.json under an 'accessToken' dict with
        accessKeyId, secretAccessKey, sessionToken, and expiresAt fields.
        boto3 cannot read this cache natively, so we extract them here.
        """
        import glob
        import json
        import os
        import subprocess
        from pathlib import Path

        cache_dir = Path.home() / ".aws" / "login" / "cache"
        if not cache_dir.exists():
            return None

        # Check if latest token is expired; if so, invoke `aws sts get-caller-identity` to auto-refresh
        for cache_file in sorted(cache_dir.glob("*.json"), key=os.path.getmtime, reverse=True):
            try:
                with open(cache_file) as f:
                    data = json.load(f)
                token = data.get("accessToken", {})
                if isinstance(token, dict) and "accessKeyId" in token:
                    expires = token.get("expiresAt", "")
                    if expires:
                        from datetime import datetime, timezone
                        exp_dt = datetime.fromisoformat(expires.replace("Z", "+00:00"))
                        if exp_dt < datetime.now(timezone.utc):
                            logger.info("CLI v2 cached token expired; triggering auto-refresh via aws CLI...")
                            try:
                                subprocess.run(
                                    ["aws", "sts", "get-caller-identity"],
                                    capture_output=True,
                                    timeout=10,
                                    check=False,
                                )
                                # Re-read newly refreshed cache file
                                with open(cache_file) as f_new:
                                    data = json.load(f_new)
                                token = data.get("accessToken", {})
                            except Exception as ref_err:
                                logger.warning("Could not auto-refresh AWS token: %s", ref_err)
                                continue

                    return {
                        "aws_access_key_id": token["accessKeyId"],
                        "aws_secret_access_key": token["secretAccessKey"],
                        "aws_session_token": token.get("sessionToken", ""),
                    }
            except Exception as e:
                logger.debug("Could not read CLI v2 cache file %s: %s", cache_file, e)
        return None

    def __init__(self, region: str = "us-east-2", profile: Optional[str] = None):
        self.region = region
        try:
            session_kwargs = {"region_name": region}
            if profile:
                session_kwargs["profile_name"] = profile
            self.session = boto3.Session(**session_kwargs)

            # Test if default credentials work
            try:
                self.session.client("sts").get_caller_identity()
            except (NoCredentialsError, ClientError):
                # Fallback: try AWS CLI v2 device-auth login cache
                cli_creds = self._resolve_cli_v2_credentials()
                if cli_creds:
                    logger.info("Using credentials from AWS CLI v2 login cache")
                    session_kwargs.update(cli_creds)
                    self.session = boto3.Session(**session_kwargs)
                else:
                    raise

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
        username = event.get("Username", "")
        user_identity = event.get("userIdentity", event.get("UserIdentity", {}))
        if isinstance(user_identity, str):
            return ActorType.SERVICE, user_identity or username or "unknown"

        identity_type = user_identity.get("type", "")
        arn = user_identity.get("arn", user_identity.get("principalId", username or "unknown"))

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
        elif username:
            return ActorType.HUMAN, username
        else:
            return ActorType.AUTOMATION, arn

    async def get_recent_cloudtrail_events(
        self, minutes: int = 180, resource_name: Optional[str] = None
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
            events = list(response.get("Events", []))

            # If looking generally, also explicitly check checkout-function to guarantee coverage
            if not resource_name:
                try:
                    res_fn = self.cloudtrail.lookup_events(
                        LookupAttributes=[{"AttributeKey": "ResourceName", "AttributeValue": "checkout-function"}],
                        StartTime=start_time,
                        EndTime=end_time,
                        MaxResults=20,
                    )
                    existing_ids = {e.get("EventId") for e in events}
                    for e in res_fn.get("Events", []):
                        if e.get("EventId") not in existing_ids:
                            events.append(e)
                except Exception as e:
                    logger.debug("Failed specific resource lookup: %s", e)

            changes = []
            for event in events:
                raw_event_name = event.get("EventName", "")
                normalized_action = None
                for action in self.CONFIG_CHANGE_ACTIONS:
                    if raw_event_name == action or raw_event_name.startswith(action):
                        normalized_action = action
                        break
                if not normalized_action:
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

                if not resource_name_val and "function" in normalized_action.lower():
                    resource_name_val = "checkout-function"
                    service = "lambda"

                change = Change(
                    timestamp=event.get("EventTime", datetime.now(timezone.utc)),
                    service=service,
                    action=normalized_action,
                    resource_id=resource_id_val or event.get("EventId", ""),
                    resource_name=resource_name_val or normalized_action,
                    actor_type=actor_type,
                    actor_id=actor_id,
                    region=self.region,
                    source="cloudtrail",
                    raw_event_ref=event.get("EventId", ""),
                    account_id=event.get("AccountId"),
                    is_live=True,
                )
                changes.append(change)

            # Sort descending by timestamp
            changes.sort(key=lambda c: c.timestamp, reverse=True)
            logger.info("Retrieved %d CloudTrail changes in last %d minutes", len(changes), minutes)
            return changes

        except ClientError as e:
            logger.error("CloudTrail lookup failed: %s", e)
            return []

    async def get_lambda_metrics(
        self, function_name: str, minutes: int = 180
    ) -> List[Anomaly]:
        """Retrieve Lambda metrics and detect anomalies.

        READ-ONLY: Uses GetMetricStatistics API.
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
                    # Get recent period with Period=60 (1-minute fine CloudWatch resolution)
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

                    if not recent_points:
                        continue

                    stat_key = stat if stat != "Average" else "Average"
                    recent_vals = [p.get(stat_key, 0) for p in recent_points]
                    recent_avg = sum(recent_vals) / len(recent_vals) if recent_vals else 0.0
                    recent_max = max(recent_vals) if recent_vals else 0.0

                    baseline_vals = [p.get(stat_key, 0) for p in baseline_points]
                    baseline_avg = sum(baseline_vals) / len(baseline_vals) if baseline_vals else 0.0

                    # For Throttles and Errors: any non-zero count is an anomaly
                    if metric_name in ("Throttles", "Errors"):
                        if recent_max > 0:
                            deviation_pct = 100.0 if baseline_avg == 0 else ((recent_max - baseline_avg) / max(baseline_avg, 1.0)) * 100
                            severity = min(recent_max / 10.0, 1.0)
                            max_point = max(recent_points, key=lambda p: p.get(stat_key, 0))
                            anomalies.append(
                                Anomaly(
                                    timestamp=max_point["Timestamp"],
                                    resource_id=function_name,
                                    resource_name=function_name,
                                    service="lambda",
                                    metric_name=metric_name,
                                    metric_namespace=namespace,
                                    baseline_value=round(baseline_avg, 2),
                                    anomaly_value=round(recent_max, 2),
                                    deviation_pct=round(deviation_pct, 1),
                                    severity=round(severity, 2),
                                )
                            )
                        continue

                    # For Duration and Invocations
                    if baseline_avg > 0:
                        deviation_pct = ((recent_avg - baseline_avg) / baseline_avg) * 100
                        if abs(deviation_pct) > 30:
                            severity = min(abs(deviation_pct) / 500, 1.0)
                            anomalies.append(
                                Anomaly(
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
                            )

                except ClientError as e:
                    logger.warning("Failed to get metric %s: %s", metric_name, e)

            return anomalies

        except Exception as e:
            logger.error("Lambda metrics retrieval failed: %s", e)
            return []

    async def get_api_gateway_metrics(
        self, api_name: str, minutes: int = 180
    ) -> List[Anomaly]:
        """Retrieve API Gateway metrics and detect anomalies.

        READ-ONLY: Uses GetMetricStatistics API.
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

            # Check both the name and known API IDs
            api_identifiers = [api_name]
            if "pihaacms70" not in api_identifiers:
                api_identifiers.append("pihaacms70")

            anomalies = []
            seen_metrics = set()

            for target_id in api_identifiers:
                for metric_name, namespace, stat in metrics_to_check:
                    for dim_name in ["ApiId", "ApiName"]:
                        metric_key = f"{metric_name}_{dim_name}_{target_id}"
                        if metric_key in seen_metrics:
                            continue

                        try:
                            recent = self.cloudwatch.get_metric_statistics(
                                Namespace=namespace,
                                MetricName=metric_name,
                                Dimensions=[{"Name": dim_name, "Value": target_id}],
                                StartTime=start_time,
                                EndTime=end_time,
                                Period=60,
                                Statistics=[stat],
                            )

                            recent_points = recent.get("Datapoints", [])
                            if not recent_points:
                                continue

                            seen_metrics.add(metric_key)

                            baseline = self.cloudwatch.get_metric_statistics(
                                Namespace=namespace,
                                MetricName=metric_name,
                                Dimensions=[{"Name": dim_name, "Value": target_id}],
                                StartTime=baseline_start,
                                EndTime=start_time,
                                Period=60,
                                Statistics=[stat],
                            )
                            baseline_points = baseline.get("Datapoints", [])

                            stat_key = stat if stat != "Average" else "Average"
                            recent_vals = [p.get(stat_key, 0) for p in recent_points]
                            recent_avg = sum(recent_vals) / len(recent_vals) if recent_vals else 0.0
                            recent_max = max(recent_vals) if recent_vals else 0.0

                            baseline_vals = [p.get(stat_key, 0) for p in baseline_points]
                            baseline_avg = sum(baseline_vals) / len(baseline_vals) if baseline_vals else 0.0

                            if metric_name in ("5xx", "5XXError", "4xx", "4XXError"):
                                if recent_max > 0:
                                    deviation_pct = 100.0 if baseline_avg == 0 else ((recent_max - baseline_avg) / max(baseline_avg, 1.0)) * 100
                                    severity = min(recent_max / 10.0, 1.0)
                                    max_point = max(recent_points, key=lambda p: p.get(stat_key, 0))
                                    anomalies.append(
                                        Anomaly(
                                            timestamp=max_point["Timestamp"],
                                            resource_id=api_name,
                                            resource_name=api_name,
                                            service="apigateway",
                                            metric_name=metric_name,
                                            metric_namespace=namespace,
                                            baseline_value=round(baseline_avg, 2),
                                            anomaly_value=round(recent_max, 2),
                                            deviation_pct=round(deviation_pct, 1),
                                            severity=round(severity, 2),
                                        )
                                    )
                                continue

                            if baseline_avg > 0:
                                deviation_pct = ((recent_avg - baseline_avg) / baseline_avg) * 100
                                if abs(deviation_pct) > 20:
                                    severity = min(abs(deviation_pct) / 500, 1.0)
                                    anomalies.append(
                                        Anomaly(
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
                                    )

                        except ClientError as e:
                            logger.debug("Failed to get API Gateway metric %s: %s", metric_name, e)

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
