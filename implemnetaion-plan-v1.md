# rh-mi-icon — Implementation Plan v1 (Single Repo)

## 1. Objective

Build `rh-mi-icon` as a zero-server-cost icon system where:
1. Icon registry data is stored in GitHub.
2. Icons are delivered through jsDelivr.
3. `rh-mi-cli` generates only requested icon components in user projects.
4. `rh-mi-react` stays minimal and CSS-friendly.
5. All public names start with `rh`.

---

## 2. Fixed Naming and Repositories

| Surface | Value |
|---|---|
| GitHub owner | `ranjeet-h` |
| Single repo | `rh-mi-icon-data` |
| Runtime package | `rh-mi-react` |
| CLI package | `rh-mi-cli` |
| CLI command | `rh-mi` |

---

## 3. Target Architecture

```text
Upstream Material SVGs
        |
        v
Scraper/Generator (local scripts + optional cron)
        |
        v
ranjeet-h/rh-mi-icon-data (JSON registry)
        |
        v
jsDelivr (tag-pinned CDN URLs)
        |
        v
rh-mi-cli fetches JSON and generates TSX into src/icons
        |
        v
App imports generated icons + uses rh-mi-react base components
```

No paid infra (no server, no edge worker, no bucket).

---

## 4. Data Contract (Registry)

### 4.1 Folder Structure (`rh-mi-icon-data`)

```text
registry/
  metadata.json
  aliases.json
  rounded/
    arrow_back.json
  outlined/
    arrow_back.json
  sharp/
    arrow_back.json
```

### 4.2 Icon JSON Shape

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

### 4.3 CDN URL Pattern

```text
https://cdn.jsdelivr.net/gh/ranjeet-h/rh-mi-icon-data@<ref>/registry/<style>/<icon>.json
```

Use tag refs (`v1.1.0`) for stable builds.

---

## 5. Package Structure (`rh-mi-icon-data`)

```text
packages/
  rh-mi-react/
    src/
      SvgIcon.tsx
      IconProvider.tsx
      types.ts
      index.ts
  rh-mi-cli/
    src/
      commands/
      core/
      generators/
      config/
      index.ts
scripts/
  scraper/
registry/
  metadata.json
  aliases.json
  rounded/
  outlined/
  sharp/
```

---

## 6. Implementation Phases

## Phase 1 — Foundation and Naming ✅ Done

### Tasks
1. Initialize workspace/monorepo for `rh-mi-react` and `rh-mi-cli`.
2. Ensure package names and docs use `rh-*` naming.
3. Set CLI binary to `rh-mi`.
4. Add shared lint/build/test setup for both packages.

### Deliverables
1. Buildable workspace with two packages.
2. Consistent naming in code and docs.

### Exit Criteria
1. `rh-mi-react` and `rh-mi-cli` compile.
2. `npx rh-mi --help` resolves locally.

---

## Phase 2 — Static Registry Setup (inside `rh-mi-icon-data`) ✅ Done

### Tasks
1. Create `registry/` structure.
2. Add initial `metadata.json` and `aliases.json`.
3. Add sample icon JSON for each style.
4. Tag first release (`v1.1.0`).
5. Verify jsDelivr URLs.

### Deliverables
1. Single repo with valid static registry files.
2. First tag accessible from jsDelivr.

### Exit Criteria
1. Metadata URL loads from jsDelivr.
2. At least one icon variant URL loads from jsDelivr.

---

## Phase 3 — Scraper and Generator ✅ Done

### Tasks
1. Implement scraper for Material symbols source.
2. Collect 6 variants per icon:
   1. rounded fill0
   2. rounded fill1
   3. outlined fill0
   4. outlined fill1
   5. sharp fill0
   6. sharp fill1
3. Normalize SVG path data.
4. Output per-style icon JSON + metadata.
5. Validate schema before write.

### Deliverables
1. Re-runnable scraper command.
2. Deterministic output under `registry/`.
3. Full icon sync support (all available icons).
4. Future icon support from live codepoints source.

### Exit Criteria
1. Regeneration is stable for same source input.
2. Invalid icon data fails validation with clear error.

---

## Phase 4 — `rh-mi-react` Runtime Package ✅ Done

### Tasks
1. Implement `SvgIcon` base with:
   1. `width="1em"` and `height="1em"`
   2. `fill="currentColor"`
   3. SVG prop pass-through
2. Define `IconProps` for:
   1. `iconStyle` (`rounded | outlined | sharp`)
   2. `fill` (`0 | 1`)
   3. optional size/color/accessibility props
3. Implement `IconProvider` for app-level defaults.

### Deliverables
1. Tiny runtime package API.
2. Typed exports ready for generated icon components.

### Exit Criteria
1. Icons size/color correctly via CSS and className.
2. TypeScript autocomplete works for icon props.

---

## Phase 5 — `rh-mi-cli` Generation Engine ✅ Done

### Tasks
1. Config reader for `rh-mi.config.json`.
2. URL resolver for jsDelivr registry endpoints.
3. Implement commands:
   1. `init`
   2. `add`
   3. `remove`
   4. `list`
   5. `search`
   6. `update`
4. TSX generator:
   1. create `src/icons/<PascalName>.tsx`
   2. embed paths by style/fill
   3. update `src/icons/index.ts`
5. Add local cache to reduce repeated fetches.

### Deliverables
1. Working CLI flow from empty app to generated icons.
2. Stable code generation templates.

### Exit Criteria
1. `npx rh-mi init` creates config + icon folder.
2. `npx rh-mi add arrow_back` generates valid TSX and export.
3. `npx rh-mi remove arrow_back` updates barrel cleanly.

---

## Phase 6 — Local Release and Publishing ✅ Done

### Tasks
1. In `rh-mi-icon-data`, add local release script to:
   1. run scraper
   2. update `registry/`
   3. commit changes
   4. create/push version tag
   5. verify jsDelivr URLs
2. In the same repo, support manual local package release:
   1. install deps
   2. lint/build/test
   3. publish `rh-mi-react` and `rh-mi-cli`
3. Document local monthly schedule on 1st day (cron).

### Deliverables
1. Scripted single-repo local data and package release flow.

### Exit Criteria
1. Tagging `rh-mi-icon-data` produces jsDelivr-consumable registry version.
2. Local publish command publishes both packages.
3. Monthly local run auto-detects and syncs newly added icons.

---

## Phase 7 — Consumer Validation ✅ Done

### Tasks
1. Create clean React sample app.
2. Run:
   1. `npx rh-mi init`
   2. `npx rh-mi add arrow_back home`
3. Import generated icons and render.
4. Change config `ref` to a new tag and run `npx rh-mi update`.
5. Confirm generated output follows new registry version.

### Deliverables
1. Proven end-to-end workflow.
2. Usage docs based on real run.

### Exit Criteria
1. New app can install and use icons without manual patching.
2. Version pinning behaves predictably.

---

## 7. Config and Usage Contract

### 7.1 `rh-mi.config.json` (consumer app)

```json
{
  "registry": {
    "owner": "ranjeet-h",
    "repo": "rh-mi-icon-data",
    "ref": "v1.1.0"
  },
  "iconsDir": "src/icons"
}
```

### 7.2 Generated Import Style

```tsx
import { ArrowBack, Home } from './icons'
```

---

## 8. Command Runbook

### 8.1 Single repo (`rh-mi-icon-data`)

```bash
mkdir -p packages/rh-mi-react packages/rh-mi-cli scripts/scraper
mkdir -p registry/rounded registry/outlined registry/sharp
touch registry/metadata.json registry/aliases.json
git add .
git commit -m "seed registry"
git push origin master
git tag v1.1.0
git push origin v1.1.0
```

### 8.2 Validate CDN

```text
https://cdn.jsdelivr.net/gh/ranjeet-h/rh-mi-icon-data@v1.1.0/registry/rounded/arrow_back.json
```

### 8.3 Consumer app flow

```bash
npx rh-mi init
npx rh-mi add arrow_back
npx rh-mi add home --style=outlined
npx rh-mi list
```

---

## 9. Risks and Controls

1. CDN cache lag after updates  
   Control: always use versioned tags for production refs.

2. Upstream icon source changes  
   Control: keep scraper deterministic and fail fast on schema mismatch.

3. Registry growth over time  
   Control: split metadata and per-icon files; fetch only requested icons.

4. Generation drift across versions  
   Control: pin `ref` and regenerate only on explicit `update`.

---

## 10. Definition of Done (v1)

1. `rh-mi-react` and `rh-mi-cli` are published (`0.1.0`) and local publish flow is configured.
2. `rh-mi-icon-data` serves tagged static icon data via jsDelivr and holds package source.
3. `npx rh-mi init` and `npx rh-mi add` work in a clean React project.
4. Generated icon components are typed and CSS-friendly.
5. End-to-end workflow runs with no paid server infrastructure.
