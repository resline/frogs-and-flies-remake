# Frogs and Flies M2 Classic Match Alpha Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox syntax for tracking.

**Goal:** Turn the current M1 PixiJS slice into a 180-second Classic Match alpha with Classic Single, Local Versus, CPU play, AI takeover, per-player scoring/results, explicit runtime/render boundaries, visible feedback effects, updated controls documentation, and deployment verification.

**Architecture:** Keep PixiJS, Vite, TypeScript, and the deterministic fixed-step simulation. Move boot/lifecycle, asset loading, input collection, HUD sync, render layers, and render adapters out of `src/main.ts`; keep gameplay authority in `src/game/*` modules that can be unit-tested without Pixi or DOM. Represent the match as a roster of players with explicit control sources, per-player commands/stats, deterministic CPU commands, simulation-owned match results, and renderer-owned non-authoritative effects.

**Tech Stack:** TypeScript, PixiJS v8, Vite, Vitest, Playwright, Docker/nginx, Coolify static container deployment.

## Current Repo Context

- `src/main.ts` currently owns boot, DOM creation, Pixi app setup, asset loading, input handling, fixed-step ticker wiring, smoke query parsing, HUD markers, and rendering.
- `src/game/createGame.ts` creates a single-player 60-second `GameState`.
- `src/game/types.ts` models one `player`, one `score`, one `combo`, one `power`, one `water`, and one command bag.
- `src/game/update.ts` applies commands, updates single-player gameplay systems, then updates timer.
- `src/game/systems/*` contain deterministic simulation systems for input, collision/scoring, movement, spawn, power, timer, and core feel.
- `tests/unit/*` cover PRNG, fixed step, spawn, scoring/power, game state, and M1 core feel.
- `tests/e2e/m0-smoke.spec.ts` and `tests/e2e/m1-smoke.spec.ts` cover current runtime markers, canvas rendering, controls, smoke states, and M1 feel.
- `README.md` documents current M0/M1 controls and smoke parameters.

## File Structure Map

Implementation workers should use this ownership map. Paths are expected; adjust only if a worker proves an existing local pattern makes a different name safer.

### Create

- `src/runtime/app.ts` - Pixi application lifecycle, resize, ticker binding, teardown.
- `src/runtime/assets.ts` - generated gameplay asset loading and fallback state.
- `src/runtime/dom.ts` - DOM shell, controls, HUD/result elements, stable test hooks.
- `src/runtime/input.ts` - keyboard/pointer command collection, per-player human-input stamps, mode/pause/replay commands.
- `src/runtime/params.ts` - URL/runtime parameter parsing for seed, mode, smoke state, elapsed time, duration overrides, and test acceleration hooks.
- `src/runtime/layers.ts` - named Pixi containers for `background`, `gameplay`, `effects`, and `ui`.
- `src/render/scene.ts` - scene creation and high-level render sync entry point.
- `src/render/entities.ts` - frog/entity sprite or procedural rendering.
- `src/render/effects.ts` - catch pop, score float, tongue feedback, splash/miss, dusk/night tint, and end flourish.
- `src/render/palette.ts` - time-of-day palette helpers.
- `src/game/match.ts` - match creation helpers, mode transitions, result calculation, player roster helpers.
- `src/game/player.ts` - player state factory and per-player command/stat helpers.
- `src/game/ai.ts` - deterministic CPU decisions and AI takeover decisions.
- `tests/unit/runtimeParams.test.ts` - runtime parameter parsing and smoke/test hook coverage.
- `tests/unit/matchModel.test.ts` - 180-second match model, per-player score/stats/results.
- `tests/unit/cpuTakeover.test.ts` - CPU opponent and AI takeover threshold/restoration.
- `tests/unit/localVersus.test.ts` - human-vs-human mode and non-overlapping command ownership.
- `tests/unit/renderLayers.test.ts` - layer names/order and effect projection contracts.
- `tests/e2e/m2-classic-match.spec.ts` - Classic Single, Local Versus, HUD markers, results, pause/replay, visual layer/effect smoke flows.

### Modify

- `src/main.ts` - reduce to boot entry: import CSS, parse params, locate `#app`, call runtime start, report missing mount errors.
- `src/game/types.ts` - add match mode, player id, player roster, player commands, control source, CPU state, stats, results, effects/events, and compatibility aliases only where needed during migration.
- `src/game/constants.ts` - change default round duration to 180 and add AI takeover threshold constants.
- `src/game/createGame.ts` - create `classic-single` and `local-versus` games with two player states.
- `src/game/update.ts` - update both players through fixed-step simulation, CPU/takeover, scoring, timer, results, and event generation.
- `src/game/systems/input.ts` - apply commands per player.
- `src/game/systems/collision.ts` - collect/catch per player with isolated score/combo/stats.
- `src/game/systems/movement.ts` - update movement/jump per player.
- `src/game/systems/power.ts` - track power per player.
- `src/game/systems/coreFeel.ts` - track tongue/water feedback per player.
- `src/game/systems/timer.ts` - use 180-second thresholds and create results once when the round ends.
- `src/style.css` - style M2 HUD, mode switcher, player score slots, control source markers, results panel, and responsive controls.
- `README.md` - document M2 controls, modes, AI takeover, smoke/test params, and verification commands.
- `tests/unit/gameState.test.ts` - update 60-second expectations to 180 seconds and two-player state.
- `tests/unit/m1ClassicCoreFeel.test.ts` - migrate helpers to Player 1 in the two-player model.
- `tests/unit/scoringPower.test.ts` - migrate scoring/power assertions to player-specific scores/stats.
- `tests/e2e/m0-smoke.spec.ts` - update timer target and markers while preserving M0 smoke intent.
- `tests/e2e/m1-smoke.spec.ts` - update runtime marker selectors to Player 1 scoped markers.

### Do Not Modify Unless Explicitly Needed

- `package.json`, `package-lock.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `Dockerfile`, `nginx.conf`, `public/assets/*`, `ASSET_MANIFEST.md`.

## Worker Ownership Hints

- Simulation worker: `src/game/**`, `tests/unit/matchModel.test.ts`, `tests/unit/cpuTakeover.test.ts`, `tests/unit/localVersus.test.ts`, migrated unit tests.
- Runtime worker: `src/runtime/**`, `src/main.ts`, `tests/unit/runtimeParams.test.ts`, runtime parts of E2E tests.
- Render worker: `src/render/**`, `src/runtime/layers.ts`, `tests/unit/renderLayers.test.ts`, visual/effect E2E assertions.
- E2E/docs/deploy worker: `tests/e2e/m2-classic-match.spec.ts`, migrated E2E tests, `README.md`, Docker/Coolify verification notes.
- Avoid concurrent edits to `src/game/types.ts`, `src/game/update.ts`, `src/main.ts`, and `tests/e2e/*`; assign one owner at a time for those files.

## Commands And Gates

Use these exact scripts unless `package.json` changes in a later approved task.

- Build gate: `npm run build`
  - Expected pass output includes `tsc && vite build` and exits `0`.
  - Fail gate: any TypeScript error, Vite build error, or non-zero exit blocks completion.
- Unit gate: `npm run test:unit`
  - Expected pass output includes `vitest run` and a final summary with all unit tests passing.
  - Red-test expected output during TDD: target test file fails with the new assertion before production changes.
- E2E gate: `npm run test:e2e`
  - Expected pass output includes `playwright test` and all browser tests passing.
  - Red-test expected output during TDD: target Playwright test times out or reports missing M2 marker/control before runtime changes.
- Full gate: `npm test`
  - Expected pass output runs `npm run test:unit && npm run test:e2e` and exits `0`.
- Deploy artifact gate: `docker build -t frogs-and-flies-m2-classic-alpha .`
  - Expected pass output reaches the final Docker build step and exits `0`.

## Implementation Tasks

### Task 1: Baseline And Branch Safety

**Files:**
- Read only: repo status and current scripts.

- [ ] **Step 1: Confirm worktree state**

Run: `git status --short`

Expected: Lists any existing user/agent changes. Do not revert unrelated changes.

- [ ] **Step 2: Confirm scripts**

Run: `npm run build`

Expected pass: command exits `0`.

- [ ] **Step 3: Confirm unit baseline**

Run: `npm run test:unit`

Expected pass: command exits `0`.

- [ ] **Step 4: Confirm E2E baseline**

Run: `npm run test:e2e`

Expected pass: command exits `0`.

- [ ] **Step 5: Commit only if repository policy allows**

Run: `git status --short`

Expected: No unrelated files staged. If committing is allowed, commit only worker-owned files with a message like `test: capture m2 baseline` after real changes exist.

### Task 2: Runtime Parameter Extraction, TDD First

**Ownership:** Runtime worker.

**Files:**
- Create: `tests/unit/runtimeParams.test.ts`
- Create: `src/runtime/params.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Write the failing runtime params test**

Create `tests/unit/runtimeParams.test.ts` with tests for defaults and overrides:

```ts
import { describe, expect, it } from 'vitest'
import { readRuntimeParams } from '../../src/runtime/params'

describe('M2 runtime params', () => {
  it('defaults to classic single, seed 1, and production match timing', () => {
    const params = readRuntimeParams(new URLSearchParams(''))

    expect(params.seed).toBe(1)
    expect(params.mode).toBe('classic-single')
    expect(params.durationSeconds).toBeUndefined()
    expect(params.theEndSeconds).toBeUndefined()
    expect(params.smokeState).toBeUndefined()
    expect(params.smokeElapsedSeconds).toBeUndefined()
    expect(params.simulationSpeed).toBe(1)
  })

  it('parses local versus, seed, smoke state, short duration, and simulation speed', () => {
    const params = readRuntimeParams(
      new URLSearchParams('mode=local-versus&seed=42&smokeState=results&smokeElapsedSeconds=179&durationSeconds=3&theEndSeconds=0.5&simulationSpeed=20'),
    )

    expect(params.mode).toBe('local-versus')
    expect(params.seed).toBe(42)
    expect(params.smokeState).toBe('results')
    expect(params.smokeElapsedSeconds).toBe(179)
    expect(params.durationSeconds).toBe(3)
    expect(params.theEndSeconds).toBe(0.5)
    expect(params.simulationSpeed).toBe(20)
  })
})
```

- [ ] **Step 2: Run red test**

Run: `npm run test:unit -- tests/unit/runtimeParams.test.ts`

Expected fail: output contains `Cannot find module '../../src/runtime/params'` or missing `readRuntimeParams`.

- [ ] **Step 3: Implement minimal runtime params module**

Create `src/runtime/params.ts` with exported types and parsing helpers. Keep accepted modes to `classic-single` and `local-versus`; keep accepted phases to existing `GamePhase`; clamp `simulationSpeed` to positive finite values and default to `1`.

- [ ] **Step 4: Move URL parsing out of `src/main.ts`**

Modify `src/main.ts` to import `readRuntimeParams` and remove duplicated local parsing helpers only after equivalent tests pass.

- [ ] **Step 5: Run focused green test**

Run: `npm run test:unit -- tests/unit/runtimeParams.test.ts`

Expected pass: file passes and exits `0`.

- [ ] **Step 6: Run compatibility checks**

Run: `npm run test:unit -- tests/unit/gameState.test.ts`

Expected pass: existing state tests still pass until later timing changes intentionally update them.

### Task 3: Match Model And 180-Second Results, TDD First

**Ownership:** Simulation worker.

**Files:**
- Create: `tests/unit/matchModel.test.ts`
- Create: `src/game/match.ts`
- Create: `src/game/player.ts`
- Modify: `src/game/types.ts`
- Modify: `src/game/constants.ts`
- Modify: `src/game/createGame.ts`
- Modify: `src/game/update.ts`
- Modify: `src/game/systems/timer.ts`
- Modify: `tests/unit/gameState.test.ts`

- [ ] **Step 1: Write failing match model tests**

Create `tests/unit/matchModel.test.ts` with assertions:

```ts
import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/game/createGame'
import { updateGame } from '../../src/game/update'

const STEP = 1 / 60

function start(seed = 7) {
  const game = createGame({ seed, mode: 'classic-single' })
  game.commands.start = true
  updateGame(game, STEP)
  return game
}

describe('M2 match model', () => {
  it('creates a 180 second classic single match with P1 human and P2 CPU', () => {
    const game = createGame({ seed: 7, mode: 'classic-single' })

    expect(game.durationSeconds).toBe(180)
    expect(game.remainingSeconds).toBe(180)
    expect(game.mode).toBe('classic-single')
    expect(game.players.map((player) => player.id)).toEqual(['p1', 'p2'])
    expect(game.players[0].controlSource).toBe('human')
    expect(game.players[1].controlSource).toBe('cpu-opponent')
  })

  it('calculates P1, P2, and tie results from isolated scores', () => {
    const game = start()

    game.players[0].score = 20
    game.players[1].score = 10
    updateGame(game, 180)
    updateGame(game, game.theEndSeconds)
    expect(game.results?.winner).toBe('p1')

    const p2 = start()
    p2.players[0].score = 10
    p2.players[1].score = 25
    updateGame(p2, 180)
    updateGame(p2, p2.theEndSeconds)
    expect(p2.results?.winner).toBe('p2')

    const tie = start()
    tie.players[0].score = 15
    tie.players[1].score = 15
    updateGame(tie, 180)
    updateGame(tie, tie.theEndSeconds)
    expect(tie.results?.winner).toBe('tie')
  })
})
```

- [ ] **Step 2: Run red test**

Run: `npm run test:unit -- tests/unit/matchModel.test.ts`

Expected fail: output contains TypeScript errors for missing `mode`, `players`, `controlSource`, or `results`.

- [ ] **Step 3: Extend types for M2 state**

In `src/game/types.ts`, add:

- `MatchMode = 'classic-single' | 'local-versus'`
- `PlayerId = 'p1' | 'p2'`
- `ControlSource = 'human' | 'cpu-opponent' | 'ai-takeover'`
- `PlayerCommands` with movement, tongue, jump, and pointer intent fields.
- `PlayerStats` with `score`, `caught`, `attempts`, and derived accuracy support.
- `MatchResults` with final scores, stats, `winner: PlayerId | 'tie'`, and mode.
- `PlayerState` fields for `id`, `label`, `controlSource`, `commands`, `score`, `combo`, `power`, `catchRadius`, `water`, `lastHumanInputElapsedSeconds`, and `ai`.
- `GameState` fields for `mode`, `players`, `elapsedSeconds`, `results`, and `events`.

Keep short-lived compatibility accessors or mirrored values for current tests only if needed during migration, then remove them when all tests are updated.

- [ ] **Step 4: Add player and match helpers**

Create `src/game/player.ts` with `createPlayer(id, label, controlSource, x)` and per-player default state.

Create `src/game/match.ts` with `createPlayers(mode)`, `getPlayer(game, id)`, `recordHumanInput(player, elapsedSeconds)`, and `buildResults(game)`.

- [ ] **Step 5: Update constants and game creation**

Change `ROUND_DURATION_SECONDS` from `60` to `180`. Add `AI_TAKEOVER_SECONDS = 15`.

Update `CreateGameOptions` to accept `mode?: MatchMode`. Default to `classic-single`.

- [ ] **Step 6: Update timer and result generation**

Track `elapsedSeconds` during `gameplay`, keep `remainingSeconds`, and set `results = buildResults(game)` once when transitioning from `the-end` to `results`.

- [ ] **Step 7: Update existing game state tests**

Change M0 expectations from 60 to 180 and time-of-day checkpoints to 90 seconds for dusk and 150 seconds for night unless the timer helper uses ratio-based thresholds.

- [ ] **Step 8: Run focused green tests**

Run: `npm run test:unit -- tests/unit/matchModel.test.ts tests/unit/gameState.test.ts`

Expected pass: both files pass and exit `0`.

### Task 4: Per-Player Movement, Scoring, Power, And Core Feel, TDD First

**Ownership:** Simulation worker. Coordinate edits to `src/game/types.ts` and `src/game/update.ts` with Task 3 owner.

**Files:**
- Modify: `tests/unit/scoringPower.test.ts`
- Modify: `tests/unit/m1ClassicCoreFeel.test.ts`
- Modify: `src/game/systems/input.ts`
- Modify: `src/game/systems/collision.ts`
- Modify: `src/game/systems/movement.ts`
- Modify: `src/game/systems/power.ts`
- Modify: `src/game/systems/coreFeel.ts`
- Modify: `src/game/update.ts`

- [ ] **Step 1: Write failing per-player scoring assertions**

In `tests/unit/scoringPower.test.ts`, migrate helper access to `game.players[0]` and add a test that P1 catching a fly increments only P1 score/stats while P2 remains unchanged.

- [ ] **Step 2: Run red scoring test**

Run: `npm run test:unit -- tests/unit/scoringPower.test.ts`

Expected fail: output shows single-player `game.score` or collision code does not isolate player scores.

- [ ] **Step 3: Update collision and power systems**

Refactor `updateCollision(game)` to loop over players and call per-player helpers. Score fly catches against the acting player only. Increment `attempts` on tongue/fire attempt and `caught` on catch. Keep power collection per player.

- [ ] **Step 4: Run scoring green test**

Run: `npm run test:unit -- tests/unit/scoringPower.test.ts`

Expected pass: file passes and exits `0`.

- [ ] **Step 5: Write failing core feel migration assertions**

In `tests/unit/m1ClassicCoreFeel.test.ts`, update helpers to target `const p1 = game.players[0]`, then assert P1 jump/tongue/water state transitions are unchanged and P2 does not mirror P1 jump/tongue commands.

- [ ] **Step 6: Run red core feel test**

Run: `npm run test:unit -- tests/unit/m1ClassicCoreFeel.test.ts`

Expected fail: output shows systems still read `game.player` or `game.commands`.

- [ ] **Step 7: Update input, movement, and core feel systems**

Apply movement/jump/tongue/water updates per player from `player.commands`. Do not let one player's jump/tongue/water state mutate the other player's state.

- [ ] **Step 8: Run core feel green test**

Run: `npm run test:unit -- tests/unit/m1ClassicCoreFeel.test.ts`

Expected pass: file passes and exits `0`.

- [ ] **Step 9: Run all simulation unit tests**

Run: `npm run test:unit -- tests/unit/gameState.test.ts tests/unit/matchModel.test.ts tests/unit/scoringPower.test.ts tests/unit/m1ClassicCoreFeel.test.ts tests/unit/spawn.test.ts`

Expected pass: all listed files pass and exit `0`.

### Task 5: CPU Opponent And AI Takeover, TDD First

**Ownership:** Simulation worker.

**Files:**
- Create: `tests/unit/cpuTakeover.test.ts`
- Create: `src/game/ai.ts`
- Modify: `src/game/update.ts`
- Modify: `src/game/types.ts`
- Modify: `src/game/constants.ts`

- [ ] **Step 1: Write failing CPU/takeover tests**

Create `tests/unit/cpuTakeover.test.ts` with assertions:

```ts
import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/game/createGame'
import { updateGame } from '../../src/game/update'

const STEP = 1 / 60

function start(mode: 'classic-single' | 'local-versus' = 'classic-single') {
  const game = createGame({ seed: 11, mode })
  game.commands.start = true
  updateGame(game, STEP)
  return game
}

describe('M2 CPU and AI takeover', () => {
  it('keeps P2 CPU controlled in classic single', () => {
    const game = start('classic-single')

    updateGame(game, STEP)

    expect(game.players[1].controlSource).toBe('cpu-opponent')
    expect(game.players[1].commands).toMatchObject({
      // Exact movement can vary by deterministic target; at least one CPU intent should be present.
    })
    expect(game.players[1].ai.lastDecisionElapsedSeconds).toBeGreaterThanOrEqual(0)
  })

  it('takes over inactive local versus players after 15 seconds and restores on valid input', () => {
    const game = start('local-versus')

    expect(game.players[0].controlSource).toBe('human')
    updateGame(game, 14.99)
    expect(game.players[0].controlSource).toBe('human')

    updateGame(game, 0.02)
    expect(game.players[0].controlSource).toBe('ai-takeover')

    game.players[0].commands.moveLeft = true
    game.players[0].commands.humanInput = true
    updateGame(game, STEP)
    expect(game.players[0].controlSource).toBe('human')
  })
})
```

- [ ] **Step 2: Run red CPU/takeover test**

Run: `npm run test:unit -- tests/unit/cpuTakeover.test.ts`

Expected fail: output shows missing `src/game/ai.ts`, missing `controlSource`, or takeover logic absent.

- [ ] **Step 3: Implement deterministic CPU decisions**

Create `src/game/ai.ts` with a pure helper such as `applyCpuCommands(game, player, deltaSeconds)`. Choose deterministic targets from visible entities and seeded state; do not call `Math.random()`, `Date.now()`, or browser APIs.

- [ ] **Step 4: Implement takeover threshold and restoration**

For players whose base source is human, switch to `ai-takeover` when `game.elapsedSeconds - player.lastHumanInputElapsedSeconds >= AI_TAKEOVER_SECONDS`. Restore to `human` on `player.commands.humanInput === true` from valid P1/P2 input.

- [ ] **Step 5: Ensure update order is deterministic**

In `updateGame`, process human input markers, then CPU/takeover commands, then gameplay systems, then timer/results, then clear commands. Do not clear `lastHumanInputElapsedSeconds`.

- [ ] **Step 6: Run focused green test**

Run: `npm run test:unit -- tests/unit/cpuTakeover.test.ts`

Expected pass: file passes and exits `0`.

- [ ] **Step 7: Run determinism guard**

Run: `rg "Math\\.random|Date\\.now|performance\\.now" src/game src/runtime`

Expected output: no matches in `src/game`; runtime may use browser timing only for Pixi ticker, not gameplay decisions.

### Task 6: Local Versus Commands, TDD First

**Ownership:** Runtime worker plus Simulation worker for command contracts.

**Files:**
- Create: `tests/unit/localVersus.test.ts`
- Modify: `src/runtime/input.ts`
- Modify: `src/game/types.ts`
- Modify: `src/game/update.ts`

- [ ] **Step 1: Write failing local versus unit test**

Create `tests/unit/localVersus.test.ts` asserting `createGame({ mode: 'local-versus' })` creates both players as `human`, P1 and P2 command bags are independent, and applying P1 movement does not move P2.

- [ ] **Step 2: Run red local versus test**

Run: `npm run test:unit -- tests/unit/localVersus.test.ts`

Expected fail: output shows mode or per-player command isolation missing.

- [ ] **Step 3: Define non-overlapping controls**

Use these bindings unless implementation constraints prove a better set:

- P1: `A`/`D` or `ArrowLeft`/`ArrowRight` move, `Space` charge/release jump, `KeyT` tongue.
- P2: `KeyJ`/`KeyL` move, `KeyI` charge/release jump, `KeyO` tongue.
- Shared: `Enter` start/resume/replay, `KeyP` pause/resume.
- Mode: on-screen mode buttons or segmented control with `classic-single` and `local-versus`; optional keyboard `Digit1` and `Digit2`.

- [ ] **Step 4: Implement per-player command mapping**

In `src/runtime/input.ts`, collect held keys and edge-triggered tongue/jump release events into `playersById.p1.commands` and `playersById.p2.commands`. Set `humanInput` only for the player whose valid key/pointer input occurred.

- [ ] **Step 5: Add pointer behavior**

Pointer/click controls P1 only. In Classic Single and Local Versus, pointer movement should set P1 x target/fire and mark P1 human input.

- [ ] **Step 6: Run focused green test**

Run: `npm run test:unit -- tests/unit/localVersus.test.ts`

Expected pass: file passes and exits `0`.

### Task 7: Runtime Extraction And HUD Markers, TDD First

**Ownership:** Runtime worker.

**Files:**
- Create: `src/runtime/app.ts`
- Create: `src/runtime/dom.ts`
- Create: `src/runtime/assets.ts`
- Modify: `src/main.ts`
- Modify: `src/style.css`
- Modify: `tests/e2e/m0-smoke.spec.ts`
- Modify: `tests/e2e/m1-smoke.spec.ts`
- Create: `tests/e2e/m2-classic-match.spec.ts`

- [ ] **Step 1: Write failing E2E marker test**

In `tests/e2e/m2-classic-match.spec.ts`, add a Classic Single smoke test:

```ts
import { expect, test } from '@playwright/test'

test.describe('Frogs and Flies 2 M2 Classic Match', () => {
  test('starts Classic Single with P1 versus CPU and exposes match markers', async ({ page }) => {
    await page.goto('/?seed=123')

    await expect(page.getByTestId('game-state')).toHaveAttribute('data-mode', 'classic-single')
    await expect(page.getByTestId('round-timer')).toHaveAttribute('data-target-seconds', '180')
    await expect(page.getByTestId('p1-score')).toBeVisible()
    await expect(page.getByTestId('p2-score')).toBeVisible()
    await expect(page.getByTestId('p1-control-source')).toHaveAttribute('data-control-source', 'human')
    await expect(page.getByTestId('p2-control-source')).toHaveAttribute('data-control-source', 'cpu-opponent')

    await page.getByTestId('start-game').click()
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'gameplay')
  })
})
```

- [ ] **Step 2: Run red E2E marker test**

Run: `npm run test:e2e -- tests/e2e/m2-classic-match.spec.ts`

Expected fail: missing `data-mode`, `p1-score`, `p2-score`, or control source markers.

- [ ] **Step 3: Extract runtime app lifecycle**

Move Pixi app creation, ticker binding, resize handling, replay/start/pause/resume wiring, and teardown into `src/runtime/app.ts`. Export `startRuntime(root, params): Promise<RuntimeHandle>`.

- [ ] **Step 4: Extract DOM/HUD binding**

Move DOM creation/sync into `src/runtime/dom.ts`. Add stable test hooks:

- `data-testid="game-state"` with `data-state`, `data-mode`, `data-time-of-day`.
- `data-testid="round-timer"` and `data-testid="timer"` with `data-target-seconds`, `data-remaining-seconds`.
- `data-testid="p1-score"`, `data-testid="p2-score"` with `data-score`, `data-caught`, `data-attempts`, `data-accuracy`.
- `data-testid="p1-control-source"`, `data-testid="p2-control-source"` with `data-control-source`.
- `data-testid="results"` with `data-winner`, `data-p1-score`, `data-p2-score`.
- Existing `start-game`, `pause-game`, `resume-game`, `replay-game` controls.

- [ ] **Step 5: Extract asset loading**

Move generated asset loading to `src/runtime/assets.ts` and preserve canvas `data-assets-loaded` behavior.

- [ ] **Step 6: Thin `src/main.ts`**

Reduce `src/main.ts` to CSS import, params parsing, `#app` lookup, and `void startRuntime(appRoot, params)`. Keep thrown error for missing `#app`.

- [ ] **Step 7: Update existing E2E tests**

Update M0/M1 selectors and timer expectations to M2 markers while preserving their intent. Avoid weakening checks.

- [ ] **Step 8: Run focused green E2E test**

Run: `npm run test:e2e -- tests/e2e/m2-classic-match.spec.ts`

Expected pass: new marker test passes and exits `0`.

### Task 8: UI Modes, Results, And Short-Round Smoke Flow, TDD First

**Ownership:** Runtime worker and E2E/docs worker.

**Files:**
- Modify: `tests/e2e/m2-classic-match.spec.ts`
- Modify: `src/runtime/dom.ts`
- Modify: `src/runtime/app.ts`
- Modify: `src/runtime/input.ts`
- Modify: `src/style.css`

- [ ] **Step 1: Write failing Local Versus E2E test**

Add a test that opens `/?mode=local-versus&seed=123`, confirms both control sources are `human`, starts gameplay, presses P1 and P2 keys, and observes both player markers remain present.

- [ ] **Step 2: Run red Local Versus E2E test**

Run: `npm run test:e2e -- tests/e2e/m2-classic-match.spec.ts -g "Local Versus"`

Expected fail: mode control or P2 human markers missing.

- [ ] **Step 3: Implement mode selection**

Expose mode selection in DOM controls before match start and in replay flow. Ensure mode changes create a fresh game with the selected mode and seed.

- [ ] **Step 4: Run Local Versus green test**

Run: `npm run test:e2e -- tests/e2e/m2-classic-match.spec.ts -g "Local Versus"`

Expected pass: Local Versus test passes and exits `0`.

- [ ] **Step 5: Write failing results E2E test**

Add a test using `/?seed=123&durationSeconds=2&theEndSeconds=0.1&simulationSpeed=20` that starts a short round and expects `results` with `data-winner` equal to `p1`, `p2`, or `tie`, plus visible P1/P2 final scores.

- [ ] **Step 6: Run red results E2E test**

Run: `npm run test:e2e -- tests/e2e/m2-classic-match.spec.ts -g "results"`

Expected fail: result markers or simulation speed hook missing.

- [ ] **Step 7: Implement safe simulation speed hook**

Apply `simulationSpeed` only to fixed-step accumulation in runtime. Keep simulation rules unchanged; this hook only advances more fixed steps per real ticker delta for smoke tests.

- [ ] **Step 8: Implement results UI**

Show both players, final scores/stats, winner label, and tie label. Keep data attributes authoritative for tests.

- [ ] **Step 9: Run results green test**

Run: `npm run test:e2e -- tests/e2e/m2-classic-match.spec.ts -g "results"`

Expected pass: results test passes and exits `0`.

### Task 9: Render Layers And Effects, TDD First

**Ownership:** Render worker.

**Files:**
- Create: `tests/unit/renderLayers.test.ts`
- Create: `src/runtime/layers.ts`
- Create: `src/render/scene.ts`
- Create: `src/render/entities.ts`
- Create: `src/render/effects.ts`
- Create: `src/render/palette.ts`
- Modify: `src/runtime/app.ts`
- Modify: `src/runtime/assets.ts`
- Modify: `tests/e2e/m2-classic-match.spec.ts`

- [ ] **Step 1: Write failing render layer unit test**

Create `tests/unit/renderLayers.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createRenderLayers } from '../../src/runtime/layers'

describe('M2 render layers', () => {
  it('creates stable background, gameplay, effects, and ui layers in order', () => {
    const layers = createRenderLayers()

    expect(Object.keys(layers.byName)).toEqual(['background', 'gameplay', 'effects', 'ui'])
    expect(layers.root.children).toEqual([
      layers.byName.background,
      layers.byName.gameplay,
      layers.byName.effects,
      layers.byName.ui,
    ])
  })
})
```

- [ ] **Step 2: Run red render layer test**

Run: `npm run test:unit -- tests/unit/renderLayers.test.ts`

Expected fail: missing `src/runtime/layers.ts`.

- [ ] **Step 3: Implement render layers**

Create `createRenderLayers()` returning a root `Container` and named child containers. No gameplay logic belongs here.

- [ ] **Step 4: Run layer green test**

Run: `npm run test:unit -- tests/unit/renderLayers.test.ts`

Expected pass: file passes and exits `0`.

- [ ] **Step 5: Move rendering out of `src/main.ts`**

Move procedural/bitmap scene creation and sync into `src/render/*`. Render both frogs and all entities from simulation snapshots. Keep effects non-authoritative.

- [ ] **Step 6: Implement M2 feedback effects**

Use simulation events or observable state transitions to render:

- Catch pop near the catching player.
- Score float showing points gained.
- Tongue/catch feedback for catch and miss.
- Splash feedback on landing.
- Dusk/night tint from time-of-day.
- End-of-round flourish when phase is `the-end` or `results`.

- [ ] **Step 7: Add render marker E2E assertions**

In `tests/e2e/m2-classic-match.spec.ts`, assert canvas has `data-runtime-markers="m2"` and `data-render-layers="background gameplay effects ui"`. For effects, use a short deterministic scenario and assert `data-last-effect` becomes `catch`, `miss`, `splash`, or `score`.

- [ ] **Step 8: Run focused render tests**

Run: `npm run test:unit -- tests/unit/renderLayers.test.ts && npm run test:e2e -- tests/e2e/m2-classic-match.spec.ts -g "render"`

Expected pass: both commands exit `0`.

### Task 10: README Controls And Smoke Docs, TDD First

**Ownership:** E2E/docs worker.

**Files:**
- Modify: `README.md`
- Create or modify: `tests/unit/readmeControls.test.ts` only if the team chooses a simple text guard.

- [ ] **Step 1: Write failing README guard**

If using a text guard, create `tests/unit/readmeControls.test.ts` that reads `README.md` and expects it to mention `Classic Single`, `Local Versus`, `P1`, `P2`, `AI takeover`, `Enter`, `P`, `Replay`, and the M2 smoke parameters.

- [ ] **Step 2: Run red README guard**

Run: `npm run test:unit -- tests/unit/readmeControls.test.ts`

Expected fail: README lacks M2 controls and AI takeover text.

- [ ] **Step 3: Update README controls**

Update README to describe:

- M2 Classic Match alpha status.
- Classic Single: P1 human versus CPU P2.
- Local Versus: P1 and P2 humans on one keyboard/browser.
- P1 controls.
- P2 controls.
- Shared pause/replay/mode controls.
- AI takeover after 15 seconds of no human input and restoration on next valid input.
- 180-second default round.
- Smoke params: `mode`, `seed`, `smokeElapsedSeconds`, `smokeState`, `durationSeconds`, `theEndSeconds`, `simulationSpeed`.
- Verification: `npm run build`, `npm run test:unit`, `npm run test:e2e`, `npm test`.

- [ ] **Step 4: Run README guard green**

Run: `npm run test:unit -- tests/unit/readmeControls.test.ts`

Expected pass: file passes and exits `0`.

### Task 11: Full Regression And Cleanup

**Ownership:** All workers, one coordinator.

**Files:**
- Modify only files already owned by prior tasks.

- [ ] **Step 1: Run TypeScript/build gate**

Run: `npm run build`

Expected pass: command exits `0`; no TypeScript errors.

- [ ] **Step 2: Run all unit tests**

Run: `npm run test:unit`

Expected pass: all Vitest tests pass and exit `0`.

- [ ] **Step 3: Run all browser tests**

Run: `npm run test:e2e`

Expected pass: all Playwright tests pass and exit `0`.

- [ ] **Step 4: Run full test alias**

Run: `npm test`

Expected pass: unit and E2E test suites pass and exit `0`.

- [ ] **Step 5: Search determinism hazards**

Run: `rg "Math\\.random|Date\\.now|performance\\.now|setTimeout|setInterval" src/game`

Expected pass: no output. Any match in `src/game` must be removed or justified in the implementation summary.

- [ ] **Step 6: Check `main.ts` scope**

Run: `wc -l src/main.ts`

Expected pass: `src/main.ts` is thin enough to clearly be bootstrapping only. If above 80 lines, justify why in the implementation summary.

- [ ] **Step 7: Review dirty files**

Run: `git status --short`

Expected pass: only intended implementation/test/docs files are changed. Do not revert unrelated files owned by other workers.

### Task 12: Code Review Preparation

**Ownership:** Coordinator.

**Files:**
- No required file edits unless review finds issues.

- [ ] **Step 1: Run review skill**

Use `superpowers:requesting-code-review` after Tasks 1-11 pass.

Expected: Review focuses on bugs, regressions, missing tests, runtime/simulation boundaries, determinism, and deploy risk.

- [ ] **Step 2: Address actionable findings**

For each accepted finding, write or update a failing test first, then implement the fix, then rerun the focused test.

Expected: Every accepted finding has a test or explicit reason why a test is not practical.

- [ ] **Step 3: Rerun final gates**

Run:

```bash
npm run build
npm run test:unit
npm run test:e2e
```

Expected pass: all commands exit `0`.

### Task 13: Docker And Coolify Verification

**Ownership:** Deploy worker or coordinator.

**Files:**
- No source file edits unless deployment exposes a real bug.

- [ ] **Step 1: Build Docker image**

Run: `docker build -t frogs-and-flies-m2-classic-alpha .`

Expected pass: Docker build completes and exits `0`.

- [ ] **Step 2: Run local container**

Run: `docker run --rm -p 8080:80 frogs-and-flies-m2-classic-alpha`

Expected: nginx serves the app on port `8080`. Keep this session running for the next step.

- [ ] **Step 3: Verify local container in browser test**

In another terminal, run: `npx playwright test tests/e2e/m2-classic-match.spec.ts --config=playwright.config.ts --project=chromium --grep "Classic Single"`

Expected pass: the test can load the deployed-like app. If the Playwright config always starts Vite, use manual browser verification at `http://localhost:8080/?seed=123` and record that substitution.

- [ ] **Step 4: Stop local container**

Stop the running Docker command with `Ctrl+C`.

Expected: container exits cleanly.

- [ ] **Step 5: Deploy through Coolify**

Trigger the Coolify deployment for the target app/environment.

Expected: Coolify build logs show successful Docker build and healthy container start. Record the deployed URL and build identifier in the implementation summary.

- [ ] **Step 6: Verify Coolify route**

Open the Coolify URL with:

- `/?seed=123`
- `/?mode=local-versus&seed=123`
- `/?seed=123&durationSeconds=2&theEndSeconds=0.1&simulationSpeed=20`

Expected pass:

- Classic Single shows 180-second target, P1 human, P2 CPU.
- Local Versus shows both players as human.
- Short round reaches results with P1/P2 scores and winner/tie marker.
- Canvas is visible and nonblank.
- Generated assets load or procedural fallback renders without a blank screen.

### Task 14: Final Implementation Summary

**Ownership:** Coordinator.

**Files:**
- No required file edits.

- [ ] **Step 1: Capture final status**

Run: `git status --short`

Expected: Only intended changed files remain.

- [ ] **Step 2: Summarize implementation**

Include:

- Runtime extraction files created.
- Match model and AI behavior implemented.
- Render layers/effects implemented.
- README controls updates.
- Exact verification commands run and pass/fail status.
- Any substitutions for scripts or deployment checks.
- Coolify URL and verification results.

- [ ] **Step 3: Commit or hand off according to team policy**

If committing is allowed, commit coherent chunks in this order:

1. Runtime parameter extraction and runtime shell.
2. Match model, players, CPU/takeover, and simulation tests.
3. Render layers/effects and E2E tests.
4. README and deploy verification docs.

Expected: No unrelated user/agent changes are included in commits.

## Completion Definition

M2 is complete only when all are true:

- `npm run build` passes.
- `npm run test:unit` passes.
- `npm run test:e2e` passes.
- Classic Single defaults to P1 human versus CPU P2.
- Local Versus is reachable and gives both players human controls.
- AI takeover activates after 15 simulated seconds of inactivity and restores on valid human input.
- The default round is 180 simulated seconds and results show P1, P2, winner, and tie states.
- `src/main.ts` is boot-only and runtime/render/simulation responsibilities are split.
- Render layers are explicit: background, gameplay, effects, UI.
- Catch, score, tongue/miss, splash, time-of-day, and end feedback are visible and non-authoritative.
- README documents M2 controls, modes, AI takeover, smoke params, and verification.
- Docker build passes.
- Coolify deployment is verified on Classic Single, Local Versus, and short-round results URLs.
