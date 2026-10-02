"""ChangeLens Demo Workload: checkout-function Lambda Handler.

Target Workload Topology:
    API Gateway (POST /checkout)
           ↓
    checkout-function
           ↓
    checkout-table (DynamoDB)

Handles both API Gateway HTTP API v2 and REST API payload formats.
Writes order items to DynamoDB checkout-table and verifies via GetItem.
Numeric fields are safely converted to Decimal(str(val)) for DynamoDB compatibility.
"""

import json
import logging
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

REGION = os.environ.get("AWS_REGION", "us-east-2")
TABLE_NAME = os.environ.get("TABLE_NAME", "checkout-table")

dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(TABLE_NAME)


def to_decimal(val):
    """Safely convert floats and nested numbers to Decimal(str(val)) for DynamoDB."""
    if isinstance(val, float):
        return Decimal(str(val))
    elif isinstance(val, dict):
        return {k: to_decimal(v) for k, v in val.items()}
    elif isinstance(val, list):
        return [to_decimal(v) for v in val]
    return val


def lambda_handler(event, context):
    logger.info("Received event: %s", json.dumps(event, default=str))

    # Parse body from HTTP API v2 or REST proxy event
    raw_body = event.get("body", "{}")
    if isinstance(raw_body, str):
        try:
            body = json.loads(raw_body) if raw_body else {}
        except json.JSONDecodeError:
            body = {}
    elif isinstance(raw_body, dict):
        body = raw_body
    else:
        body = {}

    order_id = body.get("orderId", str(uuid.uuid4()))
    customer = body.get("customer", "demo-customer")
    raw_amount = body.get("amount", 29.99)
    items = body.get("items", [{"id": "item-1", "name": "ChangeLens Subscription", "price": 29.99}])
    created_at = datetime.now(timezone.utc).isoformat()

    # Convert numeric fields using Decimal(str(val)) for DynamoDB compatibility
    try:
        decimal_amount = Decimal(str(raw_amount))
    except Exception:
        decimal_amount = Decimal("29.99")

    order_record = {
        "orderId": order_id,
        "createdAt": created_at,
        "customer": str(customer),
        "amount": decimal_amount,
        "status": "created",
        "items": to_decimal(items),
        "system": "ChangeLens-Demo",
    }

    # Ensure all nested structures are free of raw float types
    sanitized_record = to_decimal(order_record)

    try:
        # 1. Write order to DynamoDB checkout-table
        logger.info("Writing order %s to DynamoDB table %s", order_id, TABLE_NAME)
        table.put_item(Item=sanitized_record)

        # 2. Verify write via GetItem
        response = table.get_item(Key={"orderId": order_id})
        saved_item = response.get("Item", sanitized_record)

        logger.info("Successfully recorded order %s in checkout-table", order_id)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "message": "Order processed and persisted to checkout-table",
                "orderId": order_id,
                "status": "created",
                "amount": str(decimal_amount),
                "createdAt": created_at,
                "table": TABLE_NAME,
            }, default=str),
        }

    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        error_message = e.response.get("Error", {}).get("Message", str(e))
        logger.error("DynamoDB error (%s): %s", error_code, error_message)

        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "error": "DatabaseOperationFailed",
                "code": error_code,
                "message": error_message,
                "table": TABLE_NAME,
            }),
        }
    except Exception as e:
        logger.error("Unhandled exception: %s", str(e))
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "error": "InternalServerError",
                "message": str(e),
            }),
        }


# Compatibility alias
handler = lambda_handler
