# Frogs and Flies M2.9 Home Pond Encounter Mechanics Profiles Design Spec

**Date:** 2026-05-17

**Status:** Draft for implementation planning

**Milestone Name:** M2.9 - Home Pond Encounter Mechanics Profiles

**Selected Direction:** Make the three existing Home Pond campaign levels feel mechanically different through typed encounter/mechanics profiles while keeping the existing common fly, Rush power, M2.8 art/audio pack, SaveManager v2, and Classic/Versus defaults intact.

## Assumptions And Approval Context

- The user has approved current and future stages, so this design-doc step proceeds without additional questions even though the brainstorming workflow normally asks for clarification before writing the spec.
- This document is the design step only. It does not implement code, change gameplay, alter assets, or update deployment state.
- M2.8 is complete at current HEAD and deployed to `https://frog.resline.net` as the baseline for M2.9.
- M2.9 intentionally rejects new insect kinds for now. The project documentation eventually targets many insect species, hazards, power-ups, bosses, and biomes, but the current codebase has one gameplay fly entity, one Rush power entity, one scoring path, and one M2.8 common-fly art set.
- Campaign levels `1-1`, `1-2`, and `1-3` already exist and should remain the only campaign levels in this milestone.
- SaveManager remains v2. M2.9 must not introduce a save schema bump because encounter profiles are static content/runtime parameters, not player-owned persistent data.

## Current State After M2.8

M2.8 closed a major product presentation gap:

- The app is a PixiJS v8, TypeScript, Vite browser game with deterministic fixed-step gameplay.
- Classic Single, Local Versus, and the Home Pond Campaign Prologue are present and deployed.
- Campaign includes `Home Pond`, the `Dawn At Home Pond` prologue, three levels, pass/fail objectives, stars, unlocks, replay, results actions, and SaveManager v2 persistence.
- The content registry defines exactly one campaign, one prologue, three levels, and three level content profiles:
  - `home-pond-intro-classic`
  - `home-pond-quick-classic`
  - `home-pond-night-classic`
- Those content profiles currently differ mainly by label and visual tone. Runtime launches every campaign level as `classic-single` with current runtime difficulty/default duration.
- `src/game/createGame.ts` accepts mode, seed, duration, the-end seconds, and difficulty. It resolves `ClassicOptions` from `src/game/difficulty.ts`.
- `ClassicOptions` currently controls difficulty, fly band, auto-tongue, jump forgiveness, and fly spawn cadence.
- `src/game/systems/spawn.ts` spawns only `fly` and `power` entities. Fly spawn timing, fly Y band, initial velocity, and Rush cadence are controlled by game constants/options and seeded PRNG.
- M2.8 added a static Home Pond visual/audio asset pack, PWA cache parity, MIME/offline checks, and campaign/prologue/results visuals.

The product is now playable and more polished, but the three campaign levels still risk feeling like the same round with different objective thresholds. M2.9 should prove that the content registry can drive real gameplay pacing without broadening the content roster.

## Why M2.9 Is Next

The full project documentation calls for campaign breadth, multiple insects, six biomes, bosses, and difficulty progression. Adding new species or another chapter now would be premature because the current game has not yet proven a safe path for level-authored gameplay tuning.

M2.9 should answer one narrow question:

> Can a typed campaign content profile change encounter pacing in deterministic gameplay while Classic Single and Local Versus remain unchanged?

This is the smallest milestone that reduces campaign sameness and builds a rail for future content:

- Future levels can tune spawn cadence, fly band, velocity, Rush cadence, and duration without one-off runtime conditionals.
- Later insect variety can reuse the same profile boundary after the current common-fly path is proven.
- Tests can catch "dead data" where registry fields exist but gameplay ignores them.
- The player gets a visible difference between `1-1`, `1-2`, and `1-3` without adding new assets, saves, modes, or deployment complexity.

## Options Considered

### Option A - Encounter Mechanics Profiles With Existing Fly Only

Add typed encounter/mechanics profiles for the existing three campaign levels. Resolve profile data into explicit `createGame()` options and keep the implemented entity set to the existing common fly plus Rush power.

Tradeoffs:

- Best risk/payoff for M2.9.
- Makes the three existing campaign levels feel different without new art, scoring types, collision branches, or save data.
- Proves registry-to-gameplay integration and deterministic replay behavior.
- Requires careful tests to ensure Classic Single and Local Versus default behavior is unchanged.
- Does not satisfy the final multi-species product target yet.

### Option B - Home Pond Insect Variety v1

Add 2-3 insect variants with different movement, score values, rendering, and spawn weights.

Tradeoffs:

- Higher visible variety.
- Too broad for the current state. It would require species ids, render mapping, collision/scoring changes, asset/cache/manifest updates, balance work, and more E2E coverage in one milestone.
- M2.8 only shipped common-fly art, so this would either reuse misleading art or create a new asset milestone inside a gameplay milestone.

### Option C - Campaign Chapter Expansion

Add more Home Pond campaign levels while keeping the current gameplay loop.

Tradeoffs:

- More visible campaign content.
- Low mechanical value while levels `1-1` through `1-3` still play similarly.
- Risks multiplying content definitions before the content-to-gameplay tuning boundary is settled.

### Recommendation

Choose Option A.

M2.9 should be a profile and integration milestone: no new entity kinds, no new levels, no new art, and no save schema work. It should make the existing three levels measurably different through pacing, fly lane, velocity, round pressure, and Rush cadence.

## Scope

M2.9 includes:

- Extend the Home Pond content registry with typed encounter/mechanics profiles for the existing three content profiles.
- Define exactly three encounter profiles:
  - `home-pond-baseline-gentle`
  - `home-pond-quick-tongue`
  - `home-pond-nightfall-pressure`
- Add a resolver that converts a campaign level/content profile into explicit game creation options.
- Extend `createGame()` and game option types only as needed to accept profile-driven overrides for existing common-fly/Rush behavior.
- Tune profile parameters for:
  - round duration or pressure window
  - fly spawn cadence
  - fly Y band
  - fly horizontal/vertical velocity ranges
  - Rush power cadence
  - optional initial spawn offset, if needed for deterministic smoke tests
- Preserve current Classic Single and Local Versus defaults when no campaign encounter profile is supplied.
- Add unit tests proving the same seed produces measurable differences across `1-1`, `1-2`, and `1-3`.
- Add focused E2E proving each campaign level launches with its intended profile marker and still records results/unlocks.
- Keep M2.7 campaign flow, M2.8 asset pipeline, PWA/offline, accessibility, and performance smoke green.

## Strict Non-Goals

- No new insect kinds, species ids, mosquito/gadfly/firefly targets, golden fly, toxic insect, bomb insect, dragonfly, or broad insect roster.
- No new hazards.
- No new power-ups beyond existing Rush.
- No new campaign levels, prologues, campaigns, world map, biome map, or chapter content.
- No new biome beyond Home Pond.
- No bosses, Queen Bee, boss framework, or boss unlock logic.
- No SaveManager schema bump and no campaign progress model change.
- No backend, online leaderboard, accounts, cloud save, analytics, telemetry, monetization, ads, payments, or portal SDK.
- No PL/EN localization pass.
- No new visual assets, audio assets, `ASSET_MANIFEST.md` asset additions, Howler, TexturePacker, Spine, atlas runtime, or audio-sprite pipeline.
- No broad `src/game/**` refactor. M2.9 may make small, typed changes to existing game creation/spawn/movement option flow, but must not rewrite simulation ownership.
- No live API or external network dependency.

If implementation appears to require any non-goal, the worker should stop and return `BLOCKED_SCOPE_EXPANSION` to consolidation.

## Player-Visible Behavior

The player should not see a new mode or new campaign branch. They should feel that the existing three Home Pond levels have different encounter pacing.

### 1-1 First Hunt

`1-1` remains the welcoming baseline.

Expected feel:

- Gentle fly cadence.
- Wider, forgiving fly band around the current Classic Standard lane.
- Current Rush cadence or slightly friendlier cadence.
- Full default round length unless implementation uses a clearly documented current default.
- Best target for first-time campaign success.

Player interpretation:

- "Learn the rhythm, leap, catch enough flies, and see results."

### 1-2 Quick Tongue

`1-2` should create time and timing pressure without introducing new entities.

Expected feel:

- Faster fly spawn cadence than `1-1`.
- Similar or slightly narrower fly band so more flies cross reachable lanes.
- Slightly faster fly velocity than `1-1`.
- Optional shorter round duration if tests and tuning show that pressure is clearer than pure spawn-rate increase.
- Rush cadence should not dominate the level; it can remain baseline or be slightly rarer.

Player interpretation:

- "More chances appear quickly, so catches and tongue timing matter."

### 1-3 Nightfall Feast

`1-3` should feel like the high-pressure finale of the prologue while still using the common fly only.

Expected feel:

- Highest spawn pressure among the three levels.
- Tighter or more elevated fly band to make aim more demanding.
- Faster vertical drift or wider velocity range than `1-1`.
- Rarer Rush cadence than `1-1`/`1-2`, unless tuning shows the level becomes too punitive.
- Uses the existing night visual tone/results language from M2.7/M2.8; no new night mechanics.

Player interpretation:

- "The pond is busier and more demanding before night ends."

### Classic Single And Local Versus

Classic Single and Local Versus must remain the M2.8 baseline:

- Same default difficulty semantics.
- Same default fly band/spawn cadence/velocity/Rush cadence.
- Same high-score and local stats behavior.
- Same mode selection and replay behavior.
- No campaign profile marker when launched outside Campaign.

## Typed Encounter/Mechanics Profile Model

M2.9 should extend the existing content model rather than inventing a separate campaign runtime format.

Suggested ids:

```ts
export type EncounterProfileId =
  | 'home-pond-baseline-gentle'
  | 'home-pond-quick-tongue'
  | 'home-pond-nightfall-pressure'
```

Suggested profile shape:

```ts
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

The exact implementation can choose a slightly different shape if it is simpler, but it must preserve these design properties:

- Profile ids are typed.
- Every `LevelContentProfileDefinition` references exactly one encounter profile.
- The registry validator rejects missing encounter profile ids.
- The registry validator rejects new entity kinds in M2.9.
- Profile data is static and same-origin bundled TypeScript, not remote JSON.
- The simulation receives resolved numeric options, not campaign ids or story ids.

Suggested mapping:

| Campaign level | Content profile | Encounter profile | Intended tuning |
| --- | --- | --- | --- |
| `1-1 First Hunt` | `home-pond-intro-classic` | `home-pond-baseline-gentle` | Baseline cadence, forgiving lane, normal Rush. |
| `1-2 Quick Tongue` | `home-pond-quick-classic` | `home-pond-quick-tongue` | Faster spawn, slightly faster flies, timing/catch pressure. |
| `1-3 Nightfall Feast` | `home-pond-night-classic` | `home-pond-nightfall-pressure` | Highest pressure, tighter lane, faster drift, rarer Rush. |

Suggested initial tuning ranges, to be validated by tests and short play smoke:

| Profile | Fly spawn multiplier | Fly band offset | Velocity range | Rush multiplier | Duration |
| --- | ---: | --- | --- | ---: | --- |
| `baseline-gentle` | `1.00` | `{ minY: 0, maxY: 0 }` | current default | `1.00` | default |
| `quick-tongue` | `0.78` to `0.88` | `{ minY: 12, maxY: -18 }` | modestly faster than default | `1.10` to `1.25` | default or short pressure round |
| `nightfall-pressure` | `0.65` to `0.78` | `{ minY: -24, maxY: -36 }` or narrower high lane | fastest M2.9 range | `1.30` to `1.60` | default or short pressure round |

Multiplier semantics should be documented in code:

- Lower `flySpawnSecondsMultiplier` means more frequent fly spawns.
- Higher `powerSpawnSecondsMultiplier` means less frequent Rush power spawns.

## Runtime And Game Integration Boundaries

M2.9 should keep campaign/story concepts out of deterministic simulation.

### Content Layer

Responsibilities:

- Own campaign level/content/encounter profile ids and definitions.
- Validate that all three levels have encounter profiles.
- Validate that M2.9 still has one campaign, one prologue, three levels, and three content profiles.
- Provide lookup helpers such as `getEncounterProfile()` or `resolveCampaignEncounterProfile()`.

Content layer must not:

- Mutate save data.
- Start gameplay.
- Import DOM/runtime app objects.

### Runtime Layer

Responsibilities:

- When `launchCampaignLevel(levelId)` runs, look up the level content profile and encounter profile.
- Resolve the profile into `CreateGameOptions`.
- Call `createGame()` with `mode: 'classic-single'` and explicit encounter overrides.
- Set DOM/test metadata such as `data-campaign-encounter-profile="home-pond-quick-tongue"` for focused E2E and debugging.
- Continue recording results through existing M2.7 objective/star/save helpers.

Runtime layer must not:

- Put profile-specific spawn logic in DOM code.
- Change save schema to remember profile data.
- Alter Classic/Versus start paths.

### Game Layer

Responsibilities:

- Accept optional encounter tuning through `CreateGameOptions`.
- Merge tuning with existing `ClassicOptions` and constants.
- Use resolved numeric values in spawn/movement systems.
- Keep default behavior identical when no encounter tuning is supplied.

Game layer must not:

- Import campaign registry definitions.
- Branch on campaign level ids.
- Add new entity kinds or scoring categories.
- Know about prologues, stars, unlocks, or save data.

### Render/Asset Layer

Responsibilities:

- Keep using M2.8 common fly, frog, Rush, pond, prologue, and UI assets.
- Optionally expose debug/test markers already owned by runtime.

Render/asset layer must not:

- Add new M2.9 asset paths.
- Change cache manifests for new content.
- Encode encounter tuning through art file names.

## Deterministic Replay And Balancing Strategy

M2.9 changes gameplay pacing, so determinism must be verified directly.

### Determinism Requirements

- Same seed + same encounter profile + same input script produces the same spawn sequence and entity positions.
- Same seed across `1-1`, `1-2`, and `1-3` produces intentionally different measurable output.
- Different profiles must not rely on wall-clock timing or nondeterministic browser state.
- Profile resolution should happen before `createGame()` constructs PRNG state.
- If profile-specific round duration changes, it must be part of game creation options and visible in test metadata.

### Measurable Differences

Unit tests should compare profile behavior using fixed-step simulation and no human input. At minimum, tests should assert differences in two or more of:

- number of fly entities spawned after a fixed simulated time
- first fly spawn time
- fly Y distribution within profile-specific band
- fly velocity range
- Rush power spawn count or first Rush spawn time
- round duration, if the profile uses duration pressure

The tests should not assert exact long entity arrays unless necessary. Prefer compact derived metrics that prove profile data is consumed while staying robust to unrelated implementation details.

### Balancing Strategy

Initial tuning should be conservative:

- `1-1` should remain passable under current campaign smoke parameters and normal manual play.
- `1-2` should raise activity without requiring perfect input.
- `1-3` should feel busier but not become a wall before new mechanics exist.
- Objective thresholds may remain unchanged in M2.9 unless tests show the new pacing makes an existing threshold impossible or trivial. If thresholds change, that must be explicit, documented, and covered by campaign objective tests.
- Tuning should happen through profile constants, not magic numbers in spawn or runtime event handlers.

## Tests And Verification Strategy

### Unit Tests

Required focused unit coverage:

- Content registry:
  - every existing content profile references a valid encounter profile
  - all encounter profile ids are unique
  - invalid/missing encounter profile references fail validation
  - validator rejects non-M2.9 entity kinds
  - M2.9 scope remains one campaign, one prologue, three levels, three content profiles
- Profile resolver:
  - resolves `1-1`, `1-2`, `1-3` to different numeric game options
  - returns no profile override for Classic Single/Local Versus routes
  - clamps or rejects invalid profile tuning if validation is implemented
- Game creation/default preservation:
  - `createGame({ seed, mode: 'classic-single' })` matches the previous baseline values
  - `createGame({ seed, mode: 'local-versus' })` matches the previous baseline values
  - encounter profile options change only intended fields
- Spawn/movement determinism:
  - same profile/seed replays the same metrics
  - same seed across the three campaign profiles yields measurable spawn/velocity/band/Rush differences
  - fly entities remain kind `fly` and power entities remain kind `power`
- Campaign objectives/progress:
  - existing M2.7 pass/fail/unlock/star tests remain green
  - no SaveManager schema migration test changes are needed except assertions that version remains v2

### E2E Tests

Required focused Playwright coverage:

- Campaign level select still shows exactly `1-1`, `1-2`, and `1-3`.
- Launching each level sets visible/test metadata for the expected encounter profile.
- Campaign result recording still works for fail/replay/pass/next/unlock.
- Reload persistence remains SaveManager v2 and does not include a new schema version.
- Classic Single launch has no campaign encounter marker and keeps M2.8 baseline flow.
- M2.8 asset pipeline E2E remains green because no new assets are required.

E2E should not overfit exact spawn counts from canvas pixels. Use unit tests for deterministic metrics and use E2E for integration markers, shell flow, and result persistence.

### Regression Gates

Implementation should keep these gates green:

```bash
npm run test:unit
npm run build
npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium
npx playwright test tests/e2e/m28-asset-pipeline.spec.ts --project=chromium
npx playwright test tests/e2e/m26-pwa-offline.spec.ts --project=chromium
npx playwright test tests/e2e/m26-accessibility.spec.ts --project=chromium
npx playwright test tests/e2e/m26-performance.spec.ts --project=chromium
```

Final milestone gate should include full E2E if implementation lands:

```bash
npm run test:e2e
npm test
```

The known documented WebKit PWA offline skip may remain documented if still present.

### Scope Guards

Scope guard checks should prove M2.9 did not become an insect/content expansion:

- No new files under `public/assets/m29`, `public/audio`, or new M2.9 asset paths.
- No `ASSET_MANIFEST.md` asset additions unless documenting "no new assets" in docs only.
- No new `EntityKind` beyond `fly` and `power`.
- No new `PowerKind` beyond `rush`.
- No SaveManager version bump beyond v2.
- No new campaign level ids beyond the existing three.
- No backend/live API/fetch code outside existing same-origin service worker behavior.
- No broad rewrite of `src/game/**`; changes should be targeted to options, spawn/movement constants, and tests.

## Accessibility, PWA, Offline, And Performance Implications

### Accessibility

M2.9 should not add new screens or required UI controls. Existing semantic campaign/prologue/results controls remain the source of accessibility.

Required implications:

- Profile names may appear in debug/test attributes, but player-facing text should remain friendly level copy unless a concise encounter summary is added.
- If the campaign level cards show a short description such as "Gentle pacing" or "Quick fly cadence", it must be normal text and not image-only.
- Focus behavior must remain unchanged for Campaign, Gameplay, Pause, and Results.
- Reduced motion and high contrast behavior from M2.6/M2.8 remain unaffected.

### PWA And Offline

M2.9 adds no new static asset requirements.

Required implications:

- No PWA cache name bump is required solely for mechanics profile code unless the normal build hash changes.
- Service worker asset lists should not gain M2.9 image/audio paths.
- Offline campaign flow should continue using existing M2.8 cached assets and app shell.
- Any new profile metadata is bundled in JavaScript and therefore covered by normal build assets.

### Performance

More frequent spawns can increase entity count. M2.9 must keep the performance budget conservative:

- Entity counts under `nightfall-pressure` should stay within current render/update capability.
- Spawn cadence should not cause unbounded entity growth; offscreen cleanup must remain effective.
- Existing M2.6/M2.8 performance smoke should remain green.
- If a profile increases pressure, tests should include a short high-speed simulation metric or E2E performance smoke to catch runaway entity counts.

## Documentation Expectations

Implementation should update documentation after code lands:

- README should describe M2.9 as encounter mechanics profiles for the three existing Home Pond campaign levels.
- README should explicitly say there are still no new insects, hazards, biomes, bosses, new levels, or save schema bump.
- The M2.9 implementation plan should track each task with checkbox evidence and commit points.
- `ASSET_MANIFEST.md` should not gain new M2.9 asset entries because M2.9 adds no assets.

## Acceptance Criteria

M2.9 is complete only when all of the following are true:

- The registry has typed encounter/mechanics profile definitions for exactly the three existing Home Pond content profiles.
- Campaign levels `1-1`, `1-2`, and `1-3` resolve to distinct encounter/game options.
- Same seed across the three campaign profiles produces measurable differences in spawn cadence, fly band, fly velocity, Rush cadence, duration, or another explicitly documented existing mechanic.
- Same seed plus same profile remains deterministic across repeated runs.
- Classic Single and Local Versus default behavior remains unchanged when no campaign encounter profile is supplied.
- Runtime launches campaign levels through explicit profile resolution rather than campaign-specific conditionals inside spawn/update loops.
- Campaign flow, unlocks, stars, replay, and persistence remain green.
- SaveManager remains v2 with no migration or schema bump.
- No new entity kinds, power kinds, campaign levels, assets, audio paths, backend, localization, monetization, biome, boss, or broad game refactor were introduced.
- Unit, build, focused M2.7/M2.8/M2.6 regression E2E, scope guards, Docker smoke, and production smoke pass before final deployment if implementation lands.

## Risks And Mitigations

### Risk: Dead Profile Data

Profile fields could be added to the registry but not consumed by gameplay.

Mitigation:

- Require deterministic metric tests that fail unless `1-1`, `1-2`, and `1-3` produce different spawn/movement/Rush behavior.
- Add a runtime metadata marker only after resolved options are actually passed to `createGame()`.

### Risk: Classic/Versus Regression

New profile options could accidentally change default Classic Single or Local Versus pacing.

Mitigation:

- Keep profile options optional.
- Add baseline tests around default `createGame()` constants/options.
- Keep Classic/Versus start paths out of the resolver unless explicitly requested by a future milestone.

### Risk: Over-Tuning Difficulty

`1-2` and `1-3` could become too hard before the game has richer player tools.

Mitigation:

- Start with conservative multipliers.
- Preserve existing campaign objective thresholds unless evidence supports a small adjustment.
- Use smoke E2E overrides only for flow; rely on unit metrics and manual quick play for tuning sanity.

### Risk: Game Layer Learns Campaign Concepts

Fast implementation could branch on level ids in `src/game/systems/spawn.ts`.

Mitigation:

- Resolve ids in content/runtime.
- Pass only numeric `ClassicOptions`/encounter tuning into `createGame()`.
- Scope guard against campaign/prologue imports in `src/game/**`.

### Risk: Performance Entity Pressure

Faster spawn cadence could create too many entities during high-speed test runs or long idle play.

Mitigation:

- Keep profile spawn rates modest.
- Add a fixed-duration simulation metric for maximum live entity count.
- Keep existing offscreen cleanup and performance E2E smoke green.

## Rollback Strategy

Rollback should be simple because M2.9 does not touch saves or assets:

- Revert the encounter profile integration commit(s) to return all campaign levels to M2.8 Classic Single behavior.
- Since SaveManager remains v2, user saves remain compatible before and after rollback.
- Since no assets/audio/PWA cache entries are added, static deployment rollback is a normal JS bundle rollback.
- If a single profile is problematic, implementation can temporarily map all three content profiles to the baseline encounter profile while keeping the typed contract and tests adjusted in the same commit.

## Implementation Planning Notes

The implementation plan should be written after this spec is consolidated. Suggested task order:

1. Baseline audit and dirty guard.
2. Typed encounter profile model and registry validation.
3. Profile resolver and game option contract.
4. Spawn/movement/Rush tuning integration with default preservation tests.
5. Runtime campaign launch integration and metadata.
6. Deterministic replay/balancing tests.
7. Focused campaign E2E and M2.7/M2.8 regressions.
8. Documentation and scope guards.
9. Final local/Docker/deploy/production smoke if the milestone is implemented.

Each implementation task should use TDD where code behavior changes, systematic debugging for unexpected failures, verification-before-completion before completion claims, and the eliteteams consolidation gate after every worker.
