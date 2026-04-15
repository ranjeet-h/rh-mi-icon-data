#!/usr/bin/env bash
set -euo pipefail

REPO_SLUG="ranjeet-h/rh-mi-icon-data"
PAGES_BRANCH="gh-pages"
DEMO_PATH="../demo-icon"
BASE_PATH="/rh-mi-icon-data/"
SKIP_INSTALL=0
SKIP_BUILD=0

usage() {
  cat <<'EOF'
Usage:
  bash scripts/deploy-playground.sh [options]

Options:
  --repo <owner/repo>      GitHub repo slug (default: ranjeet-h/rh-mi-icon-data)
  --branch <name>          Pages branch to publish (default: gh-pages)
  --demo-path <path>       Path to demo React app (default: ../demo-icon from repo root)
  --base <path>            Vite base path (default: /rh-mi-icon-data/)
  --skip-install           Skip npm install in demo app
  --skip-build             Skip build (expects demo app dist/ already exists)
  -h, --help               Show help

Examples:
  bash scripts/deploy-playground.sh
  bash scripts/deploy-playground.sh --demo-path ../demo-icon --base /rh-mi-icon-data/
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO_SLUG="${2:-}"; shift 2 ;;
    --branch)
      PAGES_BRANCH="${2:-}"; shift 2 ;;
    --demo-path)
      DEMO_PATH="${2:-}"; shift 2 ;;
    --base)
      BASE_PATH="${2:-}"; shift 2 ;;
    --skip-install)
      SKIP_INSTALL=1; shift ;;
    --skip-build)
      SKIP_BUILD=1; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1 ;;
  esac
done

if [[ "$REPO_SLUG" != */* ]]; then
  echo "Error: --repo must be in owner/repo format." >&2
  exit 1
fi

OWNER="${REPO_SLUG%%/*}"
REPO="${REPO_SLUG##*/}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI is required." >&2
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$REPO_ROOT" ]]; then
  echo "Error: run this script from inside the repository." >&2
  exit 1
fi

DEMO_ABS="$(cd "$REPO_ROOT" && cd "$DEMO_PATH" && pwd)"
if [[ ! -f "$DEMO_ABS/package.json" ]]; then
  echo "Error: demo app package.json not found at: $DEMO_ABS" >&2
  exit 1
fi

if [[ "$SKIP_INSTALL" -eq 0 ]]; then
  echo "==> Installing demo dependencies"
  (cd "$DEMO_ABS" && npm install)
fi

if [[ "$SKIP_BUILD" -eq 0 ]]; then
  echo "==> Building demo app with base: $BASE_PATH"
  (cd "$DEMO_ABS" && npm run build -- --base="$BASE_PATH")
fi

if [[ ! -d "$DEMO_ABS/dist" ]]; then
  echo "Error: dist directory not found at: $DEMO_ABS/dist" >&2
  exit 1
fi

TMP_DEPLOY_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DEPLOY_DIR"' EXIT

echo "==> Preparing gh-pages payload"
cp -R "$DEMO_ABS/dist/." "$TMP_DEPLOY_DIR/"
touch "$TMP_DEPLOY_DIR/.nojekyll"

AUTHOR_NAME="$(git -C "$REPO_ROOT" config user.name || true)"
AUTHOR_EMAIL="$(git -C "$REPO_ROOT" config user.email || true)"
if [[ -z "$AUTHOR_NAME" ]]; then AUTHOR_NAME="local-deploy"; fi
if [[ -z "$AUTHOR_EMAIL" ]]; then AUTHOR_EMAIL="local-deploy@example.com"; fi

if [[ "$PAGES_BRANCH" == "master" || "$PAGES_BRANCH" == "main" ]]; then
  echo "Error: refusing to force-push to protected branch '$PAGES_BRANCH'" >&2
  exit 1
fi

echo "==> Publishing to $REPO_SLUG:$PAGES_BRANCH"
(
  cd "$TMP_DEPLOY_DIR"
  git init -q
  git checkout -b "$PAGES_BRANCH" >/dev/null
  git config user.name "$AUTHOR_NAME"
  git config user.email "$AUTHOR_EMAIL"
  git add .
  git commit -m "deploy: playground update" >/dev/null
  git remote add origin "https://github.com/$REPO_SLUG.git"
  git push -f origin "$PAGES_BRANCH"
)

echo "==> Ensuring GitHub Pages source is $PAGES_BRANCH"
if gh api "repos/$OWNER/$REPO/pages" >/dev/null 2>&1; then
  gh api -X PUT "repos/$OWNER/$REPO/pages" -f source[branch]="$PAGES_BRANCH" -f source[path]=/ >/dev/null
else
  gh api -X POST "repos/$OWNER/$REPO/pages" -f source[branch]="$PAGES_BRANCH" -f source[path]=/ >/dev/null
fi

echo "==> Waiting for Pages build"
STATUS=""
for _ in $(seq 1 24); do
  STATUS="$(gh api "repos/$OWNER/$REPO/pages" --jq '.status')"
  if [[ "$STATUS" == "built" ]]; then
    break
  fi
  sleep 5
done

URL="$(gh api "repos/$OWNER/$REPO/pages" --jq '.html_url')"
echo "Pages status: $STATUS"
echo "Playground URL: $URL"

