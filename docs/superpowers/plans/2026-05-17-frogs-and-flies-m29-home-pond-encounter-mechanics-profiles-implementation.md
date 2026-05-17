# Frogs and Flies M2.9 Home Pond Encounter Mechanics Profiles Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox syntax for tracking. If using eliteteams, each task should be assigned to a focused specialist worker and consolidated by a separate reviewer before the next task starts.

**Goal:** Make campaign levels `1-1`, `1-2`, and `1-3` play measurably differently through typed Home Pond encounter/mechanics profiles while preserving Classic Single and Local Versus defaults.

**Architecture:** Keep campaign/content ids in `src/content/**`, resolve profile definitions into explicit numeric gameplay options in the runtime boundary, and pass only existing common-fly/Rush tuning into `createGame()`. The deterministic simulation may learn optional spawn/band/velocity/power/duration overrides, but `src/game/**` must not import campaign registry data or branch on campaign level ids.

**Tech Stack:** TypeScript, PixiJS v8, Vite, Vitest, Playwright, deterministic fixed-step simulation, browser DOM data attributes for smoke markers, SaveManager v2, Docker/nginx, Coolify deployment to `https://frog.resline.net`.

## Scope Guard

M2.9 must add exactly:

- Typed encounter/mechanics profile ids for the three existing Home Pond content profiles.
- Static profile definitions for:
  - `home-pond-baseline-gentle`
  - `home-pond-quick-tongue`
  - `home-pond-nightfall-pressure`
- Registry validation proving each current content profile references a valid encounter profile.
- A resolver from campaign level/content profile to profile-driven game options.
- Optional `createGame()` tuning overrides for existing fly/Rush behavior.
- Runtime campaign launch handoff and DOM/test markers for the active encounter profile.
- Deterministic tests showing same seed plus different campaign levels produces measurable differences.
- Regression tests proving Classic Single and Local Versus defaults stay at the M2.8 baseline.

M2.9 must not add:

- New insect kinds, species ids, mosquito, gadfly, firefly target, golden fly, toxic insect, bomb insect, dragonfly, or any broad insect roster.
- New hazards.
- New power-ups beyond existing Rush.
- New campaign levels, prologues, campaigns, world map, biome map, chapter content, or objective expansion unless a failing test proves a tiny threshold adjustment is unavoidable.
- New biome beyond Home Pond.
- Bosses, Queen Bee, boss framework, or boss unlock logic.
- SaveManager schema bump, campaign progress shape change, save migration, cloud save, or backend.
- Localization, monetization, ads, payments, analytics, telemetry, accounts, online leaderboard, or portal SDK.
- New visual assets, audio assets, `public/assets/m29/**`, `public/audio/**`, asset manifest entries, Howler, TexturePacker, Spine, atlases, or audio sprites.
- Runtime OpenAI, ChatGPT, external network, or live API dependency.
- Broad `src/game/**` refactor. Changes must stay targeted to typed options, default values, spawn/movement tuning, and tests.

If implementation appears to require breaking a scope guard, stop and return `BLOCKED_SCOPE_EXPANSION` to consolidation.

## Port And Server Policy

Do not use default Vite port `5173`. Port `5174` may be occupied. Use explicit `5176` unless it is taken.

```bash
npm run dev -- --host 127.0.0.1 --port 5176 --strictPort
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npx playwright test tests/e2e/m29-encounter-profiles.spec.ts --project=chromium
```

For production preview:

```bash
npm run preview -- --host 127.0.0.1 --port 5176 --strictPort
```

Docker nginx serves container port `80`. Host port `8080` may be occupied, so use `18080`.

```bash
docker run --rm --name frogs-and-flies-m29 -p 18080:80 frogs-and-flies-m29-encounter-profiles
```

Stop local dev/preview/Docker processes started for verification before handing off. Remove generated `dist/`, `test-results/`, and `playwright-report/` unless they are the explicit artifact under review.

## Current File Structure Map

### Existing Baseline To Preserve

- `src/content/types.ts` defines the typed campaign, prologue, level, and content profile contracts.
- `src/content/registry.ts` defines one Home Pond campaign, one prologue, three levels, three content profiles, lookup helpers, and registry validation.
- `tests/unit/campaignRegistry.test.ts` covers current registry shape and validation failures.
- `src/game/createGame.ts` builds `GameState` from seed, mode, duration, the-end seconds, and Classic difficulty.
- `src/game/difficulty.ts` returns `ClassicOptions` for Assist, Standard, and Expert.
- `src/game/types.ts` defines `EntityKind = 'fly' | 'power'`, `PowerKind = 'rush'`, `ClassicOptions`, `GameConstants`, and `GameState`.
- `src/game/systems/spawn.ts` spawns only `fly` and `power` entities using seeded PRNG, classic fly band, default fly velocity, and Rush cadence.
- `src/game/systems/movement.ts` moves existing entities and removes offscreen entities.
- `src/game/replay.ts` and `tests/unit/deterministicReplay.test.ts` cover deterministic fixed-step replay.
- `src/runtime/app.ts` launches normal Classic/Versus rounds and campaign levels.
- `src/runtime/dom.ts` syncs DOM markers including `data-active-campaign-level`.
- `tests/e2e/m27-campaign-flow.spec.ts` covers campaign level launch, pass/fail/unlock/replay, and SaveManager v2 persistence.
- `tests/e2e/m28-asset-pipeline.spec.ts` covers M2.8 art/audio and campaign visual smoke.
- `README.md` documents current M2.8 product state, controls, markers, verification, Docker, and production smoke.
- `tests/unit/readmeControls.test.ts` gates README claims.

### Create

- `src/content/encounterProfiles.ts` - typed profile definitions, profile lookup, level/content resolver helpers, and profile-to-game-option conversion helpers that remain content/runtime friendly.
- `tests/unit/encounterProfiles.test.ts` - focused unit tests for profile mapping, resolver behavior, validation, deterministic profile metrics, and default preservation if keeping all M2.9 unit coverage in one file is clearer.
- `tests/e2e/m29-encounter-profiles.spec.ts` - focused Playwright checks for campaign profile markers and Classic/Versus marker absence.

### Modify

- `src/content/types.ts` - add `EncounterProfileId`, `EncounterMechanicsProfileDefinition`, `EncounterTuningDefinition`, profile id reference on `LevelContentProfileDefinition`, and validation codes.
- `src/content/registry.ts` - wire the three encounter profile ids into existing content profiles, export profile collection/lookups, and validate profile references plus M2.9 scope.
- `tests/unit/campaignRegistry.test.ts` - update M2.7 registry assertions to include M2.9 encounter profile references and invalid profile fixtures.
- `src/game/types.ts` - add typed fly velocity and optional encounter tuning types, plus fields in `ClassicOptions` and/or `GameConstants` needed by spawn.
- `src/game/difficulty.ts` - keep current Classic difficulty defaults and add default fly velocity data if `ClassicOptions` owns it.
- `src/game/createGame.ts` - accept optional profile-driven encounter tuning and merge it with Classic defaults without changing no-profile behavior.
- `src/game/systems/spawn.ts` - consume resolved fly band/spawn/velocity/Rush cadence values while keeping entity kinds unchanged.
- `tests/unit/difficultyOptions.test.ts` - add default preservation and override-focused assertions.
- `tests/unit/spawn.test.ts` - add deterministic entity-kind and spawn metric coverage if not covered in `encounterProfiles.test.ts`.
- `tests/unit/deterministicReplay.test.ts` - add same profile/same seed replay coverage for profile options, or keep this in `encounterProfiles.test.ts`.
- `tests/unit/localVersus.test.ts` - assert Local Versus default constants/options remain identical without campaign profile tuning.
- `src/runtime/app.ts` - resolve active campaign encounter profile before `createGame()` and preserve normal Classic/Versus start paths.
- `src/runtime/dom.ts` - add/remove `data-campaign-encounter-profile` or `data-active-campaign-encounter-profile` markers on shell/state/canvas as appropriate.
- `tests/e2e/m27-campaign-flow.spec.ts` - update existing campaign flow assertions only if the new M2.9 marker belongs naturally there; otherwise keep M2.9 coverage in the new E2E file.
- `README.md` - document M2.9 as the current milestone after code lands.
- `tests/unit/readmeControls.test.ts` - update docs gate for M2.9 claims and non-goals.

### Do Not Modify Unless A Failing Test Proves An Existing Bug Blocks M2.9

- `public/assets/**`
- `public/audio/**`
- `ASSET_MANIFEST.md`, except for a docs-only sentence explicitly saying M2.9 adds no assets if consolidation requests it.
- `src/render/**`
- `src/runtime/assets.ts`
- `src/runtime/audio.ts`
- `src/runtime/pwa.ts`
- `public/service-worker.js`
- `src/runtime/save.ts`
- `src/runtime/campaignProgress.ts`
- `Dockerfile`
- `nginx.conf`
- `package.json` and `package-lock.json`

## Required Encounter Profile Contract

Workers may adjust exact numeric tuning after red/green evidence, but keep the shape small and explicit.

Recommended content types:

```ts
export type EncounterProfileId =
  | 'home-pond-baseline-gentle'
  | 'home-pond-quick-tongue'
  | 'home-pond-nightfall-pressure'

export interface EncounterMechanicsProfileDefinition {
  id: EncounterProfileId
  label: string
  implementedEntityKinds: readonly ['fly', 'power']
  roundDurationSeconds?: number
  flySpawnSecondsMultiplier: number
  flyBandOffset: {
    minY: number
    maxY: number
  }
  flyVelocity: {
    minVx: number
    maxVx: number
    minVy: number
    maxVy: number
  }
  powerSpawnSecondsMultiplier: number
  tuningNotes: string
}
```

Recommended mapping:

| Campaign level | Content profile | Encounter profile |
| --- | --- | --- |
| `home-pond-1-1-first-hunt` | `home-pond-intro-classic` | `home-pond-baseline-gentle` |
| `home-pond-1-2-quick-tongue` | `home-pond-quick-classic` | `home-pond-quick-tongue` |
| `home-pond-1-3-nightfall-feast` | `home-pond-night-classic` | `home-pond-nightfall-pressure` |

Recommended initial tuning:

| Profile | Fly spawn multiplier | Fly band offset | Fly velocity | Rush multiplier | Duration |
| --- | ---: | --- | --- | ---: | --- |
| `home-pond-baseline-gentle` | `1.00` | `{ minY: 0, maxY: 0 }` | default Classic velocity | `1.00` | default |
| `home-pond-quick-tongue` | `0.84` | `{ minY: 12, maxY: -18 }` | modestly faster than default | `1.15` | default |
| `home-pond-nightfall-pressure` | `0.72` | `{ minY: -20, maxY: -44 }` | fastest M2.9 common fly range | `1.45` | default |

Multiplier semantics:

- Lower `flySpawnSecondsMultiplier` means more frequent fly spawns.
- Higher `powerSpawnSecondsMultiplier` means less frequent Rush power spawns.
- Profile data is static bundled TypeScript, not remote JSON.
- The simulation receives resolved numeric options, not campaign ids, content profile ids, or story ids.

## Execution Rules

- Follow superpowers:test-driven-development for every behavior change: write a focused failing test, run it red, implement the smallest change, run it green, then commit.
- Use superpowers:systematic-debugging before patching unexpected failures.
- Use superpowers:verification-before-completion before each completion claim, final commit, push, deploy, or production smoke claim.
- Keep commits task-sized. Recommended commit messages are listed under each task.
- After every task, run `git diff --check` and clean generated `dist/`, `test-results/`, and `playwright-report/`.
- After each specialist worker finishes, a separate consolidation worker must inspect commit scope, tests, generated files, and scope guards before the next worker starts.
- Do not push until final local verification passes and the deployment gate explicitly says to push.

## Task 1: Baseline Audit And Dirty Guard

**Files:**
- Read: `docs/superpowers/specs/2026-05-17-frogs-and-flies-m29-home-pond-encounter-mechanics-profiles-design.md`
- Read: `docs/superpowers/plans/2026-05-17-frogs-and-flies-m28-generated-home-pond-art-pack-asset-audio-pipeline-implementation.md`
- Read: `src/content/types.ts`
- Read: `src/content/registry.ts`
- Read: `src/game/createGame.ts`
- Read: `src/game/difficulty.ts`
- Read: `src/game/types.ts`
- Read: `src/game/systems/spawn.ts`
- Read: `src/runtime/app.ts`
- Read: `src/runtime/dom.ts`
- Read: `tests/unit/campaignRegistry.test.ts`
- Read: `tests/unit/difficultyOptions.test.ts`
- Read: `tests/unit/spawn.test.ts`
- Read: `tests/unit/deterministicReplay.test.ts`
- Read: `tests/e2e/m27-campaign-flow.spec.ts`
- Read: `package.json`

- [x] **Step 1: Confirm branch, sync, and worktree**

Run:

```bash
git branch --show-current
git status --short --branch
git log --oneline --decorate -5
```

Expected: branch is `ff2-m0-pixijs`; worktree is clean except changes by the current worker; recent history includes `500a6ef docs: clarify m29 baseline deployment wording`.

- [x] **Step 2: Confirm no existing M2.9 plan/code work needs preservation**

Run:

```bash
git status --short
rg -n "home-pond-baseline-gentle|EncounterProfile|encounter profile|data-campaign-encounter" src tests docs README.md
```

Expected: only the M2.9 spec and this implementation plan mention encounter profiles before implementation. If code already contains M2.9 work, stop and inspect it rather than overwriting.

- [x] **Step 3: Run focused baseline unit tests**

Run:

```bash
npm run test:unit -- tests/unit/campaignRegistry.test.ts tests/unit/difficultyOptions.test.ts tests/unit/spawn.test.ts tests/unit/deterministicReplay.test.ts tests/unit/localVersus.test.ts tests/unit/saveManager.test.ts
```

Expected: PASS on the M2.8 baseline.

- [x] **Step 4: Run focused campaign baseline E2E**

Run:

```bash
npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium
```

Expected: PASS for existing campaign launch, pass/fail/unlock, replay, and persistence flow.

- [x] **Step 5: Record baseline findings in the task handoff**

Document the current default values observed from source:

- Standard `flySpawnSeconds` is `0.75`.
- Standard fly band is `64..250`.
- Default Rush cadence is `8`.
- Default fly velocity is currently sampled from `vx -30..30` and `vy 55..95`.
- Classic Single and Local Versus currently call `createGame()` without encounter tuning.

Task 1 handoff evidence, 2026-05-17:

- Branch/sync: `git branch --show-current` returned `ff2-m0-pixijs`; `git status --short --branch` returned `## ff2-m0-pixijs...origin/ff2-m0-pixijs`; `git log --oneline --decorate -5` showed `f24655f`, `af13cf9`, `500a6ef`, `c5dd62b`, and `66bce80`.
- Dirty/code guard: `git status --short` returned no files. `rg -n "home-pond-baseline-gentle|EncounterProfile|encounter profile|data-campaign-encounter" src tests docs README.md` returned only this M2.9 plan and the M2.9 spec; no `src/`, `tests/`, or `README.md` M2.9 code/docs work existed before implementation.
- Focused unit baseline: `npm run test:unit -- tests/unit/campaignRegistry.test.ts tests/unit/difficultyOptions.test.ts tests/unit/spawn.test.ts tests/unit/deterministicReplay.test.ts tests/unit/localVersus.test.ts tests/unit/saveManager.test.ts` passed with 6 files and 31 tests.
- Focused campaign E2E baseline: `npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium` passed with 6 Chromium tests.
- Source-observed defaults: Standard `flySpawnSeconds` is `0.75`; Standard fly band is `64..250`; default Rush cadence is `8`; default fly velocity is sampled as `vx -30..30` and `vy 55..95`; Classic Single and Local Versus currently flow through `createGame()` without encounter tuning.
- TDD note: Task 1 was verification-only and changed no production code or tests, so no red/green cycle was applicable.

- [x] **Step 6: Commit**

No commit is required if Task 1 changed no files. If the plan checkbox evidence is updated in this file during execution, commit only that plan update:

```bash
git add docs/superpowers/plans/2026-05-17-frogs-and-flies-m29-home-pond-encounter-mechanics-profiles-implementation.md
git commit -m "docs: record m29 baseline audit"
```

## Task 2: Typed Encounter Profile Model And Registry Validation

**Files:**
- Modify: `src/content/types.ts`
- Modify: `src/content/registry.ts`
- Modify: `tests/unit/campaignRegistry.test.ts`
- Optional Create: `src/content/encounterProfiles.ts` if keeping definitions out of `registry.ts` is cleaner.
- Optional Create: `tests/unit/encounterProfiles.test.ts` if focused profile tests should not enlarge `campaignRegistry.test.ts`.

- [x] **Step 1: Write failing registry tests for typed profiles**

Add tests proving:

```ts
expect(HOME_POND_ENCOUNTER_PROFILES.map((profile) => profile.id)).toEqual([
  'home-pond-baseline-gentle',
  'home-pond-quick-tongue',
  'home-pond-nightfall-pressure',
])
expect(getLevelContentProfile('home-pond-intro-classic')?.encounterProfileId).toBe('home-pond-baseline-gentle')
expect(getLevelContentProfile('home-pond-quick-classic')?.encounterProfileId).toBe('home-pond-quick-tongue')
expect(getLevelContentProfile('home-pond-night-classic')?.encounterProfileId).toBe('home-pond-nightfall-pressure')
expect(validateCampaignRegistry()).toEqual([])
```

Also add fixture tests for missing and unsupported encounter profile references:

```ts
const brokenRegistry: CampaignRegistry = {
  ...M27_CAMPAIGN_REGISTRY,
  contentProfiles: [
    {
      ...M27_CAMPAIGN_REGISTRY.contentProfiles[0],
      encounterProfileId: 'missing-encounter-profile' as never,
    },
    ...M27_CAMPAIGN_REGISTRY.contentProfiles.slice(1),
  ],
}

expect(validateCampaignRegistry(brokenRegistry)).toContainEqual(
  expect.objectContaining({ code: 'missing-encounter-profile' }),
)
```

- [x] **Step 2: Run registry tests red**

Run:

```bash
npm run test:unit -- tests/unit/campaignRegistry.test.ts
```

Expected: FAIL because types/definitions/validation do not exist yet.

- [x] **Step 3: Add content types**

In `src/content/types.ts`, add:

- `EncounterProfileId`.
- `EncounterEntityKind = 'fly' | 'power'`.
- `EncounterMechanicsProfileDefinition`.
- `encounterProfileId: EncounterProfileId` to `LevelContentProfileDefinition`.
- Validation codes:
  - `duplicate-encounter-profile-id`
  - `missing-encounter-profile`
  - `unsupported-encounter-entity-kind`
  - `invalid-encounter-profile-tuning`
  - `invalid-m29-scope`

Keep the existing campaign level/content profile ids unchanged.

- [x] **Step 4: Add profile definitions and profile references**

In `src/content/registry.ts` or new `src/content/encounterProfiles.ts`, add:

- `HOME_POND_ENCOUNTER_PROFILES`.
- `getEncounterProfile(id: EncounterProfileId)`.
- `getEncounterProfileForContentProfile(id: LevelContentProfileId)`.
- `resolveCampaignEncounterProfile(levelId: CampaignLevelId)`.

Wire each `HOME_POND_CONTENT_PROFILES` entry to exactly one `encounterProfileId`.

- [x] **Step 5: Extend validation**

Update `validateCampaignRegistry()` to:

- Detect duplicate encounter profile ids.
- Reject content profiles that reference a missing encounter profile.
- Reject encounter profiles with any `implementedEntityKinds` member outside `fly` and `power`.
- Reject non-positive multipliers and invalid velocity ranges.
- Keep M2.9 scope to one campaign, one prologue, three levels, three content profiles, and three encounter profiles.

- [x] **Step 6: Run registry tests green**

Run:

```bash
npm run test:unit -- tests/unit/campaignRegistry.test.ts
```

Expected: PASS.

- [x] **Step 7: Typecheck and whitespace guard**

Run:

```bash
npm run build
git diff --check
```

Expected: TypeScript build PASS; no whitespace errors.

Task 2 handoff evidence, 2026-05-17:

- RED: `npm run test:unit -- tests/unit/campaignRegistry.test.ts` failed with 7 expected M2.9 registry/profile failures before implementation.
- GREEN: `npm run test:unit -- tests/unit/campaignRegistry.test.ts` passed with 1 file and 10 tests after implementation.
- Typecheck/build: `npm run build` passed.
- Whitespace guard: `git diff --check` passed.
- Cleanup: removed generated `dist/`, `test-results/`, and `playwright-report/` if present.
- Scope: changed only content types, content registry/profile validation, focused registry tests, and this Task 2 plan evidence; no runtime/gameplay/assets/save schema work.

- [x] **Step 8: Commit**

Run:

```bash
git add src/content/types.ts src/content/registry.ts src/content/encounterProfiles.ts tests/unit/campaignRegistry.test.ts tests/unit/encounterProfiles.test.ts
git commit -m "feat: add m29 encounter profile registry"
```

Expected: commit contains content model, static profile definitions, validation, and focused tests only. If optional files were not created, omit them from `git add`.

## Task 3: Profile Resolver To Game Option Contract

**Files:**
- Create: `src/runtime/encounterOptions.ts`
- Modify: `src/game/types.ts`
- Modify: `src/game/createGame.ts`
- Modify: `tests/unit/encounterProfiles.test.ts`
- Modify: `tests/unit/difficultyOptions.test.ts`

- [x] **Step 1: Write failing resolver tests**

Add tests for a resolver that converts profile definitions into numeric `createGame()` options without exposing campaign ids to the game layer:

```ts
const baseline = resolveEncounterProfileGameOptions(
  getEncounterProfile('home-pond-baseline-gentle')!,
  getClassicDifficulty('classic-standard'),
)
const quick = resolveEncounterProfileGameOptions(
  getEncounterProfile('home-pond-quick-tongue')!,
  getClassicDifficulty('classic-standard'),
)
const night = resolveEncounterProfileGameOptions(
  getEncounterProfile('home-pond-nightfall-pressure')!,
  getClassicDifficulty('classic-standard'),
)

expect(quick.encounter.flySpawnSeconds).toBeLessThan(baseline.encounter.flySpawnSeconds)
expect(night.encounter.flySpawnSeconds).toBeLessThan(quick.encounter.flySpawnSeconds)
expect(night.encounter.powerSpawnSeconds).toBeGreaterThan(baseline.encounter.powerSpawnSeconds)
expect(new Set([baseline.encounter.flyBand.minY, quick.encounter.flyBand.minY, night.encounter.flyBand.minY]).size).toBe(3)
```

Also assert Classic/Versus helpers return no profile override unless a campaign level is explicitly supplied.

- [x] **Step 2: Run resolver tests red**

Run:

```bash
npm run test:unit -- tests/unit/encounterProfiles.test.ts tests/unit/difficultyOptions.test.ts
```

Expected: FAIL because resolver/game option types are not implemented.

- [x] **Step 3: Add game tuning types**

In `src/game/types.ts`, add small generic types:

```ts
export interface FlyVelocityRange {
  minVx: number
  maxVx: number
  minVy: number
  maxVy: number
}

export interface ClassicEncounterTuning {
  roundDurationSeconds?: number
  flySpawnSeconds?: number
  flyBand?: FlyBand
  flyVelocity?: FlyVelocityRange
  powerSpawnSeconds?: number
}
```

Add `flyVelocity: FlyVelocityRange` to `ClassicOptions` or `GameConstants`. Prefer `ClassicOptions` if spawn should treat it as a gameplay option next to `flyBand`; mirror any resolved values into constants only if tests need stable runtime metadata.

- [x] **Step 4: Add resolver**

Create `src/runtime/encounterOptions.ts` with:

- `resolveEncounterProfileGameOptions(profile, classicOptions)`.
- Multiplication against current difficulty defaults.
- Clamping of band offsets to a valid `minY <= maxY` range.
- No campaign, save, DOM, or story side effects.

The return shape should be directly spreadable into `createGame()`:

```ts
{
  durationSeconds: profile.roundDurationSeconds,
  encounter: {
    flySpawnSeconds,
    flyBand,
    flyVelocity,
    powerSpawnSeconds,
  },
}
```

- [x] **Step 5: Extend `CreateGameOptions` without changing defaults**

In `src/game/createGame.ts`, add optional `encounter?: ClassicEncounterTuning`.

Merge behavior:

- No `encounter`: current M2.8 values exactly.
- `encounter.flySpawnSeconds`: sets `game.constants.flySpawnSeconds`.
- `encounter.powerSpawnSeconds`: sets `game.constants.powerSpawnSeconds`.
- `encounter.flyBand`: sets `game.options.flyBand`.
- `encounter.flyVelocity`: sets `game.options.flyVelocity` or the chosen constants field.
- `encounter.roundDurationSeconds`: use only if no explicit `durationSeconds` query/runtime value exists, or document the chosen precedence and test it.

- [x] **Step 6: Run resolver/default tests green**

Run:

```bash
npm run test:unit -- tests/unit/encounterProfiles.test.ts tests/unit/difficultyOptions.test.ts
npm run build
git diff --check
```

Expected: PASS; TypeScript build PASS; no whitespace errors.

Task 3 handoff evidence, 2026-05-17:

- RED: `npm run test:unit -- tests/unit/encounterProfiles.test.ts tests/unit/difficultyOptions.test.ts` failed because `src/runtime/encounterOptions.ts` did not exist yet.
- GREEN: `npm run test:unit -- tests/unit/encounterProfiles.test.ts tests/unit/difficultyOptions.test.ts` passed with 2 files and 8 tests after implementation.
- Typecheck/build: `npm run build` passed.
- Whitespace guard: `git diff --check` passed.
- Cleanup: removed generated `dist/`, `test-results/`, and `playwright-report/`.
- Scope: changed only the profile-to-game-option contract, generic game tuning option types, `createGame()` option merging, focused unit tests, and this Task 3 plan evidence; no campaign launch/runtime DOM/spawn integration/assets/save schema work.

- [x] **Step 7: Commit**

Run:

```bash
git add src/runtime/encounterOptions.ts src/game/types.ts src/game/createGame.ts tests/unit/encounterProfiles.test.ts tests/unit/difficultyOptions.test.ts
git commit -m "feat: resolve m29 encounter tuning options"
```

Expected: commit contains resolver and option contract only. It should not alter runtime campaign launch yet.

## Task 4: Spawn And Movement Profile Integration

**Files:**
- Modify: `src/game/difficulty.ts`
- Modify: `src/game/createGame.ts`
- Modify: `src/game/systems/spawn.ts`
- Modify: `tests/unit/spawn.test.ts`
- Modify: `tests/unit/difficultyOptions.test.ts`
- Modify: `tests/unit/localVersus.test.ts`

- [x] **Step 1: Write failing default preservation tests**

In `tests/unit/difficultyOptions.test.ts`, capture current M2.8 defaults:

```ts
const classic = createGame({ seed: 5, mode: 'classic-single', difficulty: 'classic-standard' })
const versus = createGame({ seed: 5, mode: 'local-versus', difficulty: 'classic-standard' })

expect(classic.constants.flySpawnSeconds).toBe(0.75)
expect(classic.constants.powerSpawnSeconds).toBe(8)
expect(classic.options.flyBand).toEqual({ minY: 64, maxY: 250 })
expect(classic.options.flyVelocity).toEqual({ minVx: -30, maxVx: 30, minVy: 55, maxVy: 95 })
expect(versus.constants.flySpawnSeconds).toBe(classic.constants.flySpawnSeconds)
expect(versus.options.flyVelocity).toEqual(classic.options.flyVelocity)
```

- [x] **Step 2: Write failing profile override spawn tests**

In `tests/unit/spawn.test.ts`, add:

```ts
const game = createGame({
  seed: 29,
  encounter: {
    flySpawnSeconds: 0.5,
    powerSpawnSeconds: 12,
    flyBand: { minY: 80, maxY: 120 },
    flyVelocity: { minVx: -55, maxVx: 55, minVy: 85, maxVy: 125 },
  },
})

updateSpawn(game, game.constants.flySpawnSeconds)
const fly = game.entities[game.entityIds[0]]

expect(fly?.kind).toBe('fly')
expect(fly?.y).toBeGreaterThanOrEqual(80)
expect(fly?.y).toBeLessThanOrEqual(120)
expect(fly?.vx).toBeGreaterThanOrEqual(-55)
expect(fly?.vx).toBeLessThanOrEqual(55)
expect(fly?.vy).toBeGreaterThanOrEqual(85)
expect(fly?.vy).toBeLessThanOrEqual(125)
```

Also assert Rush remains kind `power` with `powerKind: 'rush'`.

- [x] **Step 3: Run spawn tests red**

Run:

```bash
npm run test:unit -- tests/unit/spawn.test.ts tests/unit/difficultyOptions.test.ts tests/unit/localVersus.test.ts
```

Expected: FAIL before spawn consumes velocity/rush overrides.

- [x] **Step 4: Implement minimal spawn integration**

Update `src/game/difficulty.ts` to include default fly velocity for all Classic difficulties.

Update `src/game/createGame.ts` to copy resolved fly velocity into `game.options` or `game.constants` according to Task 3's chosen type placement.

Update `src/game/systems/spawn.ts`:

- Use `game.options.flyVelocity.minVx/maxVx/minVy/maxVy` for fly velocity.
- Continue spawning only `kind: 'fly'`.
- Continue spawning only Rush powers as `kind: 'power'`, `powerKind: 'rush'`.
- Keep existing PRNG call order stable for no-profile Classic/Versus if possible. If a call-order change is unavoidable, update deterministic fixtures only with explicit justification in the commit message.

- [x] **Step 5: Run spawn/default tests green**

Run:

```bash
npm run test:unit -- tests/unit/spawn.test.ts tests/unit/difficultyOptions.test.ts tests/unit/localVersus.test.ts
npm run build
git diff --check
```

Expected: PASS; TypeScript build PASS; no whitespace errors.

Task 4 handoff evidence, 2026-05-17:

- RED: `npm run test:unit -- tests/unit/spawn.test.ts tests/unit/difficultyOptions.test.ts tests/unit/localVersus.test.ts` failed with 1 expected spawn velocity assertion because fly `vx` still came from the legacy `-30..30` range instead of the encounter override.
- GREEN: The same focused command passed with 3 files and 14 tests after `updateSpawn()` consumed `game.options.flyVelocity`; tests cover spawn band/velocity, movement from the configured velocity, Rush power cadence/entity contract, and Classic/Versus default preservation.
- Typecheck/build: `npm run build` passed.
- Whitespace guard: `git diff --check` passed.
- Cleanup: removed generated `dist/`, `test-results/`, and `playwright-report`.
- Scope: changed only generic spawn option consumption, focused unit tests, and this Task 4 plan evidence; no campaign registry imports in `src/game/**`, no new entities/assets/save schema/runtime DOM handoff.

- [x] **Step 6: Commit**

Run:

```bash
git add src/game/difficulty.ts src/game/createGame.ts src/game/types.ts src/game/systems/spawn.ts tests/unit/spawn.test.ts tests/unit/difficultyOptions.test.ts tests/unit/localVersus.test.ts
git commit -m "feat: apply encounter tuning to classic spawns"
```

Expected: commit is limited to game option consumption and tests. It must not include campaign registry imports in `src/game/**`.

## Task 5: Runtime Campaign Profile Handoff And DOM Markers

**Files:**
- Modify: `src/runtime/app.ts`
- Modify: `src/runtime/dom.ts`
- Modify: `tests/e2e/m27-campaign-flow.spec.ts`
- Create: `tests/e2e/m29-encounter-profiles.spec.ts`
- Modify: `tests/unit/encounterProfiles.test.ts`

- [x] **Step 1: Write failing runtime resolver tests**

In `tests/unit/encounterProfiles.test.ts`, add tests that resolve each campaign level to the intended profile and game tuning:

```ts
expect(resolveCampaignEncounterProfile('home-pond-1-1-first-hunt')?.id).toBe('home-pond-baseline-gentle')
expect(resolveCampaignEncounterProfile('home-pond-1-2-quick-tongue')?.id).toBe('home-pond-quick-tongue')
expect(resolveCampaignEncounterProfile('home-pond-1-3-nightfall-feast')?.id).toBe('home-pond-nightfall-pressure')
```

- [x] **Step 2: Write failing Playwright marker tests**

Create `tests/e2e/m29-encounter-profiles.spec.ts`:

```ts
test('launches campaign levels with their encounter profile markers', async ({ page }) => {
  await page.goto('/?seed=2901&durationSeconds=0.25&theEndSeconds=0.1&simulationSpeed=120&campaignSmokeScore=1400&campaignSmokeCatches=14')

  await page.getByTestId('shell-campaign').click()
  await page.getByTestId('campaign-level-action-home-pond-1-1-first-hunt').click()
  await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-active-campaign-level', 'home-pond-1-1-first-hunt')
  await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-campaign-encounter-profile', 'home-pond-baseline-gentle')

  await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
  await page.getByTestId('campaign-next-level').click()
  await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-campaign-encounter-profile', 'home-pond-quick-tongue')

  await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
  await page.getByTestId('campaign-next-level').click()
  await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-campaign-encounter-profile', 'home-pond-nightfall-pressure')
})

test('classic single and local versus have no campaign encounter marker', async ({ page }) => {
  await page.goto('/?seed=2902&durationSeconds=10&theEndSeconds=0.1')

  await page.getByTestId('shell-play').click()
  await page.getByTestId('mode-classic-single').click()
  await page.getByTestId('start-game').click()
  await expect(page.getByTestId('m26-shell')).not.toHaveAttribute('data-campaign-encounter-profile')

  await page.getByTestId('change-mode').click()
  await page.getByTestId('mode-local-versus').click()
  await page.getByTestId('start-game').click()
  await expect(page.getByTestId('m26-shell')).not.toHaveAttribute('data-campaign-encounter-profile')
})
```

Adjust selectors if the existing shell flow requires `results` cleanup between mode changes.

- [x] **Step 3: Run runtime/E2E tests red**

Run:

```bash
npm run test:unit -- tests/unit/encounterProfiles.test.ts
npx playwright test tests/e2e/m29-encounter-profiles.spec.ts --project=chromium
```

Expected: FAIL because runtime does not pass profile options or expose markers.

- [x] **Step 4: Extend active campaign context**

In `src/runtime/app.ts`, extend `ActiveCampaignContext`:

```ts
encounterProfileId: EncounterProfileId
```

Resolve `level.contentProfileId` to an encounter profile before `resetGame()` in `launchCampaignLevel(levelId)`. If profile lookup fails, return without launching and log no user-facing error; validation tests should make this impossible in normal builds.

- [x] **Step 5: Pass resolved tuning to `createGame()`**

In `launchCampaignLevel(levelId)`:

- Get current difficulty via `currentRuntimeParams.options.difficulty`.
- Resolve profile tuning through `resolveEncounterProfileGameOptions()`.
- Call `resetGame()` with:
  - `mode: 'classic-single'`
  - current seed/query settings preserved
  - current runtime difficulty preserved
  - `encounter` override added
  - duration precedence documented and tested
- Do not change `startGameplay()`, `selectMode()`, `replay()` for non-campaign rounds except to clear any active campaign context.

- [x] **Step 6: Add DOM marker sync**

In `src/runtime/dom.ts`:

- Add `activeCampaignEncounterProfileId?: EncounterProfileId` to `ShellDomSyncState`.
- In `syncCampaignShellMarkers()`, set `data-campaign-encounter-profile` when active and remove it otherwise.
- Prefer setting the marker on `dom.shell`; optionally mirror to `dom.state` and `dom.canvas` only if E2E or debugging benefits.
- Do not add player-facing text solely for the test marker.

- [x] **Step 7: Run runtime/E2E tests green**

Run:

```bash
npm run test:unit -- tests/unit/encounterProfiles.test.ts tests/unit/campaignRegistry.test.ts
npx playwright test tests/e2e/m29-encounter-profiles.spec.ts --project=chromium
npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium
npm run build
git diff --check
```

Expected: PASS; campaign profile markers appear only for campaign levels; existing M2.7 campaign flow remains green.

Task 5 handoff evidence, 2026-05-17:

- RED: `npm run test:unit -- tests/unit/encounterProfiles.test.ts` failed with the expected missing runtime handoff: `TypeError: resolveCampaignLevelRuntimeEncounter is not a function`.
- RED: `npx playwright test tests/e2e/m29-encounter-profiles.spec.ts --project=chromium` failed with the expected missing campaign marker: shell `data-campaign-encounter-profile` was absent when `home-pond-baseline-gentle` was expected; the Classic/Versus marker absence check already passed.
- GREEN: `npm run test:unit -- tests/unit/encounterProfiles.test.ts tests/unit/campaignRegistry.test.ts` passed with 2 files and 14 tests.
- GREEN: `npx playwright test tests/e2e/m29-encounter-profiles.spec.ts --project=chromium` passed with 2 tests.
- GREEN: `npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium` passed with 6 tests.
- Typecheck/build: `npm run build` passed.
- Whitespace guard: `git diff --check` passed.
- Cleanup: removed generated `dist/`, `test-results/`, and `playwright-report`; verified they are absent.
- Scope: changed runtime handoff/DOM marker sync, focused unit/E2E coverage, and this Task 5 evidence only; `tests/e2e/m27-campaign-flow.spec.ts` did not need edits; no `src/game/**` changes, no new entities/assets/audio/save schema/backend/localization/monetization work.

Task 5 consolidation follow-up evidence, 2026-05-17:

- RED: `npx playwright test tests/e2e/m29-encounter-profiles.spec.ts --project=chromium` failed after adding `mode shortcuts clear active campaign encounter markers`; after `Digit2`, `data-mode` changed to `local-versus` while `data-active-campaign-level` was still present.
- GREEN: `npx playwright test tests/e2e/m29-encounter-profiles.spec.ts --project=chromium` passed with 3 tests after clearing active campaign context in the global mode action path.
- GREEN: `npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium` passed with 6 tests.
- GREEN: `npm run test:unit -- tests/unit/encounterProfiles.test.ts tests/unit/campaignRegistry.test.ts` passed with 2 files and 14 tests.
- Typecheck/build: `npm run build` passed.
- Whitespace guard: `git diff --check` passed.
- Cleanup: removed generated `dist/`, `test-results/`, and `playwright-report`; verified they are absent.
- Scope: changed only the runtime mode-action clear, focused M2.9 E2E coverage, and this Task 5 evidence; no `src/game/**`, content registry, assets, audio, save schema, backend, or Task 6+ behavior changes.

- [x] **Step 8: Commit**

Run:

```bash
git add src/runtime/app.ts src/runtime/dom.ts tests/e2e/m29-encounter-profiles.spec.ts tests/e2e/m27-campaign-flow.spec.ts tests/unit/encounterProfiles.test.ts
git commit -m "feat: launch campaign levels with encounter profiles"
```

Expected: commit contains runtime handoff and marker coverage only.

## Task 6: Deterministic Replay And Balancing Metrics

**Files:**
- Create or Modify: `tests/unit/encounterProfiles.test.ts`
- Modify: `tests/unit/deterministicReplay.test.ts`
- Modify: `tests/unit/spawn.test.ts`
- Modify: `src/game/replay.ts` only if a small generic metrics helper is needed.

- [x] **Step 1: Write failing deterministic metrics tests**

Add a helper in tests, not production, unless a reusable replay metrics helper clearly belongs in `src/game/replay.ts`:

```ts
function collectEncounterMetrics(levelId: CampaignLevelId, seed = 2909) {
  const profile = resolveCampaignEncounterProfile(levelId)
  if (!profile) {
    throw new Error(`missing profile for ${levelId}`)
  }
  const classicOptions = getClassicDifficulty('classic-standard')
  const tuning = resolveEncounterProfileGameOptions(profile, classicOptions)
  const game = createGame({
    seed,
    mode: 'classic-single',
    difficulty: 'classic-standard',
    ...tuning,
  })
  game.commands.start = true
  updateGame(game, 1 / 60)
  for (let step = 0; step < 8 * 60; step += 1) {
    updateGame(game, 1 / 60)
  }
  const entities = game.entityIds.map((id) => game.entities[id]).filter(Boolean)
  const flies = entities.filter((entity) => entity.kind === 'fly')
  const powers = entities.filter((entity) => entity.kind === 'power')
  return {
    flyCount: flies.length,
    flyYs: flies.map((fly) => fly.y),
    flyVys: flies.map((fly) => fly.vy ?? 0),
    powerCount: powers.length,
    entityKinds: new Set(entities.map((entity) => entity.kind)),
  }
}
```

Assertions:

- Same level + same seed returns identical metrics twice.
- `1-2` spawns more or equal flies than `1-1` over the same fixed window.
- `1-3` has highest pressure among the three.
- Band and/or velocity metrics differ between all three profiles.
- Entity kinds stay within `fly` and `power`.

- [x] **Step 2: Run metrics tests red if behavior is incomplete**

Run:

```bash
npm run test:unit -- tests/unit/encounterProfiles.test.ts tests/unit/deterministicReplay.test.ts tests/unit/spawn.test.ts
```

Expected: FAIL if tuning is not actually consumed or metrics are not distinct.

- [x] **Step 3: Tune conservatively through profile constants only**

Adjust values only in `HOME_POND_ENCOUNTER_PROFILES`:

- Keep `1-1` equal or very close to current standard.
- Make `1-2` faster than `1-1` without making Rush dominate.
- Make `1-3` highest pressure and rarer Rush.
- Keep max live entity count reasonable after an 8 to 12 second simulation.

Do not tune by adding `if levelId` branches in runtime or spawn.

- [x] **Step 4: Add max live entity/performance unit guard**

Add a short fixed-step guard:

```ts
expect(collectEncounterMetrics('home-pond-1-3-nightfall-feast').flyCount).toBeLessThanOrEqual(24)
```

Choose the exact threshold from observed green output plus margin. The threshold should catch runaway spawns, not overfit a single PRNG position.

- [x] **Step 5: Run deterministic suite green**

Run:

```bash
npm run test:unit -- tests/unit/encounterProfiles.test.ts tests/unit/deterministicReplay.test.ts tests/unit/spawn.test.ts tests/unit/difficultyOptions.test.ts tests/unit/localVersus.test.ts
npm run build
git diff --check
```

Expected: PASS; same profile/seed deterministic; same seed across the three campaign levels differs measurably; Classic/Versus defaults unchanged.

- [x] **Step 6: Commit**

Run:

```bash
git add src/content/encounterProfiles.ts src/content/registry.ts tests/unit/encounterProfiles.test.ts tests/unit/deterministicReplay.test.ts tests/unit/spawn.test.ts tests/unit/difficultyOptions.test.ts tests/unit/localVersus.test.ts src/game/replay.ts
git commit -m "test: prove m29 encounter profile determinism"
```

Expected: commit contains balancing constants and deterministic proof only. Omit files not changed.

Task 6 evidence, 2026-05-17:

- RED: `npm run test:unit -- tests/unit/encounterProfiles.test.ts tests/unit/deterministicReplay.test.ts tests/unit/spawn.test.ts` passed immediately after adding Step 1 metrics tests with 3 files and 11 tests; existing profile tuning was already consumed and distinct, so no production tuning was made.
- GREEN: `npm run test:unit -- tests/unit/encounterProfiles.test.ts tests/unit/deterministicReplay.test.ts tests/unit/spawn.test.ts tests/unit/difficultyOptions.test.ts tests/unit/localVersus.test.ts` passed with 5 files and 22 tests.
- Typecheck/build: `npm run build` passed.
- Whitespace guard: `git diff --check` passed.
- Cleanup: removed generated `dist/`, `test-results/`, and `playwright-report`; verified they are absent.
- Scope: changed deterministic replay metrics coverage, the nightfall live entity budget guard, and this Task 6 evidence only; no `src/game/**`, content constants, registry data, runtime campaign handoff, DOM markers, assets, audio, save schema, backend, localization, monetization, or Task 7+ work.

## Task 7: Campaign Flow, Save Schema, And Regression Gates

**Files:**
- Modify: `tests/e2e/m29-encounter-profiles.spec.ts`
- Modify: `tests/e2e/m27-campaign-flow.spec.ts`
- Modify: `tests/unit/saveManager.test.ts`
- Modify: `tests/unit/campaignProgress.test.ts` only if existing assertions need stronger no-schema-change coverage.

- [x] **Step 1: Add failing SaveManager no-schema-change assertions**

In `tests/unit/saveManager.test.ts`, ensure M2.9 does not change persistence:

```ts
const save = createDefaultSave()
expect(SAVE_SCHEMA_VERSION).toBe(2)
expect(save.version).toBe(2)
expect(JSON.stringify(save)).not.toContain('encounterProfile')
expect(JSON.stringify(save)).not.toContain('home-pond-nightfall-pressure')
```

- [x] **Step 2: Add focused campaign marker persistence E2E**

In `tests/e2e/m29-encounter-profiles.spec.ts`, after a campaign pass/reload:

- Save still lives at `frogs-and-flies.save.v2`.
- Saved JSON has `"version":2`.
- Saved JSON does not contain encounter profile ids.
- Reopening campaign shows unlock/pass state exactly as M2.7 did.

- [x] **Step 3: Run save/campaign tests red or green**

Run:

```bash
npm run test:unit -- tests/unit/saveManager.test.ts tests/unit/campaignProgress.test.ts
npx playwright test tests/e2e/m29-encounter-profiles.spec.ts tests/e2e/m27-campaign-flow.spec.ts --project=chromium
```

Expected: PASS after previous tasks if no schema changes were made. If FAIL, use systematic-debugging before patching.

- [x] **Step 4: Patch only if the tests reveal a real regression**

Allowed fixes:

- Clear DOM marker when leaving campaign.
- Ensure replay/next level refreshes active profile id.
- Ensure Classic Modes clears active campaign context.
- Ensure save writes do not include profile ids.

Disallowed fixes:

- Save schema bump.
- New migration.
- Persisting profile ids in `SaveData`.

- [x] **Step 5: Run broader focused regression green**

Run:

```bash
npm run test:unit -- tests/unit/saveManager.test.ts tests/unit/campaignProgress.test.ts tests/unit/campaignObjectives.test.ts tests/unit/runtimeShell.test.ts tests/unit/runtimeParams.test.ts
npx playwright test tests/e2e/m27-campaign-flow.spec.ts tests/e2e/m29-encounter-profiles.spec.ts tests/e2e/m26-persistence.spec.ts --project=chromium
npm run build
git diff --check
```

Expected: PASS.

- [x] **Step 6: Commit**

Run:

```bash
git add tests/unit/saveManager.test.ts tests/unit/campaignProgress.test.ts tests/e2e/m29-encounter-profiles.spec.ts tests/e2e/m27-campaign-flow.spec.ts src/runtime/app.ts src/runtime/dom.ts
git commit -m "test: guard m29 campaign persistence regressions"
```

Expected: commit contains save/schema/campaign regression guardrails only. Omit unchanged files.

### Task 7 Evidence

- Added SaveManager no-schema-change assertions that keep `SAVE_SCHEMA_VERSION`/save data at v2 and reject encounter profile fields/ids in default saves.
- Added M2.9 campaign persistence E2E covering full Home Pond pass, `frogs-and-flies.save.v2`, saved `"version":2`, no encounter profile ids in saved JSON, and pass/unlock state after reload.
- Step 3 result: `npm run test:unit -- tests/unit/saveManager.test.ts tests/unit/campaignProgress.test.ts` passed green on first run with 2 files and 25 tests; `npx playwright test tests/e2e/m29-encounter-profiles.spec.ts tests/e2e/m27-campaign-flow.spec.ts --project=chromium` passed green on first run with 10 tests. No runtime patch was needed.
- Step 5 result: focused unit gate passed with 5 files and 38 tests; focused Chromium E2E gate passed with 16 tests; `npm run build` passed; `git diff --check` passed.
- Cleanup: removed generated `dist/`, `test-results/`, and `playwright-report`.
- Scope: changed only Task 7 tests and this Task 7 evidence; no save schema bump, migration, persisted encounter profile ids, `src/runtime/**` patch, `src/game/**` change, assets, audio, backend, localization, monetization, or Task 8+ docs.

## Task 8: Documentation And Scope Guard Tests

**Files:**
- Modify: `README.md`
- Modify: `tests/unit/readmeControls.test.ts`
- Modify: `docs/superpowers/plans/2026-05-17-frogs-and-flies-m29-home-pond-encounter-mechanics-profiles-implementation.md`
- Do Not Modify: `ASSET_MANIFEST.md` unless consolidation explicitly requests a no-assets note.

- [x] **Step 1: Write failing README documentation gate**

Update `tests/unit/readmeControls.test.ts` to require README text for:

- `Current M2.9`.
- `Home Pond Encounter Mechanics Profiles`.
- `home-pond-baseline-gentle`.
- `home-pond-quick-tongue`.
- `home-pond-nightfall-pressure`.
- `data-campaign-encounter-profile`.
- `Classic Single and Local Versus keep the M2.8 default pacing` or equivalent.
- `No save schema bump`.
- `No new insects, hazards, power-ups, levels, biomes, bosses, assets, audio, backend, localization, or monetization`.

Add negative assertions against false claims such as:

- `M2.9 adds new insects`.
- `M2.9 adds a new biome`.
- `M2.9 adds bosses`.
- `M2.9 bumps SaveManager`.
- `M2.9 adds assets`.

- [x] **Step 2: Run README gate red**

Run:

```bash
npm run test:unit -- tests/unit/readmeControls.test.ts
```

Expected: FAIL before README is updated.

- [x] **Step 3: Update README**

Edit `README.md`:

- Replace "Current M2.8" current-state lead with "Current M2.9".
- Keep M2.8 asset/audio information as the current visual/audio baseline.
- Add a concise M2.9 section explaining:
  - existing three Home Pond campaign levels now use typed encounter profiles,
  - profile differences are spawn cadence, fly band, fly velocity, and Rush cadence,
  - campaign launch exposes `data-campaign-encounter-profile`,
  - Classic Single and Local Versus are unchanged when not launched from Campaign,
  - SaveManager remains v2,
  - no new assets/audio/insects/levels/biomes/bosses/backend/localization/monetization.
- Add focused M2.9 verification commands:

```bash
npm run test:unit -- tests/unit/campaignRegistry.test.ts tests/unit/encounterProfiles.test.ts tests/unit/difficultyOptions.test.ts tests/unit/spawn.test.ts tests/unit/deterministicReplay.test.ts tests/unit/localVersus.test.ts tests/unit/saveManager.test.ts
npx playwright test tests/e2e/m29-encounter-profiles.spec.ts tests/e2e/m27-campaign-flow.spec.ts --project=chromium
```

- [x] **Step 4: Update this plan checkboxes only for executed tasks**

If future workers update checkbox status in this plan, only mark steps that have actually been completed with evidence. Do not mark deployment checkboxes done until deployment smoke has finished.

- [x] **Step 5: Run docs gate green**

Run:

```bash
npm run test:unit -- tests/unit/readmeControls.test.ts
npm run build
git diff --check
```

Expected: PASS; TypeScript build PASS; no whitespace errors.

- [x] **Step 6: Run scope guard commands**

Run:

```bash
git diff --name-only HEAD~1..HEAD
rg -n "type EntityKind =|type PowerKind =" src/game/types.ts
rg -n "SAVE_SCHEMA_VERSION|frogs-and-flies.save.v2" src/runtime/save.ts tests/unit/saveManager.test.ts
find public/assets -maxdepth 2 -type d -name "m29" -print
find public/audio -type f -newer docs/superpowers/specs/2026-05-17-frogs-and-flies-m29-home-pond-encounter-mechanics-profiles-design.md -print
```

Expected:

- Diff contains docs/tests and no asset/audio additions.
- `EntityKind` remains `fly | power`.
- `PowerKind` remains `rush`.
- `SAVE_SCHEMA_VERSION` remains `2`.
- No `public/assets/m29` directory.
- No new audio files from this milestone.

Task 8 evidence:

- RED: `npm run test:unit -- tests/unit/readmeControls.test.ts` failed before README update with the expected missing `Current M2.9` assertion.
- GREEN: `npm run test:unit -- tests/unit/readmeControls.test.ts` passed 5 tests; `npm run build` passed; `git diff --check` passed.
- Scope guards: pre-commit `git diff --name-only HEAD` listed only `README.md`, this plan, and `tests/unit/readmeControls.test.ts`; `EntityKind` remained `'fly' | 'power'`; `PowerKind` remained `'rush'`; `SAVE_SCHEMA_VERSION` remained `2`; no `public/assets/m29` directory or new `public/audio` files were found.
- Commit: local commit created with message `docs: document m29 encounter profiles`; no push performed.

- [x] **Step 7: Commit**

Run:

```bash
git add README.md tests/unit/readmeControls.test.ts docs/superpowers/plans/2026-05-17-frogs-and-flies-m29-home-pond-encounter-mechanics-profiles-implementation.md
git commit -m "docs: document m29 encounter profiles"
```

Expected: commit contains docs and docs-gate tests only.

## Task 9: Focused Regression, Full Local Gate, And Cleanup

**Files:**
- No source edits expected unless tests reveal a regression.

- [x] **Step 1: Run focused M2.9 unit gate**

Run:

```bash
npm run test:unit -- tests/unit/campaignRegistry.test.ts tests/unit/encounterProfiles.test.ts tests/unit/difficultyOptions.test.ts tests/unit/spawn.test.ts tests/unit/deterministicReplay.test.ts tests/unit/localVersus.test.ts tests/unit/saveManager.test.ts tests/unit/readmeControls.test.ts
```

Expected: PASS.

Result (2026-05-17): PASS. Vitest reported 8 test files passed and 56 tests passed.

- [x] **Step 2: Run full unit gate**

Run:

```bash
npm run test:unit
```

Expected: PASS for all Vitest suites.

Result (2026-05-17): PASS. Vitest reported 31 test files passed and 177 tests passed.

- [x] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: PASS and `dist/` generated.

Result (2026-05-17): PASS. `tsc && vite build` completed, transformed 748 modules, and generated `dist/`.

- [x] **Step 4: Run focused campaign/assets/PWA E2E gate**

Run:

```bash
npx playwright test tests/e2e/m29-encounter-profiles.spec.ts tests/e2e/m27-campaign-flow.spec.ts tests/e2e/m28-asset-pipeline.spec.ts tests/e2e/m26-pwa-offline.spec.ts tests/e2e/m26-accessibility.spec.ts tests/e2e/m26-performance.spec.ts --project=chromium
```

Expected: PASS.

Result (2026-05-17): PASS. Playwright Chromium reported 35 tests passed.

- [x] **Step 5: Run full E2E gate**

Run:

```bash
npm run test:e2e
```

Expected: PASS, with only already-documented browser-specific skips if present.

Result (2026-05-17): PASS. Playwright reported 270 passed and 3 skipped; skips were the documented WebKit offline/PWA asset-availability cases.

- [x] **Step 6: Run combined test gate**

Run:

```bash
npm test
```

Expected: `npm run test:unit` and `npm run test:e2e` both PASS.

Result (2026-05-17): PASS. Combined gate reported Vitest 31 files/177 tests passed, then Playwright 270 passed and 3 documented WebKit skips.

- [x] **Step 7: Cleanup generated artifacts**

Run:

```bash
rm -rf dist test-results playwright-report
git status --short --branch
```

Expected: no generated artifacts remain; worktree contains only intentional tracked changes, or is clean after commits.

Result (2026-05-17): PASS. Removed `dist`, `test-results`, and `playwright-report`; `git status --short --branch` reported only `## ff2-m0-pixijs...origin/ff2-m0-pixijs`.

- [x] **Step 8: Final local scope audit**

Run:

```bash
rg -n "home-pond-1-4|m29-|mosquito|gadfly|dragonfly|golden|toxic|boss|Queen Bee|FrogCoins|leaderboard|analytics|telemetry|localization|i18n" src tests README.md docs/superpowers/plans/2026-05-17-frogs-and-flies-m29-home-pond-encounter-mechanics-profiles-implementation.md
rg -n "from '../content|from '../../content|content/registry|CampaignLevelId|EncounterProfileId" src/game
git diff --check
git status --short --branch
```

Expected:

- No accidental new level/species/boss/platform scope.
- `src/game/**` has no campaign/content registry imports. Type-only generic encounter tuning imports inside game are acceptable only if they do not import `src/content/**`.
- No whitespace errors.
- Worktree clean after final commit.

Result (2026-05-17): PASS. Scope-term matches were limited to plan/README guard text, content invalid-scope ids, and unit-test invalid fixtures; no accidental source-scope expansion was found. `src/game` content/campaign import audit returned no matches. `git diff --check` passed, and status was clean before this plan evidence update.

- [x] **Step 9: Commit final plan checkbox update if changed**

Run only if the plan checkbox evidence changed:

```bash
git add docs/superpowers/plans/2026-05-17-frogs-and-flies-m29-home-pond-encounter-mechanics-profiles-implementation.md
git commit -m "docs: complete m29 local verification checklist"
```

Expected: plan-only commit.

## Task 10: Docker, Push, Coolify Deploy, And Production Smoke

**Files:**
- No source edits expected.
- Read: `Dockerfile`
- Read: `nginx.conf`
- Read: `README.md`

- [x] **Step 1: Verify clean local HEAD before Docker**

Run:

```bash
git status --short --branch
git log --oneline --decorate -5
```

Expected: branch is clean and contains all M2.9 implementation/doc commits.

- [x] **Step 2: Docker build**

Run:

```bash
docker build -t frogs-and-flies-m29-encounter-profiles .
```

Expected: image builds successfully.

- [x] **Step 3: Docker static smoke**

Run in one terminal:

```bash
docker run --rm --name frogs-and-flies-m29 -p 18080:80 frogs-and-flies-m29-encounter-profiles
```

Run in another terminal:

```bash
curl -I http://127.0.0.1:18080/
curl -I http://127.0.0.1:18080/manifest.webmanifest
curl -I http://127.0.0.1:18080/service-worker.js
curl -I http://127.0.0.1:18080/assets/m28/m28-home-pond-background-v1.png
curl -I http://127.0.0.1:18080/audio/music/home-pond-loop.mp3
PLAYWRIGHT_BASE_URL=http://127.0.0.1:18080 npx playwright test tests/e2e/m29-encounter-profiles.spec.ts tests/e2e/m27-campaign-flow.spec.ts tests/e2e/m28-asset-pipeline.spec.ts --project=chromium
```

Expected:

- HTTP `200` for app shell, manifest, service worker, representative M2.8 asset/audio files.
- M2.9, M2.7, and M2.8 Chromium smoke PASS against Docker.

- [x] **Step 4: Stop Docker container**

Run:

```bash
docker stop frogs-and-flies-m29
```

Expected: container stops. If it already exited, confirm no `frogs-and-flies-m29` container remains.

- [x] **Step 5: Push branch after local/Docker gates**

Run:

```bash
git status --short --branch
git push origin ff2-m0-pixijs
```

Expected: branch pushes successfully and local HEAD equals `origin/ff2-m0-pixijs`.

- [x] **Step 6: Coolify production deploy**

Use the Coolify deployment workflow for app `frogs-and-flies-remake` on server `cx32-hell`, URL `https://frog.resline.net`.

Required evidence:

- deployed commit equals pushed HEAD,
- deployment status `finished`,
- app health `running:healthy`,
- production URL responds with current app shell.

- [x] **Step 7: Production static smoke**

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
PLAYWRIGHT_BASE_URL=https://frog.resline.net npx playwright test tests/e2e/m29-encounter-profiles.spec.ts --project=chromium
PLAYWRIGHT_BASE_URL=https://frog.resline.net npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium
PLAYWRIGHT_BASE_URL=https://frog.resline.net npx playwright test tests/e2e/m28-asset-pipeline.spec.ts --project=chromium
```

Expected:

- M2.9 encounter profile marker smoke passes on production.
- M2.7 campaign flow passes on production.
- M2.8 asset/audio smoke passes on production.

- [x] **Step 9: Cleanup production smoke artifacts**

Run:

```bash
rm -rf test-results playwright-report
git status --short --branch
```

Expected: branch clean and synced to origin. Report commit hash, deployment UUID, production URL, and verification counts to parent/consolidation.

Task 10 evidence from 2026-05-17:

- Local pre-Docker HEAD was clean on `ff2-m0-pixijs` at `1d5625a8f5bd7e3eaf93c28755ba248c21962b60`.
- Docker image `frogs-and-flies-m29-encounter-profiles` built successfully.
- Docker static smoke on `http://127.0.0.1:18080` returned `200` for `/`, `/manifest.webmanifest`, `/service-worker.js`, `/assets/m28/m28-home-pond-background-v1.png`, and `/audio/music/home-pond-loop.mp3`; MIME types were `text/html`, `application/manifest+json`, `application/javascript`, `image/png`, and `audio/mpeg`.
- Docker Playwright smoke passed: `20 passed` for `tests/e2e/m29-encounter-profiles.spec.ts`, `tests/e2e/m27-campaign-flow.spec.ts`, and `tests/e2e/m28-asset-pipeline.spec.ts` on Chromium.
- Docker container `frogs-and-flies-m29` was stopped and no matching container remained.
- `git push origin ff2-m0-pixijs` returned `Everything up-to-date`; pushed/deployed code commit was `1d5625a8f5bd7e3eaf93c28755ba248c21962b60`.
- Coolify health probe returned `OK`; authenticated version probe returned `4.0.0`.
- Coolify deployment id `1178`, UUID `cl0uuhwgn1xbzqmqtc20k4ku`, finished at `2026-05-17T07:43:23.000000Z` on `cx32-hell` for app `frogs-and-flies-remake`.
- Coolify deployment API reported commit `1d5625a8f5bd7e3eaf93c28755ba248c21962b60`, matching pushed HEAD at deployment time. App detail reported `ff2-m0-pixijs`, `git_commit_sha: HEAD`, and `status: running:healthy`.
- Production static smoke at `https://frog.resline.net` returned `200` for `/`, `/manifest.webmanifest`, `/service-worker.js`, `/assets/m28/m28-home-pond-background-v1.png`, `/assets/m28/m28-ui-star-filled-v1.png`, and `/audio/music/home-pond-loop.mp3`; MIME types were `text/html`, `application/manifest+json`, `application/javascript`, `image/png`, `image/png`, and `audio/mpeg`.
- Production Playwright smoke passed for `tests/e2e/m29-encounter-profiles.spec.ts` (`4 passed`) and `tests/e2e/m27-campaign-flow.spec.ts` (`6 passed`).
- Production Playwright smoke for `tests/e2e/m28-asset-pipeline.spec.ts` did not pass: required command returned `9 passed, 1 failed`. The failing test was `falls back when the M2.8 gameplay art pack is unavailable`, where `data-assets-pack` was still unset at the 5 second assertion timeout. A focused rerun reproduced the failure. Diagnostic evidence showed the route abort happened at about `1.3s`, fallback began, and `data-assets-pack` became `legacy` at about `6.3s`, after the assertion window. No source/test edits were made in this Task 10 scope.
- Cleanup removed `test-results` and `playwright-report`; no `frogs-and-flies-m29` container remained.

## Final Completion Criteria

M2.9 is complete only when all of the following are true:

- The registry has typed encounter/mechanics profile definitions for exactly the three existing Home Pond content profiles.
- Campaign levels `1-1`, `1-2`, and `1-3` resolve to distinct encounter/game options.
- Same seed across the three campaign profiles produces measurable deterministic differences in spawn cadence, fly band, fly velocity, Rush cadence, duration, or another documented existing mechanic.
- Same seed plus same profile remains deterministic across repeated runs.
- Classic Single and Local Versus default behavior remains unchanged when no campaign encounter profile is supplied.
- Runtime campaign launch passes explicit resolved profile tuning into `createGame()` without campaign-specific conditionals inside game loops.
- Campaign flow, unlocks, stars, replay, and persistence remain green.
- SaveManager remains v2 with no migration or schema bump.
- No new entity kinds, power kinds, campaign levels, assets, audio paths, backend, localization, monetization, biome, boss, or broad game refactor were introduced.
- `src/game/**` does not import `src/content/**`.
- Unit, build, focused M2.7/M2.8/M2.6 regression E2E, full E2E, scope guards, Docker smoke, Coolify deploy, and production smoke have concrete passing evidence.

## Rollback Strategy

Rollback should be simple because M2.9 must not touch saves or assets:

- Revert M2.9 runtime/game/profile commits to return all campaign levels to M2.8 Classic Single behavior.
- Since SaveManager remains v2, user saves remain compatible before and after rollback.
- Since no assets/audio/PWA cache entries are added, static deployment rollback is a normal JS bundle rollback.
- If a single profile is problematic, temporarily map all three content profiles to `home-pond-baseline-gentle` in one commit with tests adjusted to prove rollback intent.

## Handoff Notes For Consolidation

Consolidation after each worker should check:

- Scope guard compliance, especially no asset/audio/save schema/content expansion.
- TDD evidence for red/green behavior changes.
- `src/game/**` remains campaign-agnostic.
- Classic Single and Local Versus default behavior remains unchanged.
- Generated artifacts are cleaned.
- Commits are task-sized and messages match the work.

Final implementation handoff must include:

- Commit hashes for each task group.
- Verification commands and pass/fail counts.
- Docker image/tag evidence.
- Coolify deployment UUID and deployed commit.
- Production URL smoke evidence.
