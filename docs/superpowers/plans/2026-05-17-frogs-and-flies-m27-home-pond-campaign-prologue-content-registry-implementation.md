# Frogs and Flies M2.7 Home Pond Campaign Prologue And Level Content Registry Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox syntax for tracking. If using eliteteams, each task should be assigned to a focused specialist worker and consolidated by a separate reviewer before the next task starts.

**Goal:** Add a narrow three-level Home Pond campaign prologue with a minimal typed content registry, v2 local campaign progress, shell flow, persistence, and verification while preserving M2.6 Classic Single and Local Versus behavior.

**Architecture:** Keep deterministic gameplay authority in `src/game/**` and keep all campaign/prologue/objective/progress concepts in `src/content/**` and `src/runtime/**`. Runtime maps registered campaign levels to the existing `classic-single` Home Pond match params and records campaign progress only at prologue/result edges. The content registry is static TypeScript bundled with the app; there is no remote content fetch, broad content expansion, new biome, or new simulation mode.

**Tech Stack:** TypeScript, PixiJS v8, Vite, Vitest, Playwright, axe-core Playwright, browser `localStorage`, browser Service Worker/Cache APIs, static assets under `public/**`, Docker/nginx, Coolify static container deployment.

## Scope Guard

M2.7 must add exactly:

- One campaign: `home-pond`
- One prologue: `home-pond-dawn-prologue`
- Three campaign levels:
  - `home-pond-1-1-first-hunt`
  - `home-pond-1-2-quick-tongue`
  - `home-pond-1-3-nightfall-feast`
- Three Home Pond content profiles:
  - `home-pond-intro-classic`
  - `home-pond-quick-classic`
  - `home-pond-night-classic`
- Save v2 campaign progress for those three levels.
- Shell flow: Main Menu -> Campaign -> Prologue or Level Select -> Gameplay -> Results -> Replay, Next Level, Campaign, Classic Modes, or Main Menu.

M2.7 must not add:

- New biomes, world map, boss framework, Queen Bee, broad campaign system, broad insect roster, hazard roster, power-ups, economy, achievements, skins, shop, FrogCoins, gallery, online leaderboard, backend, accounts, cloud save, analytics, telemetry, ads, payments, portal SDKs, localization infrastructure, remote JSON, data editor, mod loading, final Spine pipeline, final TexturePacker pipeline, generated bitmap assets, sprite sheets, authored audio pipeline, or live network/API dependency for content/assets/audio/saves/boot.
- New player-facing modes beyond the existing Classic Single, Local Versus, and Campaign route.
- Campaign/prologue ids or objective/star logic inside `src/game/**`.

If a worker finds a task requires breaking a scope guard, stop and return `BLOCKED_SCOPE_EXPANSION` to consolidation.

## Port And Server Policy

Do not use default Vite port `5173` for verification. Port `5174` may be occupied. Use explicit `5176` unless it is taken.

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
docker run --rm --name frogs-and-flies-m27 -p 18080:80 frogs-and-flies-m27-campaign-prologue
```

Stop local dev/preview/Docker processes started for verification before handing off.

## Current File Structure Map

### Existing Baseline To Preserve

- `src/main.ts` loads SaveManager, reads runtime params, starts runtime, and registers the service worker.
- `src/runtime/app.ts` owns browser lifecycle, shell actions, match lifecycle, save writes, audio, input, replay, Pixi render sync, and result recording.
- `src/runtime/dom.ts` creates and syncs shell panels for main menu, mode select, settings, high scores, gameplay, pause, and results.
- `src/runtime/shell.ts` is the pure shell reducer for current M2.6 screens and controls.
- `src/runtime/save.ts` is SaveManager v1 with key `frogs-and-flies.save.v1`.
- `src/runtime/params.ts` reads smoke params and runtime options.
- `src/runtime/pwa.ts` and `public/service-worker.js` own static offline shell behavior.
- `src/game/**` owns deterministic Classic Single and Local Versus simulation. Do not import campaign content here.
- `src/render/**` owns Pixi scene projection. M2.7 should not require render changes.
- `src/style.css` owns shell/HUD/results styling and responsive constraints.
- Existing tests live under `tests/unit/**` and `tests/e2e/**`.

### Create

- `src/content/types.ts` - campaign/prologue/level/content-profile/objective/star type definitions.
- `src/content/registry.ts` - static M2.7 Home Pond registry, lookup helpers, registry validation.
- `src/content/objectives.ts` - pure objective/star evaluation helpers.
- `src/runtime/campaignProgress.ts` - pure campaign progress helpers if this keeps `save.ts` small.
- `tests/unit/campaignRegistry.test.ts`
- `tests/unit/campaignObjectives.test.ts`
- `tests/unit/campaignProgress.test.ts`
- `tests/e2e/m27-campaign-flow.spec.ts`

### Modify

- `src/runtime/save.ts` - SaveManager v2 key, v1 migration, v2 validation, campaign progress subdocument, import/export v2 support.
- `src/runtime/shell.ts` - add campaign/prologue shell screens, controls, and reducer actions.
- `src/runtime/app.ts` - add campaign actions, active campaign context, prologue progress writes, campaign level launch mapping, result recording exactly once, replay/next-level/campaign return paths.
- `src/runtime/dom.ts` - add Campaign button, campaign panel, prologue panel, campaign level list, campaign result lines/actions, focus handoff.
- `src/runtime/params.ts` - only if deterministic campaign E2E needs local smoke-only campaign result params; keep them inactive unless a campaign context exists.
- `src/style.css` - campaign/prologue panel layout, level list, star/status presentation, mobile/no-overlap constraints, high-contrast/reduced-motion compatibility.
- `tests/unit/saveManager.test.ts` - update v2 defaults, v1 migration, invalid v2, import/export, legacy key preservation.
- `tests/unit/runtimeShell.test.ts` - add campaign/prologue transitions and visible control contracts.
- `tests/unit/runtimeParams.test.ts` - only if smoke-only campaign params are added.
- `tests/unit/pwaCache.test.ts` - update only if cache name or static cache URLs change.
- `tests/unit/readmeControls.test.ts` - update M2.7 docs gate.
- `tests/e2e/m26-shell.spec.ts` - update only assertions that intentionally change because Campaign is now allowed on main menu; mode select should still offer only Classic Single and Local Versus.
- `tests/e2e/m26-persistence.spec.ts`, `tests/e2e/m26-input.spec.ts`, `tests/e2e/m26-audio.spec.ts` - update save key helpers from v1 to v2 where they read current primary saves; keep explicit v1 migration coverage in M2.7 tests.
- `tests/e2e/m26-accessibility.spec.ts` - include campaign/prologue axe/focus coverage or add equivalent coverage in `m27-campaign-flow.spec.ts`.
- `tests/e2e/m26-pwa-offline.spec.ts` - include campaign/prologue offline smoke or add equivalent coverage in `m27-campaign-flow.spec.ts`.
- `README.md` - document M2.7 campaign, save v2 migration, unlocks, replay, verification, Docker/Coolify smoke, and non-goals.
- `ASSET_MANIFEST.md` - do not edit unless a worker unexpectedly adds local assets; M2.7 should not add assets.
- `public/service-worker.js` and `src/runtime/pwa.ts` - update cache name only if testing proves old cache behavior can serve stale M2.7 shell; otherwise leave cache URLs unchanged because registry is bundled in JS.

### Do Not Modify Unless A Failing Test Proves It Is Needed

- `src/game/**`
- `src/render/**`
- `public/assets/**`
- `package.json` and `package-lock.json`
- `Dockerfile`
- `nginx.conf`

## Execution Rules

- Follow TDD: write a focused failing test, run it red, implement the smallest code, run it green, then commit.
- Use existing patterns and helpers before adding abstractions.
- Keep commits task-sized. Recommended commit messages are listed under each task.
- After each task, run `git diff --check` and remove generated `dist/`, `test-results/`, and `playwright-report/`.
- After each specialist worker finishes, a separate consolidation worker must inspect the commit, scope, and verification before continuing.
- Do not push until the final local verification gate says to push.

## Task 1: Baseline Audit And Dirty Guard

**Files:**
- Read: `docs/superpowers/specs/2026-05-16-frogs-and-flies-m27-home-pond-campaign-prologue-content-registry-design.md`
- Read: `docs/superpowers/plans/2026-05-15-frogs-and-flies-m26-home-pond-product-foundation-implementation.md`
- Read: `package.json`
- Read: `playwright.config.ts`
- Read: `src/runtime/app.ts`
- Read: `src/runtime/dom.ts`
- Read: `src/runtime/save.ts`
- Read: `src/runtime/shell.ts`
- Read: `tests/unit/saveManager.test.ts`
- Read: `tests/e2e/m26-shell.spec.ts`

- [x] **Step 1: Confirm branch and worktree**

Run:

```bash
git branch --show-current
git status --short --branch
git log --oneline --decorate -5
```

Expected: branch is `ff2-m0-pixijs`; HEAD includes `8c49a13 docs: add m27 campaign prologue spec`; no unrelated dirty files. If unrelated dirty files exist, stop and ask for consolidation guidance.

- [x] **Step 2: Confirm spec scope**

Run:

```bash
sed -n '1,260p' docs/superpowers/specs/2026-05-16-frogs-and-flies-m27-home-pond-campaign-prologue-content-registry-design.md
sed -n '260,620p' docs/superpowers/specs/2026-05-16-frogs-and-flies-m27-home-pond-campaign-prologue-content-registry-design.md
```

Expected: spec requires exactly one Home Pond campaign, one prologue, three levels, three content profiles, SaveManager v2 migration, and no broad content expansion.

- [x] **Step 3: Confirm scripts**

Run:

```bash
npm run
```

Expected: scripts include `build`, `test`, `test:unit`, `test:e2e`, `dev`, `preview`, and `start`.

- [x] **Step 4: Run baseline unit tests**

Run:

```bash
npm run test:unit
```

Expected: Vitest exits `0`; current baseline is 26 unit files and 128 tests passing. If counts changed before this task starts, record the new count in the worker status.

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

No commit is expected for Task 1 unless the plan checkboxes are being updated by the executing worker.

## Task 2: Typed Content And Level Registry

**Files:**
- Create: `src/content/types.ts`
- Create: `src/content/registry.ts`
- Create: `tests/unit/campaignRegistry.test.ts`
- Modify only if needed: `vitest.config.ts`

- [x] **Step 1: Write failing registry tests**

In `tests/unit/campaignRegistry.test.ts`, assert:

```ts
expect(HOME_POND_CAMPAIGN.id).toBe('home-pond')
expect(HOME_POND_CAMPAIGN.levelIds).toEqual([
  'home-pond-1-1-first-hunt',
  'home-pond-1-2-quick-tongue',
  'home-pond-1-3-nightfall-feast',
])
expect(HOME_POND_LEVELS).toHaveLength(3)
expect(HOME_POND_CONTENT_PROFILES).toHaveLength(3)
expect(validateCampaignRegistry()).toEqual([])
expect(getCampaignLevel('home-pond-1-2-quick-tongue')?.chapterLabel).toBe('1-2')
expect(getLevelContentProfile('home-pond-night-classic')?.matchMode).toBe('classic-single')
```

Add negative assertions through an exported test helper or pure validator fixture:

```ts
expect(validateCampaignRegistry(brokenRegistryWithDuplicateLevelIds)).toContainEqual(
  expect.objectContaining({ code: 'duplicate-level-id' }),
)
expect(validateCampaignRegistry(brokenRegistryWithMissingContentProfile)).toContainEqual(
  expect.objectContaining({ code: 'missing-content-profile' }),
)
```

- [x] **Step 2: Run registry tests red**

Run:

```bash
npm run test:unit -- tests/unit/campaignRegistry.test.ts
```

Expected: FAIL because `src/content/registry.ts` does not exist.

- [x] **Step 3: Implement minimal content types**

Create `src/content/types.ts` with exported literal id unions and interfaces:

- `CampaignId`
- `PrologueId`
- `CampaignLevelId`
- `LevelContentProfileId`
- `ArenaId`
- `RulesetId`
- `CampaignDefinition`
- `PrologueDefinition`
- `ProloguePanelDefinition`
- `CampaignLevelDefinition`
- `LevelContentProfileDefinition`
- `CampaignObjectiveDefinition`
- `CampaignStarThresholds`
- `CampaignRegistry`
- `CampaignRegistryValidationError`

Keep string copy in definitions, not duplicated in DOM code.

- [x] **Step 4: Implement the M2.7 registry**

Create `src/content/registry.ts` with:

- `HOME_POND_CAMPAIGN`
- `HOME_POND_PROLOGUE`
- `HOME_POND_LEVELS`
- `HOME_POND_CONTENT_PROFILES`
- `M27_CAMPAIGN_REGISTRY`
- `getCampaign(id)`
- `getPrologue(id)`
- `getCampaignLevel(id)`
- `getLevelContentProfile(id)`
- `getNextCampaignLevel(levelId)`
- `validateCampaignRegistry(registry = M27_CAMPAIGN_REGISTRY)`

Use spec ids and titles exactly:

- Campaign title: `Home Pond`
- Prologue title: `Dawn At Home Pond`
- Level titles: `First Hunt`, `Quick Tongue`, `Nightfall Feast`

Use placeholder thresholds from the spec unless a later objective test proves they are brittle:

- 1-1: score 300, stars 300/600/900
- 1-2: score 500 and catches 8, stars 500/800/1100
- 1-3: score 700, stars 700/1000/1300

- [x] **Step 5: Run registry tests green**

Run:

```bash
npm run test:unit -- tests/unit/campaignRegistry.test.ts
```

Expected: PASS.

- [x] **Step 6: Run focused existing unit tests**

Run:

```bash
npm run test:unit -- tests/unit/runtimeShell.test.ts tests/unit/runtimeParams.test.ts
```

Expected: PASS; content registry does not affect shell/runtime params yet.

- [x] **Step 7: Scope guard**

Run:

```bash
rg -n "queen|boss|biome|hazard|shop|coin|leaderboard|account|cloud|analytics|telemetry|fetch\\(|XMLHttpRequest|WebSocket" src tests public README.md
```

Expected: no new source references from this task except existing docs/tests or false positives already present before M2.7. Record any false positives.

- [x] **Step 8: Commit**

Run:

```bash
git diff --check
git status --short
git add src/content/types.ts src/content/registry.ts tests/unit/campaignRegistry.test.ts
git commit -m "feat: add m27 campaign content registry"
```

Expected: commit created; no generated artifacts staged.

## Task 3: Objective And Star Evaluation

**Files:**
- Create: `src/content/objectives.ts`
- Create: `tests/unit/campaignObjectives.test.ts`
- Modify: `src/content/types.ts` only if objective result types belong there.

- [x] **Step 1: Write failing objective tests**

In `tests/unit/campaignObjectives.test.ts`, assert:

```ts
expect(evaluateCampaignObjective(level11, { score: 299, catches: 20 })).toMatchObject({ passed: false, stars: 0 })
expect(evaluateCampaignObjective(level11, { score: 300, catches: 0 })).toMatchObject({ passed: true, stars: 1 })
expect(evaluateCampaignObjective(level11, { score: 900, catches: 0 })).toMatchObject({ passed: true, stars: 3 })
expect(evaluateCampaignObjective(level12, { score: 800, catches: 7 })).toMatchObject({ passed: false })
expect(evaluateCampaignObjective(level12, { score: 800, catches: 8 })).toMatchObject({ passed: true, stars: 2 })
```

Also assert invalid threshold ordering fails through registry validation:

```ts
expect(validateCampaignRegistry(registryWithDescendingStars)).toContainEqual(
  expect.objectContaining({ code: 'invalid-star-thresholds' }),
)
```

- [x] **Step 2: Run objective tests red**

Run:

```bash
npm run test:unit -- tests/unit/campaignObjectives.test.ts
```

Expected: FAIL because `src/content/objectives.ts` does not exist.

- [x] **Step 3: Implement pure objective helpers**

Create `src/content/objectives.ts` with:

- `CampaignObjectiveStatsInput`
- `CampaignObjectiveEvaluation`
- `evaluateCampaignObjective(level, stats)`
- `calculateCampaignStars(level, score)`

Rules:

- `score-at-least` passes when score is greater than or equal to objective score.
- `score-and-catches-at-least` passes only when score and catches meet thresholds.
- Stars are 0 for failed objective, otherwise 1/2/3 based on thresholds.
- Stars never depend on save state; monotonic save update happens later.

- [x] **Step 4: Run objective and registry tests green**

Run:

```bash
npm run test:unit -- tests/unit/campaignObjectives.test.ts tests/unit/campaignRegistry.test.ts
```

Expected: PASS.

- [x] **Step 5: Commit**

Run:

```bash
git diff --check
git add src/content/objectives.ts src/content/types.ts src/content/registry.ts tests/unit/campaignObjectives.test.ts tests/unit/campaignRegistry.test.ts
git commit -m "feat: add m27 campaign objective evaluation"
```

Expected: commit created; `src/game/**` unchanged.

## Task 4: SaveManager v2 Migration And Campaign Progress Helpers

**Files:**
- Modify: `src/runtime/save.ts`
- Create: `src/runtime/campaignProgress.ts`
- Modify: `tests/unit/saveManager.test.ts`
- Create: `tests/unit/campaignProgress.test.ts`
- Modify later E2E save-key helpers in Task 7.

- [x] **Step 1: Write failing v2 default and migration tests**

In `tests/unit/saveManager.test.ts`, update defaults and add v1 migration tests:

```ts
expect(SAVE_SCHEMA_VERSION).toBe(2)
expect(SAVE_STORAGE_KEY).toBe('frogs-and-flies.save.v2')
expect(SAVE_STORAGE_KEY_V1).toBe('frogs-and-flies.save.v1')

const save = createDefaultSave()
expect(save.version).toBe(2)
expect(save.campaign.levels['home-pond-1-1-first-hunt'].unlocked).toBe(true)
expect(save.campaign.levels['home-pond-1-2-quick-tongue'].unlocked).toBe(false)
expect(save.campaign.lastSelectedLevelId).toBe('home-pond-1-1-first-hunt')
```

Add a migration test using a valid v1 payload under `frogs-and-flies.save.v1`:

```ts
const result = createSaveManager({ storage }).load()
expect(result.status).toBe('migrated')
expect(result.data.version).toBe(2)
expect(result.data.settings).toMatchObject(v1.settings)
expect(result.data.highScores).toEqual(v1.highScores)
expect(storage.getItem('frogs-and-flies.save.v1')).toBe(JSON.stringify(v1))
expect(storage.getItem('frogs-and-flies.save.v2')).toContain('"version":2')
```

Add invalid/future tests:

```ts
expect(loadInvalidV2().status).toBe('invalid')
expect(loadFutureV2().status).toBe('unsupported-version')
```

- [x] **Step 2: Write failing campaign progress helper tests**

In `tests/unit/campaignProgress.test.ts`, assert:

- `createDefaultCampaignProgress()` unlocks only 1-1.
- `markPrologueSeen(progress, 'home-pond-dawn-prologue')` is idempotent.
- Failed 1-1 result increments attempts and does not unlock 1-2.
- Passing 1-1 unlocks 1-2.
- Passing 1-2 unlocks 1-3.
- Passing 1-3 marks campaign complete through a helper such as `isCampaignComplete(progress, HOME_POND_CAMPAIGN)`.
- Replaying with lower score/stars does not lower best progress.
- Unknown saved ids do not crash and required known levels are restored.

- [x] **Step 3: Run save/progress tests red**

Run:

```bash
npm run test:unit -- tests/unit/saveManager.test.ts tests/unit/campaignProgress.test.ts
```

Expected: FAIL because v2 fields/helpers do not exist.

- [x] **Step 4: Implement v2 save types and keys**

In `src/runtime/save.ts`:

- Change `SAVE_SCHEMA_VERSION` to `2`.
- Export `SAVE_STORAGE_KEY_V1 = 'frogs-and-flies.save.v1'`.
- Export `SAVE_STORAGE_KEY = 'frogs-and-flies.save.v2'`.
- Extend `SaveLoadStatus` with `migrated`.
- Add `CampaignProgress`, `CampaignLevelProgress`, `CampaignObjectiveStats`, and `SaveData` campaign field.
- Preserve all v1 fields: settings, high scores, stats, input profiles, started round ids, completed round ids.
- Keep v1 validation available as an internal migration step.
- Do not delete v1 storage on migration.

- [x] **Step 5: Implement progress helpers**

Create `src/runtime/campaignProgress.ts` with pure helpers:

- `createDefaultCampaignProgress()`
- `validateCampaignProgress(raw, registry)`
- `markPrologueSeen(progress, prologueId)`
- `selectCampaignLevel(progress, campaignId, levelId)`
- `recordCampaignLevelResult(progress, level, evaluation, stats, playedAt)`
- `isCampaignComplete(progress, campaign)`
- `getFirstUnlockedIncompleteLevel(progress, campaign)`

Rules:

- Progress writes are immutable.
- Attempts increment exactly once per call; runtime idempotency will prevent duplicate calls for one round.
- Best score, best catches, and stars are monotonic.
- Passing unlocks only the next registered level.
- 1-1 is always unlocked after validation.

- [x] **Step 6: Implement load order and migration write**

In `createSaveManager().load()`:

1. Try v2 key first.
2. If v2 exists, validate v2.
3. If v2 is missing, try v1 key.
4. If valid v1 exists, migrate to v2 in memory and write v2 if storage is available.
5. If both are missing, default v2.
6. If JSON invalid or unsupported future version, default safely and warn.

Keep `exportJson` and `importJson` validating v2; if import receives valid v1, either import as migrated v2 or return `unsupported-version` only if tests explicitly choose that behavior. Prefer migrated v2 for local user convenience and test it.

- [x] **Step 7: Run save/progress tests green**

Run:

```bash
npm run test:unit -- tests/unit/saveManager.test.ts tests/unit/campaignProgress.test.ts
```

Expected: PASS.

- [x] **Step 8: Run dependent unit tests**

Run:

```bash
npm run test:unit -- tests/unit/runtimeOptions.test.ts tests/unit/runtimeParams.test.ts tests/unit/inputBindings.test.ts
```

Expected: PASS.

- [x] **Step 9: Commit**

Run:

```bash
git diff --check
git add src/runtime/save.ts src/runtime/campaignProgress.ts tests/unit/saveManager.test.ts tests/unit/campaignProgress.test.ts
git commit -m "feat: add m27 save migration and campaign progress"
```

Expected: commit created.

## Task 5: Shell Reducer Campaign And Prologue States

**Files:**
- Modify: `src/runtime/shell.ts`
- Modify: `tests/unit/runtimeShell.test.ts`

- [x] **Step 1: Write failing shell reducer tests**

In `tests/unit/runtimeShell.test.ts`, assert:

```ts
expect(getVisibleShellControls(createInitialShellState())).toEqual(
  expect.arrayContaining(['campaign', 'play', 'settings', 'high-scores']),
)
expect(apply(createInitialShellState(), { type: 'openCampaign' }).screen).toBe('campaign')
expect(apply(campaignState, { type: 'openPrologue' }).screen).toBe('prologue')
expect(apply(prologueState, { type: 'startCampaignLevel' }).screen).toBe('gameplay')
expect(apply(resultsState, { type: 'returnToCampaign' }).screen).toBe('campaign')
expect(apply(resultsState, { type: 'nextCampaignLevel' }).screen).toBe('gameplay')
```

Also assert that mode select still exposes only `classic-single`, `local-versus`, and `main-menu`.

- [x] **Step 2: Run shell tests red**

Run:

```bash
npm run test:unit -- tests/unit/runtimeShell.test.ts
```

Expected: FAIL because campaign shell actions/controls do not exist.

- [x] **Step 3: Implement shell state expansion**

In `src/runtime/shell.ts`:

- Add `ShellScreen` values `campaign` and `prologue`.
- Add `ShellAction` values:
  - `openCampaign`
  - `openPrologue`
  - `startCampaignLevel`
  - `returnToCampaign`
  - `nextCampaignLevel`
- Add `ShellControl` values:
  - `campaign`
  - `start-prologue`
  - `continue-campaign`
  - `replay-prologue`
  - `campaign-level`
  - `prologue-next`
  - `prologue-back`
  - `prologue-skip`
  - `start-campaign-level`
  - `campaign-results`
  - `next-campaign-level`
  - `classic-modes`
- Keep `selectedMode: MatchMode`; do not add `campaign` to `MatchMode`.
- Keep compatibility `startGameplay` and forced results transitions used by older tests.

- [x] **Step 4: Run shell tests green**

Run:

```bash
npm run test:unit -- tests/unit/runtimeShell.test.ts
```

Expected: PASS.

- [x] **Step 5: Run registry/progress tests**

Run:

```bash
npm run test:unit -- tests/unit/campaignRegistry.test.ts tests/unit/campaignProgress.test.ts
```

Expected: PASS.

- [x] **Step 6: Commit**

Run:

```bash
git diff --check
git add src/runtime/shell.ts tests/unit/runtimeShell.test.ts
git commit -m "feat: add m27 campaign shell states"
```

Expected: commit created.

## Task 6: DOM Campaign Screen And Prologue UI

**Files:**
- Modify: `src/runtime/dom.ts`
- Modify: `src/runtime/app.ts`
- Modify: `src/style.css`
- Create: `tests/e2e/m27-campaign-flow.spec.ts`
- Modify: `tests/e2e/m26-shell.spec.ts`

- [ ] **Step 1: Write failing E2E for campaign entry and locked level list**

Create `tests/e2e/m27-campaign-flow.spec.ts` with a first describe block:

```ts
test('opens Campaign and shows exactly the Home Pond prologue levels', async ({ page }) => {
  await page.goto('/?seed=2701')
  await expect(page.getByTestId('shell-campaign')).toBeVisible()
  await page.getByTestId('shell-campaign').click()
  await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'campaign')
  await expect(page.getByTestId('campaign-home-pond')).toContainText('Home Pond')
  await expect(page.getByTestId('campaign-level-home-pond-1-1-first-hunt')).toHaveAttribute('data-unlocked', 'true')
  await expect(page.getByTestId('campaign-level-home-pond-1-2-quick-tongue')).toHaveAttribute('data-unlocked', 'false')
  await expect(page.getByTestId('campaign-level-home-pond-1-3-nightfall-feast')).toHaveAttribute('data-unlocked', 'false')
})
```

Add a second failing test for prologue controls:

```ts
test('advances and skips prologue with native controls', async ({ page }) => {
  await page.goto('/?seed=2702')
  await page.getByTestId('shell-campaign').click()
  await page.getByTestId('campaign-start-prologue').click()
  await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'prologue')
  await expect(page.getByTestId('prologue-next')).toBeVisible()
  await page.getByTestId('prologue-next').click()
  await expect(page.getByTestId('prologue-back')).toBeVisible()
  await page.getByTestId('prologue-skip').click()
  await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'campaign')
})
```

- [ ] **Step 2: Update M2.6 main-menu assertion red**

In `tests/e2e/m26-shell.spec.ts`, update the first shell test to expect Campaign on the main menu, but keep the mode-select test rejecting Campaign in mode select:

```ts
await expect(page.getByRole('button', { name: 'Campaign' })).toBeVisible()
...
await expect(page.getByRole('button', { name: /Online|Tournament|Practice/ })).toHaveCount(0)
```

- [ ] **Step 3: Run E2E red**

Run:

```bash
npx playwright test tests/e2e/m27-campaign-flow.spec.ts tests/e2e/m26-shell.spec.ts --project=chromium
```

Expected: FAIL because DOM Campaign/prologue controls do not exist.

- [ ] **Step 4: Add DOM state elements**

In `src/runtime/dom.ts`, add to `DomState`:

- `campaignPanel`
- `prologuePanel`
- `campaignButton`
- `campaignStartPrologueButton`
- `campaignContinueButton`
- `campaignReplayPrologueButton`
- `campaignMainMenuButton`
- `prologueNextButton`
- `prologueBackButton`
- `prologueSkipButton`
- `prologueStartLevelButton`
- `prologueMainMenuButton`

Create semantic elements:

- Main menu `Campaign` button with `data-testid="shell-campaign"`.
- `section#m27-campaign` with `data-testid="campaign-home-pond"` and level rows.
- `section#m27-prologue` with `data-testid="campaign-prologue"`.
- Native buttons for Next, Back, Skip, Start 1-1 First Hunt, and Main Menu.

Use registry strings for titles/copy by receiving campaign sync data from runtime. Do not duplicate the three level titles in multiple places.

- [ ] **Step 5: Extend shell sync contract**

In `src/runtime/dom.ts`, extend `ShellDomSyncState` with optional campaign UI data:

- current campaign definition
- prologue definition
- prologue panel index
- campaign progress
- active campaign level id
- latest campaign result summary

Keep this object simple and read-only for DOM.

- [ ] **Step 6: Add DOM visibility and focus handoff**

In `syncShellDom()`:

- Show campaign panel only when `shell.screen === 'campaign'`.
- Show prologue panel only when `shell.screen === 'prologue'`.
- Include `campaign` and `prologue` in `focusShellScreenPanel()`.
- Add shell markers:
  - `data-campaign-id`
  - `data-prologue-seen`
  - `data-last-selected-campaign-level`

Level rows should expose:

- `data-testid="campaign-level-<level-id>"`
- `data-level-id`
- `data-unlocked`
- `data-passed`
- `data-stars`
- `data-best-score`

- [ ] **Step 7: Wire basic runtime handlers**

In `src/runtime/app.ts`, wire handlers enough for this task:

- `handleCampaignClick` -> `openCampaign`
- `handleCampaignMainMenuClick` -> `mainMenu`
- `handleStartPrologueClick` -> `openPrologue`
- `handleReplayPrologueClick` -> `openPrologue`
- `handlePrologueNextClick`
- `handlePrologueBackClick`
- `handlePrologueSkipClick` -> mark prologue seen, return to campaign
- `handlePrologueMainMenuClick` -> main menu

Do not launch gameplay from campaign yet except if needed for a later task. Passing/launch/result logic belongs in Task 7.

- [ ] **Step 8: Style campaign/prologue panels**

In `src/style.css`, add `.m27-campaign-panel`, `.m27-level-list`, `.m27-level-row`, `.m27-prologue-panel`, and compact responsive rules.

Requirements:

- Controls are native buttons.
- Text wraps inside panels.
- Mobile width 390 px and desktop widths fit without overlapping buttons.
- High contrast and reduced motion use existing classes.
- No decorative cards inside cards. Level rows can be repeated row/card-like items with radius <= 8 px.

- [ ] **Step 9: Run focused E2E green**

Run:

```bash
npx playwright test tests/e2e/m27-campaign-flow.spec.ts tests/e2e/m26-shell.spec.ts --project=chromium
```

Expected: PASS for campaign entry/prologue shell tests and M2.6 shell regression.

- [ ] **Step 10: Run focused unit tests**

Run:

```bash
npm run test:unit -- tests/unit/runtimeShell.test.ts tests/unit/campaignRegistry.test.ts tests/unit/campaignProgress.test.ts
```

Expected: PASS.

- [ ] **Step 11: Commit**

Run:

```bash
rm -rf test-results playwright-report
git diff --check
git add src/runtime/dom.ts src/runtime/app.ts src/style.css tests/e2e/m27-campaign-flow.spec.ts tests/e2e/m26-shell.spec.ts
git commit -m "feat: add m27 campaign shell ui"
```

Expected: commit created.

## Task 7: Runtime Campaign Launch, Results, Unlocks, And Replay

**Files:**
- Modify: `src/runtime/app.ts`
- Modify: `src/runtime/dom.ts`
- Modify: `src/runtime/params.ts` only if smoke-only campaign result params are needed.
- Modify: `tests/unit/runtimeParams.test.ts` only if `src/runtime/params.ts` changes.
- Modify: `tests/e2e/m27-campaign-flow.spec.ts`
- Modify: `tests/e2e/m26-persistence.spec.ts`
- Modify: `tests/e2e/m26-audio.spec.ts`
- Modify: `tests/e2e/m26-input.spec.ts`

- [ ] **Step 1: Write failing E2E for launching 1-1**

Add to `tests/e2e/m27-campaign-flow.spec.ts`:

```ts
test('starts 1-1 from final prologue panel as Classic Single gameplay', async ({ page }) => {
  await page.goto('/?seed=2703&durationSeconds=1&theEndSeconds=0.1&simulationSpeed=20')
  await page.getByTestId('shell-campaign').click()
  await page.getByTestId('campaign-start-prologue').click()
  await page.getByTestId('prologue-next').click()
  await page.getByTestId('prologue-next').click()
  await page.getByTestId('prologue-start-level').click()
  await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'gameplay')
  await expect(page.getByTestId('game-state')).toHaveAttribute('data-mode', 'classic-single')
  await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-active-campaign-level', 'home-pond-1-1-first-hunt')
})
```

- [ ] **Step 2: Write failing E2E for fail/replay**

Use a short no-input round:

```ts
test('records a failed campaign attempt without unlocking the next level', async ({ page }) => {
  await page.goto('/?seed=2704&durationSeconds=0.25&theEndSeconds=0.1&simulationSpeed=120')
  await launchLevelFromCampaign(page, 'home-pond-1-1-first-hunt')
  await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
  await expect(page.getByTestId('campaign-result-status')).toContainText(/try again|failed/i)
  expect(await readCampaignProgress(page)).toMatchObject({
    level11Attempts: 1,
    level11Passed: false,
    level12Unlocked: false,
  })
  await expect(page.getByTestId('campaign-replay-level')).toBeVisible()
})
```

- [ ] **Step 3: Write failing E2E for pass/unlock persistence**

Prefer real deterministic input. If a pass cannot be made stable with current gameplay controls, add smoke-only campaign result params in this task:

- `campaignSmokeScore`
- `campaignSmokeCatches`

Rules for smoke params:

- Parsed only from URL in `src/runtime/params.ts`.
- Used only when there is an active campaign level context.
- Used only for campaign objective evaluation, not for local high-score fabrication.
- Documented as test smoke params in README.
- Unit-tested in `tests/unit/runtimeParams.test.ts`.

E2E example if smoke params are needed:

```ts
test('passing 1-1 unlocks 1-2 and persists across reload', async ({ page }) => {
  await page.goto('/?seed=2705&durationSeconds=0.25&theEndSeconds=0.1&simulationSpeed=120&campaignSmokeScore=900&campaignSmokeCatches=9')
  await launchLevelFromCampaign(page, 'home-pond-1-1-first-hunt')
  await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
  await expect(page.getByTestId('campaign-result-status')).toContainText(/1-1 passed|1-2 unlocked/i)
  expect(await readCampaignProgress(page)).toMatchObject({
    level11Passed: true,
    level11Stars: 3,
    level12Unlocked: true,
  })
  await page.reload()
  await page.getByTestId('shell-campaign').click()
  await expect(page.getByTestId('campaign-level-home-pond-1-2-quick-tongue')).toHaveAttribute('data-unlocked', 'true')
})
```

Add equivalent focused tests for 1-2 unlocking 1-3 and 1-3 marking Home Pond complete. These can reuse the same save across one test or set validated v2 localStorage fixtures; at least one unlock path must go through runtime results.

- [ ] **Step 4: Run campaign E2E red**

Run:

```bash
npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium
```

Expected: FAIL because launch/result recording is incomplete.

- [ ] **Step 5: Add active campaign context**

In `src/runtime/app.ts`, add runtime-only state:

```ts
interface ActiveCampaignContext {
  campaignId: CampaignId
  levelId: CampaignLevelId
  attemptId: string
  launchedFrom: 'campaign'
}
```

Rules:

- Set context when launching an unlocked campaign level.
- Clear context only after campaign result is recorded or when the player returns to campaign/main menu before results.
- Do not store context in `GameState`.
- Do not import content registry from `src/game/**`.

- [ ] **Step 6: Implement level launch mapping**

In `src/runtime/app.ts`:

- `launchCampaignLevel(levelId)` validates the level exists and is unlocked.
- It persists `lastSelectedCampaignId` and `lastSelectedLevelId`.
- It resets game with:
  - `mode: 'classic-single'`
  - current seed
  - current saved/runtime difficulty
  - current duration/smoke params
- It starts gameplay through existing `beginRound()` and `runCommand('start')`.
- It sets shell screen to `gameplay`.
- It updates shell markers including `data-active-campaign-level`.

- [ ] **Step 7: Implement prologue final start**

In `src/runtime/app.ts`:

- Final prologue action marks prologue seen.
- It launches `HOME_POND_PROLOGUE.startLevelId`.
- Skip marks prologue seen but returns to campaign and does not launch or unlock.

- [ ] **Step 8: Implement campaign result recording**

In `src/runtime/app.ts`, after `recordCompletedRoundIfNeeded()` or in a parallel guarded function:

- Record local high score exactly as before.
- If `activeCampaignContext` exists and game is at results, evaluate campaign objective from P1/current primary-player stats or smoke-only campaign stats if explicitly configured.
- Call `recordCampaignLevelResult()`.
- Persist save.
- Set `campaignResultRecorded = true` for the active attempt.
- Expose result status to DOM.
- Never record twice for one attempt.
- Never unlock from a non-campaign round or forced results without active campaign context.

- [ ] **Step 9: Add result actions**

In `src/runtime/dom.ts` and `src/runtime/app.ts`, add:

- `data-testid="campaign-result-status"`
- `data-testid="campaign-replay-level"`
- `data-testid="campaign-next-level"` when next level is unlocked
- `data-testid="campaign-results-return"`
- `data-testid="campaign-classic-modes"`

Actions:

- Replay Level launches the same campaign level and creates a new round.
- Next Level launches the next unlocked level.
- Campaign returns to level select.
- Classic Modes returns to mode select.
- Main Menu remains available.

- [ ] **Step 10: Update E2E save-key helpers**

In M2.6 E2E tests that read the current primary save, use `frogs-and-flies.save.v2`. Keep separate M2.7 migration tests proving v1 is read and preserved.

Files likely affected:

- `tests/e2e/m26-persistence.spec.ts`
- `tests/e2e/m26-input.spec.ts`
- `tests/e2e/m26-audio.spec.ts`
- `tests/e2e/m26-shell.spec.ts`

- [ ] **Step 11: Run campaign E2E green**

Run:

```bash
npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 12: Run M2.6 regression E2E focused**

Run:

```bash
npx playwright test tests/e2e/m26-shell.spec.ts tests/e2e/m26-persistence.spec.ts tests/e2e/m26-input.spec.ts tests/e2e/m26-audio.spec.ts --project=chromium
```

Expected: PASS; Classic Single, Local Versus, settings, input, audio, and high scores still work.

- [ ] **Step 13: Run focused unit tests**

Run:

```bash
npm run test:unit -- tests/unit/saveManager.test.ts tests/unit/campaignProgress.test.ts tests/unit/campaignObjectives.test.ts tests/unit/runtimeShell.test.ts tests/unit/runtimeParams.test.ts
```

Expected: PASS.

- [ ] **Step 14: Commit**

Run:

```bash
rm -rf test-results playwright-report
git diff --check
git add src/runtime/app.ts src/runtime/dom.ts src/runtime/params.ts tests/unit/runtimeParams.test.ts tests/e2e/m27-campaign-flow.spec.ts tests/e2e/m26-persistence.spec.ts tests/e2e/m26-input.spec.ts tests/e2e/m26-audio.spec.ts tests/e2e/m26-shell.spec.ts
git commit -m "feat: add m27 campaign launch and progress flow"
```

Expected: commit created. Omit unchanged files from `git add`.

## Task 8: Accessibility, PWA/Offline, Responsive, And Performance Verification

**Files:**
- Modify: `tests/e2e/m26-accessibility.spec.ts` or `tests/e2e/m27-campaign-flow.spec.ts`
- Modify: `tests/e2e/m26-pwa-offline.spec.ts` or `tests/e2e/m27-campaign-flow.spec.ts`
- Modify: `tests/e2e/m26-performance.spec.ts` only if adding campaign performance smoke there is cleaner.
- Modify: `tests/e2e/m26-shell.spec.ts`
- Modify only if needed: `src/runtime/pwa.ts`
- Modify only if needed: `public/service-worker.js`
- Modify only if needed: `tests/unit/pwaCache.test.ts`

- [ ] **Step 1: Add failing accessibility coverage**

Add tests that:

- Open Campaign and run axe with no serious/critical violations.
- Open Prologue and run axe with no serious/critical violations.
- Confirm visible campaign/prologue controls have accessible names.
- Confirm keyboard Tab reaches Campaign, Play, Settings, High Scores on main menu in visible order.
- Confirm prologue Next/Back/Skip/Start are reachable by keyboard.
- Confirm reduced motion and high contrast markers apply on campaign/prologue screens.

Run:

```bash
npx playwright test tests/e2e/m26-accessibility.spec.ts tests/e2e/m27-campaign-flow.spec.ts --project=chromium
```

Expected: FAIL until DOM/focus/styling is complete.

- [ ] **Step 2: Add failing responsive/no-overlap coverage**

Extend the existing viewport loop or add M2.7-specific viewport checks for:

- Main menu with Campaign
- Campaign level list
- Prologue panel
- Results with campaign actions

Use viewports:

- 390x844
- 800x600
- 1024x768
- 1366x768
- 1920x1080

Expected: visible buttons/inputs/selects have positive size, fit viewport, and do not overlap.

- [ ] **Step 3: Add failing PWA/offline campaign coverage**

Add an E2E test:

```ts
test('reaches campaign and prologue while offline after online boot', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'documented WebKit offline service-worker reload issue')
  await page.goto('/?seed=2706')
  await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-pwa-runtime-cache-ready', 'true')
  await page.context().setOffline(true)
  await page.reload()
  await page.getByTestId('shell-campaign').click()
  await expect(page.getByTestId('campaign-home-pond')).toBeVisible()
  await page.getByTestId('campaign-start-prologue').click()
  await expect(page.getByTestId('campaign-prologue')).toBeVisible()
})
```

If service worker cache version must change, update both `src/runtime/pwa.ts` and `public/service-worker.js` to a matching M2.7 cache name and update `tests/unit/pwaCache.test.ts`.

- [ ] **Step 4: Add or update performance smoke**

Ensure M2.7 does not regress M2.6 performance:

- Campaign/prologue registry boot is synchronous and small.
- No new large assets or blocking network requests.
- Existing M2.6 performance smoke remains green.

If adding a M2.7 performance assertion, keep it coarse and stable.

- [ ] **Step 5: Implement fixes to pass the tests**

Likely fixes:

- Add missing labels/aria attributes.
- Adjust focus handoff for campaign/prologue.
- Tighten CSS widths, gaps, and wrapping.
- Ensure hidden panels are `hidden` and not focusable.
- Ensure campaign/prologue copy is bundled in JS and no fetch is used.

- [ ] **Step 6: Run focused E2E green**

Run:

```bash
npx playwright test tests/e2e/m26-accessibility.spec.ts tests/e2e/m26-pwa-offline.spec.ts tests/e2e/m26-performance.spec.ts tests/e2e/m27-campaign-flow.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 7: Run PWA unit tests**

Run:

```bash
npm run test:unit -- tests/unit/pwaCache.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
rm -rf test-results playwright-report
git diff --check
git add tests/e2e/m26-accessibility.spec.ts tests/e2e/m26-pwa-offline.spec.ts tests/e2e/m26-performance.spec.ts tests/e2e/m26-shell.spec.ts tests/e2e/m27-campaign-flow.spec.ts src/runtime/pwa.ts public/service-worker.js tests/unit/pwaCache.test.ts src/runtime/dom.ts src/style.css
git commit -m "test: add m27 campaign verification coverage"
```

Expected: commit created. Omit unchanged files from `git add`.

## Task 9: Documentation And Update Gates

**Files:**
- Modify: `README.md`
- Modify: `tests/unit/readmeControls.test.ts`
- Modify: `ASSET_MANIFEST.md` only if assets were added, which should not happen.
- Modify: this plan file only to check off completed task boxes if executing workers are maintaining it.

- [ ] **Step 1: Write failing README gate**

In `tests/unit/readmeControls.test.ts`, update title/expectations from M2.6 to M2.7. Assert README contains:

- `Current M2.7`
- `Home Pond Campaign Prologue`
- `Campaign`
- `Home Pond`
- `1-1 First Hunt`
- `1-2 Quick Tongue`
- `1-3 Nightfall Feast`
- `Dawn At Home Pond`
- `frogs-and-flies.save.v2`
- `frogs-and-flies.save.v1`
- `migration`
- `unlocks`
- `stars`
- `Replay Level`
- `Next Level`
- `Classic Single`
- `Local Versus`
- `no backend`
- `offline`
- `npm run test:e2e`
- `PLAYWRIGHT_BASE_URL=https://frog.resline.net`

Assert stale wording is absent:

- `Current M2.6`
- `player-facing modes are exactly \`Classic Single\` and \`Local Versus\``
- `Save key: \`frogs-and-flies.save.v1\`` as the sole primary save key
- any claim that campaign remains out of scope

- [ ] **Step 2: Run README gate red**

Run:

```bash
npm run test:unit -- tests/unit/readmeControls.test.ts
```

Expected: FAIL until README is updated.

- [ ] **Step 3: Update README**

Update `README.md` sections:

- Intro: M2.7 is a campaign prologue foundation over M2.6 product foundation.
- Current M2.7: campaign, prologue, three Home Pond levels, registry, v2 save migration.
- Shell Flow: Main Menu includes Campaign; Campaign/Prologue/Results campaign paths.
- Controls: keep M2.6 controls and add campaign keyboard/native button expectations.
- Save And Privacy: primary v2 key, v1 rollback key preservation, local-only campaign progress, no backend/cloud.
- Determinism And Smoke Parameters: document any campaign smoke params if Task 7 added them.
- Runtime markers: add campaign markers.
- Verification: focused M2.7 commands and full commands.
- PWA/Offline: campaign/prologue bundled and available offline after app shell cache.
- Docker/Coolify: production smoke for campaign.
- Assets: no new assets added for M2.7.
- Non-goals: no broad content expansion.

- [ ] **Step 4: Confirm ASSET_MANIFEST**

Run:

```bash
find public/assets public/audio -maxdepth 3 -type f 2>/dev/null | sort
git diff --name-only -- public/assets public/audio ASSET_MANIFEST.md
```

Expected: no new M2.7 assets. If no assets were added, do not edit `ASSET_MANIFEST.md`.

- [ ] **Step 5: Run README gate green**

Run:

```bash
npm run test:unit -- tests/unit/readmeControls.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run full unit tests**

Run:

```bash
npm run test:unit
```

Expected: PASS; count increased from the M2.6 128-test baseline.

- [ ] **Step 7: Commit**

Run:

```bash
git diff --check
git add README.md tests/unit/readmeControls.test.ts ASSET_MANIFEST.md docs/superpowers/plans/2026-05-17-frogs-and-flies-m27-home-pond-campaign-prologue-content-registry-implementation.md
git commit -m "docs: document m27 campaign prologue"
```

Expected: commit created. Omit unchanged files from `git add`.

## Task 10: Final Local Verification, Docker, Production Deploy, And Scope Audit

**Files:**
- Modify: this plan file only if checking final boxes.
- No code changes expected unless verification finds a bug. If a bug is found, use systematic-debugging before patching.

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

- [ ] **Step 3: Run full E2E**

Run:

```bash
npm run test:e2e
```

Expected: PASS across Chromium, Firefox, WebKit; the known WebKit PWA offline reload skip may remain documented.

- [ ] **Step 4: Run combined npm test**

Run:

```bash
npm test
```

Expected: unit and E2E pass. If this duplicates a just-completed full gate and time is constrained, consolidation may accept Step 1 plus Step 3 as the equivalent evidence, but record the decision.

- [ ] **Step 5: Run production preview campaign smoke**

Start preview:

```bash
npm run preview -- --host 127.0.0.1 --port 5176 --strictPort
```

In another shell:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium
```

Expected: PASS. Stop preview afterward.

- [ ] **Step 6: Docker build**

Run:

```bash
docker build -t frogs-and-flies-m27-campaign-prologue .
```

Expected: PASS.

- [ ] **Step 7: Docker static smoke**

Run container:

```bash
docker run --rm --name frogs-and-flies-m27 -p 18080:80 frogs-and-flies-m27-campaign-prologue
```

In another shell:

```bash
curl -I http://127.0.0.1:18080/
curl -I http://127.0.0.1:18080/manifest.webmanifest
curl -I http://127.0.0.1:18080/service-worker.js
curl -I http://127.0.0.1:18080/assets/home-pond-background.png
PLAYWRIGHT_BASE_URL=http://127.0.0.1:18080 npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium
```

Expected:

- `/` returns `200`.
- `/manifest.webmanifest` returns `200`.
- `/service-worker.js` returns `200` with JavaScript content type.
- `/assets/home-pond-background.png` returns `200`.
- Campaign E2E smoke passes.

Stop container afterward.

- [ ] **Step 8: Scope audit**

Run:

```bash
rg -n "queen|boss|biome|hazard|shop|coin|frogcoin|leaderboard|account|cloud|analytics|telemetry|payment|ad-|ads|i18n|locale|localization|spine|texturepacker" src tests README.md docs/superpowers public
rg -n "fetch\\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|navigator\\.sendBeacon" src public tests
git diff --name-only origin/ff2-m0-pixijs...HEAD
```

Expected:

- Only expected docs/tests/non-goal references and existing false positives.
- No live network/API dependency except existing same-origin service-worker fetch handling in `public/service-worker.js`.
- No new assets under `public/assets/**` or `public/audio/**`.
- `src/game/**` contains no campaign/prologue/content-registry imports.

- [ ] **Step 9: Clean generated files**

Run:

```bash
rm -rf dist test-results playwright-report
git status --short --branch
```

Expected: clean worktree except the final plan checkbox update if the worker is committing it.

- [ ] **Step 10: Final commit if plan checkboxes changed**

If this plan file was updated to mark tasks complete, commit it:

```bash
git add docs/superpowers/plans/2026-05-17-frogs-and-flies-m27-home-pond-campaign-prologue-content-registry-implementation.md
git commit -m "feat: complete m27 campaign prologue"
```

Expected: final local commit created. If no files changed, do not create an empty commit.

- [ ] **Step 11: Push**

Run:

```bash
git status --short --branch
git push origin ff2-m0-pixijs
```

Expected: push succeeds and local branch matches origin.

- [ ] **Step 12: Coolify production deploy**

Use the Coolify deployment workflow for app `frogs-and-flies-remake` on server `cx32-hell`, URL `https://frog.resline.net`.

Expected evidence to collect:

- Coolify health `OK`.
- Deployment UUID.
- Deployment status `finished`.
- App status `running:healthy`.
- Coolify deployed commit equals local HEAD.
- Server is `cx32-hell`.

- [ ] **Step 13: Production smoke**

Run:

```bash
curl -I https://frog.resline.net/
curl -I https://frog.resline.net/manifest.webmanifest
curl -I https://frog.resline.net/service-worker.js
PLAYWRIGHT_BASE_URL=https://frog.resline.net npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium
```

Expected:

- `/` returns `200`.
- `/manifest.webmanifest` returns `200`.
- `/service-worker.js` returns `200` with JavaScript content type.
- M2.7 campaign Chromium smoke passes on production.

- [ ] **Step 14: Final status**

Run:

```bash
rm -rf test-results playwright-report
git status --short --branch
```

Expected: local branch clean and synced to origin. Report deploy evidence and verification counts to the parent agent.

## Final Completion Criteria

M2.7 is complete only when all of the following are true:

- The app shows Campaign on the main menu without removing Play, Settings, High Scores, Classic Single, or Local Versus.
- Campaign exposes exactly Home Pond levels `1-1`, `1-2`, and `1-3`.
- Prologue is semantic shell UI with Next, Back, Skip, Start 1-1, and Main Menu.
- Save v2 exists under `frogs-and-flies.save.v2`, migrates valid v1 saves from `frogs-and-flies.save.v1`, and does not delete the v1 key.
- Level unlocks, pass/fail, stars, best score, objective stats, replay, next level, and reload persistence are covered by unit and E2E tests.
- `src/game/**` remains campaign-agnostic.
- No broad content expansion or live network dependency is introduced.
- README documents M2.7 accurately.
- Unit, build, E2E, Docker smoke, production deploy, and production smoke have concrete passing evidence.
