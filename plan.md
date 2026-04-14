# World's Most Efficient Material Icons Library (rh-mi-icon)

## The Core Innovation: On-Demand Icon Installation

---

## The Real Problem With Existing Libraries

```text
@mui/icons-material     -> huge install footprint, all icons pulled in
react-icons             -> large icon set bundles
@material-symbols       -> limited variant ergonomics for app-level usage

rh-mi-icon innovation:
+-- only icons you use are installed/generated
+-- full variant support (rounded / outlined / sharp + fill states)
+-- className/CSS works naturally
+-- zero paid server infrastructure
```

---

## The Architecture: CLI + Static Registry (GitHub + jsDelivr)

Think of it like shadcn/ui for Material icons:

```text
Instead of: npm install a package containing thousands of icons
You do:     npx rh-mi add arrow_back home search

Result:     only requested icons are generated into your project
            node_modules stays tiny
            full TypeScript support
            full CSS control
```

---

## Full Architecture (No Servers, No Hosting Bill)

```text
                  +--------------------------------------+
                  |  GitHub repo: ranjeet-h/rh-mi-icon-data |
                  |  (static JSON files + metadata)      |
                  +------------------+-------------------+
                                     |
                                     | jsDelivr CDN
                                     v
                  +--------------------------------------+
                  | https://cdn.jsdelivr.net/gh/...      |
                  | versioned by tag (v1.0.0, v1.1.0...) |
                  +------------------+-------------------+
                                     |
                                     v
       +----------------------+      +-----------------------+
       | npx rh-mi add ...    |      | rh-mi-react (tiny)    |
       | (rh-mi-cli package)  |      | base SvgIcon + types  |
       | fetches only needed  |      | no icon bulk inside   |
       | icon JSON from CDN   |      | node_modules          |
       +----------+-----------+      +-----------+-----------+
                  |                              |
                  v                              v
            src/icons/*.tsx                app imports generated icons
```

---

## What Gets Installed vs What Lives in Project

```text
node_modules/
  rh-mi-react/               <- tiny base runtime only
  rh-mi-cli/                 <- CLI (invoked via npx rh-mi ...)

your-project/
  src/
    icons/
      ArrowBack.tsx
      Home.tsx
      index.ts               <- auto-managed exports
```

---

## Full Variant + CSS Support Design

### Every Icon Supports All Main Variants

```tsx
<ArrowBack iconStyle="rounded" />     // default
<ArrowBack iconStyle="outlined" />
<ArrowBack iconStyle="sharp" />

<ArrowBack fill={0} />                // outlined-like
<ArrowBack fill={1} />                // filled-like

<ArrowBack weight={100} />
<ArrowBack weight={400} />
<ArrowBack weight={700} />

<ArrowBack grade={-25} />
<ArrowBack grade={0} />
<ArrowBack grade={200} />

<ArrowBack opticalSize={20} />
<ArrowBack opticalSize={48} />

<ArrowBack className="w-6 h-6 text-red-500 hover:text-blue-500" />
<ArrowBack color="#e3e3e3" size={32} />
<ArrowBack onClick={handleClick} aria-label="go back" />
```

### Why CSS Works Naturally

```text
SVG output targets:
+-- width="1em" height="1em"   -> font-size controls size
+-- fill="currentColor"        -> color controls icon fill
+-- no hardcoded color/size    -> complete CSS/Tailwind control
```

```css
.my-icon { font-size: 32px; color: red; }
.my-icon:hover { color: blue; }
.my-icon { width: 48px; height: 48px; }
```

```text
Tailwind examples:
text-red-500      -> icon color red
text-2xl          -> icon size via font-size
w-8 h-8           -> explicit width/height
hover:text-blue-500 -> hover color
```

---

## CLI Tool Design (`npx rh-mi`)

### Commands

```bash
# Add specific icons
npx rh-mi add arrow_back
npx rh-mi add arrow_back home search menu close

# Add with explicit style(s)
npx rh-mi add arrow_back --style=rounded
npx rh-mi add arrow_back --style=outlined --style=sharp

# Add all styles
npx rh-mi add arrow_back --all-styles

# Search from metadata
npx rh-mi search "arrow"
npx rh-mi search "navigation" --category

# Remove icon(s)
npx rh-mi remove arrow_back

# Re-fetch for current registry ref
npx rh-mi update

# Show installed/generated icons
npx rh-mi list

# First-time setup
npx rh-mi init
```

### What `npx rh-mi add arrow_back` Does Internally

```text
Step 1: Read rh-mi.config.json
        (owner=ranjeet-h, repo=rh-mi-icon-data, ref=v1.0.0)

Step 2: Build CDN URL(s), for example:
        https://cdn.jsdelivr.net/gh/ranjeet-h/rh-mi-icon-data@v1.0.0/registry/rounded/arrow_back.json

Step 3: Fetch JSON for requested style variants
        (rounded/outlined/sharp + fill0/fill1 path data)

Step 4: Generate TypeScript component:
        src/icons/ArrowBack.tsx

Step 5: Update barrel file:
        src/icons/index.ts

Step 6: Print usage hint
```

---

## Generated Icon Component (What Lands in User Project)

```tsx
// src/icons/ArrowBack.tsx
// Generated by rh-mi-cli - edit carefully, re-run 'npx rh-mi update arrow_back' to refresh
// Icon: arrow_back | Variants: rounded, outlined, sharp

import { SvgIcon } from 'rh-mi-react'
import type { IconProps } from 'rh-mi-react'

const PATHS = {
  rounded: {
    fill0: 'M20 11H7.83...',
    fill1: 'M20 11H7.83...',
  },
  outlined: {
    fill0: 'M20 11H7.83...',
    fill1: 'M20 11H7.83...',
  },
  sharp: {
    fill0: 'M20 11H7.83...',
    fill1: 'M20 11H7.83...',
  },
} as const

export const ArrowBack = (props: IconProps) => {
  const { iconStyle = 'rounded', fill = 0, ...rest } = props
  return <SvgIcon {...rest} pathData={PATHS[iconStyle][`fill${fill}`]} iconName="arrow_back" />
}
```

---

## Tiny Base Package: `rh-mi-react`

### What It Contains

```text
rh-mi-react
+-- SvgIcon.tsx
+-- types.ts
+-- IconContext.tsx
+-- index.ts
```

### Base Behavior

```text
Prop resolution order:
1) Context defaults
2) Per-icon props
3) CSS className/runtime style overrides visuals

SVG output:
+-- width="1em" height="1em"
+-- fill="currentColor"
+-- viewBox="0 0 24 24"
+-- aria-hidden when no aria-label
+-- focusable="false"
```

### Global Defaults via Context

```tsx
import { IconProvider } from 'rh-mi-react'

<IconProvider
  defaults={{
    iconStyle: 'rounded',
    fill: 0,
    weight: 400,
    size: 24,
    color: '#e3e3e3',
  }}
>
  <App />
</IconProvider>
```

---

## Registry Design (GitHub Static Files)

### Storage Layout in `ranjeet-h/rh-mi-icon-data`

```text
registry/
+-- metadata.json
+-- aliases.json
+-- rounded/
|   +-- arrow_back.json
|   +-- home.json
+-- outlined/
|   +-- arrow_back.json
+-- sharp/
    +-- arrow_back.json
```

### Registry File Example

```json
{
  "name": "arrow_back",
  "style": "rounded",
  "viewBox": "0 0 24 24",
  "paths": {
    "fill0": "M20 11H7.83...",
    "fill1": "M20 11H7.83..."
  }
}
```

### CDN Access Patterns (No API Server Needed)

```text
# metadata
https://cdn.jsdelivr.net/gh/ranjeet-h/rh-mi-icon-data@v1.0.0/registry/metadata.json

# single icon variant
https://cdn.jsdelivr.net/gh/ranjeet-h/rh-mi-icon-data@v1.0.0/registry/rounded/arrow_back.json

# dev ref (non-production)
https://cdn.jsdelivr.net/gh/ranjeet-h/rh-mi-icon-data@main/registry/metadata.json
```

---

## Python Scraper: What to Collect Per Icon

### Variants to Collect

```python
variants = [
    ("rounded", 0),
    ("rounded", 1),
    ("outlined", 0),
    ("outlined", 1),
    ("sharp", 0),
    ("sharp", 1),
]
```

### Expected Output

```text
output/
+-- registry/
|   +-- rounded/*.json
|   +-- outlined/*.json
|   +-- sharp/*.json
+-- metadata.json
```

### Scraper Responsibility

1. Fetch upstream Material SVGs.
2. Extract/normalize path data.
3. Build per-style JSON files.
4. Build searchable metadata.
5. Write into `registry/` structure.

---

## Complete User Flow

```text
Day 1:
  npm install rh-mi-react
  npx rh-mi init
    -> creates src/icons/
    -> creates src/icons/index.ts
    -> creates rh-mi.config.json

Day 2:
  npx rh-mi add arrow_back
    -> fetches from jsDelivr
    -> writes src/icons/ArrowBack.tsx
    -> updates src/icons/index.ts

Usage:
  import { ArrowBack } from './icons'
  <ArrowBack className="text-red-500 w-8 h-8" />
```

---

## Comparison With Alternatives

| Feature | MUI Icons | react-icons | rh-mi-icon |
|---|---|---|---|
| Install footprint | Large | Medium/Large | Tiny base + generated only |
| Only used icons | No | No | Yes |
| Rounded/Outlined/Sharp | Partial | Partial | Yes |
| Fill variants | No | No | Yes |
| className/CSS control | Partial | Partial | Full |
| currentColor support | Varies | Varies | Yes |
| Git-committable generated icons | No | No | Yes |
| Server cost | N/A | N/A | $0 (GitHub + jsDelivr) |

---

## Size Reality Check

```text
Traditional:
+-- large icon package install
+-- unused icons still present in dependency tree

rh-mi-icon:
+-- rh-mi-react stays tiny
+-- only generated icons enter app bundle
+-- zero unused icon code if not generated
```

---

## Implementation Plan (Detailed)

### Phase 1: Naming + Package Structure
1. Keep project/library naming as `rh-mi-icon`.
2. Ensure runtime package is `rh-mi-react`.
3. Ensure CLI package is `rh-mi-cli` with binary `rh-mi`.
4. Update all docs/examples from `mi` to `rh-mi`.

### Phase 2: Static Registry Foundation
1. Create/maintain `ranjeet-h/rh-mi-icon-data`.
2. Add `registry/metadata.json` and per-style folders.
3. Define JSON schema for icon files and metadata.
4. Version registry by git tags (`vX.Y.Z`).

### Phase 3: Scraper + Data Generation
1. Build scraper script to collect variant SVGs.
2. Normalize path data and output JSON files.
3. Generate metadata index for search.
4. Commit generated output to data repo.

### Phase 4: CLI Generation Engine
1. Implement config reader (`rh-mi.config.json`).
2. Implement URL resolver for jsDelivr.
3. Implement `add/remove/list/search/update/init`.
4. Implement TSX generator + barrel updater.
5. Add local cache to reduce repeated downloads.

### Phase 5: Runtime Package
1. Implement `SvgIcon` with CSS-friendly defaults.
2. Implement `IconProps` typing for variants.
3. Implement optional `IconProvider` context defaults.
4. Publish stable versions.

### Phase 6: CI/CD Automation
1. Data repo workflow:
   - run scraper
   - update registry files
   - commit + push
   - create tag
2. Code repo workflow:
   - build/test packages
   - publish npm packages on release tag

### Phase 7: Consumer Validation
1. Test in clean React app.
2. Run `npx rh-mi init`.
3. Run `npx rh-mi add arrow_back home`.
4. Verify generated imports render correctly.
5. Verify changing `ref` in config controls icon version.

---

## Exact Setup Steps (You Can Follow This Directly)

### 1) Create two GitHub repos
1. `rh-mi-icon` (code)
2. `rh-mi-icon-data` (icon registry data)

### 2) Initialize data repo structure

```bash
mkdir -p registry/rounded registry/outlined registry/sharp
touch registry/metadata.json registry/aliases.json
```

### 3) Add first sample icon JSON
Create:
`registry/rounded/arrow_back.json`

```json
{
  "name": "arrow_back",
  "style": "rounded",
  "viewBox": "0 0 24 24",
  "paths": { "fill0": "M20 11H7.83...", "fill1": "M20 11H7.83..." }
}
```

### 4) Tag and push version

```bash
git add .
git commit -m "seed registry v1.0.0"
git push origin main
git tag v1.0.0
git push origin v1.0.0
```

### 5) Confirm CDN URL works

```text
https://cdn.jsdelivr.net/gh/ranjeet-h/rh-mi-icon-data@v1.0.0/registry/rounded/arrow_back.json
```

### 6) Create consumer config format
In app root, create `rh-mi.config.json`:

```json
{
  "registry": {
    "owner": "ranjeet-h",
    "repo": "rh-mi-icon-data",
    "ref": "v1.0.0"
  },
  "iconsDir": "src/icons"
}
```

### 7) Implement and test CLI commands

```bash
npx rh-mi init
npx rh-mi add arrow_back
npx rh-mi add home --style=outlined
npx rh-mi list
```

### 8) Validate generated icons in React
Import from `src/icons` and render in UI.

### 9) Add automated refresh
Set GitHub Actions in data repo to regenerate and tag new versions.

### 10) Publish runtime + CLI packages
Publish `rh-mi-react` and `rh-mi-cli` after tests pass.

---

## Cost Model

```text
Hosting cost:      $0 (GitHub repositories)
CDN cost:          $0 (jsDelivr)
API/server cost:   $0 (none required)
```

---

## Key Innovation Summary

```text
1. CLI-based icon install (shadcn-style model)
2. Static registry delivery from GitHub + jsDelivr
3. Generated components committed inside user project
4. CSS-first icon rendering (1em + currentColor)
5. Multi-variant support embedded at generation time
6. Fully versioned icon registry via git tags
7. All public library/package names start with "rh"
```
