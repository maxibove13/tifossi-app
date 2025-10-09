#!/bin/bash
set -euo pipefail

# Generate Strapi Security Secrets
# This script generates all required Strapi security secrets for production use
# Usage: ./scripts/generate-strapi-secrets.sh [--format FORMAT]
#   --format github  : Output as GitHub Secrets format (default)
#   --format render  : Output as Render env vars format
#   --format env     : Output as .env file format

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Strapi Security Secrets Generator"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Error: Node.js is required but not installed"
  exit 1
fi

# Parse arguments
FORMAT="${1:---format}"
if [[ "$FORMAT" == "--format" ]]; then
  FORMAT="${2:-github}"
else
  FORMAT="github"
fi

echo "Generating secrets..."
echo ""

# Generate APP_KEYS (4 keys, comma-separated, base64)
APP_KEYS=$(node -e "console.log(Array(4).fill().map(() => require('crypto').randomBytes(16).toString('base64')).join(','))")

# Generate API_TOKEN_SALT (64 bytes hex)
API_TOKEN_SALT=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Generate ADMIN_JWT_SECRET (64 bytes hex)
ADMIN_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Generate TRANSFER_TOKEN_SALT (64 bytes hex)
TRANSFER_TOKEN_SALT=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Generate JWT_SECRET (64 bytes hex)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

echo "✅ Secrets generated successfully"
echo ""

# Output based on format
case "$FORMAT" in
  github)
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "GitHub Secrets Format (copy these to GitHub repository secrets)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "APP_KEYS=$APP_KEYS"
    echo "API_TOKEN_SALT=$API_TOKEN_SALT"
    echo "ADMIN_JWT_SECRET=$ADMIN_JWT_SECRET"
    echo "TRANSFER_TOKEN_SALT=$TRANSFER_TOKEN_SALT"
    echo "JWT_SECRET=$JWT_SECRET"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "To set these secrets automatically, use:"
    echo "  ./scripts/setup-github-secrets.sh"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    ;;

  render)
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Render Environment Variables Format"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Add these to Render Dashboard → Service → Environment:"
    echo ""
    echo "APP_KEYS"
    echo "$APP_KEYS"
    echo ""
    echo "API_TOKEN_SALT"
    echo "$API_TOKEN_SALT"
    echo ""
    echo "ADMIN_JWT_SECRET"
    echo "$ADMIN_JWT_SECRET"
    echo ""
    echo "TRANSFER_TOKEN_SALT"
    echo "$TRANSFER_TOKEN_SALT"
    echo ""
    echo "JWT_SECRET"
    echo "$JWT_SECRET"
    ;;

  env)
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ".env File Format"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "# Strapi Security Secrets - Generated $(date)"
    echo "APP_KEYS=$APP_KEYS"
    echo "API_TOKEN_SALT=$API_TOKEN_SALT"
    echo "ADMIN_JWT_SECRET=$ADMIN_JWT_SECRET"
    echo "TRANSFER_TOKEN_SALT=$TRANSFER_TOKEN_SALT"
    echo "JWT_SECRET=$JWT_SECRET"
    ;;

  *)
    echo "❌ Error: Invalid format '$FORMAT'"
    echo "Valid formats: github, render, env"
    exit 1
    ;;
esac

echo ""
echo "⚠️  IMPORTANT: Store these secrets securely!"
echo "   - Do NOT commit to git"
echo "   - Do NOT share publicly"
echo "   - Keep a secure backup"
echo ""
