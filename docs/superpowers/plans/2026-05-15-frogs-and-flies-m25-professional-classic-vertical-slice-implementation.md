# Frogs and Flies M2.5 Professional Classic Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox syntax for tracking. If using eliteteams, each stage should be assigned to a focused specialist worker and consolidated before moving to the next stage.

**Goal:** Turn the M2 Classic Match alpha into a professional Home Pond Classic vertical slice with side-lily staging, readable jump/tongue play, richer generated assets, audio/options/accessibility polish, deterministic tests, and deployment verification.

**Architecture:** Keep the existing PixiJS/Vite/TypeScript runtime split: deterministic gameplay authority remains in `src/game/**`, browser lifecycle and DOM controls remain in `src/runtime/**`, and Pixi projection remains in `src/render/**`. Add narrow M2.5 contracts around arena anchors, player phases, difficulty/options, asset manifest loading, and audio state instead of introducing campaign, scene-router, backend, or progression systems.

**Tech Stack:** TypeScript, PixiJS v8, Vite, Vitest, Playwright, Web Audio API or Howler.js after bundle review, generated/processed PNG assets, Docker/nginx, Coolify static container deployment.

## Scope Guard

Implement exactly one polished Classic Home Pond match. Do not add campaign, biomes beyond Home Pond, bosses, survival/time attack, achievements, skins, leaderboard, monetization, accounts, analytics submission, shop links, or portal SDKs.

Do not make live OpenAI API calls during implementation. The asset task should use already generated local sources, checked-in stand-ins, manual image processing, or generated-image files supplied by a human.

## Current File Structure Map

### Existing Runtime Shape

- `src/game/types.ts` already defines `MatchMode`, `PlayerId`, `MatchPlayerState`, `GameState`, jump/tongue/water phases, and M2 compatibility aliases.
- `src/game/createGame.ts` creates a two-player match with 180-second default timing.
- `src/game/match.ts` creates P1/P2 rosters and result summaries.
- `src/game/player.ts` creates center-spawned player state; M2.5 should move this to side-lily anchors.
- `src/game/systems/input.ts` currently applies generic left/right movement.
- `src/game/systems/coreFeel.ts` currently owns compact jump/tongue/water stand-ins.
- `src/game/systems/collision.ts` currently uses catch-radius fly collection.
- `src/game/systems/spawn.ts` currently spawns flies from the top with fixed bands.
- `src/runtime/params.ts` parses seed, mode, smoke state, duration, THE END duration, and simulation speed.
- `src/runtime/dom.ts` builds the HTML shell, HUD, mode controls, results, and test markers.
- `src/runtime/input.ts` maps keyboard/pointer input to per-player commands.
- `src/runtime/assets.ts` loads the four M2 generated assets.
- `src/runtime/app.ts` wires DOM, Pixi app, fixed-step update, asset loading, input, and render sync.
- `src/render/scene.ts`, `src/render/entities.ts`, `src/render/effects.ts`, and `src/render/palette.ts` project simulation state into Pixi.
- `ASSET_MANIFEST.md` documents generated assets and post-processing.

### Create

- `src/game/arena.ts` - Home Pond side-lily anchors, fly bands, named arena constants, landing zones.
- `src/game/difficulty.ts` - Classic Assist/Standard/Expert option definitions and deterministic option helpers.
- `src/game/tongue.ts` - directional tongue segment/cone helpers and collision math.
- `src/game/replay.ts` - short deterministic scripted replay helper for unit tests.
- `src/runtime/options.ts` - URL/options parsing, defaults, and local UI state projection.
- `src/runtime/audio.ts` - autoplay-safe audio manager, mute/volume state, optional SFX loading/fallback.
- `tests/unit/arenaSideLily.test.ts`
- `tests/unit/jumpArc.test.ts`
- `tests/unit/tongueCollision.test.ts`
- `tests/unit/difficultyOptions.test.ts`
- `tests/unit/runtimeOptions.test.ts`
- `tests/unit/audioManager.test.ts`
- `tests/unit/deterministicReplay.test.ts`
- `tests/e2e/m25-classic-vertical-slice.spec.ts`

### Modify

- `src/game/types.ts` - add `FacingDirection`, `PlayerPhase`, `DifficultyMode`, `ClassicOptions`, lily anchor fields, tongue timing/range fields, player-facing markers, and event markers as needed.
- `src/game/constants.ts` - add named M2.5 constants for lily anchors, jump timing, splash recovery, tongue range/window, fly bands, and difficulty defaults.
- `src/game/createGame.ts` - accept options/difficulty and create anchored Classic players.
- `src/game/match.ts` - create side-lily P1/P2 identities and preserve local-versus/CPU control sources.
- `src/game/player.ts` - create anchored players with facing, home lily, phase, jump/tongue defaults, and per-player state.
- `src/game/ai.ts` - use the staged jump/tongue model for CPU and AI takeover.
- `src/game/systems/input.ts` - convert raw commands into charge/release/jump intent without free horizontal walking.
- `src/game/systems/coreFeel.ts` - update jump, splash, recovery, and tongue phase timing.
- `src/game/systems/collision.ts` - use directional tongue collision and auto-assist rules.
- `src/game/systems/movement.ts` - preserve entity movement and add jump arc/player position update if split from `coreFeel.ts`.
- `src/game/systems/spawn.ts` - spawn flies inside difficulty fly bands with deterministic motion.
- `src/game/systems/timer.ts` - keep day/dusk/night/THE END markers compatible with new visuals.
- `src/runtime/params.ts` - parse difficulty/options/smoke controls.
- `src/runtime/dom.ts` - add professional setup/options/audio/accessibility controls and markers.
- `src/runtime/input.ts` - preserve P1/P2 keyboard controls and add option toggles only through DOM buttons.
- `src/runtime/app.ts` - wire options, audio unlock, restart/replay, and render markers.
- `src/runtime/assets.ts` - load expanded M2.5 asset manifest with graceful fallback.
- `src/render/scene.ts` - render lily staging, firefly/THE END treatment, high contrast, reduced motion markers.
- `src/render/entities.ts` - render facing frogs, animation stand-ins, fly frames, directional tongue visuals.
- `src/render/effects.ts` - render splash/catch/score/firefly glow with reduced-motion support.
- `src/render/palette.ts` - tune day/dusk/night Home Pond palette.
- `src/style.css` - desktop shell, controls, focus states, responsive no-overlap guardrails.
- `ASSET_MANIFEST.md` - update M2.5 inventory, provenance, processing commands, and no-live-API note.
- `README.md` - update controls, options, smoke params, audio unlock, and deploy verification.
- Existing unit tests under `tests/unit/*.test.ts` - update only where old center-spawn/catch-radius assumptions are intentionally replaced.
- Existing E2E tests under `tests/e2e/*.spec.ts` - keep M0/M1/M2 smoke intent while updating selectors/markers affected by M2.5.

### Asset Paths Likely To Create

- `public/assets/home-pond-background.png`
- `public/assets/lily-left.png`
- `public/assets/lily-right.png`
- `public/assets/frog-p1-idle.png`
- `public/assets/frog-p1-crouch.png`
- `public/assets/frog-p1-airborne.png`
- `public/assets/frog-p1-tongue.png`
- `public/assets/frog-p1-splash.png`
- `public/assets/frog-p2-idle.png`
- `public/assets/frog-p2-crouch.png`
- `public/assets/frog-p2-airborne.png`
- `public/assets/frog-p2-tongue.png`
- `public/assets/frog-p2-splash.png`
- `public/assets/fly-wing-a.png`
- `public/assets/fly-wing-b.png`
- `public/assets/firefly-end.png`
- `public/assets/splash-ring.png`
- `public/assets/catch-pop.png`
- `public/assets/tongue-flash.png`
- Optional audio: `public/audio/jump.*`, `public/audio/tongue.*`, `public/audio/catch.*`, `public/audio/miss.*`, `public/audio/splash.*`, `public/audio/power.*`, `public/audio/start.*`, `public/audio/the-end.*`

### M2.5 Asset Source And Processing Map

Use this exact local asset pipeline unless a human supplies equivalent already-generated PNGs before Task 6 starts. Live OpenAI API calls are forbidden.

Create source stand-ins under `public/assets/source/m25/` and a local renderer at `scripts/build-m25-assets.mjs`. The renderer must use the already-installed Playwright Chromium browser to open each SVG source and save transparent PNG screenshots for sprite assets; it must not require network access, new npm packages, or OpenAI credentials.

| Output asset | Required source file | Dimensions | Transparency | Expected content |
| --- | --- | --- | --- | --- |
| `public/assets/home-pond-background.png` | `public/assets/source/m25/home-pond-background.svg` | `1600x1200` | opaque | Home Pond background with water, reeds, and readable play area. |
| `public/assets/lily-left.png` | `public/assets/source/m25/lily-left.svg` | `256x192` | transparent | Left staging lily, oriented toward center. |
| `public/assets/lily-right.png` | `public/assets/source/m25/lily-right.svg` | `256x192` | transparent | Right staging lily, oriented toward center. |
| `public/assets/frog-p1-idle.png` | `public/assets/source/m25/frog-p1-idle.svg` | `256x256` | transparent | P1 frog idle, facing right, blue-green identity accents. |
| `public/assets/frog-p1-crouch.png` | `public/assets/source/m25/frog-p1-crouch.svg` | `256x256` | transparent | P1 frog compressed jump-charge pose, facing right. |
| `public/assets/frog-p1-airborne.png` | `public/assets/source/m25/frog-p1-airborne.svg` | `256x256` | transparent | P1 frog airborne pose, facing right. |
| `public/assets/frog-p1-tongue.png` | `public/assets/source/m25/frog-p1-tongue.svg` | `256x256` | transparent | P1 frog tongue pose, facing right; tongue may be partial because runtime draws final tongue line. |
| `public/assets/frog-p1-splash.png` | `public/assets/source/m25/frog-p1-splash.svg` | `256x256` | transparent | P1 frog splash/recovery silhouette, facing right. |
| `public/assets/frog-p2-idle.png` | `public/assets/source/m25/frog-p2-idle.svg` | `256x256` | transparent | P2 frog idle, facing left, amber-green identity accents. |
| `public/assets/frog-p2-crouch.png` | `public/assets/source/m25/frog-p2-crouch.svg` | `256x256` | transparent | P2 frog compressed jump-charge pose, facing left. |
| `public/assets/frog-p2-airborne.png` | `public/assets/source/m25/frog-p2-airborne.svg` | `256x256` | transparent | P2 frog airborne pose, facing left. |
| `public/assets/frog-p2-tongue.png` | `public/assets/source/m25/frog-p2-tongue.svg` | `256x256` | transparent | P2 frog tongue pose, facing left; tongue may be partial because runtime draws final tongue line. |
| `public/assets/frog-p2-splash.png` | `public/assets/source/m25/frog-p2-splash.svg` | `256x256` | transparent | P2 frog splash/recovery silhouette, facing left. |
| `public/assets/fly-wing-a.png` | `public/assets/source/m25/fly-wing-a.svg` | `96x96` | transparent | Readable fly with wings up. |
| `public/assets/fly-wing-b.png` | `public/assets/source/m25/fly-wing-b.svg` | `96x96` | transparent | Same fly silhouette with wings down. |
| `public/assets/firefly-end.png` | `public/assets/source/m25/firefly-end.svg` | `128x128` | transparent | Warm THE END firefly glow sprite. |
| `public/assets/splash-ring.png` | `public/assets/source/m25/splash-ring.svg` | `192x192` | transparent | Expanding water ring effect. |
| `public/assets/catch-pop.png` | `public/assets/source/m25/catch-pop.svg` | `128x128` | transparent | Small catch burst/pop effect. |
| `public/assets/tongue-flash.png` | `public/assets/source/m25/tongue-flash.svg` | `128x64` | transparent | Short tongue highlight/flash effect. |

Required Task 6 processing commands:

- Create directories: `mkdir -p public/assets/source/m25 test-results/m25-assets`
- Render PNGs from SVG sources: `node scripts/build-m25-assets.mjs`
  - Expected pass: command exits `0`, prints one `wrote public/assets/...png` line for each asset in the table, and prints no network/API messages.
- Check output inventory: `test $(find public/assets -maxdepth 1 -type f -name '*.png' | rg -c 'home-pond-background|lily-left|lily-right|frog-p1-|frog-p2-|fly-wing-|firefly-end|splash-ring|catch-pop|tongue-flash') -eq 19`
  - Expected pass: command exits `0`.
- Check dimensions and transparency: `node scripts/build-m25-assets.mjs --check`
  - Expected pass: command exits `0`, verifies every required file exists at the dimensions in the table, reports `opaque` only for `home-pond-background.png`, and reports `transparent` for the other 18 PNGs.
- Check no live OpenAI dependency: `rg -n "OPENAI_API_KEY|image_gen|responses\\.create|images\\.generate|api\\.openai\\.com" scripts public/assets/source ASSET_MANIFEST.md`
  - Expected: no matches in `scripts/**` or `public/assets/source/**`; `ASSET_MANIFEST.md` may contain only the explicit no-live-API note.

### Do Not Modify Unless Explicitly Needed

- `package.json` and `package-lock.json` unless choosing Howler.js after measuring bundle impact and adding an explicit dependency task.
- `Dockerfile`, `nginx.conf`, `vite.config.ts`, `vitest.config.ts`, and `playwright.config.ts` unless a verification task proves they block M2.5.
- `dist/**` should remain build output only.

## Commands And Expected Outputs

- Baseline status: `git status --short`
  - Expected clean: no output.
  - Expected dirty: list existing files; stop and coordinate if changes overlap M2.5-owned paths.
- Build: `npm run build`
  - Expected pass: output includes `tsc && vite build` and exits `0`.
- Unit: `npm run test:unit`
  - Expected pass: output includes `vitest run` and all unit tests passing.
- E2E: `npm run test:e2e`
  - Expected pass: output includes `playwright test` and all browser tests passing.
- Full test: `npm test`
  - Expected pass: runs unit then E2E and exits `0`.
- Docker: `docker build -t frogs-and-flies-m25-classic-vertical-slice .`
  - Expected pass: reaches final image export and exits `0`.
- Production preview: `npm run build && npm run preview -- --host 127.0.0.1 --port 4173`
  - Expected pass: preview serves `/` and Playwright can load `http://127.0.0.1:4173`.

## Implementation Tasks

### Task 1: Baseline Verification And Dirty-Worktree Guard

**Files:**
- Read only: all repo files.

- [x] **Step 1: Confirm current branch and dirty files**

Run: `git status --short`

Expected clean: no output.

Expected dirty: output lists changed files. If any dirty file is in `src/**`, `tests/**`, `public/**`, `ASSET_MANIFEST.md`, `README.md`, or `docs/**`, inspect ownership before editing and do not overwrite unrelated work.

- [x] **Step 2: Confirm current scripts**

Run: `cat package.json`

Expected: scripts include `build`, `test`, `test:unit`, `test:e2e`, `preview`, and `start`.

- [x] **Step 3: Run baseline build**

Run: `npm run build`

Expected pass: command exits `0`.

- [x] **Step 4: Run baseline unit tests**

Run: `npm run test:unit`

Expected pass: command exits `0`.

- [x] **Step 5: Run baseline E2E tests**

Run: `npm run test:e2e`

Expected pass: command exits `0`.

- [x] **Step 6: Record baseline if anything is already failing**

If any baseline command fails, create a short note in the implementation summary before changing production behavior. Do not mask baseline failures by loosening M2.5 tests.

- [x] **Step 7: Commit boundary**

Run: `git status --short`

Expected: no implementation changes yet. Do not commit this baseline-only task unless repository policy requires a baseline note.

### Task 2: Classic Side-Lily Arena And Player State

**Files:**
- Create: `src/game/arena.ts`
- Create: `tests/unit/arenaSideLily.test.ts`
- Modify: `src/game/types.ts`
- Modify: `src/game/constants.ts`
- Modify: `src/game/player.ts`
- Modify: `src/game/match.ts`
- Modify: `src/game/createGame.ts`
- Modify: `src/runtime/dom.ts`
- Modify: `tests/unit/matchModel.test.ts`
- Modify: `tests/unit/localVersus.test.ts`

- [x] **Step 1: Write failing side-lily tests**

Add `tests/unit/arenaSideLily.test.ts` with assertions that `createGame({ seed: 25, mode: 'classic-single' })` creates P1 on a left lily, P2/CPU on a right lily, distinct facing directions, home lily ids, stable landing radius, and mirrored labels/control sources.

Required assertions:

```ts
expect(game.players[0].id).toBe('p1')
expect(game.players[0].state.homeLilyId).toBe('left')
expect(game.players[0].state.facing).toBe('right')
expect(game.players[0].state.x).toBeLessThan(game.constants.arenaWidth / 2)
expect(game.players[1].state.homeLilyId).toBe('right')
expect(game.players[1].state.facing).toBe('left')
expect(game.players[1].state.x).toBeGreaterThan(game.constants.arenaWidth / 2)
expect(game.players[0].state.phase).toBe('staged')
expect(game.players[1].state.phase).toBe('staged')
```

- [x] **Step 2: Run red test**

Run: `npm run test:unit -- tests/unit/arenaSideLily.test.ts`

Expected fail: TypeScript or assertion failure for missing `homeLilyId`, `facing`, `phase`, or left/right anchor behavior.

- [x] **Step 3: Add arena model**

Create `src/game/arena.ts` with named Home Pond anchors:

```ts
export const HOME_POND_LILIES = {
  left: { id: 'left', x: 128, y: 500, landingRadius: 62 },
  right: { id: 'right', x: 672, y: 500, landingRadius: 62 },
} as const
```

Add helper functions for `homeLilyForPlayer('p1' | 'p2')`, `facingForPlayer`, and fly band defaults.

- [x] **Step 4: Extend types and constants minimally**

Add `FacingDirection = 'left' | 'right'`, `HomeLilyId = 'left' | 'right'`, `PlayerPhase = 'staged' | 'charging' | 'airborne' | 'splashing' | 'recovering'`, and fields on `PlayerState` for `homeLilyId`, `facing`, `phase`, `homeX`, `homeY`, and `landingRadius`.

- [x] **Step 5: Implement anchored player factories**

Update `createPlayerState`/`createPlayer` to accept `PlayerId`, set P1/P2 anchors, and keep `game.player` aliased to `game.players[0].state` for existing M2 compatibility.

- [x] **Step 6: Add DOM markers**

Expose `data-p1-home-lily`, `data-p2-home-lily`, `data-p1-facing`, `data-p2-facing`, `data-p1-phase`, and `data-p2-phase` on existing HUD/state markers in `src/runtime/dom.ts`.

- [x] **Step 7: Run green side-lily tests**

Run: `npm run test:unit -- tests/unit/arenaSideLily.test.ts tests/unit/matchModel.test.ts tests/unit/localVersus.test.ts`

Expected pass: all listed files pass and exit `0`.

- [x] **Step 8: Commit boundary**

Run: `git status --short`

Expected: only files from this task are changed. Commit message: `feat: anchor classic players on side lilies`.

### Task 3: Lily-Based Jump Arc Model

**Files:**
- Create: `tests/unit/jumpArc.test.ts`
- Modify: `src/game/types.ts`
- Modify: `src/game/constants.ts`
- Modify: `src/game/player.ts`
- Modify: `src/game/systems/input.ts`
- Modify: `src/game/systems/coreFeel.ts`
- Modify: `src/game/systems/movement.ts`
- Modify: `src/runtime/input.ts`
- Modify: `src/render/entities.ts`
- Modify: `tests/unit/m1ClassicCoreFeel.test.ts`
- Modify: `tests/unit/runtimeInput.test.ts`

- [x] **Step 1: Write failing jump arc tests**

Add tests for charge, release, airborne arc, landing on home lily, and splash/recovery on missed landing. Use fixed `STEP = 1 / 60`.

Required scenarios:

```ts
// short tap creates a shorter jump than a max charge
// P1 starts staged, chargeJump moves to charging, releaseJump moves to airborne
// during airborne, y rises above homeY and x moves in facing direction
// after landing within lily radius, phase returns to staged
// forced x outside landing radius triggers splashing, combo reset, then recovering/staged
```

- [x] **Step 2: Run red jump tests**

Run: `npm run test:unit -- tests/unit/jumpArc.test.ts`

Expected fail: missing horizontal arc/phase/landing behavior or assertions fail against the compact M2 jump stand-in.

- [x] **Step 3: Replace free walking with jump intent**

Update `src/game/systems/input.ts` so horizontal keys affect `jump.intentX` or `jump.arcDirection` while staged/charging, not continuous free walking across the arena. Preserve pointer support as a test-only/manual assist by mapping pointer side to jump intent and tongue.

- [x] **Step 4: Implement named jump constants**

Add constants for min/max charge, min/max jump duration, min/max horizontal travel, arc height, landing tolerance, splash duration, recovery duration, and easy-assist forgiveness. Keep values in `src/game/constants.ts`.

- [x] **Step 5: Implement deterministic arc updates**

Update `coreFeel.ts` or move player arc updates into `movement.ts`: charge accumulates, release computes deterministic duration/height/travel, airborne position follows a named parabola, landing resolves to staged if inside lily tolerance, otherwise splash/recovery returns to home lily.

- [x] **Step 6: Render phase stand-ins**

Update `src/render/entities.ts` so staged, charging, airborne, splashing, and recovering have visible pose/scale/offset differences even before final assets land.

- [x] **Step 7: Run green jump tests**

Run: `npm run test:unit -- tests/unit/jumpArc.test.ts tests/unit/m1ClassicCoreFeel.test.ts tests/unit/runtimeInput.test.ts`

Expected pass: all listed files pass and exit `0`.

- [x] **Step 8: Commit boundary**

Run: `git status --short`

Expected: only jump/model/render files from this task plus related tests. Commit message: `feat: model classic side-lily jump arcs`.

### Task 4: Directional Tongue Timing, Range, And Collision Model

**Files:**
- Create: `src/game/tongue.ts`
- Create: `tests/unit/tongueCollision.test.ts`
- Modify: `src/game/types.ts`
- Modify: `src/game/constants.ts`
- Modify: `src/game/systems/collision.ts`
- Modify: `src/game/systems/coreFeel.ts`
- Modify: `src/game/ai.ts`
- Modify: `src/render/entities.ts`
- Modify: `src/render/effects.ts`
- Modify: `tests/unit/scoringPower.test.ts`
- Modify: `tests/unit/cpuTakeover.test.ts`

- [x] **Step 1: Write failing tongue collision tests**

Add `tests/unit/tongueCollision.test.ts` for these cases:

```ts
// ready tongue fires only when ready
// tongue active window lasts 150-300 ms
// fly directly forward inside range is caught
// fly behind frog is not caught
// fly outside segment/capsule width is not caught
// miss increments attempts/misses and resets combo
// catch increments score/catches/combo and removes only one fly
```

- [x] **Step 2: Run red tongue tests**

Run: `npm run test:unit -- tests/unit/tongueCollision.test.ts`

Expected fail: missing `src/game/tongue.ts` or current catch-radius behavior catches behind/out-of-cone flies.

- [x] **Step 3: Implement pure directional helpers**

Create `src/game/tongue.ts` with deterministic helpers such as `tongueOriginForPlayer`, `tongueSegmentForPlayer`, `isEntityInTongueRange`, and `findFirstTongueHit`. Use no `Math.random()` and no wall-clock time.

- [x] **Step 4: Add tongue timing state**

Extend tongue state with `activeSeconds`, `recoverySeconds`, `range`, `width`, `originX`, `originY`, `tipX`, `tipY`, and `autoFired` if needed. Active target: 0.15-0.30 seconds; recovery target: short but visible.

- [x] **Step 5: Update collision and scoring**

Change `updateCollision` so tongue input starts an active tongue if ready, checks directional hit while active, records catch/miss once per attempt, and keeps Rush scoring compatible.

- [x] **Step 6: Keep AI/takeover on the same model**

Update `src/game/ai.ts` so CPU and AI takeover issue the same charge/release/tongue commands as human-controlled players and never bypass directional collision.

- [x] **Step 7: Render attached tongue**

Render the tongue from the frog mouth/facing side to `tipX/tipY`; add catch/miss color treatment and reduced-motion-friendly effect hooks.

- [x] **Step 8: Run green tongue tests**

Run: `npm run test:unit -- tests/unit/tongueCollision.test.ts tests/unit/scoringPower.test.ts tests/unit/cpuTakeover.test.ts`

Expected pass: all listed files pass and exit `0`.

- [x] **Step 9: Commit boundary**

Run: `git status --short`

Expected: only tongue/collision/AI/render files plus tests. Commit message: `feat: add directional classic tongue timing`.

### Task 5: Fly Bands, Difficulty Options, And Options UI

**Files:**
- Create: `src/game/difficulty.ts`
- Create: `src/runtime/options.ts`
- Create: `tests/unit/difficultyOptions.test.ts`
- Create: `tests/unit/runtimeOptions.test.ts`
- Modify: `src/game/types.ts`
- Modify: `src/game/constants.ts`
- Modify: `src/game/createGame.ts`
- Modify: `src/game/systems/spawn.ts`
- Modify: `src/game/systems/collision.ts`
- Modify: `src/runtime/params.ts`
- Modify: `src/runtime/dom.ts`
- Modify: `src/runtime/app.ts`
- Modify: `src/style.css`
- Modify: `README.md`

- [x] **Step 1: Write failing difficulty tests**

Add tests that `classic-assist`, `classic-standard`, and optional `classic-expert` produce deterministic fly bands, auto-tongue settings, and jump forgiveness.

Required assertions:

```ts
expect(getClassicDifficulty('classic-assist').flyBand.maxY).toBeLessThan(getClassicDifficulty('classic-standard').flyBand.maxY)
expect(getClassicDifficulty('classic-assist').autoTongue).toBe(true)
expect(getClassicDifficulty('classic-standard').autoTongue).toBe(false)
```

- [x] **Step 2: Write failing runtime options tests**

Add tests that URL params parse `difficulty=classic-assist`, `reducedMotion=1`, `highContrast=1`, `showTimer=0`, `mute=1`, and `volume=0.35` into stable defaults and clamps.

- [x] **Step 3: Run red options tests**

Run: `npm run test:unit -- tests/unit/difficultyOptions.test.ts tests/unit/runtimeOptions.test.ts`

Expected fail: missing `difficulty.ts`, `options.ts`, or params fields.

- [x] **Step 4: Implement difficulty model**

Create `src/game/difficulty.ts` with named, typed definitions. Keep defaults to `classic-standard`; include `classic-assist` and add `classic-expert` only if it remains a small constant-table variation.

- [x] **Step 5: Apply difficulty to spawn and assist**

Update `createGame` and `spawn.ts` so fly y ranges, spawn rate adjustments, and auto-tongue eligibility use options from game state. Keep spawns seeded and deterministic.

- [x] **Step 6: Implement options parser**

Create `src/runtime/options.ts`; update `src/runtime/params.ts` so runtime params carry game options without breaking existing M2 params.

- [x] **Step 7: Add options UI controls**

Update `src/runtime/dom.ts` and `src/style.css` with semantic controls and test ids:

- `difficulty-classic-assist`
- `difficulty-classic-standard`
- `difficulty-classic-expert` if implemented
- `option-show-timer`
- `option-reduced-motion`
- `option-high-contrast`
- `option-mute`
- `option-volume`

Use `aria-pressed`, `aria-checked`, or native form controls with visible focus states.

- [x] **Step 8: Run green options tests**

Run: `npm run test:unit -- tests/unit/difficultyOptions.test.ts tests/unit/runtimeOptions.test.ts tests/unit/spawn.test.ts`

Expected pass: all listed files pass and exit `0`.

- [x] **Step 9: Commit boundary**

Run: `git status --short`

Expected: only difficulty/options files plus tests and docs. Commit message: `feat: expose classic difficulty options`.

### Task 6: Generated/Processed Asset Expansion And Animation Stand-Ins

**Files:**
- Modify: `ASSET_MANIFEST.md`
- Modify: `src/runtime/assets.ts`
- Modify: `src/render/scene.ts`
- Modify: `src/render/entities.ts`
- Modify: `src/render/effects.ts`
- Modify: `tests/unit/renderLayers.test.ts`
- Modify: `tests/unit/renderEffects.test.ts`
- Modify: `tests/e2e/m25-classic-vertical-slice.spec.ts`
- Create likely: `public/assets/home-pond-background.png`
- Create likely: `public/assets/lily-left.png`
- Create likely: `public/assets/lily-right.png`
- Create likely: `public/assets/frog-p1-idle.png`
- Create likely: `public/assets/frog-p1-crouch.png`
- Create likely: `public/assets/frog-p1-airborne.png`
- Create likely: `public/assets/frog-p1-tongue.png`
- Create likely: `public/assets/frog-p1-splash.png`
- Create likely: `public/assets/frog-p2-idle.png`
- Create likely: `public/assets/frog-p2-crouch.png`
- Create likely: `public/assets/frog-p2-airborne.png`
- Create likely: `public/assets/frog-p2-tongue.png`
- Create likely: `public/assets/frog-p2-splash.png`
- Create likely: `public/assets/fly-wing-a.png`
- Create likely: `public/assets/fly-wing-b.png`
- Create likely: `public/assets/firefly-end.png`
- Create likely: `public/assets/splash-ring.png`
- Create likely: `public/assets/catch-pop.png`
- Create likely: `public/assets/tongue-flash.png`
- Create: `public/assets/source/m25/home-pond-background.svg`
- Create: `public/assets/source/m25/lily-left.svg`
- Create: `public/assets/source/m25/lily-right.svg`
- Create: `public/assets/source/m25/frog-p1-idle.svg`
- Create: `public/assets/source/m25/frog-p1-crouch.svg`
- Create: `public/assets/source/m25/frog-p1-airborne.svg`
- Create: `public/assets/source/m25/frog-p1-tongue.svg`
- Create: `public/assets/source/m25/frog-p1-splash.svg`
- Create: `public/assets/source/m25/frog-p2-idle.svg`
- Create: `public/assets/source/m25/frog-p2-crouch.svg`
- Create: `public/assets/source/m25/frog-p2-airborne.svg`
- Create: `public/assets/source/m25/frog-p2-tongue.svg`
- Create: `public/assets/source/m25/frog-p2-splash.svg`
- Create: `public/assets/source/m25/fly-wing-a.svg`
- Create: `public/assets/source/m25/fly-wing-b.svg`
- Create: `public/assets/source/m25/firefly-end.svg`
- Create: `public/assets/source/m25/splash-ring.svg`
- Create: `public/assets/source/m25/catch-pop.svg`
- Create: `public/assets/source/m25/tongue-flash.svg`
- Create: `scripts/build-m25-assets.mjs`

- [x] **Step 1: Write failing asset-load E2E assertions**

In `tests/e2e/m25-classic-vertical-slice.spec.ts`, add a test that loads `/?seed=25&durationSeconds=3&theEndSeconds=0.1`, waits for `game-canvas`, and expects `data-assets-loaded` to contain `home-pond-background.png`, `lily-left.png`, `lily-right.png`, `frog-p1-idle.png`, `frog-p2-idle.png`, `fly-wing-a.png`, and `firefly-end.png`.

- [x] **Step 2: Run red asset E2E test**

Run: `npm run test:e2e -- tests/e2e/m25-classic-vertical-slice.spec.ts`

Expected fail: missing test ids or `data-assets-loaded` does not include expanded M2.5 paths.

- [x] **Step 3: Add or process assets without live API calls**

Use the exact `M2.5 Asset Source And Processing Map` above.

If no human-supplied PNGs are present, create the 19 hand-authored SVG stand-ins under `public/assets/source/m25/` with the exact source filenames in the table, then create `scripts/build-m25-assets.mjs` to rasterize them locally through Playwright Chromium screenshots.

Run:

`mkdir -p public/assets/source/m25 test-results/m25-assets`

`node scripts/build-m25-assets.mjs`

Expected pass: command exits `0`, writes the 19 PNG outputs listed in the map, prints one `wrote public/assets/...png` line per file, and performs no network calls.

If human-supplied PNGs are used instead, place them at the exact `public/assets/*.png` output paths in the table, still create or keep source/provenance notes in `ASSET_MANIFEST.md`, and still run `node scripts/build-m25-assets.mjs --check`.

- [x] **Step 4: Update asset manifest**

Document each M2.5 asset path from the table, its exact source path or supplied-file provenance, prompt if available, local processing command, dimensions, transparency status, and file-size note. Add an explicit line: `No live OpenAI API calls were made during M2.5 implementation.`

Run:

`node scripts/build-m25-assets.mjs --check`

Expected pass: all 19 required PNGs exist, dimensions match the table, `home-pond-background.png` is opaque, the other 18 assets have alpha transparency, and each file is recorded in `ASSET_MANIFEST.md`.

- [x] **Step 5: Update runtime asset loader**

Expand `GENERATED_GAMEPLAY_ASSET_PATHS` and `GeneratedGameplayAssets` in `src/runtime/assets.ts`. Keep graceful fallback if any optional visual fails; core gameplay must remain playable.

- [x] **Step 6: Wire animation stand-ins**

Render frog idle/crouch/airborne/tongue/splash by player phase, deterministic fly wing frames from entity id plus simulation elapsed, splash/catch/tongue sprites or procedural fallback, and firefly/THE END visual treatment.

- [x] **Step 7: Visual QA generated asset set**

Start preview-quality local rendering:

`npm run build`

`npm run preview -- --host 127.0.0.1 --port 4173`

In a second terminal, capture the asset scene:

`npx playwright screenshot "http://127.0.0.1:4173/?seed=25&durationSeconds=3&theEndSeconds=0.1&simulationSpeed=10" test-results/m25-assets/classic-assets.png --viewport-size=1366,768`

Then run:

`test -s test-results/m25-assets/classic-assets.png`

Expected pass: screenshot exists at `test-results/m25-assets/classic-assets.png`, is non-empty, shows the Home Pond background, both side lilies, both frogs using player-specific sprites, at least one fly sprite, and no broken-image placeholders or blank canvas.

Manual visual gate: open `test-results/m25-assets/classic-assets.png` and confirm sprites are not cropped incorrectly, transparent PNGs do not show solid boxes, P1 faces right, P2 faces left, and HUD/controls do not cover the side-lily staging area at `1366x768`.

- [x] **Step 8: Run focused render tests**

Run: `npm run test:unit -- tests/unit/renderLayers.test.ts tests/unit/renderEffects.test.ts`

Expected pass: render layer/effect contracts pass and exit `0`.

- [x] **Step 9: Run green asset E2E**

Run: `npm run test:e2e -- tests/e2e/m25-classic-vertical-slice.spec.ts`

Expected pass: expanded assets load, `data-assets-loaded` includes the required asset filenames from Step 1, canvas is visible, and test exits `0`.

- [x] **Step 10: Commit boundary**

Run: `git status --short`

Expected: asset PNGs, asset SVG sources, `scripts/build-m25-assets.mjs`, manifest, loader, render, focused render tests, and asset E2E only. Commit message: `feat: expand home pond vertical slice assets`.

### Task 7: Audio Baseline With Mute, Volume, And Autoplay-Safe Unlock

**Files:**
- Create: `src/runtime/audio.ts`
- Create: `tests/unit/audioManager.test.ts`
- Modify: `src/runtime/app.ts`
- Modify: `src/runtime/dom.ts`
- Modify: `src/runtime/options.ts`
- Modify: `src/game/types.ts`
- Modify: `src/game/update.ts`
- Modify: `src/game/systems/coreFeel.ts`
- Modify: `src/game/systems/collision.ts`
- Modify: `src/style.css`
- Modify: `README.md`
- Optional create: `public/audio/*.wav` or `public/audio/*.mp3`
- Optional modify: `package.json`, `package-lock.json` only if adding Howler.js.

- [x] **Step 1: Decide Web Audio vs Howler**

Run: `npm ls howler`

Expected if absent: command exits non-zero or reports empty. Prefer direct Web Audio API unless Howler is explicitly chosen with dependency update and bundle impact noted.

- [x] **Step 2: Write failing audio unit tests**

Add `tests/unit/audioManager.test.ts` with mocked `AudioContext` or a no-audio adapter. Cover initial locked state, unlock on explicit gesture, mute toggle, volume clamp, SFX event queue, and no throw when audio context creation fails.

- [x] **Step 3: Run red audio tests**

Run: `npm run test:unit -- tests/unit/audioManager.test.ts`

Expected fail: missing `src/runtime/audio.ts`.

- [x] **Step 4: Implement audio manager**

Create `src/runtime/audio.ts` with `createAudioManager`, `unlock`, `setMuted`, `setVolume`, `playSfx`, and state markers. Playback failure must not throw into gameplay.

- [x] **Step 5: Emit gameplay audio events**

Add narrow event names for `jump`, `tongue`, `catch`, `miss`, `splash`, `power`, `start`, `pause`, `resume`, `the-end`, and `results`. Consume them in runtime after each update.

- [x] **Step 6: Add audio UI**

Add `data-testid="audio-unlock"`, `data-testid="option-mute"`, and `data-testid="option-volume"` controls. Reflect `data-audio-unlocked`, `data-audio-muted`, and `data-audio-volume` markers.

- [x] **Step 7: Run green audio tests**

Run: `npm run test:unit -- tests/unit/audioManager.test.ts tests/unit/runtimeOptions.test.ts`

Expected pass: all listed tests pass and exit `0`.

- [x] **Step 8: Commit boundary**

Run: `git status --short`

Expected: audio runtime, tests, UI, optional small audio assets, docs. Commit message: `feat: add autoplay-safe classic audio baseline`.

### Task 8: Accessibility And Desktop UX Polish

**Files:**
- Modify: `src/runtime/dom.ts`
- Modify: `src/runtime/app.ts`
- Modify: `src/render/scene.ts`
- Modify: `src/render/entities.ts`
- Modify: `src/render/effects.ts`
- Modify: `src/style.css`
- Modify: `tests/e2e/m25-classic-vertical-slice.spec.ts`
- Modify: `README.md`

- [x] **Step 1: Write failing accessibility/UX E2E tests**

Add tests that verify keyboard focus order reaches mode, difficulty, start, pause, mute, volume, and replay controls; selected controls expose accessible pressed/checked state; reduced motion and high contrast update DOM/canvas markers; and `game-canvas` has an accessible label.

- [x] **Step 2: Add responsive no-overlap screenshot checks**

In the same E2E file, test viewports `800x600`, `1024x768`, `1366x768`, `1920x1080`, and `390x844`. Use locator bounding boxes for HUD/controls/canvas/results and assert visible controls do not overlap canvas-critical jump band or each other.

- [x] **Step 3: Run red UX E2E tests**

Run: `npm run test:e2e -- tests/e2e/m25-classic-vertical-slice.spec.ts`

Expected fail: missing option markers, focus states, or no-overlap constraints.

- [x] **Step 4: Implement semantic shell polish**

Use native buttons/inputs where possible, visible focus styles, stable labels, `aria-live` only for low-frequency state/results, and no diagnostic-looking primary UI text. Keep test markers as attributes.

- [x] **Step 5: Implement reduced-motion/high-contrast behavior**

Reduced motion should soften/disallow screen shake, heavy bobbing, pulsing glows, and rapid flashes. High contrast should improve frog/fly/tongue/lily outlines and avoid hue-only player identity.

- [x] **Step 6: Tune responsive CSS**

Ensure text fits buttons and panels, controls wrap predictably, HUD avoids the primary jump arc/fly bands, and results remain readable at all required viewports.

- [x] **Step 7: Run green UX E2E tests**

Run: `npm run test:e2e -- tests/e2e/m25-classic-vertical-slice.spec.ts`

Expected pass: M2.5 UX tests pass and exit `0`.

- [x] **Step 8: Commit boundary**

Run: `git status --short`

Expected: DOM/render/CSS/E2E/docs only. Commit message: `feat: polish classic desktop accessibility`.

### Task 9: E2E And Production Smoke For Classic Vertical Slice

**Files:**
- Create: `src/game/replay.ts`
- Create: `tests/unit/deterministicReplay.test.ts`
- Modify: `tests/e2e/m25-classic-vertical-slice.spec.ts`
- Modify: `tests/e2e/m2-classic-match.spec.ts`
- Modify: `src/runtime/params.ts`
- Modify: `src/runtime/app.ts`
- Modify: `README.md`

- [x] **Step 1: Write failing deterministic replay test**

Add `tests/unit/deterministicReplay.test.ts` that runs the same seed/options/input script twice and expects identical event sequence, final scores, winner, catches, attempts, and time-of-day transitions.

- [x] **Step 2: Run red replay test**

Run: `npm run test:unit -- tests/unit/deterministicReplay.test.ts`

Expected fail: missing replay helper or mismatch from non-deterministic systems.

- [x] **Step 3: Implement scripted replay helper**

Create `src/game/replay.ts` for tests only or pure simulation utility. It should drive fixed-step updates with a deterministic command script and collect a compact summary.

- [x] **Step 4: Remove nondeterminism**

Audit spawn, AI, assist, fly movement, animation frame selection, and collision tie-breaks. Replace any gameplay-affecting `Math.random()` or wall-clock dependency with seeded PRNG or simulation elapsed time.

- [x] **Step 5: Expand Classic E2E coverage**

In `m25-classic-vertical-slice.spec.ts`, cover:

- Classic Single starts P1 left and CPU/P2 right.
- Local Versus exposes two human players.
- Short seeded round reaches THE END and results.
- Day, dusk, night, and THE END markers appear.
- Generated assets load and remain visible.
- Audio unlock/mute UI state changes without audible assertions.
- Reduced motion and high contrast markers/styles update.
- Replay restarts with same seed/options.

- [x] **Step 6: Run focused green replay/unit tests**

Run: `npm run test:unit -- tests/unit/deterministicReplay.test.ts tests/unit/prng.test.ts tests/unit/spawn.test.ts`

Expected pass: all listed tests pass and exit `0`.

- [x] **Step 7: Run focused E2E**

Run: `npm run test:e2e -- tests/e2e/m25-classic-vertical-slice.spec.ts tests/e2e/m2-classic-match.spec.ts`

Expected pass: both E2E files pass and exit `0`.

- [ ] **Step 8: Production preview smoke**

Run: `npm run build && npm run preview -- --host 127.0.0.1 --port 4173`

Expected: Vite preview starts and serves `http://127.0.0.1:4173`. In a second terminal, run the E2E command against preview if Playwright config supports it, or manually smoke:

- Start Classic Single.
- Trigger jump/tongue catch and miss.
- Pause/resume.
- Toggle mute/volume.
- Toggle reduced motion/high contrast.
- Switch Local Versus.
- Force short result with `/?durationSeconds=3&theEndSeconds=0.1&simulationSpeed=20`.
- Replay.

- [ ] **Step 9: Commit boundary**

Run: `git status --short`

Expected: deterministic replay, E2E, params/app/docs only. Commit message: `test: cover m25 classic vertical slice smoke`.

### Task 10: Docker And Coolify Deploy Verification

**Files:**
- Modify: `README.md`
- Modify only if required by failing verification: `Dockerfile`, `nginx.conf`, `.dockerignore`

- [x] **Step 1: Build production app**

Run: `npm run build`

Expected pass: `tsc && vite build` exits `0`.

- [x] **Step 2: Build Docker image**

Run: `docker build -t frogs-and-flies-m25-classic-vertical-slice .`

Expected pass: Docker reaches final export and exits `0`.

- [x] **Step 3: Run Docker container locally**

Run: `docker run --rm -p 18080:80 frogs-and-flies-m25-classic-vertical-slice` because local `8080` is occupied by `bpm-backend`.

Expected: container serves nginx on `http://127.0.0.1:18080`.

- [x] **Step 4: Smoke Docker-served build**

Run in another terminal if Playwright base URL can be overridden:

`PLAYWRIGHT_BASE_URL=http://127.0.0.1:18080 npm run test:e2e -- tests/e2e/m25-classic-vertical-slice.spec.ts`

Expected pass: M2.5 E2E file passes against Docker-served production build. If config does not support `PLAYWRIGHT_BASE_URL`, perform the manual smoke from Task 9 against `http://127.0.0.1:18080`.

- [x] **Step 5: Document Coolify verification**

Update `README.md` with exact Coolify checks:

- Build pack/image uses repo `Dockerfile`.
- Published port is `80`.
- Health check loads `/`.
- Manual smoke URL uses `?durationSeconds=3&theEndSeconds=0.1&simulationSpeed=20`.
- Verify assets under `/assets/...` and optional audio under `/audio/...` return `200`.

- [x] **Step 6: Commit boundary**

Run: `git status --short`

Expected: README plus Docker/nginx only if required. Commit message: `docs: add m25 deploy verification`.

### Task 11: Final Review And Summary Gates

**Files:**
- Read/verify: all changed files.
- Modify only if review finds issues: task-owned files.

- [x] **Step 1: Run full unit suite**

Run: `npm run test:unit`

Expected pass: all unit tests pass and exit `0`.

- [x] **Step 2: Run full E2E suite**

Run: `npm run test:e2e`

Expected pass: all Playwright tests pass and exit `0`.

- [x] **Step 3: Run full test suite**

Run: `npm test`

Expected pass: unit and E2E suites pass and exit `0`.

- [x] **Step 4: Run production build**

Run: `npm run build`

Expected pass: TypeScript and Vite build pass and exit `0`.

- [x] **Step 5: Run Docker build**

Run: `docker build -t frogs-and-flies-m25-classic-vertical-slice .`

Expected pass: Docker build exits `0`.

- [x] **Step 6: Inspect final dirty state**

Run: `git status --short`

Expected: only intentional M2.5 implementation files changed.

- [x] **Step 7: Review scope exclusions**

Run: `rg -n "campaign|boss|leaderboard|monetization|shop|\bads?\b|advertising|payment|account|analytics" src tests README.md ASSET_MANIFEST.md`

Expected: no new implemented feature surface for excluded systems. Documentation mentions are acceptable only as non-goals or future scope.

- [x] **Step 8: Review asset/API guard**

Run: `rg -n "OPENAI_API_KEY|image_gen|responses\\.create|images\\.generate|live OpenAI" . --glob '!node_modules/**' --glob '!dist/**'`

Expected: no runtime or script requirement for live OpenAI image calls. `ASSET_MANIFEST.md` may include the explicit no-live-API note.

- [x] **Step 9: Prepare implementation summary**

Summarize:

- Side-lily arena/player state changes.
- Jump/tongue model changes.
- Difficulty/options/audio/accessibility changes.
- Asset manifest additions.
- Tests and deploy gates run with pass/fail status.
- Known limitations intentionally deferred outside M2.5.

- [x] **Step 10: Final commit boundary**

Run: `git status --short`

Expected: all intended changes committed or clearly listed for handoff according to repository policy. Suggested final commit message if needed: `feat: complete m25 classic vertical slice`.

## Acceptance Checklist

- [x] Classic Single is a 180-second Home Pond match with P1 on the left lily and CPU/P2 on the right lily.
- [x] Local Versus uses the same side-lily arena with two human-controlled frogs.
- [x] Player state includes lily anchor, facing, phase, jump state, tongue state, splash/recovery, and deterministic stats.
- [x] Jump charge and arc behavior are tunable through named constants and covered by unit tests.
- [x] Tongue firing is directional, visually attached to the frog, and covered by catch/miss/recovery tests.
- [x] Classic Assist and Classic Standard are exposed in UI and tests; Classic Expert is included only if it remains a constant-table extension.
- [x] Fly bands and assist behavior are deterministic and option-driven.
- [x] Home Pond assets expand beyond the four M2 images and `ASSET_MANIFEST.md` records provenance and local processing.
- [x] No live OpenAI API calls are required or made for asset generation during implementation.
- [x] Audio unlock, mute, and volume state exist and gameplay continues if audio fails.
- [x] Reduced motion and high contrast/enhanced outline options affect runtime presentation.
- [x] Desktop UI has semantic controls, visible focus, clean pause/results/replay, and no primary diagnostic-looking shell.
- [x] HUD/results text does not overlap at `800x600`, `1024x768`, `1366x768`, `1920x1080`, and `390x844`.
- [x] Same seed/options/input script produces identical replay summary in automated tests.
- [x] Playwright covers Classic Single, Local Versus, short result, assets, audio UI, options, and responsive layout.
- [x] `npm run build`, `npm run test:unit`, `npm run test:e2e`, `npm test`, and Docker build pass.
- [x] Docker/Coolify verification notes are current.
- [x] No campaign, extra biomes, bosses, leaderboard, monetization, or unrelated runtime rewrite is introduced.
