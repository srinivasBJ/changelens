#!/usr/bin/env bash
# ==============================================================================
# ChangeLens Actionable Remediation & Deep-Links Verification Script
# Version: 1.2.0 (Updated: October 24, 2026)
# Tests the remediation engine endpoint and validates anti-caching headers.
# ==============================================================================

set -euo pipefail

BASE_URL="${1:-https://djagjxqmso1ct.cloudfront.net}"
echo "==> Testing ChangeLens Remediation Engine against: ${BASE_URL}"

# 1. Health & anti-cache verification
echo "--- 1. Health Status & Cache-Control ---"
curl -s -D - "${BASE_URL}/health" -o /dev/null | grep -E -i "cache-control|pragma"

# 2. Remediation plan verification
echo "--- 2. Remediation Plan Query ---"
REMEDIATION_JSON=$(curl -s "${BASE_URL}/api/investigations/inv_live_001/remediation")
TARGET=$(echo "${REMEDIATION_JSON}" | jq -r '.target_resource')
PRIMARY_CMD=$(echo "${REMEDIATION_JSON}" | jq -r '.primary_command')
RISK=$(echo "${REMEDIATION_JSON}" | jq -r '.risk_level')
STEPS_COUNT=$(echo "${REMEDIATION_JSON}" | jq '.steps | length')
LINKS_COUNT=$(echo "${REMEDIATION_JSON}" | jq '.console_links | length')

echo "Target Resource:     ${TARGET}"
echo "Risk Level:          ${RISK}"
echo "Primary CLI Command: ${PRIMARY_CMD}"
echo "Execution Steps:     ${STEPS_COUNT}"
echo "AWS Console Links:   ${LINKS_COUNT}"

if [[ "${TARGET}" == "checkout-function" && "${STEPS_COUNT}" -ge 4 && "${LINKS_COUNT}" -ge 4 ]]; then
  echo "==> Remediation Verification: PASSED"
else
  echo "==> Remediation Verification: FAILED"
  exit 1
fi
