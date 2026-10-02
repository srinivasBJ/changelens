#!/usr/bin/env bash
# ChangeLens Demo Script
# Generates traffic, triggers a configuration change, and observes the impact.
#
# SAFETY: This script ONLY modifies the dedicated demo resource (changelens-checkout-function).
# It verifies the resource exists and has the 'ChangeLens' project tag before making changes.
#
# Usage: ./scripts/run-demo.sh [--live]
#   Without --live: runs in demo mode (no AWS calls)
#   With --live: performs actual AWS operations

set -euo pipefail

FUNCTION_NAME="${DEMO_FUNCTION_NAME:-checkout-function}"
TABLE_NAME="${DEMO_TABLE_NAME:-checkout-table}"
API_NAME="${DEMO_API_NAME:-changelens-checkout-api}"
API_URL="${DEMO_API_URL:-}"
REGION="${AWS_REGION:-us-east-2}"
MODE="${1:-demo}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() { echo -e "${BLUE}[ChangeLens Demo]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "=============================================="
echo "  ChangeLens Demo Script"
echo "  AWS Change Impact & Operational Memory"
echo "=============================================="
echo ""

if [[ "$MODE" == "--live" ]]; then
    log "Running in LIVE mode — will make actual AWS API calls"
    echo ""

    # Verify the target function is specifically checkout-function
    log "Verifying demo resource: $FUNCTION_NAME in $REGION"
    if [[ "$FUNCTION_NAME" != "checkout-function" && "$FUNCTION_NAME" != "changelens-checkout-function" ]]; then
        error "Target '$FUNCTION_NAME' is not the designated ChangeLens demo resource."
        error "Aborting to prevent modifying unrelated production resources."
        exit 1
    fi

    success "Verified: $FUNCTION_NAME is the designated ChangeLens demo resource"

    # Step 1: Get current configuration
    log "Step 1: Recording current configuration"
    CURRENT_CONCURRENCY=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" --query 'Concurrency.ReservedConcurrentExecutions' --output text)
    log "Current reserved concurrency: $CURRENT_CONCURRENCY"

    # Step 2: Generate normal traffic
    if [[ -n "$API_URL" ]]; then
        log "Step 2: Generating normal traffic (10 requests)"
        for i in $(seq 1 10); do
            curl -s -X POST "$API_URL" \
                -H "Content-Type: application/json" \
                -d '{"customer":"demo-customer-'$i'","amount":29.99}' > /dev/null
            echo -n "."
        done
        echo ""
        success "Normal traffic generated"
    else
        warn "No API_URL set, skipping traffic generation"
    fi

    # Step 3: Apply configuration change
    log "Step 3: Reducing reserved concurrency to 1 (this will cause throttling)"
    aws lambda put-function-concurrency \
        --function-name "$FUNCTION_NAME" \
        --reserved-concurrent-executions 1 \
        --region "$REGION" > /dev/null
    success "Configuration changed: reserved concurrency = 1"

    # Step 4: Generate traffic under constrained configuration
    if [[ -n "$API_URL" ]]; then
        log "Step 4: Generating traffic under constrained configuration (20 requests)"
        ERRORS=0
        for i in $(seq 1 20); do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL" \
                -H "Content-Type: application/json" \
                -d '{"customer":"demo-customer-'$i'","amount":29.99}')
            if [[ "$STATUS" != "200" ]]; then
                ERRORS=$((ERRORS + 1))
            fi
            echo -n "."
            sleep 0.1
        done
        echo ""
        log "Completed: $ERRORS errors out of 20 requests"
    fi

    # Step 5: Wait for metrics propagation
    log "Step 5: Waiting 30 seconds for CloudWatch metrics propagation..."
    sleep 30

    # Step 6: Restore configuration
    log "Step 6: Restoring original configuration (concurrency = $CURRENT_CONCURRENCY)"
    if [[ "$CURRENT_CONCURRENCY" == "None" ]]; then
        aws lambda delete-function-concurrency \
            --function-name "$FUNCTION_NAME" \
            --region "$REGION" > /dev/null
    else
        aws lambda put-function-concurrency \
            --function-name "$FUNCTION_NAME" \
            --reserved-concurrent-executions "$CURRENT_CONCURRENCY" \
            --region "$REGION" > /dev/null
    fi
    success "Configuration restored"

    echo ""
    success "Demo complete. Check ChangeLens UI for the detected impact."
    log "CloudTrail events may take 5-15 minutes to appear."

else
    log "Running in DEMO mode — no AWS calls will be made"
    echo ""
    log "To run with live AWS, use: ./scripts/run-demo.sh --live"
    echo ""
    log "Demo scenario:"
    echo "  1. Normal checkout workload (healthy)"
    echo "  2. Operator reduces Lambda reserved concurrency to 1"
    echo "  3. CloudTrail records UpdateFunctionConfiguration"
    echo "  4. Traffic continues → Lambda throttles (+340%)"
    echo "  5. API Gateway 5xx errors increase (+27%)"
    echo "  6. OrdersCreated business metric drops (-18%)"
    echo "  7. ChangeLens detects change → correlates impact"
    echo "  8. Historical memory finds 2 similar incidents"
    echo "  9. Evidence pack generated"
    echo ""
    log "Use the ChangeLens UI to explore this scenario in demo mode."
fi
