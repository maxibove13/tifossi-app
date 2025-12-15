#!/usr/bin/env bash

# Check if app.json version matches git tag on HEAD (if any)
# Prevents building with mismatched version/tag

TAG=$(git describe --tags --exact-match HEAD 2>/dev/null)

if [ -z "$TAG" ]; then
  exit 0
fi

if [[ ! "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  exit 0
fi

TAG_VERSION="${TAG#v}"
APP_VERSION=$(node -p "require('./app.json').expo.version")

if [ "$TAG_VERSION" != "$APP_VERSION" ]; then
  echo "ERROR: Version mismatch!"
  echo "  Git tag:     $TAG ($TAG_VERSION)"
  echo "  app.json:    $APP_VERSION"
  echo ""
  echo "Update app.json version to $TAG_VERSION before committing."
  exit 1
fi
