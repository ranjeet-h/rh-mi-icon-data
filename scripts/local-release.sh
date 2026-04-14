#!/usr/bin/env bash
set -euo pipefail

OWNER="ranjeet-h"
REPO="rh-mi-icon-data"
BRANCH="master"
TAG=""
CONCURRENCY="32"
RETRIES="3"
LIMIT=""
ICONS=""
SKIP_SCRAPE=0
SKIP_VALIDATION=0
SKIP_GIT=0
SKIP_CDN_CHECK=0
PUBLISH=0

usage() {
  cat <<'EOF'
Usage:
  bash scripts/local-release.sh [options]

Options:
  --owner <github-owner>         Default: ranjeet-h
  --repo <github-repo>           Default: rh-mi-icon-data
  --branch <branch>              Default: master
  --tag <tag>                    Example: v1.2.0 (default auto timestamp)
  --concurrency <n>              Default: 32
  --retries <n>                  Default: 3
  --limit <n>                    Optional scrape limit for testing
  --icons <a,b,c>                Optional comma-separated icon names
  --skip-scrape                  Skip scraper step
  --skip-validation              Skip lint/build/test
  --skip-git                     Skip git commit/push/tag
  --skip-cdn-check               Skip jsDelivr verification
  --publish                      Publish rh-mi-react and rh-mi-cli to npm
  -h, --help                     Show help

Examples:
  bash scripts/local-release.sh --tag v1.2.0
  bash scripts/local-release.sh --limit 50 --skip-git --skip-cdn-check
  bash scripts/local-release.sh --tag v1.2.1 --publish
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --owner)
      OWNER="${2:-}"; shift 2 ;;
    --repo)
      REPO="${2:-}"; shift 2 ;;
    --branch)
      BRANCH="${2:-}"; shift 2 ;;
    --tag)
      TAG="${2:-}"; shift 2 ;;
    --concurrency)
      CONCURRENCY="${2:-}"; shift 2 ;;
    --retries)
      RETRIES="${2:-}"; shift 2 ;;
    --limit)
      LIMIT="${2:-}"; shift 2 ;;
    --icons)
      ICONS="${2:-}"; shift 2 ;;
    --skip-scrape)
      SKIP_SCRAPE=1; shift ;;
    --skip-validation)
      SKIP_VALIDATION=1; shift ;;
    --skip-git)
      SKIP_GIT=1; shift ;;
    --skip-cdn-check)
      SKIP_CDN_CHECK=1; shift ;;
    --publish)
      PUBLISH=1; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1 ;;
  esac
done

if [[ -z "$TAG" ]]; then
  TAG="v$(date +'%Y.%m.%d.%H%M')"
fi

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$REPO_ROOT" ]]; then
  echo "Error: not inside a git repository." >&2
  exit 1
fi

cd "$REPO_ROOT"

if [[ ! -f package.json || ! -f scripts/scraper/scrape-icons.mjs ]]; then
  echo "Error: run this script from the rh-mi-icon-data repository root." >&2
  exit 1
fi

echo "==> Installing dependencies"
npm install

if [[ "$SKIP_SCRAPE" -eq 0 ]]; then
  echo "==> Scraping icon registry"
  SCRAPE_ARGS=(--concurrency="$CONCURRENCY" --retries="$RETRIES")
  if [[ -n "$LIMIT" ]]; then
    SCRAPE_ARGS+=(--limit="$LIMIT")
  fi
  if [[ -n "$ICONS" ]]; then
    SCRAPE_ARGS+=(--icons="$ICONS")
  fi
  npm run scrape -- "${SCRAPE_ARGS[@]}"
fi

if [[ "$SKIP_VALIDATION" -eq 0 ]]; then
  echo "==> Running lint/build/test"
  npm run lint
  npm run build
  npm run test
fi

if [[ "$SKIP_GIT" -eq 0 ]]; then
  echo "==> Checking repository state"
  CURRENT_BRANCH="$(git branch --show-current)"
  if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
    echo "Error: expected branch '$BRANCH' but found '$CURRENT_BRANCH'." >&2
    exit 1
  fi

  NON_REGISTRY_TRACKED="$(git diff --name-only | grep -Ev '^registry/' || true)"
  NON_REGISTRY_STAGED="$(git diff --cached --name-only | grep -Ev '^registry/' || true)"
  NON_REGISTRY_UNTRACKED="$(git ls-files --others --exclude-standard | grep -Ev '^registry/' || true)"
  if [[ -n "$NON_REGISTRY_TRACKED$NON_REGISTRY_STAGED$NON_REGISTRY_UNTRACKED" ]]; then
    echo "Error: found non-registry changes. Commit/stash them first." >&2
    echo "$NON_REGISTRY_TRACKED"
    echo "$NON_REGISTRY_STAGED"
    echo "$NON_REGISTRY_UNTRACKED"
    exit 1
  fi

  if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
    echo "Error: local tag '$TAG' already exists." >&2
    exit 1
  fi
  if git ls-remote --tags origin "refs/tags/$TAG" | grep -q .; then
    echo "Error: remote tag '$TAG' already exists." >&2
    exit 1
  fi

  if [[ -n "$(git status --porcelain registry)" ]]; then
    git add registry
    git commit -m "chore: refresh icon registry"
  else
    echo "No registry changes detected. Skipping registry commit."
  fi

  echo "==> Pushing branch and tag"
  git push origin "$BRANCH"
  git tag "$TAG"
  git push origin "$TAG"
fi

if [[ "$PUBLISH" -eq 1 ]]; then
  echo "==> Publishing npm packages"
  (cd packages/rh-mi-react && npm publish --access public)
  (cd packages/rh-mi-cli && npm publish --access public)
fi

if [[ "$SKIP_CDN_CHECK" -eq 0 ]]; then
  echo "==> Verifying jsDelivr CDN"
  METADATA_URL="https://cdn.jsdelivr.net/gh/${OWNER}/${REPO}@${TAG}/registry/metadata.json"
  ICON_URL="https://cdn.jsdelivr.net/gh/${OWNER}/${REPO}@${TAG}/registry/outlined/search.json"
  TMP_META="$(mktemp)"
  TMP_ICON="$(mktemp)"
  META_CODE=""
  ICON_CODE=""

  for ATTEMPT in $(seq 1 30); do
    META_CODE="$(curl -sS -o "$TMP_META" -w "%{http_code}" "$METADATA_URL" || true)"
    ICON_CODE="$(curl -sS -o "$TMP_ICON" -w "%{http_code}" "$ICON_URL" || true)"
    if [[ "$META_CODE" == "200" && "$ICON_CODE" == "200" ]]; then
      break
    fi
    sleep 5
  done

  if [[ "$META_CODE" != "200" || "$ICON_CODE" != "200" ]]; then
    rm -f "$TMP_META" "$TMP_ICON"
    echo "Error: jsDelivr verification failed for tag $TAG" >&2
    echo "Metadata status: $META_CODE"
    echo "Icon status: $ICON_CODE"
    exit 1
  fi

  ICON_COUNT="$(node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));console.log(m.icons.length)" "$TMP_META")"
  rm -f "$TMP_META" "$TMP_ICON"
  echo "CDN verified."
  echo "Metadata icon count: $ICON_COUNT"
  echo "Metadata URL: $METADATA_URL"
  echo "Sample icon URL: $ICON_URL"
fi

echo "Local release flow completed."

