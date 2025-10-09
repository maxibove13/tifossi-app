#!/bin/bash
set -euo pipefail

# Render Environment Variable Sync Script
# Fetches current env vars from Render, merges with GitHub Secrets, and updates service
# Syncs: Database credentials, Cloudinary, MercadoPago, and webhook configuration
# Usage: ./sync-render-env.sh <service_id> <api_key>

RENDER_SERVICE_ID="${1:-}"
RENDER_API_KEY="${2:-}"

if [[ -z "$RENDER_SERVICE_ID" || -z "$RENDER_API_KEY" ]]; then
  echo "Error: Missing required arguments"
  echo "Usage: $0 <service_id> <api_key>"
  exit 1
fi

API_BASE="https://api.render.com/v1"
TEMP_FILE=$(mktemp)
trap 'rm -f "$TEMP_FILE"' EXIT

echo "Fetching current environment variables from Render..."

# Fetch current env vars
HTTP_STATUS=$(curl -s -w "%{http_code}" -o "$TEMP_FILE" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" \
  "${API_BASE}/services/${RENDER_SERVICE_ID}/env-vars")

if [[ "$HTTP_STATUS" != "200" ]]; then
  echo "Error: Failed to fetch environment variables (HTTP ${HTTP_STATUS})"
  cat "$TEMP_FILE"
  exit 1
fi

echo "Merging with GitHub Secrets..."

# Build the updated env vars JSON
# Start with current vars from Render
CURRENT_VARS=$(cat "$TEMP_FILE")

# Create a temporary file for the merged env vars
MERGED_FILE=$(mktemp)
trap 'rm -f "$TEMP_FILE" "$MERGED_FILE"' EXIT

# Parse current vars and update with GitHub Secrets values
# We'll use jq to properly merge JSON
if ! command -v jq &> /dev/null; then
  echo "Error: jq is required but not installed"
  exit 1
fi

# Start with current env vars
echo "$CURRENT_VARS" > "$MERGED_FILE"

# Function to update or add env var
update_env_var() {
  local key="$1"
  local value="$2"
  local temp_output=$(mktemp)

  # Check if key exists and update, otherwise add
  jq --arg key "$key" --arg value "$value" '
    if any(.[]; .key == $key) then
      map(if .key == $key then .value = $value else . end)
    else
      . + [{"key": $key, "value": $value}]
    end
  ' "$MERGED_FILE" > "$temp_output"

  mv "$temp_output" "$MERGED_FILE"
}

# Update Cloudinary credentials
if [[ -n "${CLOUDINARY_NAME:-}" ]]; then
  update_env_var "CLOUDINARY_NAME" "$CLOUDINARY_NAME"
fi

if [[ -n "${CLOUDINARY_KEY:-}" ]]; then
  update_env_var "CLOUDINARY_KEY" "$CLOUDINARY_KEY"
fi

if [[ -n "${CLOUDINARY_SECRET:-}" ]]; then
  update_env_var "CLOUDINARY_SECRET" "$CLOUDINARY_SECRET"
fi

# Update MercadoPago credentials
# Note: Backend code uses MP_* prefix, so we sync both naming conventions
if [[ -n "${MERCADO_PAGO_ACCESS_TOKEN:-}" ]]; then
  update_env_var "MERCADO_PAGO_ACCESS_TOKEN" "$MERCADO_PAGO_ACCESS_TOKEN"
  update_env_var "MP_ACCESS_TOKEN" "$MERCADO_PAGO_ACCESS_TOKEN"
fi

if [[ -n "${MERCADO_PAGO_PUBLIC_KEY:-}" ]]; then
  update_env_var "MERCADO_PAGO_PUBLIC_KEY" "$MERCADO_PAGO_PUBLIC_KEY"
  update_env_var "MP_PUBLIC_KEY" "$MERCADO_PAGO_PUBLIC_KEY"
fi

if [[ -n "${MERCADO_PAGO_WEBHOOK_SECRET:-}" ]]; then
  update_env_var "MERCADO_PAGO_WEBHOOK_SECRET" "$MERCADO_PAGO_WEBHOOK_SECRET"
  update_env_var "MP_WEBHOOK_SECRET" "$MERCADO_PAGO_WEBHOOK_SECRET"
fi

# Update MercadoPago test credentials
if [[ -n "${MP_TEST_ACCESS_TOKEN:-}" ]]; then
  update_env_var "MP_TEST_ACCESS_TOKEN" "$MP_TEST_ACCESS_TOKEN"
fi

if [[ -n "${MP_TEST_PUBLIC_KEY:-}" ]]; then
  update_env_var "MP_TEST_PUBLIC_KEY" "$MP_TEST_PUBLIC_KEY"
fi

if [[ -n "${MP_WEBHOOK_SECRET:-}" ]]; then
  update_env_var "MP_WEBHOOK_SECRET" "$MP_WEBHOOK_SECRET"
fi

if [[ -n "${WEBHOOK_URL:-}" ]]; then
  update_env_var "WEBHOOK_URL" "$WEBHOOK_URL"
fi

# Update Database credentials
if [[ -n "${DATABASE_URL:-}" ]]; then
  update_env_var "DATABASE_URL" "$DATABASE_URL"
fi

if [[ -n "${DATABASE_CLIENT:-}" ]]; then
  update_env_var "DATABASE_CLIENT" "$DATABASE_CLIENT"
fi

if [[ -n "${DATABASE_SSL:-}" ]]; then
  update_env_var "DATABASE_SSL" "$DATABASE_SSL"
fi

if [[ -n "${DATABASE_SSL_REJECT_UNAUTHORIZED:-}" ]]; then
  update_env_var "DATABASE_SSL_REJECT_UNAUTHORIZED" "$DATABASE_SSL_REJECT_UNAUTHORIZED"
fi

# Update Strapi security secrets
if [[ -n "${APP_KEYS:-}" ]]; then
  update_env_var "APP_KEYS" "$APP_KEYS"
fi

if [[ -n "${API_TOKEN_SALT:-}" ]]; then
  update_env_var "API_TOKEN_SALT" "$API_TOKEN_SALT"
fi

if [[ -n "${ADMIN_JWT_SECRET:-}" ]]; then
  update_env_var "ADMIN_JWT_SECRET" "$ADMIN_JWT_SECRET"
fi

if [[ -n "${TRANSFER_TOKEN_SALT:-}" ]]; then
  update_env_var "TRANSFER_TOKEN_SALT" "$TRANSFER_TOKEN_SALT"
fi

if [[ -n "${JWT_SECRET:-}" ]]; then
  update_env_var "JWT_SECRET" "$JWT_SECRET"
fi

echo "Updating environment variables on Render..."

# Filter out any entries with empty keys or values before sending
CLEAN_VARS=$(mktemp)
trap 'rm -f "$TEMP_FILE" "$MERGED_FILE" "$CLEAN_VARS"' EXIT

jq 'map(select(.key != "" and .key != null))' "$MERGED_FILE" > "$CLEAN_VARS"

echo "Filtered environment variables:"
jq -r '.[] | "\(.key)"' "$CLEAN_VARS"

# Send updated env vars to Render
HTTP_STATUS=$(curl -s -w "%{http_code}" -o "$TEMP_FILE" \
  -X PUT \
  -H "Authorization: Bearer ${RENDER_API_KEY}" \
  -H "Content-Type: application/json" \
  --data-binary "@${CLEAN_VARS}" \
  "${API_BASE}/services/${RENDER_SERVICE_ID}/env-vars")

if [[ "$HTTP_STATUS" != "200" ]]; then
  echo "Error: Failed to update environment variables (HTTP ${HTTP_STATUS})"
  cat "$TEMP_FILE"
  exit 1
fi

echo "✅ Environment variables synced successfully"
exit 0