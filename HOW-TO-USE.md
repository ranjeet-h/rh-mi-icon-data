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

## 3) Full local release script (recommended)

Use this to run everything locally:
1. scrape all icons
2. run lint/build/test
3. commit `registry/` changes
4. push branch + tag
5. verify jsDelivr URLs

```bash
bash scripts/local-release.sh --tag v1.2.0
```

Useful options:
1. `--concurrency 32 --retries 3` -> fast, stable scraping
2. `--skip-git` -> run without commit/tag/push
3. `--skip-cdn-check` -> skip jsDelivr verification
4. `--publish` -> publish `rh-mi-react` and `rh-mi-cli` from local machine

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

## 6) Use in another React project (from scratch)

### Step 1: Create a React app

```bash
npm create vite@latest my-rh-icons-app -- --template react-ts
cd my-rh-icons-app
npm install
```

### Step 2: Install packages

```bash
npm install rh-mi-react
npm install -D rh-mi-cli
```

### Step 3: Initialize icon setup

```bash
npx rh-mi init
```

### Step 4: Point config to your registry

Edit `rh-mi.config.json`:

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

### Step 5: Add icons you need

```bash
npx rh-mi add search home arrow_back --all-styles
```

This generates:
1. `src/icons/Search.tsx`
2. `src/icons/Home.tsx`
3. `src/icons/ArrowBack.tsx`
4. `src/icons/index.ts`

### Step 6: Use icons in your app

```tsx
// src/App.tsx
import { IconProvider } from 'rh-mi-react'
import { Search, Home } from './icons'

export default function App() {
  return (
    <IconProvider defaults={{ iconStyle: 'rounded', fill: 0 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Search className="text-blue-500" />
        <Home style={{ color: '#0ea5e9', fontSize: 24 }} />
      </div>
    </IconProvider>
  )
}
```

---

## 7) Publish packages (manual)

Dry-run checks:

```bash
cd packages/rh-mi-react && npm publish --dry-run
cd ../rh-mi-cli && npm publish --dry-run
```

Publish directly from local:

```bash
cd packages/rh-mi-react && npm publish --access public
cd ../rh-mi-cli && npm publish --access public
```

Or publish as part of local release script:

```bash
bash scripts/local-release.sh --tag v1.2.0 --publish
```

If npm account has 2FA for publish, use an automation token or provide OTP when prompted.

---

## 8) Validate everything

```bash
npm run lint
npm run build
npm run test
```

---

## 9) Run monthly on your machine (1st day)

Use cron on your local machine/server:

```bash
crontab -e
```

Add:

```cron
0 2 1 * * cd /absolute/path/to/rh-mi-icon-data && /bin/bash scripts/local-release.sh >> /tmp/rh-mi-monthly.log 2>&1
```
