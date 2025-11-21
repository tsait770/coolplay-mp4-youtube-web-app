#!/usr/bin/env bash
set -euo pipefail

# Usage: bash scripts/auto-push.sh "commit message" [branch]

COMMIT_MSG=${1:-"chore: CI Supabase verify + tRPC base URL priority"}
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
TARGET_BRANCH=${2:-$CURRENT_BRANCH}

echo "[auto-push] Preparing to push to branch: $TARGET_BRANCH"

# Ensure git user config exists (fallback values if missing)
if ! git config user.name >/dev/null; then
  git config user.name "Auto Push Bot"
fi
if ! git config user.email >/dev/null; then
  git config user.email "autopush@example.com"
fi

# Stage changes
git add -A

# Commit if there are staged changes
if git diff --cached --quiet; then
  echo "[auto-push] No changes to commit."
else
  echo "[auto-push] Committing changes..."
  git commit -m "$COMMIT_MSG"
fi

# Validate remote origin
if ! git remote get-url origin >/dev/null 2>&1; then
  echo "[auto-push] Error: No git remote 'origin' configured. Please add a remote and rerun."
  echo "Example: git remote add origin https://github.com/<user>/<repo>.git"
  exit 1
fi

# Push to origin
echo "[auto-push] Pushing to origin/$TARGET_BRANCH..."
git push origin "$TARGET_BRANCH"

echo "[auto-push] Push completed."