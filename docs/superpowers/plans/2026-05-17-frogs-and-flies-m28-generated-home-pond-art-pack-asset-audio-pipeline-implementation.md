# Frogs and Flies M2.8 Generated Home Pond Art Pack v1 And Asset/Audio Pipeline Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox syntax for tracking. If using eliteteams, each task should be assigned to a focused specialist worker and consolidated by a separate reviewer before the next task starts.

**Goal:** Replace the visible Home Pond stand-in feel with a generated M2.8 visual pack, fulfill the already-registered local audio paths, and harden manifest/cache/tests/deployment evidence without changing gameplay, campaign content, save schema, or backend behavior.

**Architecture:** Keep deterministic gameplay in `src/game/**` untouched. Add versioned M2.8 static assets under `public/assets/m28/**` and `public/audio/**`, expose their runtime paths through existing runtime asset/audio/PWA modules, and retain existing M2.5/M0 art as fallback. DOM campaign/prologue/results visuals stay decorative and semantic HTML remains the source of text/status truth; all generation happens before commit and the shipped app has no live OpenAI/ChatGPT/API dependency.

**Tech Stack:** TypeScript, PixiJS v8, Vite, Vitest, Playwright, axe-core Playwright, `pngjs`, static PNG/MP3 files under `public/**`, browser Service Worker/Cache APIs, Docker/nginx, Coolify static container deployment.

## Scope Guard

M2.8 must add exactly:

- A generated or fallback-authored Home Pond art pack v1 under `public/assets/m28/`.
- Three prologue images for existing tones: `dawn`, `day`, `dusk`.
- Campaign UI icon art for filled star, empty star, locked, and cleared states.
- MP3 files only for paths already registered in `LOCAL_AUDIO_ASSET_REGISTRY`.
- Manifest, filesystem, MIME, PWA/cache, screenshot/no-overlap, accessibility, performance, Docker, and production smoke coverage for those assets.

M2.8 must not add:

- New gameplay behavior, levels, biomes, bosses, Queen Bee, insects, hazards, power-ups, spawn profiles, scoring rules, objective thresholds, save schema changes, world map, achievements, skins, shop, FrogCoins, backend, online leaderboard, accounts, cloud save, analytics, telemetry, ads, payments, localization, Spine, TexturePacker, atlas runtime, Howler, audio sprites, adaptive music, final OST, external CDN, or runtime OpenAI/ChatGPT/API dependency.
- Any import or campaign/art concept in `src/game/**`.
- New local audio registry keys or paths for `resume` or `the-end`.

If implementation appears to require breaking a scope guard, stop and return `BLOCKED_SCOPE_EXPANSION` to consolidation.

## Port And Server Policy

Do not use default Vite port `5173`. Port `5174` may be occupied. Use explicit `5176` unless it is taken.

```bash
npm run dev -- --host 127.0.0.1 --port 5176 --strictPort
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npm run test:e2e
```

For production preview:

```bash
npm run preview -- --host 127.0.0.1 --port 5176 --strictPort
```

Docker nginx serves container port `80`. Host port `8080` may be occupied, so use `18080`.

```bash
docker run --rm --name frogs-and-flies-m28 -p 18080:80 frogs-and-flies-m28-art-pack
```

Stop local dev/preview/Docker processes started for verification before handing off.

## Required M2.8 Visual Asset Contract

Final runtime files:

```text
public/assets/m28/m28-home-pond-background-v1.png
public/assets/m28/m28-lily-left-v1.png
public/assets/m28/m28-lily-right-v1.png
public/assets/m28/m28-frog-p1-idle-v1.png
public/assets/m28/m28-frog-p1-crouch-v1.png
public/assets/m28/m28-frog-p1-airborne-v1.png
public/assets/m28/m28-frog-p1-tongue-v1.png
public/assets/m28/m28-frog-p1-splash-v1.png
public/assets/m28/m28-frog-p2-idle-v1.png
public/assets/m28/m28-frog-p2-crouch-v1.png
public/assets/m28/m28-frog-p2-airborne-v1.png
public/assets/m28/m28-frog-p2-tongue-v1.png
public/assets/m28/m28-frog-p2-splash-v1.png
public/assets/m28/m28-fly-wing-a-v1.png
public/assets/m28/m28-fly-wing-b-v1.png
public/assets/m28/m28-firefly-end-v1.png
public/assets/m28/m28-splash-ring-v1.png
public/assets/m28/m28-catch-pop-v1.png
public/assets/m28/m28-tongue-flash-v1.png
public/assets/m28/m28-rush-power-v1.png
public/assets/m28/m28-prologue-dawn-v1.png
public/assets/m28/m28-prologue-day-v1.png
public/assets/m28/m28-prologue-dusk-v1.png
public/assets/m28/m28-ui-star-filled-v1.png
public/assets/m28/m28-ui-star-empty-v1.png
public/assets/m28/m28-ui-lock-v1.png
public/assets/m28/m28-ui-cleared-v1.png
```

Expected dimensions and transparency:

- `m28-home-pond-background-v1.png`: `1600x1200`, opaque.
- `m28-lily-left-v1.png`, `m28-lily-right-v1.png`: `256x192`, transparent.
- Frog poses: `256x256`, transparent.
- Fly frames: `96x96`, transparent.
- `m28-firefly-end-v1.png`, `m28-rush-power-v1.png`, `m28-catch-pop-v1.png`: `128x128`, transparent.
- `m28-splash-ring-v1.png`: `192x192`, transparent.
- `m28-tongue-flash-v1.png`: `128x64`, transparent.
- Prologue panels: `1280x720`, opaque.
- UI icons: `96x96`, transparent.

Legacy files under `public/assets/*.png` must remain checked in as fallback.

## Required M2.8 Audio Contract

Final runtime files:

```text
public/audio/sfx/jump.mp3
public/audio/sfx/tongue.mp3
public/audio/sfx/catch.mp3
public/audio/sfx/miss.mp3
public/audio/sfx/splash.mp3
public/audio/sfx/power.mp3
public/audio/sfx/start.mp3
public/audio/sfx/pause.mp3
public/audio/sfx/results.mp3
public/audio/music/home-pond-loop.mp3
```

Do not add files for `resume` or `the-end` unless a later milestone expands `LOCAL_AUDIO_ASSET_REGISTRY`.

## Current File Structure Map

### Existing Baseline To Preserve

- `src/runtime/assets.ts` defines `GENERATED_GAMEPLAY_ASSET_PATHS` and loads Pixi textures into `GeneratedGameplayAssets`.
- `src/render/scene.ts`, `src/render/entities.ts`, and `src/render/effects.ts` consume the logical texture fields from `GeneratedGameplayAssets`.
- `src/runtime/audio.ts` defines `LOCAL_AUDIO_ASSET_REGISTRY`, procedural Web Audio fallback, unlock/mute/volume/mono state, and safe fetch failure behavior.
- `src/runtime/pwa.ts` defines `PWA_CACHE_NAME` and `buildPwaCacheUrls()`.
- `public/service-worker.js` manually duplicates the service-worker cache name and app-shell asset list.
- `src/runtime/dom.ts` builds Campaign, Prologue, Results, Settings, High Scores, Gameplay, Pause, and native controls.
- `src/style.css` owns shell/prologue/campaign/results responsive styling.
- `ASSET_MANIFEST.md` documents M0 generated assets and M2.5 local SVG stand-ins.
- `scripts/build-m25-assets.mjs` is the existing local SVG-to-PNG fallback pattern.
- `tests/unit/pwaCache.test.ts`, `tests/unit/audioManager.test.ts`, and M2.6/M2.7 Playwright specs already cover PWA, audio fallback, accessibility, performance, shell fit, and campaign flow.

### Create

- `scripts/check-m28-assets.mjs` - filesystem, PNG dimension/alpha, manifest, and audio-byte validation script.
- Optional fallback only: `scripts/build-m28-assets.mjs` - local SVG fallback renderer modeled on `scripts/build-m25-assets.mjs`.
- Optional fallback only: `public/assets/source/m28/*.svg` - local fallback sources if live image generation is unavailable.
- Optional generated-source storage: `public/assets/source/m28/raw/**` - small raw/source files only if needed for repeatable post-processing.
- `public/assets/m28/*.png` - final M2.8 image assets.
- `public/audio/sfx/*.mp3`
- `public/audio/music/home-pond-loop.mp3`
- `tests/unit/m28AssetPipeline.test.ts`
- `tests/e2e/m28-asset-pipeline.spec.ts`

### Modify

- `src/runtime/assets.ts` - add M2.8 path constants, retain legacy path constants, implement primary M2.8 load with legacy fallback, and mark the canvas with loaded pack/path metadata.
- `src/runtime/pwa.ts` - bump cache name to M2.8 and include required M2.8 visual/audio paths.
- `public/service-worker.js` - bump cache name and mirror required same-origin cache URLs; cache `/audio/` same-origin paths safely.
- `src/runtime/dom.ts` - add decorative prologue image element, campaign level status icons/stars, and campaign result stars while preserving text.
- `src/style.css` - style M2.8 prologue art and campaign/result icons with responsive, high-contrast, and reduced-motion-safe rules.
- `tests/unit/pwaCache.test.ts` - update M2.8 cache expectations and parity checks.
- `tests/unit/audioManager.test.ts` - add local registry filesystem assertions without changing audio behavior.
- `tests/e2e/m26-pwa-offline.spec.ts` - extend offline checks to include M2.8 prologue/campaign visuals if not fully covered in `m28-asset-pipeline.spec.ts`.
- `tests/e2e/m26-accessibility.spec.ts` - keep campaign/prologue axe and accessible names green after decorative images.
- `tests/e2e/m26-performance.spec.ts` - keep coarse asset-loaded campaign smoke under existing thresholds.
- `tests/e2e/m26-shell.spec.ts` - update no-overlap checks only if new images change visible bounding boxes.
- `tests/unit/readmeControls.test.ts` - update documentation gate for M2.8.
- `README.md` - document M2.8 asset/audio/offline behavior and non-goals.
- `ASSET_MANIFEST.md` - add complete M2.8 provenance, manifest, file size, dimensions, alpha/duration, and no-runtime-live-API notes.

### Do Not Modify Unless A Failing Test Proves An Existing Bug Blocks Asset Rendering

- `src/game/**`
- `src/content/registry.ts`
- `src/content/objectives.ts`
- `src/runtime/save.ts`
- `src/runtime/campaignProgress.ts`
- `Dockerfile`
- `nginx.conf`
- `package.json` and `package-lock.json`

## Execution Rules

- Follow superpowers:test-driven-development for all code/test behavior: write a focused failing test, run it red, implement the smallest change, run it green, then commit.
- For generated/static assets, the equivalent red gate is a validator or E2E test that fails because the exact files, dimensions, manifest entries, cache entries, or MIME responses are absent.
- Use superpowers:systematic-debugging before patching any unexpected failure.
- Use superpowers:verification-before-completion before each completion claim, final commit, push, deploy, or production smoke claim.
- Keep commits task-sized. Recommended commit messages are listed under each task.
- After every task, run `git diff --check` and remove generated `dist/`, `test-results/`, and `playwright-report/`.
- After each specialist worker finishes, a separate consolidation worker must inspect the commit, scope, and verification before continuing.
- Do not push until the final local verification gate says to push.

## Image Generation And Fallback Policy

Implementation workers must explicitly choose and record one generation path before creating final PNGs:

1. Preferred: use the available image generation skill/tool for development-time generation. If using the local OpenAI image API skill, first read `/mnt/disk/Home/work/app/frog/.codex/skills/openai/imagegen/SKILL.md`; require `OPENAI_API_KEY`; store raw outputs under `/home/resline/.codex/generated_images/m28-home-pond-art-pack-v1/<timestamp>/`; record the exact model/tool label actually used in `ASSET_MANIFEST.md`.
2. If the user-accessible ChatGPT image workflow is used instead of the API CLI, export raw images into the same generated-image workspace and record the ChatGPT/OpenAI product label visible at generation time. Do not add browser session data, credentials, or private subscription identifiers to the repo.
3. If live generation is unavailable, use a local fallback workflow: create `public/assets/source/m28/*.svg`, render them through a `scripts/build-m28-assets.mjs` Playwright screenshot script modeled on `scripts/build-m25-assets.mjs`, and mark every M2.8 image in `ASSET_MANIFEST.md` as "local authored fallback stand-in".

In all paths, final runtime assets must be local static PNGs under `public/assets/m28/`; the shipped app must not call OpenAI, ChatGPT, or any external service at runtime.

## Task 1: Baseline Audit And Dirty Guard

**Files:**
- Read: `docs/superpowers/specs/2026-05-17-frogs-and-flies-m28-generated-home-pond-art-pack-asset-audio-pipeline-design.md`
- Read: `docs/superpowers/plans/2026-05-17-frogs-and-flies-m27-home-pond-campaign-prologue-content-registry-implementation.md`
- Read: `package.json`
- Read: `src/runtime/assets.ts`
- Read: `src/runtime/audio.ts`
- Read: `src/runtime/pwa.ts`
- Read: `public/service-worker.js`
- Read: `src/runtime/dom.ts`
- Read: `ASSET_MANIFEST.md`
- Read: `tests/unit/pwaCache.test.ts`
- Read: `tests/unit/audioManager.test.ts`
- Read: `tests/e2e/m27-campaign-flow.spec.ts`

- [x] **Step 1: Confirm branch, sync, and worktree**

Run:

```bash
git branch --show-current
git status --short --branch
git log --oneline --decorate -5
```

Expected: branch is `ff2-m0-pixijs`; HEAD includes `5444761 docs: add m28 asset pipeline spec`; worktree is clean and synced with origin. If unrelated dirty files exist, stop and ask consolidation how to proceed.

- [x] **Step 2: Confirm spec scope**

Run:

```bash
sed -n '1,260p' docs/superpowers/specs/2026-05-17-frogs-and-flies-m28-generated-home-pond-art-pack-asset-audio-pipeline-design.md
sed -n '260,620p' docs/superpowers/specs/2026-05-17-frogs-and-flies-m28-generated-home-pond-art-pack-asset-audio-pipeline-design.md
```

Expected: spec requires the exact M2.8 visual/audio asset set, PWA cache bump, manifest/tests/deploy evidence, and strict non-goals.

- [x] **Step 3: Confirm scripts and dependencies**

Run:

```bash
npm run
node -e "import('pngjs').then(() => console.log('pngjs ok'))"
command -v ffmpeg || true
command -v ffprobe || true
```

Expected: npm scripts include `build`, `test`, `test:unit`, `test:e2e`, `dev`, `preview`, and `start`; `pngjs ok` prints. `ffmpeg`/`ffprobe` are optional but record availability in the worker status because Task 4 may use them.

- [x] **Step 4: Run baseline unit tests**

Run:

```bash
npm run test:unit
```

Expected: PASS. Current M2.7 baseline is 29 files / 145 tests passing. If counts differ before M2.8 starts, record the new baseline.

- [x] **Step 5: Run baseline build**

Run:

```bash
npm run build
```

Expected: `tsc && vite build` exits `0`; `dist/` is generated but not committed.

- [x] **Step 6: Check verification ports**

Run:

```bash
lsof -iTCP:5176 -sTCP:LISTEN || true
lsof -iTCP:18080 -sTCP:LISTEN || true
```

Expected: no listeners. If occupied, choose another explicit port and record it.

- [x] **Step 7: Clean generated output**

Run:

```bash
rm -rf dist test-results playwright-report
git status --short
```

Expected: no source changes from baseline verification.

- [x] **Step 8: Commit boundary**

No source commit is expected for Task 1 unless the executing worker is updating this plan's checkboxes.

## Task 2: M2.8 Asset Path Contract

**Files:**
- Modify: `src/runtime/assets.ts`
- Create: `tests/unit/m28AssetPipeline.test.ts`
- Modify: `docs/superpowers/plans/2026-05-17-frogs-and-flies-m28-generated-home-pond-art-pack-asset-audio-pipeline-implementation.md`

- [x] **Step 1: Write failing path-contract tests**

In `tests/unit/m28AssetPipeline.test.ts`, add tests that import constants from `src/runtime/assets.ts` and assert:

```ts
expect(M28_GAMEPLAY_ASSET_PATHS).toEqual([
  '/assets/m28/m28-home-pond-background-v1.png',
  '/assets/m28/m28-lily-left-v1.png',
  '/assets/m28/m28-lily-right-v1.png',
  '/assets/m28/m28-frog-p1-idle-v1.png',
  '/assets/m28/m28-frog-p1-crouch-v1.png',
  '/assets/m28/m28-frog-p1-airborne-v1.png',
  '/assets/m28/m28-frog-p1-tongue-v1.png',
  '/assets/m28/m28-frog-p1-splash-v1.png',
  '/assets/m28/m28-frog-p2-idle-v1.png',
  '/assets/m28/m28-frog-p2-crouch-v1.png',
  '/assets/m28/m28-frog-p2-airborne-v1.png',
  '/assets/m28/m28-frog-p2-tongue-v1.png',
  '/assets/m28/m28-frog-p2-splash-v1.png',
  '/assets/m28/m28-fly-wing-a-v1.png',
  '/assets/m28/m28-fly-wing-b-v1.png',
  '/assets/m28/m28-firefly-end-v1.png',
  '/assets/m28/m28-splash-ring-v1.png',
  '/assets/m28/m28-catch-pop-v1.png',
  '/assets/m28/m28-tongue-flash-v1.png',
  '/assets/m28/m28-rush-power-v1.png',
])
expect(M28_PROLOGUE_ASSET_PATH_BY_TONE).toEqual({
  dawn: '/assets/m28/m28-prologue-dawn-v1.png',
  day: '/assets/m28/m28-prologue-day-v1.png',
  dusk: '/assets/m28/m28-prologue-dusk-v1.png',
})
expect(M28_CAMPAIGN_UI_ASSET_PATHS).toEqual([
  '/assets/m28/m28-ui-star-filled-v1.png',
  '/assets/m28/m28-ui-star-empty-v1.png',
  '/assets/m28/m28-ui-lock-v1.png',
  '/assets/m28/m28-ui-cleared-v1.png',
])
expect(LEGACY_GAMEPLAY_ASSET_PATHS).toEqual(expect.arrayContaining(['/assets/home-pond-background.png']))
```

Do not assert filesystem existence yet; Task 3 owns final PNG creation.

- [x] **Step 2: Run path-contract tests red**

Run:

```bash
npm run test:unit -- tests/unit/m28AssetPipeline.test.ts
```

Expected: FAIL because M2.8 constants do not exist yet.

- [x] **Step 3: Add exported constants without switching runtime loading**

In `src/runtime/assets.ts`, add:

```ts
export const LEGACY_GAMEPLAY_ASSET_PATHS = GENERATED_GAMEPLAY_ASSET_PATHS
export const M28_GAMEPLAY_ASSET_PATHS = [/* exact paths from test */] as const
export const M28_PROLOGUE_ASSET_PATH_BY_TONE = {
  dawn: '/assets/m28/m28-prologue-dawn-v1.png',
  day: '/assets/m28/m28-prologue-day-v1.png',
  dusk: '/assets/m28/m28-prologue-dusk-v1.png',
} as const
export const M28_CAMPAIGN_UI_ASSET_PATHS = [/* exact UI paths */] as const
export const M28_REQUIRED_VISUAL_ASSET_PATHS = [
  ...M28_GAMEPLAY_ASSET_PATHS,
  ...Object.values(M28_PROLOGUE_ASSET_PATH_BY_TONE),
  ...M28_CAMPAIGN_UI_ASSET_PATHS,
] as const
```

Keep `GENERATED_GAMEPLAY_ASSET_PATHS` pointing at legacy paths for now so the app remains green before files exist.

- [x] **Step 4: Run focused tests green**

Run:

```bash
npm run test:unit -- tests/unit/m28AssetPipeline.test.ts
npm run test:unit -- tests/unit/pwaCache.test.ts tests/unit/audioManager.test.ts
```

Expected: PASS.

- [x] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [x] **Step 6: Commit**

Run:

```bash
git diff --check
git add src/runtime/assets.ts tests/unit/m28AssetPipeline.test.ts docs/superpowers/plans/2026-05-17-frogs-and-flies-m28-generated-home-pond-art-pack-asset-audio-pipeline-implementation.md
git commit -m "feat: add m28 asset path contract"
```

Expected: commit created. Remove `dist/` before handoff.

## Task 3: Visual Asset Generation, Processing, And Provenance

**Files:**
- Create: `public/assets/m28/*.png`
- Create if fallback: `public/assets/source/m28/*.svg`
- Create if fallback: `scripts/build-m28-assets.mjs`
- Create: `scripts/check-m28-assets.mjs`
- Modify: `ASSET_MANIFEST.md`
- Modify: `tests/unit/m28AssetPipeline.test.ts`
- Modify: this plan file

- [x] **Step 1: Write failing filesystem/dimension/alpha tests**

Extend `tests/unit/m28AssetPipeline.test.ts` to run the validation script:

```ts
import { execFileSync } from 'node:child_process'

it('validates the M2.8 visual asset files and manifest provenance', () => {
  expect(() => execFileSync('node', ['scripts/check-m28-assets.mjs', '--images'], { stdio: 'pipe' })).not.toThrow()
})
```

Create `scripts/check-m28-assets.mjs` with exported `M28_IMAGE_ASSETS` containing every required image, expected width, height, and transparency. The check should:

- read files from repo root,
- decode PNGs with `pngjs`,
- fail on missing file,
- fail on wrong dimensions,
- fail if opaque images contain transparent pixels,
- fail if transparent images have no transparent pixels,
- fail if `ASSET_MANIFEST.md` omits the final output path,
- print `verified <path> <width>x<height> <transparency>`.

- [x] **Step 2: Run image validator red**

Run:

```bash
npm run test:unit -- tests/unit/m28AssetPipeline.test.ts
node scripts/check-m28-assets.mjs --images
```

Expected: FAIL because `public/assets/m28/*.png` and manifest entries do not exist.

- [x] **Step 3: Choose and record the image generation path**

Use one of the policy paths:

- Preferred live generation: read `/mnt/disk/Home/work/app/frog/.codex/skills/openai/imagegen/SKILL.md`, use the available image generation skill/tool, write raw exports to `/home/resline/.codex/generated_images/m28-home-pond-art-pack-v1/<timestamp>/`, and record exact tool/model label.
- ChatGPT subscription export: export raw images through the user's available ChatGPT/OpenAI workflow into the same generated-image workspace and record exact product label.
- Fallback: create local SVG sources in `public/assets/source/m28/` and render them with `scripts/build-m28-assets.mjs`.

Do not add any runtime API keys, external URLs, subscription identifiers, or browser session data to the repo.

- [x] **Step 4: Generate or fallback-author the exact visual set**

Use the shared style prefix from the spec:

```text
Premium hand-painted 2D game art for an original Frogs and Flies spiritual successor, warm storybook arcade style, clear silhouettes, readable at small size, saturated but natural pond palette, soft watercolor texture, crisp game-sprite edges, no text, no logos, no watermark, no Atari or Mattel references.
```

Generate or fallback-author all 27 final PNG files listed in "Required M2.8 Visual Asset Contract". Preserve exact final dimensions. Keep transparent sprites/icons on stable canvases; do not tight-trim frog/VFX canvases.

- [x] **Step 5: Post-process transparent assets if needed**

If chroma key cleanup is required, use:

```bash
python "${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/scripts/remove_chroma_key.py" \
  --input public/assets/source/m28/raw/<source>.png \
  --out public/assets/m28/<final>.png \
  --auto-key border \
  --soft-matte \
  --transparent-threshold 12 \
  --opaque-threshold 220 \
  --despill \
  --edge-contract 1
```

Expected: transparent images have clean alpha edges and still match required canvases.

- [x] **Step 6: Update `ASSET_MANIFEST.md` visual section**

Add an M2.8 section with:

- status summary,
- generation path or fallback source path,
- exact tool/model label or fallback statement,
- no-runtime-live-API note,
- table for every visual asset with output, source/raw workspace, prompt/provenance, dimensions, transparency, post-processing, file size, and QA notes.

- [x] **Step 7: Run image validator green**

Run:

```bash
node scripts/check-m28-assets.mjs --images
npm run test:unit -- tests/unit/m28AssetPipeline.test.ts
```

Expected: PASS and validator prints every final image path.

- [x] **Step 8: Check size target**

Run:

```bash
du -ch public/assets/m28/*.png | tail -n 1
```

Expected: total is under `6 MB` when practical. If larger, record the reason and run the performance gates in Task 8/Task 11 before accepting.

- [x] **Step 9: Commit**

Run:

```bash
git diff --check
git add public/assets/m28 ASSET_MANIFEST.md scripts/check-m28-assets.mjs tests/unit/m28AssetPipeline.test.ts docs/superpowers/plans/2026-05-17-frogs-and-flies-m28-generated-home-pond-art-pack-asset-audio-pipeline-implementation.md
git add public/assets/source/m28 scripts/build-m28-assets.mjs 2>/dev/null || true
git commit -m "feat: add m28 home pond visual pack"
```

Expected: commit created. Only add fallback/source files if they exist and are intentionally part of provenance.

## Task 4: Minimal Local Audio Fulfillment

**Files:**
- Create: `public/audio/sfx/*.mp3`
- Create: `public/audio/music/home-pond-loop.mp3`
- Modify: `ASSET_MANIFEST.md`
- Modify: `tests/unit/audioManager.test.ts`
- Modify: `scripts/check-m28-assets.mjs`
- Modify: this plan file

- [x] **Step 1: Write failing audio filesystem tests**

In `tests/unit/audioManager.test.ts`, add a test that flattens `LOCAL_AUDIO_ASSET_REGISTRY` and asserts:

```ts
const paths = [
  ...Object.values(LOCAL_AUDIO_ASSET_REGISTRY.sfx).flatMap((entry) => entry ?? []),
  ...Object.values(LOCAL_AUDIO_ASSET_REGISTRY.music).flatMap((entry) => entry ?? []),
]
expect(paths).toEqual([
  '/audio/sfx/jump.mp3',
  '/audio/sfx/tongue.mp3',
  '/audio/sfx/catch.mp3',
  '/audio/sfx/miss.mp3',
  '/audio/sfx/splash.mp3',
  '/audio/sfx/power.mp3',
  '/audio/sfx/start.mp3',
  '/audio/sfx/pause.mp3',
  '/audio/sfx/results.mp3',
  '/audio/music/home-pond-loop.mp3',
])
for (const path of paths) {
  const absolutePath = new URL(`../../public${path}`, import.meta.url)
  const bytes = readFileSync(absolutePath)
  expect(bytes.length, `${path} file size`).toBeGreaterThan(256)
  expect(isLikelyMp3(bytes), `${path} MP3 signature`).toBe(true)
}
```

Add `isLikelyMp3` helper accepting `ID3` or MPEG frame sync headers. Do not add registry paths for `resume` or `the-end`.

- [x] **Step 2: Extend validation script for audio**

In `scripts/check-m28-assets.mjs`, add `--audio` mode that:

- checks every exact audio path,
- fails on missing file,
- fails on very small files,
- checks likely MP3 signature,
- checks every audio output path appears in `ASSET_MANIFEST.md`,
- optionally records `ffprobe` duration if available but does not require `ffprobe` in unit tests.

- [x] **Step 3: Run audio tests red**

Run:

```bash
npm run test:unit -- tests/unit/audioManager.test.ts
node scripts/check-m28-assets.mjs --audio
```

Expected: FAIL because `public/audio/**` does not exist.

- [x] **Step 4: Create minimal MP3 files**

Create only the registered paths. Preferred if `ffmpeg` is available:

```bash
mkdir -p public/audio/sfx public/audio/music
ffmpeg -y -f lavfi -i "sine=frequency=420:duration=0.14" -af "afade=t=out:st=0.10:d=0.04,volume=0.22" public/audio/sfx/jump.mp3
ffmpeg -y -f lavfi -i "sine=frequency=620:duration=0.10" -af "afade=t=out:st=0.07:d=0.03,volume=0.18" public/audio/sfx/tongue.mp3
ffmpeg -y -f lavfi -i "sine=frequency=860:duration=0.18" -af "afade=t=out:st=0.13:d=0.05,volume=0.20" public/audio/sfx/catch.mp3
ffmpeg -y -f lavfi -i "sine=frequency=170:duration=0.18" -af "afade=t=out:st=0.13:d=0.05,volume=0.18" public/audio/sfx/miss.mp3
ffmpeg -y -f lavfi -i "sine=frequency=120:duration=0.24" -af "afade=t=out:st=0.18:d=0.06,volume=0.20" public/audio/sfx/splash.mp3
ffmpeg -y -f lavfi -i "sine=frequency=980:duration=0.24" -af "afade=t=out:st=0.18:d=0.06,volume=0.18" public/audio/sfx/power.mp3
ffmpeg -y -f lavfi -i "sine=frequency=520:duration=0.16" -af "afade=t=out:st=0.11:d=0.05,volume=0.18" public/audio/sfx/start.mp3
ffmpeg -y -f lavfi -i "sine=frequency=260:duration=0.12" -af "afade=t=out:st=0.08:d=0.04,volume=0.16" public/audio/sfx/pause.mp3
ffmpeg -y -f lavfi -i "sine=frequency=700:duration=0.45" -af "afade=t=out:st=0.34:d=0.11,volume=0.18" public/audio/sfx/results.mp3
ffmpeg -y -f lavfi -i "sine=frequency=196:duration=24" -f lavfi -i "sine=frequency=294:duration=24" -filter_complex "[0:a][1:a]amix=inputs=2:duration=shortest,afade=t=in:st=0:d=1,afade=t=out:st=23:d=1,volume=0.12" public/audio/music/home-pond-loop.mp3
```

If `ffmpeg` is unavailable, use an approved local/exported audio tool, but still create the same MP3 paths and document source/provenance.

- [x] **Step 5: Update `ASSET_MANIFEST.md` audio section**

For every audio file, document output, provenance/source method, duration if known, MIME expectation, file size, normalization/compression notes, and fallback behavior. Explicitly state this is minimal local path fulfillment, not a final audio production pass.

- [x] **Step 6: Run audio validator green**

Run:

```bash
node scripts/check-m28-assets.mjs --audio
npm run test:unit -- tests/unit/audioManager.test.ts
```

Expected: PASS.

- [x] **Step 7: Check size target**

Run:

```bash
du -ch public/audio/sfx/*.mp3 public/audio/music/home-pond-loop.mp3 | tail -n 1
```

Expected: total is under `2 MB` when practical. If larger, record the reason and verify performance/offline gates.

- [x] **Step 8: Commit**

Run:

```bash
git diff --check
git add public/audio ASSET_MANIFEST.md scripts/check-m28-assets.mjs tests/unit/audioManager.test.ts docs/superpowers/plans/2026-05-17-frogs-and-flies-m28-generated-home-pond-art-pack-asset-audio-pipeline-implementation.md
git commit -m "feat: add m28 local audio assets"
```

Expected: commit created.

## Task 5: Manifest, Filesystem, And PWA Cache Validators

**Files:**
- Modify: `src/runtime/pwa.ts`
- Modify: `public/service-worker.js`
- Modify: `tests/unit/pwaCache.test.ts`
- Modify: `tests/unit/m28AssetPipeline.test.ts`
- Modify: `scripts/check-m28-assets.mjs`
- Modify: this plan file

- [x] **Step 1: Write failing cache parity tests**

Update `tests/unit/pwaCache.test.ts` to assert:

```ts
expect(PWA_CACHE_NAME).toContain('m28')
expect(buildPwaCacheUrls()).toEqual(expect.arrayContaining([
  '/',
  '/manifest.webmanifest',
  '/favicon.png',
  ...M28_GAMEPLAY_ASSET_PATHS,
  ...Object.values(M28_PROLOGUE_ASSET_PATH_BY_TONE),
  ...M28_CAMPAIGN_UI_ASSET_PATHS,
  ...flattenLocalAudioPaths(),
]))
```

Extend the VM service-worker loader assertions to verify:

- service worker cache name contains `m28`,
- `APP_SHELL_CACHE_URLS` contains representative M2.8 image/audio paths,
- `isRuntimeCacheableRequest()` returns true for same-origin `/assets/m28/...png` and `/audio/sfx/jump.mp3`,
- cross-origin requests remain false.

- [x] **Step 2: Write failing manifest/cache/file parity test**

In `tests/unit/m28AssetPipeline.test.ts`, add:

```ts
it('keeps M2.8 manifest, runtime paths, PWA cache, and filesystem in parity', () => {
  expect(() => execFileSync('node', ['scripts/check-m28-assets.mjs', '--parity'], { stdio: 'pipe' })).not.toThrow()
})
```

`--parity` should fail if a required M2.8 asset/audio file exists but is missing from the manifest/cache lists, if runtime/PWA paths point to missing files, or if TS/service-worker cache names disagree.

- [x] **Step 3: Run parity tests red**

Run:

```bash
npm run test:unit -- tests/unit/pwaCache.test.ts tests/unit/m28AssetPipeline.test.ts
```

Expected: FAIL because cache names/lists still reference M2.6/legacy paths.

- [x] **Step 4: Update TypeScript PWA cache**

In `src/runtime/pwa.ts`:

- set `PWA_CACHE_NAME = 'frogs-and-flies-m28-v1'`,
- import `M28_REQUIRED_VISUAL_ASSET_PATHS`,
- include all M2.8 required visual paths in `buildPwaCacheUrls()`,
- include all `LOCAL_AUDIO_ASSET_REGISTRY` paths by default now that files exist,
- preserve same-origin runtime JS/CSS warming behavior.

- [x] **Step 5: Update service worker cache**

In `public/service-worker.js`:

- set `PWA_CACHE_NAME = 'frogs-and-flies-m28-v1'`,
- add all required M2.8 image and audio paths to `APP_SHELL_CACHE_URLS`,
- keep `/`, `/manifest.webmanifest`, and `/favicon.png`,
- keep legacy `/assets/*.png` only if needed for fallback/offline rollback,
- update immutable cache policy so same-origin `/assets/` and `/audio/` static files can be cache-first,
- keep cross-origin fetches ignored.

- [x] **Step 6: Run parity tests green**

Run:

```bash
node scripts/check-m28-assets.mjs --parity
npm run test:unit -- tests/unit/pwaCache.test.ts tests/unit/m28AssetPipeline.test.ts
npm run test:unit -- tests/unit/audioManager.test.ts
```

Expected: PASS.

- [x] **Step 7: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [x] **Step 8: Commit**

Run:

```bash
git diff --check
git add src/runtime/pwa.ts public/service-worker.js tests/unit/pwaCache.test.ts tests/unit/m28AssetPipeline.test.ts scripts/check-m28-assets.mjs docs/superpowers/plans/2026-05-17-frogs-and-flies-m28-generated-home-pond-art-pack-asset-audio-pipeline-implementation.md
git commit -m "test: verify m28 asset cache parity"
```

Expected: commit created.

## Task 6: Runtime Pixi Asset Pack Integration And Fallback

**Files:**
- Modify: `src/runtime/assets.ts`
- Modify if needed only: `src/render/scene.ts`
- Create/modify: `tests/e2e/m28-asset-pipeline.spec.ts`
- Modify: this plan file

- [x] **Step 1: Write failing runtime asset E2E**

Create `tests/e2e/m28-asset-pipeline.spec.ts` with a test:

```ts
test('loads the M2.8 gameplay art pack into the Pixi canvas', async ({ page }) => {
  await page.goto('/?seed=2801&durationSeconds=10&theEndSeconds=0.1')
  await expect(page.getByTestId('game-canvas')).toHaveAttribute('data-assets-pack', 'm28-v1')
  await expect(page.getByTestId('game-canvas')).toHaveAttribute('data-assets-loaded', /m28-home-pond-background-v1\.png/)
  await page.getByTestId('shell-play').click()
  await page.getByTestId('mode-classic-single').click()
  await page.getByTestId('start-game').click()
  await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'gameplay')
  await expectCanvasNonblank(page)
})
```

Use or copy the existing nonblank canvas helper from `tests/e2e/m26-shell.spec.ts`.

- [x] **Step 2: Write failing fallback E2E**

Add a focused test that routes one representative M2.8 image to fail and verifies the app still renders with fallback:

```ts
await page.route('**/assets/m28/m28-home-pond-background-v1.png', (route) => route.abort())
await page.goto('/?seed=2802&durationSeconds=10&theEndSeconds=0.1')
await expect(page.getByTestId('game-canvas')).toHaveAttribute('data-assets-pack', /legacy|procedural/)
await expectCanvasNonblank(page)
```

- [x] **Step 3: Run runtime asset E2E red**

Run:

```bash
npx playwright test tests/e2e/m28-asset-pipeline.spec.ts --project=chromium
```

Expected: FAIL because runtime still loads legacy paths and does not set `data-assets-pack="m28-v1"`.

- [x] **Step 4: Implement two-tier asset loading**

In `src/runtime/assets.ts`:

- keep legacy path constants,
- make `GENERATED_GAMEPLAY_ASSET_PATHS` export the current primary pack or add `PRIMARY_GAMEPLAY_ASSET_PATHS`,
- update `loadGeneratedGameplayAssets(canvas)` to try M2.8 first,
- if M2.8 succeeds, set:

```ts
canvas.setAttribute('data-assets-pack', 'm28-v1')
canvas.setAttribute('data-assets-loaded', M28_GAMEPLAY_ASSET_PATHS.join(' '))
```

- if M2.8 fails, try legacy paths and set `data-assets-pack="legacy"` with legacy paths,
- if both fail, remove loaded markers or set `data-assets-pack="procedural"` and return `undefined`,
- keep the returned logical texture fields unchanged so `src/render/**` needs little or no change.

- [x] **Step 5: Run focused E2E green**

Run:

```bash
npx playwright test tests/e2e/m28-asset-pipeline.spec.ts --project=chromium
npm run test:unit -- tests/unit/m28AssetPipeline.test.ts tests/unit/pwaCache.test.ts
npm run build
```

Expected: PASS.

- [x] **Step 6: Commit**

Run:

```bash
git diff --check
git add src/runtime/assets.ts tests/e2e/m28-asset-pipeline.spec.ts docs/superpowers/plans/2026-05-17-frogs-and-flies-m28-generated-home-pond-art-pack-asset-audio-pipeline-implementation.md
git add src/render/scene.ts 2>/dev/null || true
git commit -m "feat: load m28 gameplay art pack"
```

Expected: commit created. Remove `dist/`, `test-results/`, and `playwright-report/`.

## Task 7: DOM Campaign Icons, Prologue Visuals, And Results Stars

**Files:**
- Modify: `src/runtime/dom.ts`
- Modify: `src/style.css`
- Modify: `tests/e2e/m28-asset-pipeline.spec.ts`
- Modify: `tests/e2e/m26-accessibility.spec.ts` only if required by image semantics
- Modify: this plan file

- [ ] **Step 1: Write failing DOM visual E2E**

Extend `tests/e2e/m28-asset-pipeline.spec.ts` to assert:

- Campaign level select shows star/lock/cleared visual containers with non-zero bounding boxes.
- Locked level status still has visible text such as `Locked`.
- Prologue panel 1 shows `m28-prologue-dawn-v1.png`, panel 2 shows `m28-prologue-day-v1.png`, panel 3 shows `m28-prologue-dusk-v1.png`.
- Prologue text remains visible HTML text.
- Campaign results after a smoke pass show star visuals and `campaign-result-status` text.

Use test ids:

```text
prologue-illustration
campaign-level-status-icon-<levelId>
campaign-level-stars-<levelId>
campaign-result-stars
```

- [ ] **Step 2: Run DOM visual E2E red**

Run:

```bash
npx playwright test tests/e2e/m28-asset-pipeline.spec.ts --project=chromium
```

Expected: FAIL because DOM image/icon elements are absent.

- [ ] **Step 3: Add prologue illustration DOM**

In `src/runtime/dom.ts`:

- add `prologueIllustration: HTMLImageElement` to `DomState`,
- create it in `createDomState()` before `prologueText`,
- set `data-testid="prologue-illustration"`, `alt=""`, `aria-hidden="true"`,
- in `syncProloguePanel()`, set `src` from `M28_PROLOGUE_ASSET_PATH_BY_TONE[panel.visualTone]`, set `data-prologue-image-tone`, and keep all narrative text in `prologueText`.

- [ ] **Step 4: Add campaign level icons/stars**

In `createCampaignLevelRow()`:

- add a decorative status `<img>` with test id `campaign-level-status-icon-${level.id}`,
- use lock icon for locked, cleared icon for passed, and empty/filled star support for unlocked states,
- add a star strip with test id `campaign-level-stars-${level.id}` containing three decorative star images,
- keep `meta.textContent = "<Status> - <stars> stars - best <score>"` or equivalent visible text.

- [ ] **Step 5: Add campaign result stars**

In `syncCampaignResultActions()`:

- create or update an element with test id `campaign-result-stars`,
- render three decorative star icons from `result.stars`,
- keep `campaignResultStatus.textContent` as the accessible result source.

- [ ] **Step 6: Add responsive/high-contrast CSS**

In `src/style.css`:

- constrain prologue art with `aspect-ratio: 16 / 9`, `max-height`, `object-fit: cover`, and no text overlap,
- size icons with fixed dimensions such as `24px` to prevent layout shifts,
- keep status text visible in high contrast even if icons are hidden or low contrast,
- disable any image transition under `.is-reduced-motion`,
- avoid nested UI cards and oversized hero-style text inside shell panels.

- [ ] **Step 7: Run focused E2E and accessibility green**

Run:

```bash
npx playwright test tests/e2e/m28-asset-pipeline.spec.ts --project=chromium
npx playwright test tests/e2e/m26-accessibility.spec.ts --project=chromium
npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium
```

Expected: PASS. Campaign/prologue text and controls remain accessible.

- [ ] **Step 8: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 9: Commit**

Run:

```bash
git diff --check
git add src/runtime/dom.ts src/style.css tests/e2e/m28-asset-pipeline.spec.ts docs/superpowers/plans/2026-05-17-frogs-and-flies-m28-generated-home-pond-art-pack-asset-audio-pipeline-implementation.md
git add tests/e2e/m26-accessibility.spec.ts 2>/dev/null || true
git commit -m "feat: add m28 campaign and prologue visuals"
```

Expected: commit created. Remove generated test artifacts.

## Task 8: PWA Offline, MIME, No-Overlap, And Performance E2E

**Files:**
- Modify: `tests/e2e/m28-asset-pipeline.spec.ts`
- Modify: `tests/e2e/m26-pwa-offline.spec.ts` if needed
- Modify: `tests/e2e/m26-performance.spec.ts` if needed
- Modify: `tests/e2e/m26-shell.spec.ts` if no-overlap helpers need to include images
- Modify: this plan file

- [ ] **Step 1: Add failing URL/MIME E2E checks**

In `tests/e2e/m28-asset-pipeline.spec.ts`, add request checks:

```ts
for (const path of [
  '/assets/m28/m28-home-pond-background-v1.png',
  '/assets/m28/m28-frog-p1-idle-v1.png',
  '/assets/m28/m28-fly-wing-a-v1.png',
  '/assets/m28/m28-prologue-dawn-v1.png',
  '/assets/m28/m28-ui-star-filled-v1.png',
]) {
  const response = await request.get(path)
  expect(response.status(), path).toBe(200)
  expect(response.headers()['content-type'], path).toContain('image/')
}
for (const path of ['/audio/sfx/jump.mp3', '/audio/music/home-pond-loop.mp3']) {
  const response = await request.get(path)
  expect(response.status(), path).toBe(200)
  expect(response.headers()['content-type'], path).toMatch(/audio|mpeg|octet-stream/)
}
```

Run once before any missing MIME/cache fix if the test is newly added; it should pass if previous tasks are complete. If it fails, fix static serving or paths before continuing.

- [ ] **Step 2: Add offline asset availability test**

Add an offline test in `m28-asset-pipeline.spec.ts` or extend `m26-pwa-offline.spec.ts`:

- boot online,
- wait for `data-pwa-registration` and `data-pwa-runtime-cache-ready="true"`,
- skip if service worker unsupported/failed,
- set offline,
- reload,
- open Campaign and Prologue,
- assert `prologue-illustration` visible and `src` contains `/assets/m28/`,
- assert campaign icons have non-zero bounding boxes.

Keep the documented WebKit offline reload skip.

- [ ] **Step 3: Add no-overlap/screenshot smoke**

Use existing helpers or add local helpers to check visible controls/images:

- desktop `1366x768`,
- desktop `1440x900`,
- mobile `390x844`.

Screens to check:

- Main Menu,
- Campaign fresh save,
- Prologue dawn,
- Prologue dusk/final panel,
- Gameplay Classic Single start,
- Campaign Results after smoke pass.

Expected: no visible controls/images outside viewport, no zero-size required images, no text clipped inside buttons.

- [ ] **Step 4: Add audio unlock/fallback E2E**

In `m28-asset-pipeline.spec.ts`:

- open Settings or main shell,
- click `Enable Audio`,
- start a short round,
- assert no `pageerror` or console errors,
- route one MP3 such as `**/audio/sfx/jump.mp3` to abort and verify gameplay still starts/results without throwing.

Do not require autoplaying music before unlock.

- [ ] **Step 5: Run focused E2E**

Run:

```bash
npx playwright test tests/e2e/m28-asset-pipeline.spec.ts --project=chromium
npx playwright test tests/e2e/m26-pwa-offline.spec.ts --project=chromium
npx playwright test tests/e2e/m26-performance.spec.ts --project=chromium
npx playwright test tests/e2e/m26-shell.spec.ts --project=chromium
```

Expected: PASS. Any WebKit offline skip remains documented only in full suite.

- [ ] **Step 6: Run unit/build**

Run:

```bash
npm run test:unit -- tests/unit/m28AssetPipeline.test.ts tests/unit/pwaCache.test.ts tests/unit/audioManager.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git diff --check
git add tests/e2e/m28-asset-pipeline.spec.ts tests/e2e/m26-pwa-offline.spec.ts tests/e2e/m26-performance.spec.ts tests/e2e/m26-shell.spec.ts docs/superpowers/plans/2026-05-17-frogs-and-flies-m28-generated-home-pond-art-pack-asset-audio-pipeline-implementation.md
git commit -m "test: add m28 asset pipeline e2e coverage"
```

Expected: commit created. Omit unchanged files from `git add`.

## Task 9: Documentation And Update Gates

**Files:**
- Modify: `README.md`
- Modify: `tests/unit/readmeControls.test.ts`
- Modify: `ASSET_MANIFEST.md` only for missing M2.8 verification notes
- Modify: this plan file

- [ ] **Step 1: Write failing README gate**

Update `tests/unit/readmeControls.test.ts` to require README coverage for:

- M2.8 generated Home Pond art pack,
- `public/assets/m28/`,
- prologue dawn/day/dusk visuals,
- campaign star/lock/cleared icons,
- `public/audio/sfx/*.mp3`,
- `public/audio/music/home-pond-loop.mp3`,
- PWA cache `m28`,
- offline asset/audio availability,
- no runtime OpenAI/ChatGPT/API dependency,
- scope: no new gameplay, levels, biomes, bosses, save schema, backend, monetization, localization, Howler, Spine, TexturePacker.

Keep existing M2.7 campaign docs gate expectations unless they conflict with M2.8 wording.

- [ ] **Step 2: Run README gate red**

Run:

```bash
npm run test:unit -- tests/unit/readmeControls.test.ts
```

Expected: FAIL because README still documents M2.7 as the latest milestone.

- [ ] **Step 3: Update README**

In `README.md`, document:

- current milestone M2.8,
- player-visible art/audio changes,
- generated/fallback provenance summary,
- how M2.8 assets are loaded and cached,
- audio unlock/fallback behavior,
- how to run relevant tests,
- Docker/Coolify production smoke expectations,
- explicit non-goals.

Do not claim new levels, biomes, bosses, insect roster, backend, localization, or monetization.

- [ ] **Step 4: Ensure manifest has verification notes**

Check `ASSET_MANIFEST.md` includes commands:

```bash
node scripts/check-m28-assets.mjs --images
node scripts/check-m28-assets.mjs --audio
node scripts/check-m28-assets.mjs --parity
```

Add them if missing.

- [ ] **Step 5: Run docs gates green**

Run:

```bash
npm run test:unit -- tests/unit/readmeControls.test.ts
node scripts/check-m28-assets.mjs --images
node scripts/check-m28-assets.mjs --audio
node scripts/check-m28-assets.mjs --parity
```

Expected: PASS.

- [ ] **Step 6: Run full unit and build**

Run:

```bash
npm run test:unit
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git diff --check
git add README.md tests/unit/readmeControls.test.ts ASSET_MANIFEST.md docs/superpowers/plans/2026-05-17-frogs-and-flies-m28-generated-home-pond-art-pack-asset-audio-pipeline-implementation.md
git commit -m "docs: document m28 asset pipeline"
```

Expected: commit created. Omit unchanged files from `git add`.

## Task 10: Scope Audit And Regression Verification

**Files:**
- Modify: this plan file only if checking boxes.
- No code changes expected. If verification finds a bug, use systematic-debugging before patching.

- [ ] **Step 1: Run full unit tests**

Run:

```bash
npm run test:unit
```

Expected: PASS.

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: PASS and `dist/` generated.

- [ ] **Step 3: Run focused M2.8 and campaign regression E2E**

Run:

```bash
npx playwright test tests/e2e/m28-asset-pipeline.spec.ts --project=chromium
npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium
npx playwright test tests/e2e/m26-accessibility.spec.ts --project=chromium
npx playwright test tests/e2e/m26-pwa-offline.spec.ts --project=chromium
npx playwright test tests/e2e/m26-performance.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 4: Run full E2E**

Run:

```bash
npm run test:e2e
```

Expected: PASS across Chromium, Firefox, WebKit; known documented WebKit offline service-worker reload skips may remain.

- [ ] **Step 5: Run combined npm test**

Run:

```bash
npm test
```

Expected: unit and E2E pass. If this duplicates freshly completed Step 1 and Step 4 and time is constrained, consolidation may accept Step 1 plus Step 4 as equivalent evidence, but record the decision explicitly.

- [ ] **Step 6: Run scope guard**

Run:

```bash
git diff --name-only origin/ff2-m0-pixijs...HEAD
git diff --name-only origin/ff2-m0-pixijs...HEAD -- src/game
rg -n "queen|boss|biome|hazard|shop|coin|frogcoin|leaderboard|account|cloud|analytics|telemetry|payment|ad-|ads|i18n|locale|localization|spine|texturepacker|howler" src tests README.md docs/superpowers public ASSET_MANIFEST.md
rg -n "fetch\\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|navigator\\.sendBeacon|openai|chatgpt|api-key|OPENAI_API_KEY" src public tests
```

Expected:

- no `src/game/**` changes,
- only expected docs/tests/non-goal mentions,
- no live runtime network/API dependency except existing same-origin service-worker/static asset fetch handling,
- no OpenAI/ChatGPT/API key references in runtime code.

- [ ] **Step 7: Clean generated files**

Run:

```bash
rm -rf dist test-results playwright-report
git status --short --branch
```

Expected: clean worktree except this plan file if checkboxes are being committed.

- [ ] **Step 8: Commit final plan checkbox update if changed**

Run:

```bash
git add docs/superpowers/plans/2026-05-17-frogs-and-flies-m28-generated-home-pond-art-pack-asset-audio-pipeline-implementation.md
git commit -m "feat: complete m28 asset pipeline"
```

Expected: commit created only if this plan file changed.

## Task 11: Docker, Push, Coolify Deploy, And Production Smoke

**Files:**
- Modify: this plan file only if checking boxes.
- No code changes expected.

- [ ] **Step 1: Run production preview smoke**

Start preview:

```bash
npm run preview -- --host 127.0.0.1 --port 5176 --strictPort
```

In another shell:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npx playwright test tests/e2e/m28-asset-pipeline.spec.ts --project=chromium
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium
```

Expected: PASS. Stop preview afterward.

- [ ] **Step 2: Docker build**

Run:

```bash
docker build -t frogs-and-flies-m28-art-pack .
```

Expected: PASS.

- [ ] **Step 3: Docker static smoke**

Run container:

```bash
docker run --rm --name frogs-and-flies-m28 -p 18080:80 frogs-and-flies-m28-art-pack
```

In another shell:

```bash
curl -I http://127.0.0.1:18080/
curl -I http://127.0.0.1:18080/manifest.webmanifest
curl -I http://127.0.0.1:18080/service-worker.js
curl -I http://127.0.0.1:18080/assets/m28/m28-home-pond-background-v1.png
curl -I http://127.0.0.1:18080/assets/m28/m28-frog-p1-idle-v1.png
curl -I http://127.0.0.1:18080/assets/m28/m28-fly-wing-a-v1.png
curl -I http://127.0.0.1:18080/assets/m28/m28-prologue-dawn-v1.png
curl -I http://127.0.0.1:18080/assets/m28/m28-ui-star-filled-v1.png
curl -I http://127.0.0.1:18080/audio/sfx/jump.mp3
curl -I http://127.0.0.1:18080/audio/music/home-pond-loop.mp3
PLAYWRIGHT_BASE_URL=http://127.0.0.1:18080 npx playwright test tests/e2e/m28-asset-pipeline.spec.ts --project=chromium
```

Expected:

- root returns `200`,
- manifest returns `200`,
- service worker returns JavaScript MIME,
- representative M2.8 image assets return `200` image MIME,
- representative audio assets return `200` audio/MPEG-compatible MIME,
- M2.8 Chromium smoke passes.

Stop container afterward.

- [ ] **Step 4: Clean before push**

Run:

```bash
rm -rf dist test-results playwright-report
git status --short --branch
git log --oneline --decorate -5
```

Expected: clean branch ahead of origin by M2.8 commits.

- [ ] **Step 5: Push**

Run:

```bash
git push origin ff2-m0-pixijs
```

Expected: push succeeds and local branch matches origin.

- [ ] **Step 6: Coolify production deploy**

Use the Coolify deployment workflow for app `frogs-and-flies-remake` on server `cx32-hell`, URL `https://frog.resline.net`.

Expected evidence to collect:

- Coolify health `OK`,
- deployment UUID,
- deployment status `finished`,
- app status `running:healthy`,
- deployed commit equals pushed HEAD,
- server is `cx32-hell`.

- [ ] **Step 7: Production static smoke**

Run:

```bash
curl -I https://frog.resline.net/
curl -I https://frog.resline.net/manifest.webmanifest
curl -I https://frog.resline.net/service-worker.js
curl -I https://frog.resline.net/assets/m28/m28-home-pond-background-v1.png
curl -I https://frog.resline.net/assets/m28/m28-frog-p1-idle-v1.png
curl -I https://frog.resline.net/assets/m28/m28-fly-wing-a-v1.png
curl -I https://frog.resline.net/assets/m28/m28-prologue-dawn-v1.png
curl -I https://frog.resline.net/assets/m28/m28-ui-star-filled-v1.png
curl -I https://frog.resline.net/audio/sfx/jump.mp3
curl -I https://frog.resline.net/audio/music/home-pond-loop.mp3
```

Expected:

- `/` returns `200`,
- `/manifest.webmanifest` returns `200`,
- `/service-worker.js` returns `200` with JavaScript content type,
- representative image/audio assets return `200` with acceptable MIME.

- [ ] **Step 8: Production Playwright smoke**

Run:

```bash
PLAYWRIGHT_BASE_URL=https://frog.resline.net npx playwright test tests/e2e/m28-asset-pipeline.spec.ts --project=chromium
PLAYWRIGHT_BASE_URL=https://frog.resline.net npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium
```

Expected: PASS on production.

- [ ] **Step 9: Final status**

Run:

```bash
rm -rf test-results playwright-report dist
git status --short --branch
```

Expected: local branch clean and synced to origin. Report commit, deploy evidence, verification counts, and production URL to the parent agent.

## Final Completion Criteria

M2.8 is complete only when all of the following are true:

- The exact M2.8 visual files exist under `public/assets/m28/` with expected dimensions and alpha/opacity.
- The exact minimal audio files exist under `public/audio/sfx/` and `public/audio/music/`.
- `ASSET_MANIFEST.md` documents every visual and audio asset with provenance, dimensions/duration, file sizes, post-processing, fallback notes, and no-runtime-live-API notes.
- Runtime loads the M2.8 gameplay art pack first and falls back to legacy/procedural rendering if the primary pack fails.
- Campaign, Prologue, and Results display M2.8 visuals without replacing semantic text or breaking keyboard/focus/a11y behavior.
- Service worker and PWA cache names are bumped to M2.8 and include required same-origin image/audio assets.
- Offline verification reaches Campaign and Prologue with M2.8 visuals after one online boot.
- Audio unlock remains gesture-driven, local MP3 failures do not throw, and procedural fallback remains available.
- Classic Single, Local Versus, and Campaign flow still work with unchanged gameplay semantics.
- `src/game/**` is unchanged.
- No new biome, boss, level, insect/hazard roster, save schema, backend, monetization, localization, Spine/TexturePacker, Howler, or live runtime API dependency is introduced.
- Unit tests, build, focused E2E, full E2E, Docker smoke, Coolify deploy, and production smoke have concrete passing evidence.
