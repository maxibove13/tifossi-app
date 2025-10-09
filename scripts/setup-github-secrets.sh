#!/bin/bash
set -euo pipefail

# Setup GitHub Secrets for Strapi
# This script generates and sets all required Strapi secrets in GitHub repository
# Requires: gh CLI (GitHub CLI) installed and authenticated
# Usage: ./scripts/setup-github-secrets.sh [REPO_NAME]

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 GitHub Secrets Setup for Strapi"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for gh CLI
if ! command -v gh &> /dev/null; then
  echo "❌ Error: GitHub CLI (gh) is required but not installed"
  echo ""
  echo "Install instructions:"
  echo "  macOS:   brew install gh"
  echo "  Linux:   https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
  echo "  Windows: https://github.com/cli/cli/releases"
  echo ""
  echo "After installation, authenticate with: gh auth login"
  exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
  echo "❌ Error: Not authenticated with GitHub CLI"
  echo ""
  echo "Please authenticate with: gh auth login"
  exit 1
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Get repository name
REPO_NAME="${1:-}"
if [[ -z "$REPO_NAME" ]]; then
  # Try to detect from git remote
  if git remote get-url origin &> /dev/null; then
    REPO_URL=$(git remote get-url origin)
    # Extract owner/repo from URL
    REPO_NAME=$(echo "$REPO_URL" | sed -n 's#.*/\([^/]*/[^/]*\)\.git#\1#p' | sed 's#.*github.com[:/]##')

    if [[ -z "$REPO_NAME" ]]; then
      echo "❌ Error: Could not detect repository from git remote"
      echo ""
      echo "Usage: $0 OWNER/REPO"
      echo "Example: $0 myorg/myrepo"
      exit 1
    fi
  else
    echo "❌ Error: Repository name required"
    echo ""
    echo "Usage: $0 OWNER/REPO"
    echo "Example: $0 myorg/myrepo"
    exit 1
  fi
fi

echo "Repository: $REPO_NAME"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Error: Node.js is required but not installed"
  exit 1
fi

echo "Generating Strapi secrets..."
echo ""

# Generate secrets
APP_KEYS=$(node -e "console.log(Array(4).fill().map(() => require('crypto').randomBytes(16).toString('base64')).join(','))")
API_TOKEN_SALT=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
ADMIN_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
TRANSFER_TOKEN_SALT=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

echo "✅ Secrets generated"
echo ""

# Function to set secret
set_secret() {
  local key="$1"
  local value="$2"

  echo -n "Setting $key... "

  if echo "$value" | gh secret set "$key" --repo "$REPO_NAME" 2>&1; then
    echo "✅"
    return 0
  else
    echo "❌"
    return 1
  fi
}

echo "Setting GitHub Secrets..."
echo ""

FAILED_SECRETS=()

# Set all secrets
set_secret "APP_KEYS" "$APP_KEYS" || FAILED_SECRETS+=("APP_KEYS")
set_secret "API_TOKEN_SALT" "$API_TOKEN_SALT" || FAILED_SECRETS+=("API_TOKEN_SALT")
set_secret "ADMIN_JWT_SECRET" "$ADMIN_JWT_SECRET" || FAILED_SECRETS+=("ADMIN_JWT_SECRET")
set_secret "TRANSFER_TOKEN_SALT" "$TRANSFER_TOKEN_SALT" || FAILED_SECRETS+=("TRANSFER_TOKEN_SALT")
set_secret "JWT_SECRET" "$JWT_SECRET" || FAILED_SECRETS+=("JWT_SECRET")

echo ""

# Check if any failed
if [ ${#FAILED_SECRETS[@]} -ne 0 ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "⚠️  Some secrets failed to set:"
  printf '%s\n' "${FAILED_SECRETS[@]}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Manual values (copy to GitHub Settings → Secrets → Actions):"
  echo ""
  for secret in "${FAILED_SECRETS[@]}"; do
    case "$secret" in
      APP_KEYS)
        echo "$secret=$APP_KEYS"
        ;;
      API_TOKEN_SALT)
        echo "$secret=$API_TOKEN_SALT"
        ;;
      ADMIN_JWT_SECRET)
        echo "$secret=$ADMIN_JWT_SECRET"
        ;;
      TRANSFER_TOKEN_SALT)
        echo "$secret=$TRANSFER_TOKEN_SALT"
        ;;
      JWT_SECRET)
        echo "$secret=$JWT_SECRET"
        ;;
    esac
  done
  echo ""
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All Strapi secrets set successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Verifying secrets..."
echo ""

# Verify secrets are set
echo "Checking secrets in repository..."
SECRETS_LIST=$(gh secret list --repo "$REPO_NAME" 2>&1)

for secret_name in "APP_KEYS" "API_TOKEN_SALT" "ADMIN_JWT_SECRET" "TRANSFER_TOKEN_SALT" "JWT_SECRET"; do
  if echo "$SECRETS_LIST" | grep -q "^$secret_name"; then
    echo "  ✅ $secret_name"
  else
    echo "  ❌ $secret_name (not found)"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next steps:"
echo "  1. Verify all secrets: gh secret list --repo $REPO_NAME"
echo "  2. Trigger CI/CD to sync to Render: git push"
echo "  3. Monitor deployment in GitHub Actions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
