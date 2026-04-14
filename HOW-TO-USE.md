# HOW TO USE `rh-mi-icon-data`

This repo contains everything in one place:
1. Registry data (`registry/`)
2. Scraper (`scripts/scraper/`)
3. React runtime package (`packages/rh-mi-react`)
4. CLI package (`packages/rh-mi-cli`)

---

## 1) Setup

```bash
npm install
npm run build
```

---

## 2) Scrape all icons (full sync)

This fetches all currently available Material Symbols and writes JSON files to `registry/`.

```bash
npm run scrape -- --concurrency=32 --retries=3
```

Useful flags:
1. `--force` -> re-fetch everything even if files already exist
2. `--limit=<n>` -> scrape only first N icons (dev/testing)
3. `--icons=a,b,c` -> scrape only selected icons
4. `--no-prune` -> keep old icon files not in latest source list

Example:

```bash
npm run scrape -- --force --concurrency=32 --retries=3
```

---

## 3) Monthly auto-update

GitHub Actions workflow:
1. File: `.github/workflows/refresh-registry.yml`
2. Schedule: `0 2 1 * *` (1st day of every month)
3. Behavior: full scrape, commit changes, push, create new version tag

You can also trigger it manually from GitHub Actions UI (`workflow_dispatch`).

---

## 4) Use the CLI locally

Build first:

```bash
npm run build
```

Run CLI:

```bash
node packages/rh-mi-cli/dist/index.js help
node packages/rh-mi-cli/dist/index.js init
node packages/rh-mi-cli/dist/index.js add search home --all-styles
node packages/rh-mi-cli/dist/index.js list
node packages/rh-mi-cli/dist/index.js search search
node packages/rh-mi-cli/dist/index.js remove home
node packages/rh-mi-cli/dist/index.js update
```

---

## 5) Consumer app config

Create `rh-mi.config.json` in app root:

```json
{
  "registry": {
    "owner": "ranjeet-h",
    "repo": "rh-mi-icon-data",
    "ref": "v1.1.0"
  },
  "iconsDir": "src/icons",
  "cacheDir": ".cache/rh-mi"
}
```

---

## 6) Publish packages

Dry-run checks:

```bash
cd packages/rh-mi-react && npm publish --dry-run
cd ../rh-mi-cli && npm publish --dry-run
```

Real publish happens via workflow:
1. Set repo secret: `NPM_TOKEN`
2. Push a release tag (example `v1.1.0`)
3. Workflow `.github/workflows/release-packages.yml` runs build/test and publish

---

## 7) Validate everything

```bash
npm run lint
npm run build
npm run test
```

