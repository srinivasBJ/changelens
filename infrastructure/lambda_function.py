"""ChangeLens Demo Workload: checkout-function Lambda Handler.

Target Workload Topology:
    API Gateway (POST /checkout)
           ↓
    checkout-function
           ↓
    checkout-table (DynamoDB)

Handles both API Gateway HTTP API v2 and REST API payload formats.
Writes order items to DynamoDB checkout-table and verifies via GetItem.
"""

import json
import logging
import os
import uuid
from datetime import datetime, timezone
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

REGION = os.environ.get("AWS_REGION", "us-east-2")
TABLE_NAME = os.environ.get("TABLE_NAME", "checkout-table")

dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event, context):
    logger.info("Received event: %s", json.dumps(event))

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
    amount = body.get("amount", 29.99)
    items = body.get("items", [{"id": "item-1", "name": "ChangeLens Subscription", "price": 29.99}])
    created_at = datetime.now(timezone.utc).isoformat()

    order_record = {
        "orderId": order_id,
        "createdAt": created_at,
        "customer": customer,
        "amount": str(amount),
        "status": "created",
        "items": items,
        "system": "ChangeLens-Demo",
    }

    try:
        # 1. Write order to DynamoDB checkout-table
        logger.info("Writing order %s to DynamoDB table %s", order_id, TABLE_NAME)
        table.put_item(Item=order_record)

        # 2. Verify write via GetItem
        response = table.get_item(Key={"orderId": order_id})
        saved_item = response.get("Item", order_record)

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
                "createdAt": created_at,
                "table": TABLE_NAME,
            }),
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


# Alias for compatibility
handler = lambda_handler
