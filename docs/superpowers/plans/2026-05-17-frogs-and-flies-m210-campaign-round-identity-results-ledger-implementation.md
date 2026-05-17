# Frogs And Flies M2.10 Campaign Round Identity Results Ledger Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox syntax for tracking. If using eliteteams, execute tasks strictly sequentially: one focused specialist worker per task, then a separate consolidation worker must verify scope, diffs, tests, generated files, and evidence before the next task starts.

**Goal:** Persist campaign-launched round attempts as bounded campaign results while preventing those attempts from writing direct Classic Single high scores or top-level direct aggregate stats.

**Architecture:** Bump SaveManager to v3, keep v1/v2 keys as migration and rollback inputs, and add a validated `campaign.attempts` ledger capped to the newest 50 global campaign attempts. Make runtime round origin explicit at the app boundary so direct rounds keep the existing `recordRoundStarted()` and `recordRoundCompleted()` path, while campaign rounds record only through campaign progress. The deterministic `src/game/**` layer remains campaign-agnostic and M2.9 encounter profile ids remain runtime/content metadata, not persisted attempt identity.

**Tech Stack:** TypeScript, PixiJS v8, Vite, Vitest, Playwright, browser `localStorage`, DOM data attributes for smoke markers, SaveManager v3, Docker/nginx, Coolify deployment to `https://frog.resline.net`.

## Repository And Execution Guard

- Work only in `/mnt/disk/Home/work/app/frog/frog-m0-pixijs`.
- Do not touch sibling repo `/mnt/disk/Home/work/app/frog/app`.
- Do not revert edits made by other workers.
- The user's standing approval `Zatwierdzamy ten etap i wszystkie przyszłe` satisfies M2.10 push/deploy approval. It does not bypass the required local, Docker, Coolify deploy, production smoke, or mandatory consolidation gates; complete them in the order below.
- Use `git status --short --branch` before every task and before every commit.
- Use `git diff --check` before every commit.
- Remove generated `dist/`, `test-results/`, and `playwright-report/` unless a task explicitly asks to preserve an artifact.

## Scope Guard

M2.10 must add only:

- SaveManager v3 primary key and migration from v2 and v1.
- `campaign.attempts` as a bounded, validated, exportable/importable ledger.
- Stable campaign attempt identity using `attemptId`, `campaignId`, and `levelId`.
- Runtime separation between direct rounds and campaign attempts.
- Campaign result DOM markers for attempt id, recorded state, ledger count, and result attempt id.
- Tests and README updates for the new persistence boundary.
- Local Docker and Coolify production smoke evidence after implementation lands.

M2.10 must not add:

- Mosquito or any other new insect species.
- New levels, campaigns, prologues, modes, biomes, bosses, hazards, power-ups, assets, audio, backend, localization, monetization, accounts, cloud save, telemetry, analytics, or online leaderboard.
- Gameplay tuning changes or broad `src/game/**` refactors.
- A dedicated campaign ledger/history UI.
- Persistence of `encounterProfileId`, content profile id, visual tone, asset ids, or future species ids in attempt summaries.
- Cleanup of older v2 Classic Single high-score rows that may have been created by M2.9 campaign play.
- Expansion of top-level aggregate stats for campaign history.

Direct Classic Single and Local Versus behavior must remain unchanged except that existing v1/v2 saves migrate to v3. Campaign attempts must not write Classic Single high scores, `stats`, `startedRoundIds`, or `completedRoundIds`.

If implementation appears to require breaking a scope guard, stop and return `BLOCKED_SCOPE_EXPANSION` to consolidation.

## Port And Server Policy

Do not assume default Vite port `5173` is free. Use explicit `5176` unless it is occupied.

```bash
npm run dev -- --host 127.0.0.1 --port 5176 --strictPort
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npx playwright test tests/e2e/m210-campaign-attempt-ledger.spec.ts --project=chromium
```

For production preview:

```bash
npm run preview -- --host 127.0.0.1 --port 5176 --strictPort
```

Docker nginx serves container port `80`. Use host port `18080` to avoid common `8080` conflicts.

```bash
docker run --rm --name frogs-and-flies-m210 -p 18080:80 frogs-and-flies-m210-campaign-ledger
```

Stop dev/preview/Docker processes started for verification before handing off.

## Current File Structure Map

### Existing Baseline To Preserve

- `src/runtime/save.ts` owns SaveManager v2, `SAVE_SCHEMA_VERSION = 2`, primary key `frogs-and-flies.save.v2`, v1 migration, high scores, aggregate stats, started/completed round ids, import/export, and direct round recorders.
- `src/runtime/campaignProgress.ts` owns campaign defaults, validation, prologue seen state, selected level, level progress, unlocks, stars, objective stats, and `recordCampaignLevelResult()`.
- `src/runtime/app.ts` owns runtime launch flow. Current campaign launch calls `beginRound()`, which writes direct started-round stats before assigning `activeCampaignContext`; results then call `recordRoundCompleted()` before `recordCampaignResultIfNeeded()`.
- `src/runtime/dom.ts` owns shell/results DOM. Current campaign markers include `data-active-campaign-level`, `data-campaign-encounter-profile`, `data-campaign-result-level`, `data-campaign-result-passed`, and `data-campaign-result-stars`.
- `src/content/registry.ts` and `src/content/types.ts` define the one Home Pond campaign, three levels, three content profiles, and three M2.9 encounter profiles.
- `tests/unit/saveManager.test.ts` covers v2 defaults, v1 migration, high scores, stats, import/export, and runtime options.
- `tests/unit/campaignProgress.test.ts` covers campaign defaults, selection, level result recording, unlocks, bests, and validation.
- `tests/e2e/m27-campaign-flow.spec.ts` covers campaign launch, failure, pass, next level, persistence, and currently reads `frogs-and-flies.save.v2`.
- `tests/e2e/m29-encounter-profiles.spec.ts` covers campaign encounter markers and verifies v2 saved JSON does not contain encounter profile ids.
- `tests/e2e/m26-persistence.spec.ts`, `tests/e2e/m26-shell.spec.ts`, `tests/e2e/m26-audio.spec.ts`, and `tests/e2e/m26-input.spec.ts` contain save-key assumptions.
- `README.md` and `tests/unit/readmeControls.test.ts` document and gate current M2.9 behavior.
- `Dockerfile` and `nginx.conf` already support static Vite/nginx deployment and should not need functional changes.

### Create

- `tests/e2e/m210-campaign-attempt-ledger.spec.ts` - focused Playwright proof for v3 campaign attempt ledger, direct high-score separation, attempt ids, replay/next distinct attempts, and v2 migration.

### Modify

- `src/runtime/save.ts` - bump to v3, add v2 key constant, add campaign attempt type, load order v3 -> v2 -> v1, migration, validation, cloning, import/export, and tests-facing constants.
- `src/runtime/campaignProgress.ts` - add `attempts` defaults/validation/cloning and new idempotent campaign attempt recorder that updates progress plus ledger in one operation.
- `src/runtime/app.ts` - replace inferred campaign state with explicit direct/campaign round context, avoid direct round recording for campaign attempts, build campaign summaries, and generate distinct campaign attempt ids.
- `src/runtime/dom.ts` - add campaign attempt DOM markers and neutral campaign result copy while leaving direct result/high-score UI unchanged.
- `tests/unit/saveManager.test.ts` - update v3 expectations, v2/v1 migration, import/export, ledger validation, and direct high-score regression coverage.
- `tests/unit/campaignProgress.test.ts` - cover default empty ledger, append, idempotency, trimming, validation, no encounter persistence, and no direct save mutation contract.
- `tests/e2e/m27-campaign-flow.spec.ts` - update save key to v3 and keep existing campaign progress expectations green.
- `tests/e2e/m29-encounter-profiles.spec.ts` - update save key to v3 while preserving runtime-only encounter profile assertions.
- `tests/e2e/m26-persistence.spec.ts`, `tests/e2e/m26-shell.spec.ts`, `tests/e2e/m26-audio.spec.ts`, `tests/e2e/m26-input.spec.ts` - update primary key to v3 and legacy key expectations where needed.
- `README.md` - document current M2.10 save/runtime boundary, v3/v2/v1 keys, campaign attempt ledger, direct high-score separation, markers, and non-goals.
- `tests/unit/readmeControls.test.ts` - update docs gates and stale claim guards.

### Do Not Modify Unless A Failing Test Proves An Existing Bug Blocks M2.10

- `src/game/**`
- `src/render/**`
- `src/runtime/assets.ts`
- `src/runtime/audio.ts`
- `src/runtime/pwa.ts`
- `public/assets/**`
- `public/audio/**`
- `ASSET_MANIFEST.md`
- `public/service-worker.js`
- `Dockerfile`
- `nginx.conf`
- `package.json`
- `package-lock.json`

## Required Data Contracts

Add these contracts in `src/runtime/save.ts` or the nearest existing save-owned type boundary:

```ts
export const SAVE_SCHEMA_VERSION = 3
export const SAVE_STORAGE_KEY_V1 = 'frogs-and-flies.save.v1'
export const SAVE_STORAGE_KEY_V2 = 'frogs-and-flies.save.v2'
export const SAVE_STORAGE_KEY = 'frogs-and-flies.save.v3'
export const CAMPAIGN_ATTEMPT_LEDGER_LIMIT = 50

export interface CampaignAttemptSummary {
  attemptId: string
  campaignId: CampaignId
  levelId: CampaignLevelId
  completedAt: string
  seed: number
  difficulty: DifficultyMode
  durationSeconds: number
  timeRemainingSeconds: number
  score: number
  catches: number
  attempts: number
  accuracy: number
  splashes: number
  maxCombo: number
  passed: boolean
  stars: 0 | 1 | 2 | 3
}

export interface CampaignProgress {
  seenPrologueIds: string[]
  levels: Record<string, CampaignLevelProgress>
  attempts: CampaignAttemptSummary[]
  lastSelectedCampaignId?: string
  lastSelectedLevelId?: string
}
```

Validation rules:

- Keep only known `campaignId` and `levelId` pairs from the registry.
- Drop attempts with empty/non-string `attemptId`.
- Drop attempts with invalid `difficulty`, invalid timestamp, invalid stars, or non-finite/negative numeric stats.
- Trim to the newest 50 valid attempts, preserving oldest-to-newest order within the retained slice.
- Drop malformed attempts instead of invalidating the whole save.
- Do not persist `encounterProfileId`.

Recommended runtime shape in `src/runtime/app.ts`:

```ts
type ActiveRoundContext =
  | {
      kind: 'direct'
      roundId: string
      mode: MatchMode
    }
  | {
      kind: 'campaign'
      roundId: string
      campaignAttemptId: string
      campaignId: CampaignId
      levelId: CampaignLevelId
      encounterProfileId: EncounterProfileId
      launchedFrom: 'campaign'
    }
```

Attempt id format can be:

```ts
`campaign:${campaignId}:${levelId}:${runtimeSessionId}:${campaignAttemptCounter}`
```

## Execution Rules

- Use superpowers:test-driven-development for every behavior change: write a focused failing test, run it red, implement the smallest change, run it green, then commit.
- Use superpowers:systematic-debugging before patching unexpected failures.
- Use superpowers:verification-before-completion before every completion claim, final commit, push, deploy, or production smoke claim.
- If using eliteteams, each task must be implemented by one focused worker and consolidated by a separate reviewer before the next task starts.
- Consolidation after every task must inspect:
  - `git status --short --branch`
  - `git show --stat --oneline HEAD`
  - `git diff --check`
  - relevant test output
  - generated files cleanup
  - scope guards
- Keep commits task-sized. Recommended commit messages are listed under each task.

## Task 1: Baseline Audit And Dirty Guard

**Files:**
- Read: `docs/superpowers/specs/2026-05-17-frogs-and-flies-m210-campaign-round-identity-results-ledger-design.md`
- Read: `docs/superpowers/plans/2026-05-17-frogs-and-flies-m29-home-pond-encounter-mechanics-profiles-implementation.md`
- Read: `src/runtime/save.ts`
- Read: `src/runtime/campaignProgress.ts`
- Read: `src/runtime/app.ts`
- Read: `src/runtime/dom.ts`
- Read: `tests/unit/saveManager.test.ts`
- Read: `tests/unit/campaignProgress.test.ts`
- Read: `tests/e2e/m27-campaign-flow.spec.ts`
- Read: `tests/e2e/m29-encounter-profiles.spec.ts`
- Read: `tests/e2e/m26-persistence.spec.ts`
- Read: `README.md`
- Read: `package.json`

- [ ] **Step 1: Confirm branch and dirty state**

Run:

```bash
git branch --show-current
git status --short --branch
git log --oneline --decorate -8
```

Expected: branch is `ff2-m0-pixijs`; worktree is clean except changes by the current worker; recent history includes `7769003 docs: add m210 campaign round identity spec`.

- [ ] **Step 2: Confirm no existing M2.10 implementation work needs preservation**

Run:

```bash
rg -n "SAVE_SCHEMA_VERSION|frogs-and-flies.save.v3|CampaignAttemptSummary|campaign-attempt|data-campaign-attempt|data-active-round-scope|recordCampaignAttempt" src tests README.md docs/superpowers/plans
git status --short
```

Expected: M2.10 terms appear only in the spec and this plan before implementation. If `src/`, `tests/`, or `README.md` already contain M2.10 code/docs, stop and inspect those edits instead of overwriting them.

- [ ] **Step 3: Run focused baseline unit tests**

Run:

```bash
npm run test:unit -- tests/unit/saveManager.test.ts tests/unit/campaignProgress.test.ts tests/unit/readmeControls.test.ts
```

Expected: PASS on the M2.9 baseline.

- [ ] **Step 4: Run focused baseline campaign E2E**

Run:

```bash
npx playwright test tests/e2e/m27-campaign-flow.spec.ts tests/e2e/m29-encounter-profiles.spec.ts --project=chromium
```

Expected: PASS on the M2.9 baseline.

- [ ] **Step 5: Record baseline findings in the task handoff**

Record these observed baseline facts:

- `src/runtime/save.ts` is v2 with primary key `frogs-and-flies.save.v2`.
- `src/runtime/campaignProgress.ts` has no `attempts` ledger.
- `src/runtime/app.ts` currently calls `beginRound()` for campaign launches, which writes direct started-round stats.
- `refresh()` currently invokes `recordCompletedRoundIfNeeded()` before `recordCampaignResultIfNeeded()`.
- `tests/e2e/*` save-key constants currently use v2.

- [ ] **Step 6: Commit only if task evidence is written to a file**

If Task 1 changes no files, do not commit. If evidence is written into this plan during execution, commit only the plan evidence:

```bash
git add docs/superpowers/plans/2026-05-17-frogs-and-flies-m210-campaign-round-identity-results-ledger-implementation.md
git commit -m "docs: record m210 baseline audit"
```

- [ ] **Step 7: Mandatory consolidation**

Run:

```bash
git status --short --branch
git diff --check
```

Expected: no unexpected files, no whitespace errors, generated output cleaned. Consolidator confirms no sibling repo edits and no scope guard violations before Task 2 starts.

## Task 2: SaveManager V3 Schema, Migration, And Ledger Validation

**Files:**
- Modify: `src/runtime/save.ts`
- Modify: `src/runtime/campaignProgress.ts`
- Modify: `tests/unit/saveManager.test.ts`
- Modify: `tests/unit/campaignProgress.test.ts`

- [ ] **Step 1: Write failing SaveManager v3 default and key tests**

Update `tests/unit/saveManager.test.ts` to expect:

```ts
expect(SAVE_SCHEMA_VERSION).toBe(3)
expect(SAVE_STORAGE_KEY).toBe('frogs-and-flies.save.v3')
expect(saveApi.SAVE_STORAGE_KEY_V2).toBe('frogs-and-flies.save.v2')
expect(SAVE_STORAGE_KEY_V1).toBe('frogs-and-flies.save.v1')
expect(createDefaultSave().version).toBe(3)
expect(createDefaultSave().campaign.attempts).toEqual([])
```

Also keep:

```ts
const serialized = JSON.stringify(createDefaultSave())
expect(serialized).not.toContain('encounterProfile')
expect(serialized).not.toContain('home-pond-nightfall-pressure')
```

- [ ] **Step 2: Write failing v2 and v1 migration tests**

Add a `createLegacyV2Save()` helper shaped like current v2:

```ts
function createLegacyV2Save(): Record<string, unknown> {
  const current = createDefaultSave()
  return {
    ...current,
    version: 2,
    campaign: {
      seenPrologueIds: ['home-pond-dawn-prologue'],
      levels: current.campaign.levels,
      lastSelectedCampaignId: 'home-pond',
      lastSelectedLevelId: 'home-pond-1-1-first-hunt',
    },
  }
}
```

Expect v2 load order and preservation:

```ts
const storage = createMemoryStorage({
  [SAVE_STORAGE_KEY_V2]: JSON.stringify(createLegacyV2Save()),
})
const result = createSaveManager({ storage }).load()

expect(result.status).toBe('migrated')
expect(result.data.version).toBe(3)
expect(result.data.campaign.attempts).toEqual([])
expect(storage.getItem(SAVE_STORAGE_KEY_V2)).not.toBeNull()
expect(storage.getItem(SAVE_STORAGE_KEY)).toContain('"version":3')
```

Update v1 migration expectations to v3 plus empty attempts.

- [ ] **Step 3: Write failing v3 import/export and validation tests**

Add tests proving:

```ts
const save = createDefaultSave()
save.campaign.attempts = [
  {
    attemptId: 'campaign:home-pond:home-pond-1-1-first-hunt:test:1',
    campaignId: 'home-pond',
    levelId: 'home-pond-1-1-first-hunt',
    completedAt: '2026-05-17T12:00:00.000Z',
    seed: 42,
    difficulty: 'classic-standard',
    durationSeconds: 180,
    timeRemainingSeconds: 25,
    score: 900,
    catches: 9,
    attempts: 10,
    accuracy: 0.9,
    splashes: 1,
    maxCombo: 4,
    passed: true,
    stars: 3,
  },
]

const result = importJson()(exportJson()(save))
expect(result.status).toBe('imported')
expect(result.data?.campaign.attempts).toEqual(save.campaign.attempts)
expect(exportJson()(save)).not.toContain('encounterProfile')
```

Add malformed attempts and unknown ids and expect they are dropped, not fatal:

```ts
const raw = createDefaultSave()
raw.campaign.attempts = [
  validAttempt,
  { ...validAttempt, attemptId: '' },
  { ...validAttempt, levelId: 'unknown-level' as never },
  { ...validAttempt, completedAt: 'not-a-date' },
  { ...validAttempt, stars: 9 as never },
  { ...validAttempt, score: Number.NaN },
]
const imported = importJson()(JSON.stringify(raw))
expect(imported.data?.campaign.attempts).toEqual([validAttempt])
```

- [ ] **Step 4: Run schema tests red**

Run:

```bash
npm run test:unit -- tests/unit/saveManager.test.ts tests/unit/campaignProgress.test.ts
```

Expected: FAIL because v3 constants, migration, and attempt validation do not exist yet.

- [ ] **Step 5: Implement SaveManager v3 constants and types**

In `src/runtime/save.ts`:

- Set `SAVE_SCHEMA_VERSION = 3`.
- Add `SAVE_STORAGE_KEY_V2 = 'frogs-and-flies.save.v2'`.
- Set `SAVE_STORAGE_KEY = 'frogs-and-flies.save.v3'`.
- Add `CAMPAIGN_ATTEMPT_LEDGER_LIMIT = 50`.
- Add `CampaignAttemptSummary`.
- Add `attempts: CampaignAttemptSummary[]` to `CampaignProgress`.
- Keep `SAVE_STORAGE_KEY_V1` unchanged.

- [ ] **Step 6: Implement load order v3, v2, v1**

In `createSaveManager().load()`:

```ts
const currentText = storage.getItem(SAVE_STORAGE_KEY)
if (currentText !== null) return loadJson(currentText, 'loaded')

const legacyV2Text = storage.getItem(SAVE_STORAGE_KEY_V2)
if (legacyV2Text !== null) {
  const migrated = loadJson(legacyV2Text, 'migrated')
  if (migrated.status === 'migrated') {
    storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(migrated.data))
  }
  return migrated
}

const legacyV1Text = storage.getItem(SAVE_STORAGE_KEY_V1)
```

Expected behavior: v3 wins if present; v2 migrates and writes v3; v1 migrates and writes v3; no migration deletes v2 or v1.

- [ ] **Step 7: Implement v2 migration helpers**

Add a v2 interface and migration path:

```ts
interface SaveDataV2 extends Omit<SaveDataV1, 'version'> {
  version: 2
  campaign: Omit<CampaignProgress, 'attempts'>
}
```

Update `migrate()`:

```ts
switch (raw.version) {
  case 3:
    return validateV3(raw)
  case 2:
    return migrateV2ToV3(validateV2(raw))
  case 1:
    return migrateV1ToV3(validateV1(raw))
  default:
    return undefined
}
```

`migrateV2ToV3()` must preserve settings, input profiles, high scores, aggregate stats, started/completed round ids, seen prologue ids, selected campaign/level ids, and known level progress fields, then set `campaign.attempts = []`.

- [ ] **Step 8: Implement campaign attempts defaults, cloning, and validation**

In `src/runtime/campaignProgress.ts`:

- Add `attempts: []` in `createDefaultCampaignProgress()`.
- Add attempts validation in `validateCampaignProgress()`.
- Add attempts cloning in `cloneCampaignProgress()`.
- Add helpers to validate known campaign/level ids, timestamp, stars, finite non-negative stats, and ledger cap.
- Keep validation forgiving: malformed attempts are dropped.

Required trim behavior:

```ts
return validAttempts.slice(-CAMPAIGN_ATTEMPT_LEDGER_LIMIT)
```

Preserve retained order oldest to newest.

- [ ] **Step 9: Run schema tests green**

Run:

```bash
npm run test:unit -- tests/unit/saveManager.test.ts tests/unit/campaignProgress.test.ts
npm run build
git diff --check
```

Expected: SaveManager and campaign progress unit tests PASS; TypeScript build PASS; no whitespace errors.

- [ ] **Step 10: Commit**

Run:

```bash
git add src/runtime/save.ts src/runtime/campaignProgress.ts tests/unit/saveManager.test.ts tests/unit/campaignProgress.test.ts
git commit -m "feat: migrate saves to v3 campaign ledger"
```

Expected: commit contains only v3 schema/migration/default/validation work and focused unit tests.

- [ ] **Step 11: Mandatory consolidation**

Run:

```bash
git status --short --branch
git show --stat --oneline HEAD
git diff --check
```

Expected: clean worktree except allowed generated files already removed. Consolidator verifies no `src/game/**`, assets, audio, Docker, nginx, or sibling repo edits.

## Task 3: Campaign Progress Attempt Recorder And Bounded Ledger

**Files:**
- Modify: `src/runtime/campaignProgress.ts`
- Modify: `tests/unit/campaignProgress.test.ts`
- Optional Modify: `tests/unit/saveManager.test.ts` if direct-save immutability assertions belong there.

- [ ] **Step 1: Write failing append and idempotency tests**

In `tests/unit/campaignProgress.test.ts`, add tests for a new recorder such as `recordCampaignAttemptResult()`:

```ts
const attempt = {
  attemptId: 'campaign:home-pond:home-pond-1-1-first-hunt:test:1',
  campaignId: 'home-pond' as const,
  levelId: LEVEL_11.id,
  completedAt: '2026-05-17T12:00:00.000Z',
  seed: 2101,
  difficulty: 'classic-standard' as const,
  durationSeconds: 180,
  timeRemainingSeconds: 12,
  score: 700,
  catches: 8,
  attempts: 9,
  accuracy: 8 / 9,
  splashes: 1,
  maxCombo: 5,
  passed: true,
  stars: 2 as const,
}

const first = recordCampaignAttemptResult(createDefaultCampaignProgress(), LEVEL_11, attempt)
const second = recordCampaignAttemptResult(first, LEVEL_11, attempt)

expect(first.attempts).toEqual([attempt])
expect(first.levels[LEVEL_11.id].objectiveStats.attempts).toBe(1)
expect(second.attempts).toEqual([attempt])
expect(second.levels[LEVEL_11.id].objectiveStats.attempts).toBe(1)
```

The important assertions are immutable append and exact-id idempotency.

- [ ] **Step 2: Write failing trim and level-progress tests**

Add tests proving:

```ts
let progress = createDefaultCampaignProgress()
for (let index = 0; index < 55; index += 1) {
  progress = recordCampaignAttemptResult(progress, LEVEL_11, {
    ...attempt,
    attemptId: `campaign:home-pond:${LEVEL_11.id}:test:${index}`,
    completedAt: new Date(Date.UTC(2026, 4, 17, 12, index)).toISOString(),
    score: index,
    passed: index % 2 === 0,
    stars: (index % 4) as 0 | 1 | 2 | 3,
  })
}

expect(progress.attempts).toHaveLength(50)
expect(progress.attempts[0].attemptId).toContain(':5')
expect(progress.attempts[49].attemptId).toContain(':54')
```

Add assertions that passes unlock the next level, failures do not, bests/stars are not lowered, and `lastPlayedAt` equals `attempt.completedAt`.

- [ ] **Step 3: Write failing no direct-save mutation contract test**

Use unit tests to make the product boundary explicit:

```ts
const save = createDefaultSave()
const nextCampaign = recordCampaignAttemptResult(save.campaign, LEVEL_11, attempt)

expect(save.highScores.classicSingle).toEqual([])
expect(save.stats.roundsStarted).toBe(0)
expect(save.stats.roundsCompleted).toBe(0)
expect(save.startedRoundIds).toEqual([])
expect(save.completedRoundIds).toEqual([])
expect(nextCampaign.attempts).toHaveLength(1)
```

This test can live in `campaignProgress.test.ts` or `saveManager.test.ts`; it should fail before the recorder exists.

- [ ] **Step 4: Run recorder tests red**

Run:

```bash
npm run test:unit -- tests/unit/campaignProgress.test.ts tests/unit/saveManager.test.ts
```

Expected: FAIL because `recordCampaignAttemptResult()` and ledger idempotency do not exist yet.

- [ ] **Step 5: Implement `recordCampaignAttemptResult()`**

In `src/runtime/campaignProgress.ts`, add:

```ts
export function recordCampaignAttemptResult(
  progress: CampaignProgress,
  level: CampaignLevelDefinition,
  attempt: CampaignAttemptSummary,
): CampaignProgress
```

Behavior:

- Start from `validateCampaignProgress(progress)`.
- If `next.attempts.some((entry) => entry.attemptId === attempt.attemptId)`, return `cloneCampaignProgress(next)` without incrementing objective stats or appending.
- Evaluate level progress from `attempt.passed` and `attempt.stars`.
- Update objective stats exactly once:
  - `attempts += 1`
  - `passes += attempt.passed ? 1 : 0`
  - best score/catches/time remaining using current max behavior
- Update `unlocked`, `passed`, `bestScore`, `stars`, and `lastPlayedAt`.
- Unlock `level.unlocksLevelId` only when `attempt.passed`.
- Append a sanitized copy of `attempt`.
- Trim to last 50.

Keep `recordCampaignLevelResult()` only if existing tests or callers still need it; otherwise make it a small compatibility wrapper or replace call sites in a later task. Avoid duplicating level-progress logic.

- [ ] **Step 6: Run recorder tests green**

Run:

```bash
npm run test:unit -- tests/unit/campaignProgress.test.ts tests/unit/saveManager.test.ts
npm run build
git diff --check
```

Expected: PASS; build PASS; no whitespace errors.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/runtime/campaignProgress.ts tests/unit/campaignProgress.test.ts tests/unit/saveManager.test.ts
git commit -m "feat: record campaign attempt summaries"
```

Expected: commit contains recorder and focused unit tests only.

- [ ] **Step 8: Mandatory consolidation**

Run:

```bash
git status --short --branch
git show --stat --oneline HEAD
git diff --check
```

Expected: clean scope. Consolidator verifies recorder persists stable campaign/level ids only and does not persist encounter profile ids.

## Task 4: Runtime Round Origin Identity And High-Score Separation

**Files:**
- Modify: `src/runtime/app.ts`
- Modify: `src/runtime/dom.ts` only if shell sync types need new fields for compile.
- Modify: `tests/unit/saveManager.test.ts` if direct record regression needs strengthening.
- Optional Modify: `tests/e2e/m26-shell.spec.ts` if direct started-round marker expectations need key updates from Task 2.

- [ ] **Step 1: Write failing direct recorder regression tests**

Keep direct SaveManager behavior explicit in `tests/unit/saveManager.test.ts`:

```ts
it('keeps direct Classic Single and Local Versus round recorders unchanged', () => {
  const classic = recordRoundCompleted()(recordRoundStarted()(createDefaultSave(), 'classic-1'), summary())
  const versus = recordRoundCompleted()(
    recordRoundStarted()(createDefaultSave(), 'versus-1'),
    summary({ roundId: 'versus-1', mode: 'local-versus', winner: 'tie' }),
  )

  expect(classic.stats.roundsStarted).toBe(1)
  expect(classic.stats.roundsCompleted).toBe(1)
  expect(classic.highScores.classicSingle).toHaveLength(1)
  expect(classic.campaign.attempts).toEqual([])
  expect(versus.highScores.localVersus).toHaveLength(1)
  expect(versus.campaign.attempts).toEqual([])
})
```

This may already pass; keep it as a regression gate for the runtime split.

- [ ] **Step 2: Write failing runtime unit or E2E assertion for campaign non-leak**

If unit-level runtime harnessing is not practical, defer the full proof to Task 6 E2E. At minimum, add compile-time and app-level expectations in Task 4 implementation:

- Campaign launch must not call `recordRoundStarted()`.
- Campaign result must not call `recordRoundCompleted()`.
- Direct `startGameplay()`, keyboard Enter, pointer start, direct replay, and Local Versus still call direct recorders.

- [ ] **Step 3: Run focused tests red or document already-green regression**

Run:

```bash
npm run test:unit -- tests/unit/saveManager.test.ts
```

Expected: PASS for direct recorders. If a newly added runtime-level test exists, it should FAIL before implementation.

- [ ] **Step 4: Add explicit active round context**

In `src/runtime/app.ts`, replace or wrap `activeRoundId`, `roundRecorded`, and `activeCampaignContext` with an explicit context:

```ts
type ActiveRoundContext =
  | { kind: 'direct'; roundId: string; mode: MatchMode }
  | {
      kind: 'campaign'
      roundId: string
      campaignAttemptId: string
      campaignId: CampaignId
      levelId: CampaignLevelId
      encounterProfileId: EncounterProfileId
      launchedFrom: 'campaign'
    }
```

Keep M2.9 `encounterProfileId` only in runtime context for markers and tuning.

- [ ] **Step 5: Split direct and campaign round start**

Replace `beginRound()` with focused helpers:

```ts
function beginDirectRound(): void {
  const roundId = createRoundId(currentRuntimeParams.mode)
  activeRoundContext = { kind: 'direct', roundId, mode: currentRuntimeParams.mode }
  roundRecorded = false
  highScoreStatus = 'Local high score status pending.'
  persistSave(recordRoundStarted(saveData, roundId))
}

function beginCampaignAttempt(level, encounterHandoff): void {
  const roundId = createRoundId('classic-single')
  const campaignAttemptId = createCampaignAttemptId(level.campaignId, level.id)
  activeRoundContext = {
    kind: 'campaign',
    roundId,
    campaignAttemptId,
    campaignId: level.campaignId,
    levelId: level.id,
    encounterProfileId: encounterHandoff.encounterProfileId,
    launchedFrom: 'campaign',
  }
  roundRecorded = false
  campaignResultRecordedAttemptId = ''
  highScoreStatus = 'Campaign result pending.'
}
```

Campaign start must not call `recordRoundStarted()`.

- [ ] **Step 6: Split result recording**

Change `recordCompletedRoundIfNeeded()` so it returns immediately unless the active context is direct:

```ts
if (activeRoundContext?.kind !== 'direct' || roundRecorded) {
  return
}
```

Change `recordCampaignResultIfNeeded()` to require campaign context and use `recordCampaignAttemptResult()`:

```ts
if (context.kind !== 'campaign' || campaignResultRecordedAttemptId === context.campaignAttemptId) {
  return
}
```

Build `CampaignAttemptSummary` from P1 stats:

- `attemptId: context.campaignAttemptId`
- `campaignId: context.campaignId`
- `levelId: context.levelId`
- `completedAt: now`
- `seed: currentRuntimeParams.seed`
- `difficulty: currentRuntimeParams.options.difficulty`
- `durationSeconds: game.durationSeconds`
- `timeRemainingSeconds: game.remainingSeconds`
- `score`, `catches` using campaign smoke overrides only when campaign context exists
- `attempts: player.stats.attempts`
- `accuracy: catches / attempts` or `0`
- `splashes: player.stats.misses`
- `maxCombo: player.stats.combo`
- `passed`, `stars` from objective evaluation

Set `campaignResultRecordedAttemptId = context.campaignAttemptId` only after successful campaign progress update.

- [ ] **Step 7: Ensure restart/replay/next create new campaign attempt ids**

Update flows:

- `launchCampaignLevel(levelId)` creates a new `campaignAttemptId` every call.
- `handleRestartClick()` for a campaign context creates a new campaign attempt id and does not call direct `recordRoundStarted()`.
- Replay Level calls `launchCampaignLevel()` and gets a new attempt id.
- Next Level calls `launchCampaignLevel()` for next level and gets a new attempt id.
- `startGameplay()`, `selectMode()`, `Digit1`, `Digit2`, Change Mode, Classic Modes, and Main Menu clear campaign context and begin direct behavior when gameplay starts.

- [ ] **Step 8: Run runtime-focused tests green**

Run:

```bash
npm run test:unit -- tests/unit/saveManager.test.ts tests/unit/campaignProgress.test.ts
npm run build
git diff --check
```

Expected: PASS; build PASS; no whitespace errors. Full campaign non-leak proof lands in Task 6 E2E.

- [ ] **Step 9: Commit**

Run:

```bash
git add src/runtime/app.ts src/runtime/dom.ts tests/unit/saveManager.test.ts
git commit -m "fix: split campaign rounds from direct high scores"
```

Expected: commit contains runtime split and any compile-type support only. If `src/runtime/dom.ts` or tests were not changed, omit them from `git add`.

- [ ] **Step 10: Mandatory consolidation**

Run:

```bash
git status --short --branch
git show --stat --oneline HEAD
git diff --check
```

Expected: consolidator verifies direct Classic Single and Local Versus code paths still use direct recorders, while campaign launch/results do not.

## Task 5: Campaign Results DOM Markers And UI Copy Without Dedicated Ledger UI

**Files:**
- Modify: `src/runtime/dom.ts`
- Modify: `src/runtime/app.ts`
- Modify: `tests/e2e/m27-campaign-flow.spec.ts` only if existing result assertions need updated neutral copy.
- Optional Modify: `tests/e2e/m29-encounter-profiles.spec.ts` if marker clearing assertions naturally expand.

- [ ] **Step 1: Write failing DOM marker expectations**

Add or prepare E2E expectations in Task 6 for these markers:

```ts
await expect(shell).toHaveAttribute('data-active-round-scope', 'campaign')
await expect(shell).toHaveAttribute('data-campaign-attempt-id', /campaign:home-pond:/)
await expect(shell).toHaveAttribute('data-campaign-attempt-recorded', 'true')
await expect(shell).toHaveAttribute('data-campaign-attempt-ledger-count', '1')
await expect(page.getByTestId('campaign-result-status')).toHaveAttribute('data-campaign-result-attempt-id', /campaign:home-pond:/)
await expect(page.getByTestId('results-high-score-status')).toContainText(/campaign result recorded/i)
await expect(page.getByTestId('results-high-score-status')).not.toContainText(/high score/i)
```

Direct mode expectations:

```ts
await expect(shell).toHaveAttribute('data-active-round-scope', 'direct')
await expect(shell).not.toHaveAttribute('data-campaign-attempt-id')
await expect(shell).not.toHaveAttribute('data-campaign-attempt-recorded')
await expect(page.getByTestId('results-high-score-status')).toContainText(/local high score/i)
```

- [ ] **Step 2: Run E2E marker test red if Task 6 file already exists**

If `tests/e2e/m210-campaign-attempt-ledger.spec.ts` already exists, run:

```bash
npx playwright test tests/e2e/m210-campaign-attempt-ledger.spec.ts --project=chromium --grep "markers"
```

Expected: FAIL because the markers are not implemented yet. If Task 6 has not created the E2E file yet, document this as a planned red test and continue with unit/build checks.

- [ ] **Step 3: Extend DOM sync types**

In `src/runtime/dom.ts`, add fields to `ShellDomSyncState`:

```ts
activeRoundScope?: 'direct' | 'campaign'
activeCampaignAttemptId?: string
campaignAttemptRecorded?: boolean
campaignAttemptLedgerCount?: number
```

Add to `CampaignResultDomSummary`:

```ts
attemptId: string
```

- [ ] **Step 4: Sync shell markers**

In `syncCampaignShellMarkers()` or a focused helper:

- Always set `data-active-round-scope` to `shellSync.activeRoundScope ?? 'direct'`.
- Set `data-campaign-attempt-ledger-count` to `String(shellSync.campaignAttemptLedgerCount ?? progress.attempts.length)`.
- Set `data-campaign-attempt-id` only when an active campaign attempt exists.
- Set `data-campaign-attempt-recorded` only when an active campaign attempt exists; value is `true` or `false`.
- Remove campaign attempt id/recorded markers when not in campaign context.
- Keep existing encounter profile marker behavior unchanged and runtime-only.

- [ ] **Step 5: Sync result attempt marker**

In `syncCampaignResultActions()`:

- When no campaign result exists, remove `data-campaign-result-attempt-id`.
- When campaign result exists, set `data-campaign-result-attempt-id` to `result.attemptId`.
- Keep `data-campaign-result-level`, `data-campaign-result-passed`, and `data-campaign-result-stars`.
- Do not add a ledger browser or history list.

- [ ] **Step 6: Pass marker data from runtime**

In `src/runtime/app.ts`, pass these values into `syncDom()`:

```ts
activeRoundScope: activeRoundContext?.kind ?? 'direct',
activeCampaignAttemptId: activeRoundContext?.kind === 'campaign' ? activeRoundContext.campaignAttemptId : undefined,
campaignAttemptRecorded:
  activeRoundContext?.kind === 'campaign'
    ? campaignResultRecordedAttemptId === activeRoundContext.campaignAttemptId
    : undefined,
campaignAttemptLedgerCount: saveData.campaign.attempts.length,
```

When building `latestCampaignResultSummary`, include `attemptId: context.campaignAttemptId`.

- [ ] **Step 7: Update campaign high-score status copy**

For campaign results, ensure the existing `results-high-score-status` line uses neutral copy:

```ts
highScoreStatus = 'Campaign result recorded.'
```

It must not say "New local high score recorded" or "Local high score already recorded" for campaign attempts.

- [ ] **Step 8: Run DOM/build checks green**

Run:

```bash
npm run build
npx playwright test tests/e2e/m27-campaign-flow.spec.ts tests/e2e/m29-encounter-profiles.spec.ts --project=chromium
git diff --check
```

Expected: build PASS; existing M2.7/M2.9 campaign E2E still PASS; no whitespace errors.

- [ ] **Step 9: Commit**

Run:

```bash
git add src/runtime/dom.ts src/runtime/app.ts tests/e2e/m27-campaign-flow.spec.ts tests/e2e/m29-encounter-profiles.spec.ts
git commit -m "feat: expose campaign attempt result markers"
```

Expected: commit contains DOM/runtime marker and neutral result-copy changes only. If E2E files were not modified in this task, omit them.

- [ ] **Step 10: Mandatory consolidation**

Run:

```bash
git status --short --branch
git show --stat --oneline HEAD
git diff --check
```

Expected: consolidator confirms no dedicated ledger UI was added and direct high-score UI remains local direct modes only.

## Task 6: E2E Persistence And High-Score Separation

**Files:**
- Create: `tests/e2e/m210-campaign-attempt-ledger.spec.ts`
- Modify: `tests/e2e/m27-campaign-flow.spec.ts`
- Modify: `tests/e2e/m29-encounter-profiles.spec.ts`
- Modify: `tests/e2e/m26-persistence.spec.ts`
- Modify: `tests/e2e/m26-shell.spec.ts`
- Modify: `tests/e2e/m26-audio.spec.ts`
- Modify: `tests/e2e/m26-input.spec.ts`

- [ ] **Step 1: Update primary save keys in existing E2E tests**

Replace primary save key constants with v3:

```ts
const SAVE_KEY = 'frogs-and-flies.save.v3'
const LEGACY_SAVE_KEY_V2 = 'frogs-and-flies.save.v2'
const LEGACY_SAVE_KEY_V1 = 'frogs-and-flies.save.v1'
```

Use v2 only when explicitly seeding legacy migration data.

- [ ] **Step 2: Write failing fresh campaign failure test**

In `tests/e2e/m210-campaign-attempt-ledger.spec.ts`:

```ts
test('campaign failure writes one v3 attempt without direct high-score or top-level stats', async ({ page }) => {
  await page.goto('/?seed=2101&durationSeconds=0.25&theEndSeconds=0.1&simulationSpeed=120')
  await launchLevelFromCampaign(page, LEVEL_11)
  await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })

  const shell = page.getByTestId('m26-shell')
  await expect(shell).toHaveAttribute('data-active-round-scope', 'campaign')
  await expect(shell).toHaveAttribute('data-campaign-attempt-ledger-count', '1')
  await expect(shell).toHaveAttribute('data-campaign-attempt-recorded', 'true')
  await expect(page.getByTestId('campaign-result-status')).toHaveAttribute('data-campaign-result-attempt-id', /campaign:home-pond:/)
  await expect(page.getByTestId('results-high-score-status')).toContainText(/campaign result recorded/i)

  const saved = await readSave(page)
  expect(saved.version).toBe(3)
  expect(saved.highScores.classicSingle).toEqual([])
  expect(saved.stats.roundsStarted).toBe(0)
  expect(saved.stats.roundsCompleted).toBe(0)
  expect(saved.startedRoundIds).toEqual([])
  expect(saved.completedRoundIds).toEqual([])
  expect(saved.campaign.attempts).toHaveLength(1)
  expect(saved.campaign.attempts[0]).toMatchObject({
    campaignId: 'home-pond',
    levelId: LEVEL_11,
    seed: 2101,
    passed: false,
    stars: 0,
  })
  expect(JSON.stringify(saved.campaign.attempts[0])).not.toContain('encounterProfile')
})
```

- [ ] **Step 3: Write failing campaign pass/replay/next distinct attempts test**

Add:

```ts
test('campaign pass, replay level, and next level create distinct attempt ids', async ({ page }) => {
  await page.goto('/?seed=2102&durationSeconds=0.25&theEndSeconds=0.1&simulationSpeed=120&campaignSmokeScore=1400&campaignSmokeCatches=14')

  await launchLevelFromCampaign(page, LEVEL_11)
  await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
  const firstAttemptId = await page.getByTestId('m26-shell').getAttribute('data-campaign-attempt-id')

  await page.getByTestId('campaign-replay-level').click()
  await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
  const replayAttemptId = await page.getByTestId('m26-shell').getAttribute('data-campaign-attempt-id')

  await page.getByTestId('campaign-next-level').click()
  await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
  const nextAttemptId = await page.getByTestId('m26-shell').getAttribute('data-campaign-attempt-id')

  expect(new Set([firstAttemptId, replayAttemptId, nextAttemptId]).size).toBe(3)
  const saved = await readSave(page)
  expect(saved.campaign.attempts).toHaveLength(3)
  expect(saved.campaign.attempts.map((entry) => entry.levelId)).toEqual([LEVEL_11, LEVEL_11, LEVEL_12])
  expect(saved.highScores.classicSingle).toEqual([])
  expect(saved.stats.roundsCompleted).toBe(0)
})
```

- [ ] **Step 4: Write failing direct Classic and Local Versus separation tests**

Add direct mode tests:

```ts
test('direct Classic Single still writes direct high scores and no campaign attempts', async ({ page }) => {
  await completeDirectClassic(page, 2103)
  const shell = page.getByTestId('m26-shell')
  await expect(shell).toHaveAttribute('data-active-round-scope', 'direct')
  await expect(shell).not.toHaveAttribute('data-campaign-attempt-id')
  await expect(page.getByTestId('results-high-score-status')).toContainText(/local high score/i)

  const saved = await readSave(page)
  expect(saved.highScores.classicSingle.length).toBeGreaterThan(0)
  expect(saved.campaign.attempts).toEqual([])
  expect(saved.stats.roundsStarted).toBe(1)
  expect(saved.stats.roundsCompleted).toBe(1)
})

test('Local Versus still writes direct local-versus high scores and no campaign attempts', async ({ page }) => {
  await completeDirectLocalVersus(page, 2104)
  const saved = await readSave(page)
  expect(saved.highScores.localVersus.length).toBeGreaterThan(0)
  expect(saved.highScores.classicSingle).toEqual([])
  expect(saved.campaign.attempts).toEqual([])
})
```

- [ ] **Step 5: Write failing v2 migration E2E**

Seed localStorage with a v2 save before navigation:

```ts
await page.addInitScript(
  ({ v2Key, v3Key, legacy }) => {
    localStorage.removeItem(v3Key)
    localStorage.setItem(v2Key, JSON.stringify(legacy))
  },
  { v2Key: LEGACY_SAVE_KEY_V2, v3Key: SAVE_KEY, legacy: createLegacyV2Seed() },
)
await page.goto('/?seed=2105')
await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-save-status', 'migrated')
const saved = await readSave(page)
expect(saved.version).toBe(3)
expect(saved.campaign.attempts).toEqual([])
expect(await page.evaluate((key) => localStorage.getItem(key) !== null, LEGACY_SAVE_KEY_V2)).toBe(true)
```

Expected: v2 progress remains visible after reload and v2 key is preserved.

- [ ] **Step 6: Run M2.10 E2E red**

Run:

```bash
npx playwright test tests/e2e/m210-campaign-attempt-ledger.spec.ts --project=chromium
```

Expected: FAIL before runtime DOM/save split is complete, or PASS if Tasks 2-5 already implemented all behavior. If PASS, record that Task 6 was a regression expansion over already-green implementation.

- [ ] **Step 7: Fix implementation gaps only if M2.10 E2E exposes them**

If tests fail, patch the smallest relevant code in:

- `src/runtime/save.ts`
- `src/runtime/campaignProgress.ts`
- `src/runtime/app.ts`
- `src/runtime/dom.ts`

Use superpowers:systematic-debugging before changing code for unexpected failures. Do not change gameplay tuning, assets, or `src/game/**`.

- [ ] **Step 8: Run focused E2E green**

Run:

```bash
npx playwright test tests/e2e/m210-campaign-attempt-ledger.spec.ts tests/e2e/m27-campaign-flow.spec.ts tests/e2e/m29-encounter-profiles.spec.ts tests/e2e/m26-persistence.spec.ts --project=chromium
```

Expected: PASS. Campaign attempts write v3 ledger only; direct Classic/Versus still write direct high scores/stats; v2 migration works; M2.7/M2.9 regressions remain green.

- [ ] **Step 9: Run focused unit/build green**

Run:

```bash
npm run test:unit -- tests/unit/saveManager.test.ts tests/unit/campaignProgress.test.ts
npm run build
git diff --check
```

Expected: PASS; build PASS; no whitespace errors.

- [ ] **Step 10: Commit**

Run:

```bash
git add tests/e2e/m210-campaign-attempt-ledger.spec.ts tests/e2e/m27-campaign-flow.spec.ts tests/e2e/m29-encounter-profiles.spec.ts tests/e2e/m26-persistence.spec.ts tests/e2e/m26-shell.spec.ts tests/e2e/m26-audio.spec.ts tests/e2e/m26-input.spec.ts src/runtime/save.ts src/runtime/campaignProgress.ts src/runtime/app.ts src/runtime/dom.ts
git commit -m "test: cover m210 campaign attempt persistence"
```

Expected: commit includes E2E coverage and only necessary implementation gaps found by E2E. Omit unchanged source files from `git add`.

- [ ] **Step 11: Mandatory consolidation**

Run:

```bash
git status --short --branch
git show --stat --oneline HEAD
git diff --check
```

Expected: consolidator verifies test coverage proves campaign attempts do not write Classic Single high scores or top-level direct stats.

## Task 7: README And Docs Scope Guard Tests

**Files:**
- Modify: `README.md`
- Modify: `tests/unit/readmeControls.test.ts`

- [ ] **Step 1: Write failing README tests for M2.10 claims**

Update `tests/unit/readmeControls.test.ts` to expect:

```ts
for (const text of [
  'Current M2.10',
  'Campaign Round Identity And Results Ledger',
  '`frogs-and-flies.save.v3`',
  '`frogs-and-flies.save.v2`',
  '`frogs-and-flies.save.v1`',
  'last 50',
  'campaign attempts',
  'direct Classic Single and Local Versus high scores',
  'Campaign result recorded.',
  'data-active-round-scope',
  'data-campaign-attempt-id',
  'data-campaign-attempt-recorded',
  'data-campaign-attempt-ledger-count',
  'data-campaign-result-attempt-id',
  'no dedicated campaign ledger UI',
]) {
  expect(readme).toContain(text)
}
```

- [ ] **Step 2: Write failing stale/scope guard tests**

Update stale claim guards:

```ts
for (const staleText of [
  'Current M2.9',
  'Primary save key: `frogs-and-flies.save.v2`',
  'No save schema bump',
  'M2.10 adds new insects',
  'M2.10 adds a new level',
  'M2.10 adds a backend',
  'M2.10 adds an online leaderboard',
  'campaign history screen',
]) {
  expect(readme).not.toContain(staleText)
}
```

Keep existing M2.8/M2.9 asset/encounter docs that remain true.

- [ ] **Step 3: Run README test red**

Run:

```bash
npm run test:unit -- tests/unit/readmeControls.test.ts
```

Expected: FAIL because README still documents M2.9 and v2 primary save key.

- [ ] **Step 4: Update README current milestone**

In `README.md`:

- Change opening/current milestone from M2.9 to M2.10.
- State that M2.10 adds campaign round identity and a campaign attempt results ledger.
- State M2.9 encounter profiles remain static runtime/content tuning.
- Keep direct player modes as Classic Single and Local Versus.
- State High Scores remains local direct Classic Single and Local Versus only.
- State there is no dedicated campaign ledger UI.

- [ ] **Step 5: Update README save/privacy section**

Document:

- Primary save key: `frogs-and-flies.save.v3`.
- Legacy keys preserved: `frogs-and-flies.save.v2` and `frogs-and-flies.save.v1`.
- v2 migration preserves current supported fields and initializes `campaign.attempts = []`.
- v3 campaign attempts persist last 50 global attempt summaries.
- Attempt summaries store `attemptId`, `campaignId`, `levelId`, timestamp, seed, difficulty, duration/time remaining, score/catches/attempts/accuracy/splashes/combo, passed, and stars.
- Attempt summaries do not store encounter profile ids.
- Campaign attempts do not write direct high scores, top-level stats, started round ids, or completed round ids.
- Direct Classic Single and Local Versus save behavior remains unchanged.

- [ ] **Step 6: Update README runtime markers and verification**

Add markers:

- `data-active-round-scope`
- `data-campaign-attempt-id`
- `data-campaign-attempt-recorded`
- `data-campaign-attempt-ledger-count`
- `data-campaign-result-attempt-id`

Add focused gates:

```bash
npm run test:unit -- tests/unit/saveManager.test.ts tests/unit/campaignProgress.test.ts tests/unit/readmeControls.test.ts
npx playwright test tests/e2e/m210-campaign-attempt-ledger.spec.ts tests/e2e/m27-campaign-flow.spec.ts tests/e2e/m29-encounter-profiles.spec.ts --project=chromium
```

Update production smoke to include M2.10 E2E.

- [ ] **Step 7: Run docs tests green**

Run:

```bash
npm run test:unit -- tests/unit/readmeControls.test.ts
npm run test:unit -- tests/unit/saveManager.test.ts tests/unit/campaignProgress.test.ts
git diff --check
```

Expected: PASS; no whitespace errors.

- [ ] **Step 8: Commit**

Run:

```bash
git add README.md tests/unit/readmeControls.test.ts
git commit -m "docs: document m210 campaign save boundary"
```

Expected: commit contains docs and README gate only.

- [ ] **Step 9: Mandatory consolidation**

Run:

```bash
git status --short --branch
git show --stat --oneline HEAD
git diff --check
```

Expected: consolidator verifies README does not claim new species, levels, assets, audio, backend, localization, monetization, online leaderboard, or dedicated ledger UI.

## Task 8: Focused And Full Local Gates, Scope Audit, And Cleanup

**Files:**
- No source edits expected.
- Optional Modify: this plan file only if recording verification evidence is required by the parent agent.

- [ ] **Step 1: Run focused M2.10 unit gates**

Run:

```bash
npm run test:unit -- tests/unit/saveManager.test.ts tests/unit/campaignProgress.test.ts tests/unit/readmeControls.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run focused M2.10/M2.9/M2.7 E2E gates**

Run:

```bash
npx playwright test tests/e2e/m210-campaign-attempt-ledger.spec.ts tests/e2e/m27-campaign-flow.spec.ts tests/e2e/m29-encounter-profiles.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 3: Run direct persistence/input/audio regression E2E**

Run:

```bash
npx playwright test tests/e2e/m26-persistence.spec.ts tests/e2e/m26-shell.spec.ts tests/e2e/m26-input.spec.ts tests/e2e/m26-audio.spec.ts --project=chromium
```

Expected: PASS. Direct Classic Single and Local Versus persistence remains unchanged except v3 key/migration compatibility.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: PASS. `dist/` may be generated and must not be committed.

- [ ] **Step 5: Run full local test gate**

Run:

```bash
npm test
```

Expected: PASS for all Vitest and Playwright tests available in the environment. If a browser dependency or environment issue blocks a subset, use superpowers:systematic-debugging, record the exact blocker, and run the focused gates above.

- [ ] **Step 6: Run scope audit**

Run:

```bash
rg -n "mosquito|species|new level|new mode|backend|leaderboard|monetization|encounterProfileId|encounterProfile" src tests README.md
rg -n "frogs-and-flies.save.v2|SAVE_SCHEMA_VERSION = 2|Current M2.9|No save schema bump" src tests README.md
git diff --name-only HEAD~7..HEAD
```

Expected:

- No new species/mode/backend/leaderboard/monetization implementation claims.
- `encounterProfileId` appears only in runtime/content/test markers, not in saved attempt summary assertions or persisted JSON.
- v2 references remain only as legacy migration key/documentation/tests.
- Changed files match the M2.10 plan scope.

- [ ] **Step 7: Cleanup generated files**

Run:

```bash
rm -rf dist test-results playwright-report
git status --short --branch
git diff --check
```

Expected: no generated files remain; no whitespace errors.

- [ ] **Step 8: Commit verification evidence only if requested**

If the parent agent requires evidence in the plan, commit only that evidence:

```bash
git add docs/superpowers/plans/2026-05-17-frogs-and-flies-m210-campaign-round-identity-results-ledger-implementation.md
git commit -m "test: verify m210 local gates"
```

If no file changes are needed, do not commit.

- [ ] **Step 9: Mandatory consolidation**

Run:

```bash
git status --short --branch
git log --oneline --decorate -8
git diff --check
```

Expected: consolidator confirms all local gates, cleanup, scope guards, and commit boundaries before any Docker/deploy task starts.

## Task 9: Docker, Coolify Deploy, And Production Smoke

**Files:**
- No source edits expected.
- Read: `Dockerfile`
- Read: `nginx.conf`
- Read: `README.md`
- Optional Modify: this plan file only if deployment evidence must be recorded.

- [ ] **Step 1: Verify clean local HEAD before Docker**

Run:

```bash
git status --short --branch
git log --oneline --decorate -8
```

Expected: branch is clean and contains all M2.10 implementation/doc commits.

- [ ] **Step 2: Docker build**

Run:

```bash
docker build -t frogs-and-flies-m210-campaign-ledger .
```

Expected: image builds successfully.

- [ ] **Step 3: Docker static smoke**

Run in one terminal:

```bash
docker run --rm --name frogs-and-flies-m210 -p 18080:80 frogs-and-flies-m210-campaign-ledger
```

Run in another terminal:

```bash
curl -I http://127.0.0.1:18080/
curl -I http://127.0.0.1:18080/manifest.webmanifest
curl -I http://127.0.0.1:18080/service-worker.js
curl -I http://127.0.0.1:18080/assets/m28/m28-home-pond-background-v1.png
curl -I http://127.0.0.1:18080/assets/m28/m28-ui-star-filled-v1.png
curl -I http://127.0.0.1:18080/audio/music/home-pond-loop.mp3
PLAYWRIGHT_BASE_URL=http://127.0.0.1:18080 npx playwright test tests/e2e/m210-campaign-attempt-ledger.spec.ts tests/e2e/m27-campaign-flow.spec.ts tests/e2e/m29-encounter-profiles.spec.ts --project=chromium
```

Expected:

- HTTP `200` for shell, manifest, service worker, representative M2.8 asset, UI icon, and music file.
- M2.10, M2.7, and M2.9 Chromium smoke PASS against Docker.

- [ ] **Step 4: Stop Docker container**

Run:

```bash
docker stop frogs-and-flies-m210
```

Expected: container stops. If already exited, confirm no `frogs-and-flies-m210` container remains.

- [ ] **Step 5: Push using standing release approval after Docker gates**

The user's standing approval `Zatwierdzamy ten etap i wszystkie przyszłe` satisfies M2.10 push/deploy approval. Do not require a new approval before M2.10 push/deploy. After all preceding local and Docker gates have passed, run:

```bash
git status --short --branch
git push origin ff2-m0-pixijs
```

Expected: branch pushes successfully and local HEAD equals `origin/ff2-m0-pixijs`.

- [ ] **Step 6: Coolify production deploy**

Use the Coolify deployment workflow for app `frogs-and-flies-remake` on server `cx32-hell`, URL `https://frog.resline.net`.

Required evidence:

- deployed commit equals pushed HEAD,
- deployment status `finished`,
- app health `running:healthy`,
- production URL responds with current app shell.

Expected: no Dockerfile, nginx, backend, service worker cache list, asset manifest, or audio changes are needed for M2.10.

- [ ] **Step 7: Production static smoke**

Run:

```bash
curl -I https://frog.resline.net/
curl -I https://frog.resline.net/manifest.webmanifest
curl -I https://frog.resline.net/service-worker.js
curl -I https://frog.resline.net/assets/m28/m28-home-pond-background-v1.png
curl -I https://frog.resline.net/assets/m28/m28-ui-star-filled-v1.png
curl -I https://frog.resline.net/audio/music/home-pond-loop.mp3
```

Expected:

- `/`, manifest, service worker, representative M2.8 assets, and audio return `200`.
- Service worker returns JavaScript-compatible content type.
- MP3 returns audio-compatible MIME.

- [ ] **Step 8: Production Playwright smoke**

Run:

```bash
PLAYWRIGHT_BASE_URL=https://frog.resline.net npx playwright test tests/e2e/m210-campaign-attempt-ledger.spec.ts --project=chromium
PLAYWRIGHT_BASE_URL=https://frog.resline.net npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium
PLAYWRIGHT_BASE_URL=https://frog.resline.net npx playwright test tests/e2e/m29-encounter-profiles.spec.ts --project=chromium
PLAYWRIGHT_BASE_URL=https://frog.resline.net npx playwright test tests/e2e/m28-asset-pipeline.spec.ts --project=chromium
```

Expected:

- M2.10 campaign attempt ledger and high-score separation smoke passes on production.
- M2.7 campaign flow passes on production.
- M2.9 encounter profile marker smoke passes on production.
- M2.8 asset/audio smoke passes on production.

- [ ] **Step 9: Commit deployment evidence only if requested**

If deployment evidence is recorded in this plan or README, commit only that evidence:

```bash
git add docs/superpowers/plans/2026-05-17-frogs-and-flies-m210-campaign-round-identity-results-ledger-implementation.md README.md
git commit -m "docs: record m210 deployment smoke"
```

If no evidence file is required, do not commit.

- [ ] **Step 10: Mandatory consolidation**

Run:

```bash
git status --short --branch
git log --oneline --decorate -8
git diff --check
```

Expected: consolidator records deployment UUID/status, deployed commit, production smoke results, generated-file cleanup, and the standing approval `Zatwierdzamy ten etap i wszystkie przyszłe` used for M2.10 push/deploy.

## Acceptance Criteria

- SaveManager v3 exists with primary key `frogs-and-flies.save.v3`.
- v2 and v1 save keys are preserved and migrate to v3 without deletion.
- `campaign.attempts` defaults to `[]`, validates safely, imports/exports, and trims to the newest 50 global attempts.
- Campaign attempts persist `attemptId`, `campaignId`, `levelId`, timestamp, seed, difficulty, duration/time remaining, score/catches/attempts/accuracy/splashes/combo, passed, and stars.
- Campaign attempts do not persist `encounterProfileId`.
- Campaign progress bests/stars/objective stats/unlocks update exactly once per campaign attempt.
- Duplicate attempt ids do not append again or increment objective stats again.
- Campaign-launched rounds do not write Classic Single high scores, top-level aggregate stats, started round ids, or completed round ids.
- Direct Classic Single and Local Versus started/completed/high-score/stat behavior remains unchanged.
- DOM markers expose active round scope, campaign attempt id, attempt recorded state, ledger count, and campaign result attempt id.
- Campaign result copy does not claim a local high score for campaign attempts.
- High Scores remains a local direct Classic Single and Local Versus screen.
- Existing M2.7 campaign flow and M2.9 encounter profile marker tests remain green.
- README documents M2.10, v3 migration, direct/campaign save boundary, markers, verification, Docker/Coolify smoke, and non-goals.
- No new species, levels, modes, gameplay tuning, assets, audio, backend, localization, monetization, online leaderboard, dedicated ledger UI, or broad game refactor is introduced.

## Rollback Notes

- M2.10 writes only v3 after migration. Existing v2 and v1 keys remain in localStorage for rollback.
- Rolling back to M2.9 reads the preserved v2 key and ignores M2.10 campaign attempts recorded only in v3.
- Do not try to clean old v2 Classic Single high-score rows that may have come from campaign attempts; v2 did not persist enough context to prove origin.
- Since no assets/audio/PWA cache entries are added, deployment rollback is a normal JavaScript bundle rollback.

## Final Handoff Checklist

- [ ] Commit hashes for each implementation task.
- [ ] Focused unit test output for save/campaign/docs.
- [ ] Focused E2E output for M2.10/M2.7/M2.9.
- [ ] Direct persistence E2E output for M2.6 regressions.
- [ ] `npm run build` output.
- [ ] `npm test` output or exact blocker.
- [ ] `git diff --check` output.
- [ ] Scope audit output.
- [ ] Docker build and static smoke output.
- [ ] Coolify deployment UUID/status and deployed commit, if release approval allowed deployment.
- [ ] Production smoke output.
- [ ] Confirmation that `dist/`, `test-results/`, and `playwright-report/` were removed or intentionally preserved.
