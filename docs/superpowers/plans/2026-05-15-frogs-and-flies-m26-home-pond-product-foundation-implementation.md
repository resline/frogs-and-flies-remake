# Frogs and Flies M2.6 Home Pond Product Foundation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox syntax for tracking. If using eliteteams, each stage should be assigned to a focused specialist worker and consolidated before moving to the next stage.

**Goal:** Turn the M2.5 Home Pond Classic vertical slice into a stable local product foundation with versioned local saves, a real product shell, input profiles, audio pipeline foundations, PWA/offline static deployment, and stronger verification while keeping the playable content limited to Classic Single and Local Versus.

**Architecture:** Preserve the current PixiJS/Vite/TypeScript boundaries: deterministic gameplay authority stays in `src/game/**`, browser lifecycle/product shell/storage/input/audio/PWA wiring stays in `src/runtime/**`, and Pixi projection stays in `src/render/**`. Add typed runtime services around the existing M2.5 match instead of moving product-shell state into the simulation. The full product objective is not complete; M2.5 is only a deployed vertical slice, and M2.6 hardens that slice before M3 content breadth.

**Tech Stack:** TypeScript, PixiJS v8, Vite, Vitest, Playwright, Web Audio API, browser `localStorage`, browser Gamepad API, browser Service Worker/Cache APIs, static assets under `public/**`, Docker/nginx, Coolify static container deployment.

## Scope Guard

M2.6 must not add campaign, extra biomes, bosses, online leaderboard, backend, accounts, cloud save, networking, analytics, monetization, shop, payment, ads, final Spine pipeline, final TexturePacker pipeline, live OpenAI image API calls, live OpenAI audio API calls, or any live network/API dependency for assets, audio, saves, settings, leaderboard, or shell boot.

Player-facing gameplay modes remain exactly:

- Classic Single
- Local Versus

Use existing Home Pond content. Do not start M3 content breadth.

## Port And Server Policy

Do not use default Vite port `5173` for new verification work. Port `5174` may also be occupied. Use an explicit free port such as `5176` and set `PLAYWRIGHT_BASE_URL` when running Playwright against it.

Use:

```bash
npm run dev -- --host 127.0.0.1 --port 5176 --strictPort
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npm run test:e2e
```

For production preview use:

```bash
npm run preview -- --host 127.0.0.1 --port 5176 --strictPort
```

The Docker image serves nginx on container port `80`. Host port `8080` may be occupied, so use host port `18080` when needed:

```bash
docker run --rm --name frogs-and-flies-m26 -p 18080:80 frogs-and-flies-m26-product-foundation
```

## Current File Structure Map

### Existing Runtime Shape

- `src/main.ts` reads URL params and starts runtime.
- `src/runtime/app.ts` wires DOM, Pixi app, fixed-step update, asset loading, input, audio, replay, and render sync.
- `src/runtime/dom.ts` creates the current M2.5 HUD, controls, options, results, and smoke-test markers.
- `src/runtime/input.ts` maps hard-coded keyboard and pointer input to game commands.
- `src/runtime/options.ts` parses non-persistent runtime options.
- `src/runtime/params.ts` parses seed, mode, smoke state, duration, THE END duration, simulation speed, and options.
- `src/runtime/audio.ts` implements procedural Web Audio SFX with unlock, mute, volume, queued SFX, and silent fallback.
- `src/runtime/assets.ts` loads local Home Pond image assets through Pixi `Assets`.
- `src/game/types.ts` defines match modes, player ids, game phases, commands, stats, results, audio event names, and game state.
- `src/game/createGame.ts` creates deterministic Classic Single or Local Versus matches.
- `src/game/match.ts` creates players and builds result summaries.
- `src/game/update.ts` advances deterministic match state and drains audio events.
- `src/render/scene.ts`, `src/render/entities.ts`, `src/render/effects.ts`, and `src/render/palette.ts` render simulation state to Pixi.
- `src/style.css` owns the current shell, canvas, HUD, controls, options, focus, high-contrast, reduced-motion, and responsive styles.
- `index.html` hosts the Vite app and favicon.
- `README.md` documents current controls, smoke params, verification, Docker, and Coolify notes.
- `ASSET_MANIFEST.md` documents current local image assets and no-live-API M2.5 asset provenance.
- `playwright.config.ts` currently has one Chromium project and defaults to port `5173`.
- `vitest.config.ts` runs `tests/unit/**/*.test.ts` in Node.
- `Dockerfile` builds with Node 22 Alpine and serves `dist` with nginx 1.27 Alpine.
- `nginx.conf` serves the SPA and immutable static assets from container port `80`.

### Create

- `src/runtime/save.ts` - SaveManager v1 schema, defaults, validation, migration, storage adapter, high-score/stat helpers, import/export helpers.
- `src/runtime/shell.ts` - product shell state machine and shell actions.
- `src/runtime/inputBindings.ts` - action ids, binding types, default profiles, conflict detection, remapping helpers.
- `src/runtime/gamepad.ts` - Gamepad API polling and mapper functions.
- `src/runtime/pwa.ts` - service worker registration and runtime PWA state markers.
- `public/manifest.webmanifest` - install metadata for the static app.
- `public/service-worker.js` - manual offline shell/cache worker.
- Optional local audio files only if supplied locally: `public/audio/sfx/jump.mp3`, `public/audio/sfx/tongue.mp3`, `public/audio/sfx/catch.mp3`, `public/audio/sfx/miss.mp3`, `public/audio/sfx/splash.mp3`, `public/audio/sfx/power.mp3`, `public/audio/sfx/start.mp3`, `public/audio/sfx/pause.mp3`, `public/audio/sfx/results.mp3`, `public/audio/music/home-pond-loop.mp3`.
- `tests/unit/saveManager.test.ts`
- `tests/unit/runtimeShell.test.ts`
- `tests/unit/inputBindings.test.ts`
- `tests/unit/gamepadInput.test.ts`
- `tests/unit/pwaCache.test.ts`
- `tests/e2e/m26-shell.spec.ts`
- `tests/e2e/m26-persistence.spec.ts`
- `tests/e2e/m26-input.spec.ts`
- `tests/e2e/m26-audio.spec.ts`
- `tests/e2e/m26-pwa-offline.spec.ts`
- `tests/e2e/m26-accessibility.spec.ts`
- `tests/e2e/m26-performance.spec.ts`

### Modify

- `src/main.ts` - initialize SaveManager, merge saved settings with URL overrides, register PWA, start shell-aware runtime.
- `src/runtime/app.ts` - accept shell/save/input/audio/PWA services, own match lifecycle from shell actions, update stats/high scores exactly once.
- `src/runtime/dom.ts` - render splash/main menu/mode select/settings/high scores/gameplay/pause/results controls and state markers.
- `src/runtime/input.ts` - consume `inputBindings.ts` action state instead of hard-coded conditionals while preserving current defaults.
- `src/runtime/options.ts` - add persisted audio/input settings and helpers to merge defaults, save, and URL overrides.
- `src/runtime/params.ts` - keep smoke params and make URL options explicit one-load overrides.
- `src/runtime/audio.ts` - add buses, music/SFX registry, mono flag, missing-asset fallback, and persistent audio settings.
- `src/runtime/assets.ts` - export required cacheable asset paths for the service worker if needed.
- `src/game/types.ts` - add result/stat fields only if runtime cannot derive them without mutating simulation contracts.
- `src/game/match.ts` - add richer result summary helper only if needed for high scores.
- `src/game/update.ts` - expose completion transition cleanly if runtime needs an edge to update stats once.
- `src/style.css` - product shell layout, touch zones, focus, settings/results/high-score panels, responsive no-overlap constraints.
- `index.html` - link manifest, theme color, Apple/mobile metadata if needed.
- `playwright.config.ts` - add Chromium/Firefox/WebKit projects and make webServer port configurable to `5176`.
- `vitest.config.ts` - modify only if service worker unit tests require a separate include or environment.
- `package.json` and `package-lock.json` - modify only if adding `@axe-core/playwright`; avoid Howler and `vite-plugin-pwa` unless a later task explicitly accepts the dependency.
- `nginx.conf` - add no-cache handling for `service-worker.js` and manifest while preserving immutable build asset caching.
- `README.md` - update M2.6 controls, save behavior, shell flow, PWA/offline, verification, Docker/Coolify, and non-goals.
- `ASSET_MANIFEST.md` - record local audio placeholder paths/provenance if audio files are added; keep no-live-API notes.
- Existing unit tests under `tests/unit/*.test.ts` - update only where contracts intentionally expand.
- Existing E2E tests under `tests/e2e/*.spec.ts` - keep M0/M1/M2/M2.5 coverage green or explicitly update expected shell markers while preserving behavioral coverage.

## Task 1: Baseline Verification And Dirty Guard

**Files:**
- Read: `docs/superpowers/specs/2026-05-15-frogs-and-flies-m26-home-pond-product-foundation-design.md`
- Read: `package.json`
- Read: `playwright.config.ts`
- Read: `vitest.config.ts`
- Read: `Dockerfile`
- Read: `nginx.conf`
- Read: `README.md`
- Read: `ASSET_MANIFEST.md`

- [x] **Step 1: Confirm branch and worktree**

Run:

```bash
git branch --show-current
git status --short --branch
```

Expected: branch is `ff2-m0-pixijs`; status has no unrelated dirty files. If unrelated dirty files exist, stop and ask the owner before changing anything.

- [x] **Step 2: Confirm plan/spec alignment**

Run:

```bash
sed -n '1,220p' docs/superpowers/specs/2026-05-15-frogs-and-flies-m26-home-pond-product-foundation-design.md
sed -n '221,520p' docs/superpowers/specs/2026-05-15-frogs-and-flies-m26-home-pond-product-foundation-design.md
```

Expected: spec states the full product objective is not complete, M2.5 is only a deployed vertical slice, Option A is recommended, and the milestone is product foundation around Classic Single and Local Versus.

- [x] **Step 3: Confirm package scripts**

Run:

```bash
npm run
```

Expected: scripts include `build`, `test`, `test:unit`, `test:e2e`, `preview`, `start`, and `dev`.

- [x] **Step 4: Run baseline unit tests**

Run:

```bash
npm run test:unit
```

Expected: Vitest exits `0`; current baseline is 21 unit files and 81 tests passing. If the count changes because previous work landed, record the new count.

- [x] **Step 5: Run baseline build**

Run:

```bash
npm run build
```

Expected: `tsc && vite build` exits `0` and writes `dist/`. Do not commit generated `dist/`.

- [x] **Step 6: Check free ports**

Run:

```bash
lsof -iTCP:5176 -sTCP:LISTEN || true
lsof -iTCP:18080 -sTCP:LISTEN || true
```

Expected: no process is listening. If occupied, choose another explicit port and document it in the final verification notes.

- [x] **Step 7: Commit boundary**

Run:

```bash
git status --short
```

Expected: no source changes from baseline verification. Do not commit generated `dist/`, reports, or screenshots.

## Task 2: SaveManager v1

**Files:**
- Create: `src/runtime/save.ts`
- Create: `tests/unit/saveManager.test.ts`
- Modify: `src/runtime/options.ts`
- Modify: `src/runtime/params.ts`
- Modify later integration points only after unit green: `src/main.ts`, `src/runtime/app.ts`, `src/runtime/dom.ts`

- [x] **Step 1: Write failing default-save tests**

In `tests/unit/saveManager.test.ts`, add tests that import from `../../src/runtime/save` and assert:

```ts
expect(createDefaultSave().version).toBe(1)
expect(createDefaultSave().settings.difficulty).toBe('classic-standard')
expect(createDefaultSave().highScores.classicSingle).toEqual([])
expect(createDefaultSave().highScores.localVersus).toEqual([])
expect(createDefaultSave().stats.roundsStarted).toBe(0)
```

- [x] **Step 2: Run red SaveManager tests**

Run:

```bash
npm run test:unit -- tests/unit/saveManager.test.ts
```

Expected fail: module `../../src/runtime/save` does not exist.

- [x] **Step 3: Implement minimal SaveManager schema**

Create `src/runtime/save.ts` with:

- `SAVE_SCHEMA_VERSION = 1`
- `SAVE_STORAGE_KEY = 'frogs-and-flies.save.v1'`
- `SaveData`, `SaveSettings`, `InputProfile`, `InputBinding`, `ScoreEntry`, `AggregateStats`, and `SaveLoadStatus` types.
- `createDefaultSave(now?: () => string): SaveData`
- `createMemoryStorage(initial?: Record<string, string>): StorageLike` for tests.

The default schema must include:

```ts
settings: {
  difficulty: 'classic-standard',
  showTimer: true,
  reducedMotion: false,
  highContrast: false,
  mute: false,
  masterVolume: 1,
  sfxVolume: 1,
  musicVolume: 0.8,
  monoAudio: false,
  inputProfileId: 'default',
}
highScores: { classicSingle: [], localVersus: [] }
stats: {
  roundsStarted: 0,
  roundsCompleted: 0,
  totalCatches: 0,
  totalAttempts: 0,
  totalSplashes: 0,
  bestCombo: 0,
  totalPlaySeconds: 0,
}
```

- [x] **Step 4: Run green default-save tests**

Run:

```bash
npm run test:unit -- tests/unit/saveManager.test.ts
```

Expected pass: default schema tests pass.

- [x] **Step 5: Write failing storage resilience tests**

Add tests for:

- Missing key returns defaults with status `defaulted`.
- Invalid JSON returns defaults with status `invalid`.
- Unknown future version returns defaults with status `unsupported-version`.
- Unavailable storage does not throw and returns defaults with status `storage-unavailable`.
- Invalid primitive ranges are clamped or rejected to defaults.

- [x] **Step 6: Implement load, save, reset, validation, and migration switch**

In `src/runtime/save.ts`, implement:

- `createSaveManager(options?: { storage?: StorageLike; now?: () => string; onWarning?: (warning: SaveWarning) => void })`
- `load(): SaveLoadResult`
- `save(next: SaveData): SaveWriteResult`
- `reset(): SaveWriteResult`
- `migrate(raw: unknown): SaveData | undefined`
- Shape validation helpers for settings, profiles, high scores, and stats.

Use a version switch even though only v1 exists.

- [x] **Step 7: Run green storage resilience tests**

Run:

```bash
npm run test:unit -- tests/unit/saveManager.test.ts
```

Expected pass: invalid/unavailable storage never prevents boot defaults.

- [x] **Step 8: Write failing high-score and stats tests**

Add tests for:

- `recordRoundStarted(save, roundId)` increments once for a round id.
- `recordRoundCompleted(save, summary)` increments completed stats once for a round id.
- Classic Single high scores are sorted descending by score and capped to a small limit, for example 10.
- Local Versus records winner or `tie` without claiming global authority.
- Score entries include mode, difficulty, score, winner/player id, catches, attempts, accuracy, max combo, seed, completedAt, and duration seconds.

- [x] **Step 9: Implement high-score and stats helpers**

Add pure helpers in `src/runtime/save.ts`. Keep them independent from DOM and Pixi.

- [x] **Step 10: Write failing import/export tests**

Add tests for:

- `exportJson(save)` returns stable pretty JSON containing version and subdocuments.
- `importJson(json)` validates before accepting.
- Import rejects malformed JSON and unsupported versions.
- Import includes input profiles if implemented.

- [x] **Step 11: Implement import/export helpers**

Add `exportJson(save: SaveData): string` and `importJson(json: string): SaveImportResult`. UI controls for import/export are optional later, but these internal APIs must be tested.

- [x] **Step 12: Integrate settings defaults with runtime options**

Modify `src/runtime/options.ts` and `src/runtime/params.ts` so saved defaults can be merged before URL overrides. URL params must override saved settings for that page load, but must not rewrite saved settings until the user changes settings through UI.

- [x] **Step 13: Run focused SaveManager integration tests**

Run:

```bash
npm run test:unit -- tests/unit/saveManager.test.ts tests/unit/runtimeOptions.test.ts tests/unit/runtimeParams.test.ts
```

Expected pass: save tests and existing option/param tests pass.

- [x] **Step 14: Commit boundary**

Run:

```bash
git status --short
```

Expected: `src/runtime/save.ts`, `tests/unit/saveManager.test.ts`, and narrow runtime option/param changes only. Commit message: `feat: add m26 save manager foundation`.

## Task 3: Real Shell Flow Around Classic And Local Versus

**Files:**
- Create: `src/runtime/shell.ts`
- Create: `tests/unit/runtimeShell.test.ts`
- Create: `tests/e2e/m26-shell.spec.ts`
- Create: `tests/e2e/m26-persistence.spec.ts`
- Modify: `src/main.ts`
- Modify: `src/runtime/app.ts`
- Modify: `src/runtime/dom.ts`
- Modify: `src/runtime/options.ts`
- Modify: `src/runtime/params.ts`
- Modify: `src/runtime/save.ts`
- Modify: `src/game/match.ts` only if richer result summaries are needed.
- Modify: `src/game/types.ts` only if richer result types are needed.
- Modify: `src/style.css`

- [x] **Step 1: Write failing shell state tests**

In `tests/unit/runtimeShell.test.ts`, test:

- Initial state is `splash` or `main-menu` after boot readiness.
- `play` moves to `mode-select`.
- `selectMode('classic-single')` and `selectMode('local-versus')` are the only player-facing mode selections.
- `openSettings`, `openHighScores`, `startGameplay`, `pause`, `resume`, `showResults`, `replay`, and `mainMenu` transitions are valid.
- Invalid transitions return unchanged state or a typed error without throwing.

- [x] **Step 2: Run red shell state tests**

Run:

```bash
npm run test:unit -- tests/unit/runtimeShell.test.ts
```

Expected fail: `src/runtime/shell.ts` does not exist.

- [x] **Step 3: Implement pure shell state machine**

Create `src/runtime/shell.ts` with:

- `ShellScreen = 'splash' | 'main-menu' | 'mode-select' | 'settings' | 'high-scores' | 'gameplay' | 'pause' | 'results'`
- `ShellState`
- `ShellAction`
- `createInitialShellState`
- `reduceShellState`
- `getVisibleShellControls`

Keep this file DOM-free and Pixi-free.

- [x] **Step 4: Run green shell state tests**

Run:

```bash
npm run test:unit -- tests/unit/runtimeShell.test.ts
```

Expected pass: pure shell transitions pass.

- [x] **Step 5: Write failing shell E2E tests**

Create `tests/e2e/m26-shell.spec.ts` covering:

- Boot reaches `[data-testid="m26-shell"]` with `data-shell-screen`.
- Splash/main menu exposes native buttons for Play, Settings, High Scores.
- Mode select exposes Classic Single and Local Versus only.
- Settings screen exposes difficulty, timer, reduced motion, high contrast, audio controls, and input profile controls.
- Gameplay starts existing Home Pond match.
- Pause offers Resume, Restart, Settings, and Main Menu.
- Results show winner, scores, catches, attempts, accuracy, combo/high-score status, Replay, Change Mode, and Main Menu.
- High Scores uses local-only wording.

- [x] **Step 6: Run red shell E2E tests on port 5176**

Run:

```bash
npm run dev -- --host 127.0.0.1 --port 5176 --strictPort
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npx playwright test tests/e2e/m26-shell.spec.ts --project=chromium
```

Expected fail: M2.6 shell markers and screens do not exist yet.

- [x] **Step 7: Integrate shell in runtime and DOM**

Modify `src/main.ts`, `src/runtime/app.ts`, and `src/runtime/dom.ts` to:

- Load saved settings before runtime starts.
- Render product shell screens as native HTML controls.
- Keep gameplay canvas mounted without duplicating Pixi apps.
- Keep deterministic game simulation ignorant of shell navigation.
- Preserve existing M2.5 test ids where possible, or update tests intentionally.
- Add DOM state markers: `data-testid="m26-shell"`, `data-shell-screen`, `data-selected-mode`, `data-save-status`, `data-storage-available`, `data-round-recorded`.

- [x] **Step 8: Add results and high-score integration**

Modify runtime so a completed round updates high scores and stats exactly once. Use a round id such as `${mode}:${seed}:${startedAt}` or an internal monotonic runtime id. Results re-render must not double-write.

- [x] **Step 9: Add settings persistence UI hooks**

Settings changes persist immediately or through a small debounced save. Failed writes update non-blocking markers; gameplay must continue.

- [x] **Step 10: Write failing persistence E2E tests**

Create `tests/e2e/m26-persistence.spec.ts` covering:

- Change settings, reload, settings persist.
- URL params override saved settings for one load.
- Complete a short round, reload, high score remains.
- Results replay/change-mode does not duplicate stats.
- Local storage disabled through page init script still boots with defaults and marker.

- [x] **Step 11: Run green shell and persistence tests**

Run:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npx playwright test tests/e2e/m26-shell.spec.ts tests/e2e/m26-persistence.spec.ts --project=chromium
```

Expected pass: shell and persistence flows pass on Chromium.

- [x] **Step 12: Run focused unit tests**

Run:

```bash
npm run test:unit -- tests/unit/runtimeShell.test.ts tests/unit/saveManager.test.ts tests/unit/runtimeOptions.test.ts tests/unit/runtimeParams.test.ts tests/unit/matchModel.test.ts
```

Expected pass: shell/save integration does not break match model.

- [x] **Step 13: Commit boundary**

Run:

```bash
git status --short
```

Expected: shell runtime, save integration, shell/persistence tests, and CSS only. Commit message: `feat: add m26 product shell flow`.

## Task 4: Input Foundation

**Files:**
- Create: `src/runtime/inputBindings.ts`
- Create: `src/runtime/gamepad.ts`
- Create: `tests/unit/inputBindings.test.ts`
- Create: `tests/unit/gamepadInput.test.ts`
- Create: `tests/e2e/m26-input.spec.ts`
- Modify: `src/runtime/input.ts`
- Modify: `src/runtime/app.ts`
- Modify: `src/runtime/dom.ts`
- Modify: `src/runtime/save.ts`
- Modify: `src/style.css`
- Modify: `tests/unit/runtimeInput.test.ts`

- [ ] **Step 1: Write failing action registry tests**

In `tests/unit/inputBindings.test.ts`, assert action ids include:

- `p1.moveLeft`, `p1.moveRight`, `p1.chargeJump`, `p1.releaseJump`, `p1.tongue`
- `p2.moveLeft`, `p2.moveRight`, `p2.chargeJump`, `p2.releaseJump`, `p2.tongue`
- `ui.start`, `ui.pause`, `ui.confirm`, `ui.back`

Assert default keyboard bindings preserve:

- P1: `KeyA`, `KeyD`, `ArrowLeft`, `ArrowRight`, `Space`, `KeyT`
- P2: `KeyJ`, `KeyL`, `KeyI`, `KeyO`
- UI: `Enter`, `KeyP`

- [ ] **Step 2: Run red action registry tests**

Run:

```bash
npm run test:unit -- tests/unit/inputBindings.test.ts
```

Expected fail: `src/runtime/inputBindings.ts` does not exist.

- [ ] **Step 3: Implement input binding data model**

Create `src/runtime/inputBindings.ts` with:

- `InputActionId`
- `InputDeviceType = 'keyboard' | 'pointer' | 'touch' | 'gamepad'`
- `InputBinding`
- `InputProfile`
- `DEFAULT_INPUT_PROFILE`
- `createDefaultInputProfiles()`
- `normalizeBinding`
- `detectBindingConflict`
- `isBrowserReservedShortcut`
- `resetProfileToDefaults`

- [ ] **Step 4: Run green action registry tests**

Run:

```bash
npm run test:unit -- tests/unit/inputBindings.test.ts
```

Expected pass: action registry and defaults are data-driven.

- [ ] **Step 5: Write failing runtime mapper tests**

Extend `tests/unit/runtimeInput.test.ts` so keyboard state is converted through the default profile rather than hard-coded checks. Existing behavior must remain:

- P1 movement, jump charge/release, and tongue work.
- P2 controls work only in Local Versus.
- UI `Enter` and `KeyP` map to shell/runtime actions.
- Pointer input remains P1-only and compatible with current smoke behavior.

- [ ] **Step 6: Refactor runtime input through action state**

Modify `src/runtime/input.ts` to:

- Convert raw keyboard/pointer/touch/gamepad inputs to action state.
- Convert action state to game commands.
- Keep gameplay commands separate from UI shell actions.
- Preserve existing `applyRuntimeInput` and `applyRuntimePointerInput` compatibility if existing tests rely on them.

- [ ] **Step 7: Write failing gamepad mapper tests**

In `tests/unit/gamepadInput.test.ts`, test pure functions for:

- D-pad/left stick maps to P1 left/right.
- South button maps to jump/charge.
- East button or right trigger maps to tongue.
- Start/menu maps to pause.
- Dead zone prevents drift.
- Disconnected gamepad yields no actions.

- [ ] **Step 8: Implement gamepad polling foundation**

Create `src/runtime/gamepad.ts` with pure mapper helpers and a browser poller. Runtime must expose markers such as `data-gamepad-connected` and `data-active-input-device`. If CI cannot emulate gamepads, E2E should assert only marker behavior while unit tests cover mapper logic.

- [ ] **Step 9: Add touch zones**

Modify DOM/CSS to expose touch zones when touch mode is active:

- left
- right
- jump/charge
- tongue
- pause
- confirm

Touch zones must not break desktop pointer play or focus behavior.

- [ ] **Step 10: Add remapping UI**

Add settings UI to:

- Select input profile.
- Start remapping for an action.
- Reject conflicts or browser-reserved shortcuts.
- Reset to defaults.
- Persist selected profile and profiles through SaveManager.

- [ ] **Step 11: Write and run input E2E tests**

Create `tests/e2e/m26-input.spec.ts` covering keyboard defaults, pointer/touch zone markers, remap conflict, reset defaults, and persistence after reload.

Run:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npx playwright test tests/e2e/m26-input.spec.ts --project=chromium
```

Expected pass: input flows pass without adding a user account model.

- [ ] **Step 12: Run focused input unit tests**

Run:

```bash
npm run test:unit -- tests/unit/inputBindings.test.ts tests/unit/gamepadInput.test.ts tests/unit/runtimeInput.test.ts tests/unit/saveManager.test.ts
```

Expected pass: input foundation and persistence hooks pass.

- [ ] **Step 13: Commit boundary**

Run:

```bash
git status --short
```

Expected: input binding/gamepad/runtime input/save/shell/CSS/test files only. Commit message: `feat: add m26 input foundation`.

## Task 5: Audio v1 Pipeline

**Files:**
- Modify: `src/runtime/audio.ts`
- Modify: `src/runtime/options.ts`
- Modify: `src/runtime/save.ts`
- Modify: `src/runtime/app.ts`
- Modify: `src/runtime/dom.ts`
- Modify: `src/runtime/assets.ts` only if exporting audio path registry.
- Modify: `tests/unit/audioManager.test.ts`
- Create: `tests/e2e/m26-audio.spec.ts`
- Optional create only if local files are supplied: `public/audio/sfx/*.mp3`, `public/audio/music/home-pond-loop.mp3`
- Optional modify only if local files are added: `ASSET_MANIFEST.md`
- Avoid modifying: `package.json`, `package-lock.json` unless Howler is explicitly accepted.

- [ ] **Step 1: Record Web Audio vs Howler decision**

Run:

```bash
npm ls howler
npm run build
```

Expected: Howler is absent. Prefer current direct Web Audio because M2.6 can add buffers, buses, mono, unlock, and fallback without a runtime dependency. Do not install Howler unless this step is deliberately reversed with measured bundle impact.

- [ ] **Step 2: Write failing audio bus tests**

Extend `tests/unit/audioManager.test.ts` to cover:

- `masterVolume`, `sfxVolume`, `musicVolume` clamp to `0..1`.
- Muting master silences SFX and music.
- Mono flag is stored in audio state.
- Missing asset fallback uses procedural oscillator or no-op without throwing.
- Unlock remains gesture-driven.
- Queued SFX limit still applies.

- [ ] **Step 3: Run red audio bus tests**

Run:

```bash
npm run test:unit -- tests/unit/audioManager.test.ts
```

Expected fail: current manager has only `volume`, not buses/music/mono/local asset fallback.

- [ ] **Step 4: Implement Web Audio bus model**

Modify `src/runtime/audio.ts` to add:

- `AudioBusName = 'master' | 'sfx' | 'music' | 'ui'`
- `setMasterVolume`, `setSfxVolume`, `setMusicVolume`
- `setMonoAudio`
- `playMusic`, `stopMusic`
- Local asset registry support.
- Graceful fallback to procedural SFX when assets are missing or decoding fails.

- [ ] **Step 5: Define local audio placeholder registry**

Define registry paths without requiring generated/live API assets:

```ts
{
  sfx: {
    jump: ['/audio/sfx/jump.mp3'],
    tongue: ['/audio/sfx/tongue.mp3'],
    catch: ['/audio/sfx/catch.mp3'],
    miss: ['/audio/sfx/miss.mp3'],
    splash: ['/audio/sfx/splash.mp3'],
    power: ['/audio/sfx/power.mp3'],
    start: ['/audio/sfx/start.mp3'],
    pause: ['/audio/sfx/pause.mp3'],
    results: ['/audio/sfx/results.mp3'],
  },
  music: {
    homePondLoop: ['/audio/music/home-pond-loop.mp3'],
  },
}
```

If files are not present, tests should prove gameplay continues silently or procedurally. Do not make live OpenAI audio API calls.

- [ ] **Step 6: Persist audio settings**

Modify SaveManager/options/DOM so settings include mute, master volume, SFX volume, music volume, mono audio, and audio unlock state marker. Do not persist browser unlock itself as unlocked; persist only user preferences.

- [ ] **Step 7: Add audio E2E tests**

Create `tests/e2e/m26-audio.spec.ts` covering markers only, not audible output:

- Changing volumes updates DOM markers and persists after reload.
- Mono toggle persists.
- Missing optional audio files do not block gameplay.
- Unlock button reports available/unavailable state.

- [ ] **Step 8: Run focused audio tests**

Run:

```bash
npm run test:unit -- tests/unit/audioManager.test.ts tests/unit/saveManager.test.ts
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npx playwright test tests/e2e/m26-audio.spec.ts --project=chromium
```

Expected pass: audio unit and marker E2E tests pass.

- [ ] **Step 9: Optional local audio asset documentation**

If local audio files were added, update `ASSET_MANIFEST.md` with file paths, provenance, size, and explicit note that no live OpenAI audio API calls were made.

- [ ] **Step 10: Commit boundary**

Run:

```bash
git status --short
```

Expected: audio runtime/tests/settings/docs and optional local audio files only. Commit message: `feat: extend m26 audio pipeline`.

## Task 6: PWA And Static Deployment Hardening

**Files:**
- Create: `public/manifest.webmanifest`
- Create: `public/service-worker.js`
- Create: `src/runtime/pwa.ts`
- Create: `tests/unit/pwaCache.test.ts`
- Create: `tests/e2e/m26-pwa-offline.spec.ts`
- Modify: `src/main.ts`
- Modify: `src/runtime/app.ts` only for PWA state markers if needed.
- Modify: `src/runtime/dom.ts` only for PWA state markers if needed.
- Modify: `src/runtime/assets.ts`
- Modify: `index.html`
- Modify: `nginx.conf`
- Modify: `README.md`
- Avoid modifying: `package.json`, `package-lock.json` unless manual service worker proves insufficient and `vite-plugin-pwa` is explicitly accepted.

- [ ] **Step 1: Write failing manifest/offline tests**

Create `tests/e2e/m26-pwa-offline.spec.ts` covering:

- `/manifest.webmanifest` returns `200`.
- Manifest has name, short_name, description, start_url, display, theme_color, background_color, icons, and orientation preference.
- `/service-worker.js` returns `200` with JavaScript content type.
- First online load registers service worker or reports registration failure through a marker.
- Offline reload after first online load reaches shell.

- [ ] **Step 2: Run red PWA E2E tests**

Run against preview, not dev:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 5176 --strictPort
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npx playwright test tests/e2e/m26-pwa-offline.spec.ts --project=chromium
```

Expected fail: manifest and service worker do not exist.

- [ ] **Step 3: Add manifest**

Create `public/manifest.webmanifest`. Use existing `public/favicon.png` as an icon if no better icons exist. Keep metadata local and static.

- [ ] **Step 4: Link manifest and theme metadata**

Modify `index.html` to link the manifest and theme color.

- [ ] **Step 5: Write failing service worker unit tests**

Create `tests/unit/pwaCache.test.ts` for exported constants if using a generated module, or test a pure helper that returns cache lists:

- Cache name includes an M2.6 version.
- Cache list includes `/`, `/manifest.webmanifest`, required Home Pond asset paths, and optional audio paths only when present.
- Cross-origin URLs are rejected.

- [ ] **Step 6: Implement manual service worker**

Create `public/service-worker.js` with:

- A cache version constant.
- Install handler that caches app shell and same-origin required assets.
- Activate handler that deletes old caches.
- Fetch handler that does not cache cross-origin resources.
- Cache-first for immutable assets.
- Safe root fallback for offline shell.

Keep it simple and static. Prefer this over `vite-plugin-pwa`.

- [ ] **Step 7: Register service worker**

Create `src/runtime/pwa.ts` with `registerServiceWorker()` and state result markers. Modify `src/main.ts` or runtime startup to call it after boot. Registration failure must not block app boot.

- [ ] **Step 8: Update nginx caching**

Modify `nginx.conf` so `service-worker.js` and `manifest.webmanifest` are not served with long immutable caching. Keep hashed build assets and images cacheable.

- [ ] **Step 9: Run PWA/offline tests**

Run:

```bash
npm run test:unit -- tests/unit/pwaCache.test.ts
npm run build
npm run preview -- --host 127.0.0.1 --port 5176 --strictPort
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npx playwright test tests/e2e/m26-pwa-offline.spec.ts --project=chromium
```

Expected pass: manifest, service worker, and offline shell smoke pass.

- [ ] **Step 10: Run Docker static smoke**

Run:

```bash
docker build -t frogs-and-flies-m26-product-foundation .
docker run --rm --name frogs-and-flies-m26 -p 18080:80 frogs-and-flies-m26-product-foundation
```

In another terminal:

```bash
curl -I http://127.0.0.1:18080/
curl -I http://127.0.0.1:18080/manifest.webmanifest
curl -I http://127.0.0.1:18080/service-worker.js
curl -I http://127.0.0.1:18080/assets/home-pond-background.png
curl -I http://127.0.0.1:18080/assets/frog-p1-idle.png
curl -I http://127.0.0.1:18080/assets/fly-wing-a.png
```

Expected: `/`, manifest, service worker, and required assets return `200`. Service worker should have JavaScript content type. Use host `18080`; container port is `80`.

- [ ] **Step 11: Update Coolify docs**

Update `README.md` with:

- Build uses repository `Dockerfile`.
- Container port is `80`.
- Local host smoke should use `18080:80` if `8080` is occupied.
- Health check loads `/`.
- Verify manifest, service worker, required assets, and offline shell.
- No backend or analytics service is required.

- [ ] **Step 12: Commit boundary**

Run:

```bash
git status --short
```

Expected: manifest, service worker, PWA runtime, nginx, README, and PWA tests only. Commit message: `feat: add m26 pwa offline shell`.

## Task 7: Verification Upgrade

**Files:**
- Modify: `playwright.config.ts`
- Optional modify: `package.json`
- Optional modify: `package-lock.json`
- Create: `tests/e2e/m26-accessibility.spec.ts`
- Create: `tests/e2e/m26-performance.spec.ts`
- Modify or reuse: `tests/e2e/m26-shell.spec.ts`
- Modify or reuse: `tests/e2e/m26-pwa-offline.spec.ts`

- [ ] **Step 1: Add multi-browser Playwright projects**

Modify `playwright.config.ts` to:

- Keep `PLAYWRIGHT_BASE_URL` override support.
- Use port `5176` for the default webServer command.
- Add projects `chromium`, `firefox`, and `webkit` using Playwright devices.

Expected config command should be equivalent to:

```ts
command: 'npm run dev -- --host 127.0.0.1 --port 5176 --strictPort'
url: 'http://127.0.0.1:5176'
```

- [ ] **Step 2: Run browser install check**

Run:

```bash
npx playwright install --dry-run
```

Expected: command lists browser install targets without changing source. If browsers are missing locally/CI, install them using the project-standard method and document it.

- [ ] **Step 3: Run Chromium, Firefox, and WebKit shell smoke**

Run:

```bash
npx playwright test tests/e2e/m26-shell.spec.ts --project=chromium
npx playwright test tests/e2e/m26-shell.spec.ts --project=firefox
npx playwright test tests/e2e/m26-shell.spec.ts --project=webkit
```

Expected: all supported browser projects pass. If a browser is unsupported in the environment, document the blocker with exact error output.

- [ ] **Step 4: Decide axe-core dependency**

If automated accessibility audit is accepted, run:

```bash
npm install -D @axe-core/playwright
```

Expected: `package.json` and `package-lock.json` update with dev dependency only.

If dependency is rejected, do not edit package files; instead document a manual accessibility gate in `README.md` and keep semantic/focus E2E checks.

- [ ] **Step 5: Write accessibility E2E tests**

Create `tests/e2e/m26-accessibility.spec.ts`:

- If `@axe-core/playwright` is installed, run axe on main menu, settings, gameplay shell, pause, results, and high scores.
- Assert no serious/critical violations.
- Always assert native controls have accessible names and focus order works.
- Keep canvas limitations explicit.

- [ ] **Step 6: Run accessibility tests**

Run:

```bash
npx playwright test tests/e2e/m26-accessibility.spec.ts --project=chromium
```

Expected pass: accessibility shell audit passes, or manual fallback checks pass if axe was not accepted.

- [ ] **Step 7: Upgrade screenshot/no-overlap coverage**

Extend E2E helpers to cover:

- splash/menu
- settings
- gameplay
- pause
- results
- high scores

Viewports:

- `390x844`
- `800x600`
- `1024x768`
- `1366x768`
- `1920x1080`

Expected: visible text and controls do not overlap or leave viewport; canvas remains nonblank.

- [ ] **Step 8: Add small performance smoke**

Create `tests/e2e/m26-performance.spec.ts` with loose thresholds:

- Shell boot marker appears within 3000 ms on local/CI.
- Starting a short deterministic round does not emit uncaught console errors.
- No single interaction produces an extreme long task if browser exposes long-task entries.
- Bundle or static asset size increases are logged if practical; do not fail on small expected changes.

- [ ] **Step 9: Run verification E2E set**

Run:

```bash
npx playwright test tests/e2e/m26-shell.spec.ts tests/e2e/m26-persistence.spec.ts tests/e2e/m26-input.spec.ts tests/e2e/m26-audio.spec.ts tests/e2e/m26-pwa-offline.spec.ts tests/e2e/m26-accessibility.spec.ts tests/e2e/m26-performance.spec.ts
```

Expected pass: all M2.6 Playwright tests pass across configured projects or unsupported browser blockers are documented.

- [ ] **Step 10: Commit boundary**

Run:

```bash
git status --short
```

Expected: Playwright config, verification E2E tests, optional axe dependency files, and docs if manual audit fallback was chosen. Commit message: `test: upgrade m26 product verification`.

## Task 8: Documentation And Update Gates

**Files:**
- Modify: `README.md`
- Modify: `ASSET_MANIFEST.md` only if audio assets were added.
- Modify: `docs/superpowers/specs/2026-05-15-frogs-and-flies-m26-home-pond-product-foundation-design.md` only if implementation discovered a required spec correction and owner agrees.
- Read: `docs/superpowers/plans/2026-05-15-frogs-and-flies-m26-home-pond-product-foundation-implementation.md`

- [ ] **Step 1: Update README current milestone language**

Document that M2.6 is a local product foundation around the M2.5 Home Pond Classic vertical slice, not the finished full product.

- [ ] **Step 2: Update controls and shell docs**

Document:

- Splash/main menu/mode select/settings/high scores/gameplay/pause/results flow.
- Classic Single and Local Versus only.
- Keyboard defaults.
- Pointer/touch zones.
- Gamepad foundation if implemented or mapper-only limitation if deferred.
- Remapping and reset defaults.

- [ ] **Step 3: Update save/privacy docs**

Document:

- Save key `frogs-and-flies.save.v1`.
- Settings, input profiles, high scores, and local stats stored locally.
- Import/export scope.
- No backend, account, cloud save, analytics, or online leaderboard.

- [ ] **Step 4: Update audio docs**

Document:

- Web Audio v1 decision unless Howler was explicitly accepted.
- Mute, master/SFX/music volumes, mono audio, unlock behavior.
- Local authored placeholder paths.
- Missing audio fallback.
- No live OpenAI audio API calls.

- [ ] **Step 5: Update PWA/Docker/Coolify docs**

Document:

- Manifest and service worker paths.
- Offline shell behavior.
- Docker container port `80`.
- Host port `18080` when `8080` is occupied.
- Required smoke URLs and expected `200` responses.

- [ ] **Step 6: Update asset manifest if audio assets exist**

If any `public/audio/**` files were added, update `ASSET_MANIFEST.md` with:

- path
- provenance
- file size
- format
- local-only note
- no-live-API note

If no audio files were added, do not edit `ASSET_MANIFEST.md` only to mention placeholders.

- [ ] **Step 7: Run README documentation tests**

Run:

```bash
npm run test:unit -- tests/unit/readmeControls.test.ts
```

Expected pass: README tests reflect current controls and verification docs. If tests are too M2-specific, update them intentionally.

- [ ] **Step 8: Commit boundary**

Run:

```bash
git status --short
```

Expected: README, readme tests, and optional asset manifest only. Commit message: `docs: document m26 product foundation`.

## Task 9: Final Local, Docker, Production Smoke, And Scope Guard

**Files:**
- Read/verify: all changed files.
- Modify only if a final gate fails: task-owned implementation/test/doc files from previous tasks.

- [ ] **Step 1: Run full unit suite**

Run:

```bash
npm run test:unit
```

Expected: all Vitest tests pass.

- [ ] **Step 2: Run full E2E suite**

Run:

```bash
npm run test:e2e
```

Expected: all configured Playwright projects pass. If WebKit/Firefox cannot run in the environment, record blocker and prove Chromium passes.

- [ ] **Step 3: Run full test suite**

Run:

```bash
npm test
```

Expected: unit and E2E suites pass.

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build exit `0`.

- [ ] **Step 5: Run production preview smoke on 5176**

Run:

```bash
npm run preview -- --host 127.0.0.1 --port 5176 --strictPort
```

In another terminal:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npx playwright test tests/e2e/m26-shell.spec.ts tests/e2e/m26-pwa-offline.spec.ts --project=chromium
```

Expected: preview serves production build and smoke tests pass.

- [ ] **Step 6: Build Docker image**

Run:

```bash
docker build -t frogs-and-flies-m26-product-foundation .
```

Expected: Docker build exits `0`.

- [ ] **Step 7: Run Docker production smoke**

Run:

```bash
docker run --rm --name frogs-and-flies-m26 -p 18080:80 frogs-and-flies-m26-product-foundation
```

In another terminal:

```bash
curl -I http://127.0.0.1:18080/
curl -I http://127.0.0.1:18080/manifest.webmanifest
curl -I http://127.0.0.1:18080/service-worker.js
curl -I http://127.0.0.1:18080/assets/home-pond-background.png
PLAYWRIGHT_BASE_URL=http://127.0.0.1:18080 npx playwright test tests/e2e/m26-shell.spec.ts tests/e2e/m26-pwa-offline.spec.ts --project=chromium
```

Expected: static production smoke passes on host port `18080`.

- [ ] **Step 8: Run scope exclusion search**

Run:

```bash
rg -n "campaign|biome|boss|leaderboard|backend|account|cloud save|networking|analytics|monetization|shop|payment|ads|advertising|Spine|TexturePacker|OPENAI_API_KEY|images\\.generate|audio\\.speech|responses\\.create" src tests public README.md ASSET_MANIFEST.md docs/superpowers/specs docs/superpowers/plans package.json
```

Expected: matches are only non-goal/future-scope/documentation references. No implementation surface exists for excluded systems.

- [ ] **Step 9: Run live-network/API guard**

Run:

```bash
rg -n "fetch\\(|XMLHttpRequest|WebSocket|EventSource|navigator\\.sendBeacon|OPENAI_API_KEY|api\\.openai\\.com" src public tests scripts package.json
```

Expected: no runtime live network/API dependency for boot, assets, audio, saves, settings, leaderboard, analytics, or shell. Service worker same-origin fetch handling is acceptable.

- [ ] **Step 10: Inspect final dirty state**

Run:

```bash
git status --short
```

Expected: only intentional M2.6 files changed. No `dist/`, `test-results/`, `playwright-report/`, or generated screenshots are staged unless explicitly intended.

- [ ] **Step 11: Final commit boundary**

Run:

```bash
git add <intentional M2.6 files only>
git commit -m "feat: complete m26 product foundation"
```

Expected: commit contains only intentional M2.6 implementation, tests, and docs.

## Acceptance Checklist

- [ ] The implementation and docs state that the full product objective is not complete and M2.5 is only a deployed vertical slice.
- [ ] SaveManager v1 persists settings, high scores, aggregate local stats, schema version, and migration/default behavior.
- [ ] SaveManager handles unavailable storage, invalid data, unknown versions, export, and import according to implementation scope.
- [ ] The app has splash or boot state, main menu, mode select, settings, high scores, gameplay, pause, and results.
- [ ] Classic Single and Local Versus remain the only player-facing gameplay modes.
- [ ] Results update high scores and stats exactly once per completed round.
- [ ] Input is modeled through named actions, default bindings, conflict-aware remapping, and SaveManager persistence hooks.
- [ ] Keyboard and pointer/touch remain functional.
- [ ] Gamepad mapping foundation exists or is explicitly deferred with tested mapper boundaries and markers.
- [ ] Audio v1 decision is recorded as Web Audio or Howler, with measured tradeoffs if adding a dependency.
- [ ] Authored local SFX/music placeholder paths are defined without live network/API calls.
- [ ] Audio has master/SFX/music volume concepts, mute, mono flag, unlock behavior, and graceful missing-audio fallback.
- [ ] PWA manifest and service worker/offline shell are implemented and smoke-tested.
- [ ] Docker/nginx and Coolify static deployment notes are updated for manifest, service worker, assets, and offline shell checks.
- [ ] Multi-browser Playwright shell/gameplay smoke passes or unsupported browser blockers are documented.
- [ ] Axe-core or equivalent shell accessibility audit passes for serious/critical issues if package/setup is accepted.
- [ ] Screenshot/no-overlap checks cover shell states and common viewports.
- [ ] A small performance smoke runs with clear, loose thresholds.
- [ ] `npm run build`, focused unit tests, Playwright tests, full test, and Docker/static smoke pass before completion is claimed.
- [ ] No campaign, extra biomes, bosses, online leaderboard, backend, analytics, monetization, shop, payments, ads, final Spine/TexturePacker pipeline, or live OpenAI image/audio API calls are introduced.
