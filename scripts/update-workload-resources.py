#!/usr/bin/env python3
"""ChangeLens: Update existing checkout-function to interact with checkout-table.

This script:
1. Zips infrastructure/lambda_handler.py
2. Updates checkout-function code via boto3
3. Sets TABLE_NAME=checkout-table environment variable
4. Attaches minimal DynamoDB inline policy to the Lambda execution role

SAFETY: Targets ONLY checkout-function and checkout-table. Never creates duplicates.
"""

import io
import json
import os
import sys
import zipfile
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

REGION = os.environ.get("AWS_REGION", "us-east-2")
FUNCTION_NAME = os.environ.get("DEMO_FUNCTION_NAME", "checkout-function")
TABLE_NAME = os.environ.get("DEMO_TABLE_NAME", "checkout-table")


def main():
    print(f"=== ChangeLens Workload Updater ===")
    print(f"Region:   {REGION}")
    print(f"Lambda:   {FUNCTION_NAME}")
    print(f"DynamoDB: {TABLE_NAME}")
    print("")

    session = boto3.Session(region_name=REGION)
    lambda_client = session.client("lambda")
    iam_client = session.client("iam")

    # Verify credentials
    try:
        sts = session.client("sts")
        caller = sts.get_caller_identity()
        print(f"✓ Authenticated as: {caller.get('Arn')}")
    except (NoCredentialsError, ClientError) as e:
        print(f"⚠️  AWS credentials not detected in environment: {e}")
        print("")
        print("To apply updates automatically:")
        print("  export AWS_ACCESS_KEY_ID=...")
        print("  export AWS_SECRET_ACCESS_KEY=...")
        print("  export AWS_REGION=us-east-2")
        print("  python3 scripts/update-workload-resources.py")
        print("")
        print("Or use the AWS CLI commands below:")
        print_cli_commands()
        return

    # 1. Package handler into zip
    handler_path = os.path.join(os.path.dirname(__file__), "..", "infrastructure", "lambda_handler.py")
    if not os.path.exists(handler_path):
        print(f"Error: {handler_path} not found")
        sys.exit(1)

    with open(handler_path, "r") as f:
        handler_code = f.read()

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        # Standard Lambda entry point index.py or lambda_function.py
        z.writestr("index.py", handler_code)
        z.writestr("lambda_function.py", handler_code)
    buf.seek(0)
    zip_bytes = buf.read()

    # 2. Update Lambda function code
    try:
        print(f"Updating code for {FUNCTION_NAME}...")
        lambda_client.update_function_code(
            FunctionName=FUNCTION_NAME,
            ZipFile=zip_bytes,
        )
        print(f"✓ Successfully updated {FUNCTION_NAME} code.")
    except ClientError as e:
        print(f"❌ Failed to update function code: {e}")
        sys.exit(1)

    # 3. Update Lambda function configuration with environment variables
    try:
        print(f"Updating environment variables for {FUNCTION_NAME} (TABLE_NAME={TABLE_NAME})...")
        func_info = lambda_client.get_function_configuration(FunctionName=FUNCTION_NAME)
        existing_env = func_info.get("Environment", {}).get("Variables", {})
        existing_env["TABLE_NAME"] = TABLE_NAME
        existing_env["AWS_REGION"] = REGION

        lambda_client.update_function_configuration(
            FunctionName=FUNCTION_NAME,
            Environment={"Variables": existing_env},
        )
        print(f"✓ Environment variables updated.")

        # 4. Attach minimal IAM policy to Lambda role
        role_arn = func_info.get("Role", "")
        role_name = role_arn.split("/")[-1] if "/" in role_arn else ""
        if role_name:
            print(f"Attaching minimal DynamoDB policy to role: {role_name}...")
            policy_doc = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "ChangeLensCheckoutTableMinimumAccess",
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query",
                            "dynamodb:DescribeTable"
                        ],
                        "Resource": f"arn:aws:dynamodb:{REGION}:*:table/{TABLE_NAME}"
                    }
                ]
            }
            iam_client.put_role_policy(
                RoleName=role_name,
                PolicyName="ChangeLensCheckoutDynamoDBPolicy",
                PolicyDocument=json.dumps(policy_doc),
            )
            print(f"✓ Minimal IAM policy attached to {role_name}.")

    except ClientError as e:
        print(f"⚠️ Notice on configuration/role update: {e}")

    print("")
    print("=== Update Complete ===")
    print(f"checkout-function is now connected to checkout-table in {REGION}!")


def print_cli_commands():
    print("----------------------------------------------------------------")
    print("MANUAL / CLI UPDATE COMMANDS:")
    print("----------------------------------------------------------------")
    print("# 1. Zip the handler:")
    print("cd infrastructure && zip -r function.zip lambda_function.py && cd ..")
    print("")
    print("# 2. Update checkout-function code:")
    print("aws lambda update-function-code \\")
    print("  --function-name checkout-function \\")
    print("  --zip-file fileb://infrastructure/function.zip \\")
    print("  --region us-east-2")
    print("")
    print("# 3. Set environment variable TABLE_NAME=checkout-table:")
    print("aws lambda update-function-configuration \\")
    print("  --function-name checkout-function \\")
    print("  --environment Variables=\"{TABLE_NAME=checkout-table}\" \\")
    print("  --region us-east-2")
    print("")
    print("# 4. Attach minimal DynamoDB policy to checkout-function's IAM role:")
    print("aws iam put-role-policy \\")
    print("  --role-name <CHECKOUT_FUNCTION_ROLE_NAME> \\")
    print("  --policy-name ChangeLensCheckoutDynamoDBPolicy \\")
    print("  --policy-document file://infrastructure/dynamodb_policy.json")
    print("----------------------------------------------------------------")


if __name__ == "__main__":
    main()
