# rh-mi-icon-data

Material Symbols as an **on-demand icon system** for React: scrape once, serve from GitHub + jsDelivr, and generate only the icons your app uses.

[![npm version](https://img.shields.io/npm/v/rh-mi-react.svg)](https://www.npmjs.com/package/rh-mi-react)
[![npm version](https://img.shields.io/npm/v/rh-mi-cli.svg)](https://www.npmjs.com/package/rh-mi-cli)
[![CDN](https://img.shields.io/badge/CDN-jsDelivr-blue)](https://www.jsdelivr.com/)
[![Node](https://img.shields.io/badge/node-%3E%3D22-339933)](https://nodejs.org/)

---

## Table of Contents

1. [Why this project](#why-this-project)
2. [What’s in this repository](#whats-in-this-repository)
3. [Architecture](#architecture)
4. [Quick start (React app)](#quick-start-react-app)
5. [CLI commands](#cli-commands)
6. [Configuration](#configuration)
7. [Use in React components](#use-in-react-components)
8. [Maintain the registry (scraper)](#maintain-the-registry-scraper)
9. [Local production release flow](#local-production-release-flow)
10. [Monthly automatic run (local cron)](#monthly-automatic-run-local-cron)
11. [Troubleshooting](#troubleshooting)
12. [Contributing](#contributing)
13. [License](#license)

---

## Why this project

Traditional icon packages usually install large icon sets in `node_modules`, even when apps use only a small subset.

`rh-mi-icon-data` uses a different model:
1. Keep icon data in this repo (`registry/`)
2. Serve data over jsDelivr (from git tags)
3. Generate only requested icons into your project with `rh-mi-cli`
4. Keep runtime tiny with `rh-mi-react`

---

## What’s in this repository

```text
packages/
  rh-mi-react/         # tiny React runtime (SvgIcon + context + types)
  rh-mi-cli/           # CLI: init/add/remove/list/search/update
registry/              # icon JSON registry + metadata + aliases + schema
scripts/scraper/       # full catalog scraper
scripts/local-release.sh
```

Published packages:
1. `rh-mi-react` (runtime)
2. `rh-mi-cli` (CLI)

---

## Architecture

```text
Google Material Symbols source
        -> scraper -> registry JSON in this repo
        -> git tag (vX.Y.Z)
        -> jsDelivr URL
        -> rh-mi-cli fetches only requested icons
        -> generated TSX in app src/icons/
        -> rendered by rh-mi-react
```

---

## Quick start (React app)

### 1) Create app

```bash
npm create vite@latest my-icons-app -- --template react-ts --no-interactive
cd my-icons-app
npm install
```

### 2) Install packages

```bash
npm install rh-mi-react
npm install -D rh-mi-cli
```

### 3) Initialize and configure

```bash
npx rh-mi init
```

Edit `rh-mi.config.json`:

```json
{
  "registry": {
    "owner": "ranjeet-h",
    "repo": "rh-mi-icon-data",
    "ref": "v1.2.0"
  },
  "iconsDir": "src/icons",
  "cacheDir": ".cache/rh-mi"
}
```

### 4) Add icons

```bash
npx rh-mi add search home arrow_back --all-styles
```

### 5) Build

```bash
npm run build
```

---

## CLI commands

```bash
npx rh-mi init
npx rh-mi add <icon...> [--style=rounded|outlined|sharp] [--all-styles]
npx rh-mi remove <icon...>
npx rh-mi list
npx rh-mi search "<query>" [--category]
npx rh-mi update [icon...]
```

---

## Configuration

`rh-mi.config.json` keys:

1. `registry.owner`: GitHub owner
2. `registry.repo`: GitHub repository with `registry/`
3. `registry.ref`: git tag/branch/commit for deterministic CDN fetches
4. `iconsDir`: where generated icons are written
5. `cacheDir`: local cache for downloaded registry payloads

---

## Use in React components

```tsx
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

## Maintain the registry (scraper)

Full scrape:

```bash
npm install
npm run scrape -- --concurrency=32 --retries=3
```

Useful flags:
1. `--force` re-fetch all
2. `--limit=<n>` test with subset
3. `--icons=a,b,c` scrape selected icons only
4. `--no-prune` keep old files not in latest source list

---

## Local production release flow

Use the local script for release from this repo:

```bash
bash scripts/local-release.sh --tag v1.2.1
```

What it does:
1. install deps
2. scrape (full by default)
3. lint/build/test
4. commit `registry/` changes (if any)
5. push branch + tag
6. verify jsDelivr metadata and sample icon URL

Publish npm packages in same flow:

```bash
bash scripts/local-release.sh --tag v1.2.1 --publish
```

---

## Monthly automatic run (local cron)

Run on the 1st day of each month:

```cron
0 2 1 * * cd /absolute/path/to/rh-mi-icon-data && /bin/bash scripts/local-release.sh >> /tmp/rh-mi-monthly.log 2>&1
```

---

## Troubleshooting

1. **npm publish fails with OTP (`EOTP`)**  
   Use an npm automation token policy, or publish interactively with OTP.

2. **Icons not updating in app**  
   Bump `registry.ref` in `rh-mi.config.json` to latest tag and run:
   ```bash
   npx rh-mi update
   ```

3. **CDN not updated yet after tagging**  
   Wait a short time for jsDelivr cache propagation.

---

## Contributing

1. Fork and create a feature branch
2. Make changes
3. Run:
   ```bash
   npm run lint
   npm run build
   npm run test
   ```
4. Open a pull request

---

## License

No license file is currently defined in this repository.

