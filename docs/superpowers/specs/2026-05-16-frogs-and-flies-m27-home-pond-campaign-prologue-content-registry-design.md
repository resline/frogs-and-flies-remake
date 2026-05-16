# Frogs and Flies M2.7 Home Pond Campaign Prologue And Level Content Registry Design Spec

**Date:** 2026-05-16

**Status:** Draft for implementation planning

**Milestone Name:** M2.7 - Home Pond Campaign Prologue And Level Content Registry

**Selected Direction:** Add the first player-visible campaign prologue for Home Pond and introduce only the minimum typed content registry needed to launch a three-level Home Pond campaign path through the existing Home Pond Classic match. M2.7 should not become a broad insect, hazard, biome, boss, or campaign-system expansion.

## Assumptions And Approval Context

- The user has approved the current and future design stages, so this written design-doc step proceeds without additional questions even though the brainstorming workflow normally asks for staged clarification and approval.
- The filename uses the consolidated milestone date `2026-05-16` as requested.
- M2.6 is complete at current HEAD and is the baseline for this design.
- M2.7 is a design and planning milestone for implementation readiness. This spec does not implement code.
- Existing player-facing modes, Classic Single and Local Versus, remain valid and must not be displaced by campaign work.
- The Home Pond prologue can use current Home Pond visuals, shell controls, audio fallback, PWA shell, and the existing Classic Single ruleset.

## Current State After M2.6

M2.6 turned the M2.5 Home Pond vertical slice into a local product foundation:

- PixiJS v8, Vite, TypeScript, deterministic fixed-step gameplay, seeded randomness, and Home Pond render assets are present.
- The match loop supports `start` -> `gameplay` -> `the-end` -> `results`, with day/dusk/night/THE END presentation.
- Classic Single and Local Versus are the only player-facing gameplay modes.
- The shell includes main menu, mode select, settings, high scores, gameplay, pause, and results.
- SaveManager v1 persists settings, input profiles, local high scores, local stats, started round ids, and completed round ids in `localStorage`.
- Runtime settings support difficulty, timer visibility, reduced motion, high contrast, audio mute/volume/mono, and input profile selection.
- Input is modeled through named actions, default keyboard bindings, touch zones, gamepad mapper foundations, conflict-aware remapping, and reset defaults.
- Web Audio v1 has autoplay-safe unlock, mute, master/SFX/music volume concepts, mono flag, optional local asset paths, and procedural missing-audio fallback.
- PWA metadata and a service worker provide a local offline shell for the current Home Pond slice.
- Unit and Playwright coverage exists for shell flow, persistence, input, audio, PWA/offline, accessibility, no-overlap, performance smoke, and gameplay behavior.

M2.6 is still not the full product. There is no campaign path, no campaign progress, no content registry, no world map, no extra levels, no biomes beyond Home Pond, no new insects or hazards, no bosses, no online systems, and no monetization.

## Why M2.7 Is Next

The next useful product step is a narrow campaign entry point, not content breadth. M2.6 already has the shell, save layer, input settings, results, and offline runtime needed to support a small player-visible prologue safely. A Home Pond campaign prologue proves how story, level definitions, save progress, results, and shell routing will connect before M3 adds more levels or biomes.

M2.7 should answer these questions with the least new machinery possible:

- How does a player enter campaign from the existing shell?
- How is a short prologue presented without building a cinematic system?
- How do three small campaign levels map to the existing Classic Single match?
- What is the smallest typed registry that can name a campaign, prologue, three levels, and their Home Pond content profiles?
- How does SaveManager migrate from v1 to v2 without losing M2.6 saves?
- Where are the runtime boundaries so story/content data does not leak into deterministic simulation?

## Scope

M2.7 includes:

- A player-visible Home Pond campaign entry from the shell.
- A concise campaign prologue for Home Pond, presented as semantic HTML shell content over current visual styling.
- Three campaign level entries, `home-pond-1-1-first-hunt`, `home-pond-1-2-quick-tongue`, and `home-pond-1-3-nightfall-feast`, that launch the existing Home Pond Classic Single ruleset with minimal Home Pond content profiles.
- A minimal typed content registry for campaigns, prologues, levels, and Home Pond content profiles.
- Save migration from M2.6 SaveManager v1 to an M2.7-compatible schema that stores unlock state, best score, stars, objective stats, and last selected level for all three levels.
- Shell/runtime integration boundaries for starting a registered level, recording pass/fail results, unlocking the next level, and preserving progress across reloads.
- Focused tests for registry validation, save migration, shell flow, prologue accessibility, pass/fail/replay, unlock persistence, offline availability, and regression coverage for Classic Single and Local Versus.

The expected player-facing campaign content is intentionally small:

- Campaign: `Home Pond`
- Prologue: `Dawn At Home Pond`
- Level 1-1: `First Hunt`
- Level 1-2: `Quick Tongue`
- Level 1-3: `Nightfall Feast`

## Non-Goals

- No new insects, insect species tables, hazards, enemy families, or spawn ecology expansion.
- No new power-ups.
- No bosses or boss framework.
- No new biome art or biome sequence.
- No world map.
- No reward economy beyond the minimal local 1-3 star rating stored for the three M2.7 levels. No achievements, skins, unlock shop, gallery, currency, or spendable rewards.
- No online leaderboard, backend, account, cloud save, analytics, or telemetry submission.
- No monetization, ads, payments, portal SDKs, or store links.
- No localization infrastructure. Strings should be easy to extract later, but M2.7 can keep inline English copy.
- No live network/API dependency for content, assets, audio, saves, prologue, or registry loading.
- No final Spine, TexturePacker, or authored audio pipeline.
- No data-driven editor, CMS, remote JSON content, mod loading, or schema package.
- No simulation rewrite. Existing `src/game/**` authority stays focused on gameplay rules.

## Options Considered

### Option A - Three-Level Prologue Plus Minimal Typed Registry

Add a campaign entry, a short Home Pond prologue, three registered Home Pond levels, and a small static typed registry. Route each level into the existing Classic Single match. Add only the save fields needed to remember prologue state, level unlocks, best scores, stars, objective stats, and last selected level.

Tradeoffs:

- Best alignment with M2.6 because the shell, persistence, results, and PWA foundation are ready.
- Gives players a visible campaign path without multiplying gameplay systems or assets.
- Creates implementation seams for future campaign breadth while keeping the simulation untouched.
- Requires a SaveManager migration, deterministic pass/fail recording, unlock routing, and careful shell routing.
- Does not deliver new mechanics, so acceptance must focus on flow, data boundaries, and regression safety.

### Option B - Full Campaign Content Expansion

Start building many campaign levels, insect variants, hazards, boss hooks, economy systems, and a broader level progression model.

Tradeoffs:

- Looks closer to the long-range product fantasy.
- High risk because content breadth would arrive before a tested registry and migration model.
- Likely touches spawn, collision, scoring, rendering, assets, save data, and UI at the same time.
- Contradicts the consolidated decision to avoid a broad insect/hazard expansion.

### Option C - Narrative-Only Prologue

Add a prologue screen or modal with no typed registry and no campaign progress model. The player returns to the existing mode select afterward.

Tradeoffs:

- Fastest visible story addition.
- Avoids migration work in the short term.
- Creates throwaway shell logic because later campaign levels would still need a registry and progress model.
- Does not prove level-to-runtime mapping, pass/fail recording, or unlock persistence.

### Recommendation

Choose Option A.

M2.7 should combine the player-visible campaign prologue with a three-level Home Pond path and only a minimal typed content registry. This proves campaign entry, level sequencing, pass/fail/replay, unlock persistence, and save migration while keeping all actual gameplay content inside the existing Home Pond Classic slice.

## Player-Visible Flow

### Main Menu

The main menu should keep the existing M2.6 actions and add a campaign entry without hiding Classic modes:

- `Campaign`
- `Play` or existing Classic mode entry
- `Settings`
- `High Scores`

If layout space is tight, `Campaign` should be the first player-facing route and `Play` should continue to open the existing Classic Single / Local Versus mode select.

### Campaign Screen

The campaign screen shows one available campaign:

- Title: `Home Pond`
- Status: `New`, `In Progress`, or `Complete`, derived from local save progress across levels 1-1, 1-2, and 1-3.
- Primary action:
  - First visit: `Start Prologue`
  - Prologue seen with any unlocked level incomplete: `Continue`
  - Complete: `Replay Prologue`
- Secondary action: `Main Menu`

No world map is required. A single semantic panel/list item for the campaign plus a compact semantic level list is enough.

The level list shows exactly three Home Pond levels:

- `1-1 First Hunt`: unlocked by default.
- `1-2 Quick Tongue`: locked until 1-1 is passed.
- `1-3 Nightfall Feast`: locked until 1-2 is passed.

Each level row should display title, lock/pass state, best score, stars, and a replay/start action when unlocked. Locked rows are visible but not playable. `Continue` should choose the last selected unlocked incomplete level when available, otherwise the first unlocked incomplete level, otherwise 1-1 for replay.

### Prologue Screen

The prologue should be short, readable, and keyboard accessible. It should use HTML controls rather than a Pixi cinematic.

Suggested panel count:

1. Dawn breaks over Home Pond. Toby Toad wakes on the left lily as the first flies cross the water.
2. The old pond tale says the Golden Mother Fly appears only to frogs who master the first hunt.
3. Toby's first task is simple: leap, aim, and catch enough flies before nightfall.

Controls:

- `Next`
- `Back`, when not on the first panel
- `Skip`
- `Start 1-1 First Hunt`, on the final panel
- `Main Menu`

Behavior:

- Advancing through the final panel marks the prologue as seen.
- Skipping also marks the prologue as seen, but does not pass or unlock any level.
- The player can replay the prologue later from the campaign screen.
- Focus moves to the active prologue control when panels change.
- Reduced motion disables panel transition animation.

### Home Pond Prologue Levels

Starting any M2.7 campaign level creates a normal Home Pond Classic Single match:

- Match mode: `classic-single`
- Arena: existing Home Pond
- Ruleset: existing Classic match rules
- Difficulty: current saved/runtime difficulty setting
- Duration: existing default 180 seconds, with current smoke/test overrides still available
- Results: existing results screen with an added campaign pass/fail/progress message when launched from campaign

The three registered levels are intentionally profile-only variations over existing Home Pond content:

| Level | Id | Title | Content Profile | Pass Objective | Star Model |
|---|---|---|---|---|---|
| 1-1 | `home-pond-1-1-first-hunt` | `First Hunt` | Existing Home Pond Classic Single, standard duration, day/dawn presentation where available | Reach the registry-defined introductory score threshold before results | 1 star for pass, 2-3 stars for higher score thresholds |
| 1-2 | `home-pond-1-2-quick-tongue` | `Quick Tongue` | Existing Home Pond Classic Single, same Home Pond fly behavior, current runtime difficulty | Reach the registry-defined catch/score threshold before results | 1 star for pass, 2-3 stars for higher score/catch thresholds |
| 1-3 | `home-pond-1-3-nightfall-feast` | `Nightfall Feast` | Existing Home Pond Classic Single, night/THE END presentation already available in the current match loop | Reach the registry-defined final score threshold before results | 1 star for pass, 2-3 stars for higher score thresholds |

The exact numeric thresholds should be conservative implementation constants chosen against the current Home Pond scoring curve. They must live in the level definitions or a small helper referenced by the registry, not inside the deterministic simulation.

The simulation does not need a new campaign mode. Runtime starts the registered level by mapping it to the current `createGame` parameters.

### Unlock And Replay Flow

- `1-1 First Hunt` is unlocked by default for every fresh v2 save and every v1 migration.
- Passing 1-1 unlocks 1-2 and persists that unlock.
- Passing 1-2 unlocks 1-3 and persists that unlock.
- Passing 1-3 marks the Home Pond prologue campaign complete.
- Failing a level records objective stats and may update best score if higher, but it does not unlock the next level.
- Replaying an unlocked level is always allowed from the campaign screen.
- Replay results can improve best score, stars, and objective stats, but must not lower existing best progress.
- Reloading after a pass must show the next level unlocked and preserve the last selected level.

### Results And Return

When the registered campaign level reaches results:

- Existing local high score and stats behavior remains.
- Campaign pass/fail, best score, stars, objective stats, and next-level unlock are recorded exactly once for the active campaign level.
- Results show a short status such as `1-1 passed`, `1-2 unlocked`, `Try 1-2 again`, or `Home Pond complete`.
- Actions include `Replay Level`, `Next Level` when newly unlocked, `Campaign`, `Classic Modes`, and `Main Menu`.

If the player quits to main menu before results, the prologue can remain seen, but the active level must remain unpassed and must not unlock the next level.

## Data And Content Model

M2.7 should introduce a static typed registry. It should be small enough to live in TypeScript and be covered by unit tests. Do not introduce remote JSON, a parser, editor tooling, or a package-level schema dependency.

Suggested content ownership:

- `src/content/registry.ts` or equivalent: exported registry constants and lookup helpers.
- `src/content/types.ts` or equivalent: content id and definition types if separating types improves clarity.
- Runtime shell imports content definitions.
- Deterministic game simulation does not import campaign/prologue definitions.

Suggested id conventions:

- Campaign id: `home-pond`
- Prologue id: `home-pond-dawn-prologue`
- Level ids:
  - `home-pond-1-1-first-hunt`
  - `home-pond-1-2-quick-tongue`
  - `home-pond-1-3-nightfall-feast`
- Content profile ids:
  - `home-pond-intro-classic`
  - `home-pond-quick-classic`
  - `home-pond-night-classic`
- Arena id: `home-pond`
- Ruleset id: `classic-home-pond`

Suggested type shape:

```ts
type CampaignId = 'home-pond'
type PrologueId = 'home-pond-dawn-prologue'
type CampaignLevelId =
  | 'home-pond-1-1-first-hunt'
  | 'home-pond-1-2-quick-tongue'
  | 'home-pond-1-3-nightfall-feast'
type LevelContentProfileId =
  | 'home-pond-intro-classic'
  | 'home-pond-quick-classic'
  | 'home-pond-night-classic'
type ArenaId = 'home-pond'
type RulesetId = 'classic-home-pond'

interface CampaignDefinition {
  id: CampaignId
  title: string
  prologueId: PrologueId
  initialLevelId: CampaignLevelId
  levelIds: CampaignLevelId[]
}

interface PrologueDefinition {
  id: PrologueId
  campaignId: CampaignId
  title: string
  panels: ProloguePanelDefinition[]
  startLevelId: CampaignLevelId
  replayable: boolean
}

interface ProloguePanelDefinition {
  id: string
  text: string
  visualTone: 'dawn' | 'day' | 'dusk'
}

interface CampaignLevelDefinition {
  id: CampaignLevelId
  campaignId: CampaignId
  chapterLabel: '1-1' | '1-2' | '1-3'
  title: string
  contentProfileId: LevelContentProfileId
  unlocksLevelId?: CampaignLevelId
  objective: CampaignObjectiveDefinition
  starThresholds: CampaignStarThresholds
}

interface LevelContentProfileDefinition {
  id: LevelContentProfileId
  arenaId: ArenaId
  rulesetId: RulesetId
  matchMode: 'classic-single'
  difficultySource: 'runtime-settings'
  durationSource: 'runtime-defaults'
  homePondContent: 'existing-classic-only'
  visualTone: 'dawn' | 'day' | 'night'
  completion: 'on-results'
}

interface CampaignObjectiveDefinition {
  type: 'score-at-least' | 'score-and-catches-at-least'
  score: number
  catches?: number
}

interface CampaignStarThresholds {
  oneStarScore: number
  twoStarScore: number
  threeStarScore: number
}
```

Suggested minimal registry content:

```ts
const homePondCampaign: CampaignDefinition = {
  id: 'home-pond',
  title: 'Home Pond',
  prologueId: 'home-pond-dawn-prologue',
  initialLevelId: 'home-pond-1-1-first-hunt',
  levelIds: [
    'home-pond-1-1-first-hunt',
    'home-pond-1-2-quick-tongue',
    'home-pond-1-3-nightfall-feast',
  ],
}

const homePondLevels: CampaignLevelDefinition[] = [
  {
    id: 'home-pond-1-1-first-hunt',
    campaignId: 'home-pond',
    chapterLabel: '1-1',
    title: 'First Hunt',
    contentProfileId: 'home-pond-intro-classic',
    unlocksLevelId: 'home-pond-1-2-quick-tongue',
    objective: { type: 'score-at-least', score: 300 },
    starThresholds: { oneStarScore: 300, twoStarScore: 600, threeStarScore: 900 },
  },
  {
    id: 'home-pond-1-2-quick-tongue',
    campaignId: 'home-pond',
    chapterLabel: '1-2',
    title: 'Quick Tongue',
    contentProfileId: 'home-pond-quick-classic',
    unlocksLevelId: 'home-pond-1-3-nightfall-feast',
    objective: { type: 'score-and-catches-at-least', score: 500, catches: 8 },
    starThresholds: { oneStarScore: 500, twoStarScore: 800, threeStarScore: 1100 },
  },
  {
    id: 'home-pond-1-3-nightfall-feast',
    campaignId: 'home-pond',
    chapterLabel: '1-3',
    title: 'Nightfall Feast',
    contentProfileId: 'home-pond-night-classic',
    objective: { type: 'score-at-least', score: 700 },
    starThresholds: { oneStarScore: 700, twoStarScore: 1000, threeStarScore: 1300 },
  },
]
```

The numeric values above are planning placeholders. Implementation can tune them if tests show they are too brittle, but the shape must remain a minimal three-level Home Pond registry using existing Classic content only.

This model intentionally excludes:

- Insect catalogs
- Hazard definitions
- Boss definitions
- Spawn tables beyond the existing Classic runtime
- Reward tables beyond the local 1-3 star thresholds on the three registered levels
- Medals or unlock economy
- Per-biome art pipelines

### Registry Validation

The registry should be validated through unit tests and lightweight runtime guards:

- Campaign ids are unique.
- Prologue ids are unique.
- Level ids are unique.
- Every campaign references an existing prologue and initial level.
- Every campaign level id appears once in campaign order.
- Every prologue references an existing campaign and start level.
- Every level references an existing campaign.
- Every level references an existing Home Pond content profile.
- Every content profile uses an implemented ruleset, arena, and match mode.
- Every level objective has ascending 1-, 2-, and 3-star thresholds.
- Unlock links follow campaign order: 1-1 unlocks 1-2, 1-2 unlocks 1-3, and 1-3 has no next unlock.
- M2.7 registry contains exactly one campaign, one prologue, three campaign levels, and three Home Pond content profiles unless the implementation plan explicitly accepts an internal test fixture.
- Invalid content references fail tests and should not silently boot into broken UI.

### Content Copy Ownership

M2.7 may keep copy inline in the registry. To prepare for later localization without implementing it now:

- Panel ids should be stable.
- Copy should not be assembled through ad hoc string concatenation.
- UI components should receive strings from definitions rather than hard-coding the same copy in multiple places.

## Save Migration Design

M2.6 uses SaveManager v1 with storage key `frogs-and-flies.save.v1` and schema version `1`. M2.7 needs local campaign progress. The safest design is to introduce SaveManager v2 while preserving v1 data and keeping rollback possible.

### Storage Key Strategy

Recommended:

- Add `SAVE_SCHEMA_VERSION = 2`.
- Add new primary key `frogs-and-flies.save.v2`.
- On load, read v2 first.
- If v2 is absent, read legacy v1 from `frogs-and-flies.save.v1`, validate it, migrate it in memory, and write v2 when storage is available.
- Do not delete the v1 key during M2.7 migration.

Why:

- Preserves M2.6 rollback behavior.
- Avoids storing schema `2` under a key named `.v1`.
- Lets implementation tests verify legacy migration and fresh v2 load separately.

### Save v2 Shape

Save v2 should preserve all v1 fields and add one campaign subdocument:

```ts
interface SaveDataV2 extends SaveDataV1 {
  version: 2
  campaign: CampaignProgress
}

interface CampaignProgress {
  seenPrologueIds: string[]
  levels: Record<string, CampaignLevelProgress>
  lastSelectedCampaignId?: string
  lastSelectedLevelId?: string
}

interface CampaignLevelProgress {
  unlocked: boolean
  passed: boolean
  bestScore: number
  stars: 0 | 1 | 2 | 3
  objectiveStats: CampaignObjectiveStats
  lastPlayedAt?: string
}

interface CampaignObjectiveStats {
  attempts: number
  passes: number
  bestScore: number
  bestCatches?: number
  bestTimeRemainingSeconds?: number
}
```

Default campaign progress:

```ts
{
  seenPrologueIds: [],
  levels: {
    'home-pond-1-1-first-hunt': {
      unlocked: true,
      passed: false,
      bestScore: 0,
      stars: 0,
      objectiveStats: { attempts: 0, passes: 0, bestScore: 0 }
    },
    'home-pond-1-2-quick-tongue': {
      unlocked: false,
      passed: false,
      bestScore: 0,
      stars: 0,
      objectiveStats: { attempts: 0, passes: 0, bestScore: 0, bestCatches: 0 }
    },
    'home-pond-1-3-nightfall-feast': {
      unlocked: false,
      passed: false,
      bestScore: 0,
      stars: 0,
      objectiveStats: { attempts: 0, passes: 0, bestScore: 0 }
    }
  },
  lastSelectedCampaignId: 'home-pond',
  lastSelectedLevelId: 'home-pond-1-1-first-hunt'
}
```

The save should store ids and player progress only, not full content definitions. Content definitions, objectives, thresholds, and content profiles remain code-owned by the registry.

### Migration Rules

Migration from v1 to v2:

- Preserve settings exactly after v1 validation.
- Preserve input profiles and selected input profile id.
- Preserve high scores.
- Preserve aggregate local stats.
- Preserve started and completed round ids.
- Add default campaign progress for all three levels with only 1-1 unlocked.
- If any v1 field is invalid, continue using v1 validation defaults for that field.
- If v1 JSON is invalid or a future unsupported version, do not attempt partial migration; default to a clean v2 save and emit a recoverable warning marker.

Validation for v2:

- Validate known primitive ranges as v1 already does.
- Validate campaign arrays as string arrays and level progress records as bounded primitives.
- Clamp `stars` to 0-3 and require `bestScore`, attempts, and passes to be non-negative finite numbers.
- Ensure missing known levels receive default progress entries.
- Ensure 1-1 is always unlocked after validation.
- Preserve the invariant that 1-2 is unlocked only after 1-1 is passed, and 1-3 is unlocked only after 1-2 is passed, unless a future migration explicitly changes campaign order.
- Clamp campaign ids to ids that exist in the content registry when presenting UI.
- Unknown campaign/prologue/level ids in save should not crash boot.
- The implementation may either drop unknown campaign ids during validation or keep them inert for future compatibility. The selected behavior must be unit-tested.

Status markers:

- Existing `data-save-status` values should continue to work.
- Add or reuse a status for migrated loads, for example `migrated`, if useful for tests.
- Storage-unavailable behavior remains non-blocking. Campaign can run in-memory, but progress will not persist.

### Campaign Progress Writes

Progress should update at clear runtime edges:

- Mark prologue seen once when the player finishes or skips the prologue.
- On results for a campaign-launched level, increment attempts once, evaluate pass/fail against the level objective, update best score and objective stats, and update stars only when the new star count is higher.
- Mark a level passed once when a campaign-launched result meets its pass objective.
- Unlock the next registered level only when the current level is passed.
- Update `lastSelectedCampaignId` and `lastSelectedLevelId` when entering or replaying campaign content.
- Persist progress after every prologue seen, level result, unlock, and last-selected update when storage is available.
- Do not mark a level passed or unlock the next level from smoke-forced results unless the runtime has an active campaign level context.
- Do not duplicate result writes if results re-render.

Campaign pass/fail should be independent from local high-score insertion. A player may pass a campaign level without creating a new high score, and a failed replay may still improve Classic high scores if the existing score rules allow it.

## Runtime And Simulation Integration Boundaries

### Runtime Owns Campaign Flow

Runtime/shell code owns:

- Campaign screen state.
- Prologue panel index.
- Active campaign level context.
- Mapping a `CampaignLevelDefinition` to runtime game params.
- Recording prologue seen, level result, stars, unlocks, and last-selected level in SaveManager.
- Showing campaign status on results.

The shell state model may add screens such as:

- `campaign`
- `prologue`

It may also add a runtime-only active context:

```ts
interface ActiveCampaignContext {
  campaignId: string
  levelId: string
  attemptId: string
  launchedFrom: 'campaign'
}
```

### Simulation Stays Content-Agnostic

`src/game/**` should not know about:

- Campaign ids
- Prologue ids
- Level ids
- Story panels
- Unlock state
- Objective thresholds or star ratings
- SaveManager
- Shell screens

The game simulation should continue receiving ordinary runtime params:

- `mode: 'classic-single'`
- `seed`
- `durationSeconds`
- `theEndSeconds`
- `simulationSpeed`
- `options`

If implementation needs to identify campaign results, do that in runtime by wrapping match creation and result recording, not by adding campaign concepts to `GameState`. Objective evaluation should consume existing result stats in runtime after the match ends.

### Rendering And Assets

M2.7 should not require new Pixi gameplay rendering. The prologue can be an HTML shell layer using existing CSS and current Home Pond background treatment.

Allowed visual work:

- Reuse existing Home Pond background or shell theme.
- Add small CSS state styles for campaign/prologue screens.
- Reuse existing audio cues for confirm/start/results.

Avoid:

- New generated bitmap assets.
- New sprite sheets.
- New cinematic renderer.
- New asset loading pipeline.

### PWA Boundary

The content registry is bundled with the app. It should not fetch content at runtime. Once the app shell is cached, the campaign screen, prologue copy, three level definitions, and content profiles should be available offline.

If the service worker cache name changes for M2.7, old cache cleanup must be tested. If no new static assets are added, the cache URL list can remain small.

## Testing And Verification Strategy

### Unit Tests

Add focused unit tests for:

- Registry uniqueness and referential integrity.
- Registry scope guard: exactly one campaign, one prologue, three campaign levels, and three Home Pond content profiles for M2.7.
- Level mapping from `home-pond-1-1-first-hunt`, `home-pond-1-2-quick-tongue`, and `home-pond-1-3-nightfall-feast` to `classic-single` runtime params.
- Unlock order validation: 1-1 unlocks 1-2, 1-2 unlocks 1-3, and 1-3 has no next unlock.
- Objective and star threshold validation for all three levels.
- Save v2 defaults: 1-1 unlocked by default, 1-2 and 1-3 locked, all best scores 0, all stars 0, objective stats initialized, and last selected level set to 1-1.
- v1-to-v2 migration preserves settings, input profiles, high scores, stats, started round ids, and completed round ids.
- Invalid v2 campaign data falls back safely.
- Future unsupported save version still defaults safely.
- Prologue progress writes are idempotent.
- Campaign level pass/fail result writes are idempotent and separate from high-score writes.
- Failed results record attempts/objective stats but do not unlock the next level.
- Passing 1-1 unlocks 1-2, passing 1-2 unlocks 1-3, and replay cannot lower best score or stars.
- Reloaded progress preserves unlocked states, best score, stars, objective stats, and last selected level.
- Shell reducer transitions for campaign, prologue, gameplay, results, and return paths.

### Playwright Tests

Add or extend E2E coverage for:

- First boot shows campaign entry without removing existing Classic paths.
- Campaign screen opens and exposes Home Pond.
- The campaign screen exposes levels 1-1, 1-2, and 1-3 with only 1-1 unlocked on a fresh save.
- Prologue panels can be advanced with buttons and keyboard focus remains visible.
- Skip marks prologue seen but does not pass a level or unlock 1-2.
- Final prologue action starts `1-1 First Hunt`.
- A short deterministic campaign-launched 1-1 pass reaches results, records progress once, and unlocks 1-2.
- A deterministic fail/replay path records an attempt, keeps the next level locked, and allows replay from results or the campaign screen.
- Passing 1-2 unlocks 1-3; passing 1-3 marks Home Pond complete.
- Reload after each unlock preserves unlocked levels, best score, stars, objective stats, and last selected level.
- Reload after Home Pond completion shows campaign status as complete while keeping all three levels replayable.
- Classic Single and Local Versus still start from the existing mode select.
- Existing settings, input remapping, audio markers, and high scores still behave after migration.

### Accessibility Verification

- Run existing axe-core shell coverage, or extend it, for campaign and prologue screens.
- Prologue controls must be native focusable controls.
- Panel changes must not trap focus or require pointer-only input.
- Text should fit at mobile and desktop verification viewports.
- Reduced motion must remove or greatly reduce panel transition motion.
- High contrast must keep prologue text and controls readable.

### PWA And Offline Verification

- After an online load, the campaign screen and prologue should be reachable offline.
- The registry, all three level definitions, and all three Home Pond content profiles must be bundled, not fetched.
- Offline boot should not fail if storage is unavailable.
- If the service worker cache version changes, old cache cleanup should be covered by unit or E2E smoke.

### Performance Verification

- Registry initialization should be trivial and synchronous.
- Prologue flow should not add large assets or blocking network work.
- Existing performance smoke should remain within M2.6 thresholds.
- E2E should continue checking no-overlap screenshots for shell states; include campaign/prologue if the existing pattern supports it.

### Security And Privacy Verification

- Campaign progress remains local-only.
- No campaign content, save data, high scores, or stats are sent to a backend.
- Service worker only caches same-origin app assets.
- Imported saves, if current import/export UI becomes visible later, must validate v2 shape before replacing local data.

### Lightweight Spec Verification

For this design-doc-only change, verification should be limited to markdown sanity if available, `git diff --check`, and `git status --short --branch`.

## Accessibility, PWA, Performance, Security, And Offline Implications

### Accessibility

M2.7 adds reading flow, so text accessibility matters more than in earlier gameplay-only work:

- Prologue copy should be semantic HTML, not canvas text.
- Buttons need accessible names matching their actions.
- Focus order should follow visible order.
- Prologue panel changes should announce meaningfully through normal DOM updates.
- Keyboard-only players must be able to open campaign, read/skip prologue, start the level, and return.
- Reduced motion and high contrast from M2.6 must apply to campaign/prologue screens.

### PWA And Offline

Because registry content is bundled, M2.7 should work offline after the app shell has been cached. No runtime fetch is allowed for prologue text, level definitions, objectives, star thresholds, or content profiles. If a cache version bump is needed, the implementation should update service worker tests and README deployment smoke notes.

### Performance

The registry should be static and tiny. The prologue should not add image or audio weight. Any CSS transition should be cheap and disabled by reduced motion. Existing boot and gameplay performance smoke should not regress.

### Security And Privacy

Campaign progress is local save data. It should not include personal information and should not be sent anywhere. The app remains a static same-origin PWA with no backend dependency. Unknown save ids must not become dynamic import paths, URLs, or untrusted HTML.

### Offline Storage Failure

If `localStorage` is unavailable, campaign still runs in memory:

- Prologue can be viewed.
- Any currently unlocked campaign level can be played.
- Pass/fail, stars, and unlock status can be shown for the current session.
- A non-blocking storage unavailable marker should remain visible to tests.

## Acceptance Criteria

M2.7 is implementation-ready when the implementation plan can satisfy all of these criteria:

1. The M2.7 title is `Home Pond Campaign Prologue And Level Content Registry`.
2. The app has a player-visible Campaign entry without removing Classic Single or Local Versus.
3. Home Pond campaign screen exposes exactly the M2.7 campaign content needed for the prologue: 1-1 First Hunt, 1-2 Quick Tongue, and 1-3 Nightfall Feast.
4. The prologue is playable as semantic shell UI with Next, Back, Skip, Start 1-1 First Hunt, and Main Menu paths.
5. Level 1-1 is unlocked by default on a fresh save and after v1 migration; levels 1-2 and 1-3 start locked.
6. Starting any unlocked M2.7 campaign level launches the existing Home Pond Classic Single ruleset rather than a new simulation mode.
7. Results from a campaign-launched level record pass/fail, best score, stars, objective stats, and unlock changes exactly once.
8. Passing 1-1 unlocks 1-2, passing 1-2 unlocks 1-3, passing 1-3 completes Home Pond, and all unlock state persists after reload.
9. Failing a level records the attempt/objective stats without unlocking the next level, and replay remains available for unlocked levels.
10. Replay results can improve best score, stars, and objective stats but cannot lower previous best progress.
11. A minimal typed content registry defines the campaign, prologue, three campaign levels, and three Home Pond content profiles with unique ids and referential integrity tests.
12. The registry does not add broad insect, hazard, boss, biome, reward, monetization, backend, leaderboard, cloud-save, mode, localization, sprite, or audio pipeline systems.
13. SaveManager migrates valid M2.6 v1 saves to v2 while preserving existing settings, input profiles, high scores, stats, and round ids.
14. Save v2 stores campaign progress for all three levels as ids and bounded progress fields: unlocked, passed, best score, stars, objective stats, and last selected level.
15. Save v2 validates invalid or unknown campaign ids safely and restores required known level defaults.
16. M2.6 v1 save data is not deleted during migration, preserving rollback behavior.
17. Storage-unavailable behavior remains non-blocking.
18. Campaign and prologue screens pass accessibility checks for semantic controls, focus, reduced motion, and high contrast.
19. Campaign/prologue content and all level registry data are available offline after the app shell is cached.
20. Existing Classic Single, Local Versus, settings, high scores, input remapping, audio, PWA, and performance smoke tests remain green.
21. No live network/API dependency is introduced for content, assets, audio, saves, or boot.
22. Documentation is updated during implementation to describe campaign prologue flow, save migration, unlock flow, replay behavior, and scope limits.

## Risks And Mitigations

| Risk | Mitigation |
|---|---|
| M2.7 grows into a broad campaign/content system. | Keep exactly one campaign, one prologue, three campaign levels, and three Home Pond content profiles; test registry size for M2.7 scope. |
| Save migration loses M2.6 player data. | Validate v1 first, migrate in tests, preserve v1 key, and write v2 separately. |
| Rollback to M2.6 cannot read v2 saves. | Do not delete `frogs-and-flies.save.v1`; rollback uses the old key and ignores campaign progress. |
| Campaign shell breaks existing Classic mode flow. | Keep existing Play/mode-select routes and add regression E2E for Classic Single and Local Versus. |
| Story content leaks into deterministic simulation. | Runtime maps level definitions to ordinary game params; `src/game/**` stays campaign-agnostic. |
| Prologue UI is inaccessible on keyboard or screen readers. | Use semantic HTML controls, predictable focus movement, and axe/manual checks. |
| Prologue layout overlaps on mobile. | Add no-overlap screenshots for campaign/prologue states at existing viewports if the current harness supports it. |
| Service worker serves stale content after registry changes. | Bump cache version only if needed and test activation cleanup. |
| Unknown ids in save cause broken UI. | Validate ids against registry before display and fall back to Home Pond defaults. |
| Replay lowers saved progress. | Update best score, stars, and objective stats monotonically and test failed replay paths. |
| Copy becomes hard to localize later. | Keep stable panel ids and route copy through definitions rather than duplicating strings. |

## Rollback Strategy

Implementation should be easy to roll back because M2.7 is additive:

- Preserve M2.6 Classic Single and Local Versus routes.
- Keep M2.6 v1 save key untouched.
- Store M2.7 progress under the v2 key.
- Keep campaign/prologue state in runtime shell and content modules, not simulation.
- If campaign needs to be disabled, hide the Campaign entry and continue booting the M2.6 shell against existing modes.
- A rollback loses only M2.7 campaign progress visibility; existing M2.6 settings, input profiles, high scores, stats, and round ids remain available through the v1 key.

## Implementation-Plan Handoff Notes

The implementation plan should stay TDD-first and narrow:

1. Baseline and dirty-worktree guard.
2. Content registry types, definitions, and validation tests.
3. SaveManager v2 defaults and v1 migration tests.
4. Shell reducer and DOM campaign/prologue flow.
5. Runtime level launch mapping and active campaign context.
6. Results-time pass/fail, star, best-score, objective-stat, and unlock recording.
7. Accessibility, PWA/offline, no-overlap, and performance regression coverage.
8. Classic Single and Local Versus regression checks.
9. README and deployment note updates.
10. Final scope audit confirming no broad content expansion entered M2.7.

M2.7 should finish as the first real campaign-facing slice over the current Home Pond product foundation, not as the start of M3 content breadth.
