# Frogs and Flies M2.10 Campaign Round Identity And Results Ledger Design Spec

**Date:** 2026-05-17

**Status:** Draft for implementation planning

**Milestone Name:** M2.10 - Campaign Round Identity And Results Ledger

**Selected Direction:** Give campaign-launched rounds their own persisted attempt identity and bounded results ledger, and stop those attempts from writing direct Classic Single high scores. Direct Classic Single and Local Versus save behavior must remain unchanged.

## Assumptions And Approval Context

- The user has approved current and future spec-writing stages, so this document proceeds without additional clarification questions.
- M2.9 Home Pond Encounter Mechanics Profiles is complete. The current baseline is branch `ff2-m0-pixijs` at `12cffe1 test: stabilize m28 production fallback smoke`.
- M2.10 is a persistence/runtime boundary milestone. It does not add mosquito species, new levels, new scoring rules, new assets, or a campaign history screen.
- M2.10 should prepare campaign-only scoring/species/modes by separating campaign attempts from direct Classic high scores before more campaign content lands.

## Background/Current State

The current app is a PixiJS v8, TypeScript, Vite browser game with deterministic fixed-step gameplay and a local-only product shell. M2.9 adds typed Home Pond encounter profiles for the existing campaign levels while keeping the simulation campaign-agnostic:

- Campaign `home-pond` has three levels: `home-pond-1-1-first-hunt`, `home-pond-1-2-quick-tongue`, and `home-pond-1-3-nightfall-feast`.
- Each level maps to a static content profile and encounter profile, but SaveManager v2 intentionally does not persist encounter profile ids.
- Runtime stores active campaign context in `src/runtime/app.ts` with `campaignId`, `levelId`, `encounterProfileId`, `attemptId`, and `launchedFrom: 'campaign'`.
- Campaign results currently call the generic `recordRoundCompleted()` path before `recordCampaignLevelResult()`.
- `recordRoundCompleted()` writes to top-level aggregate stats and inserts a `ScoreEntry` into `highScores.classicSingle` when `mode === 'classic-single'`.
- Since campaign levels launch as `classic-single`, campaign attempts can currently populate direct Classic Single high scores.
- SaveManager v2 persists settings, input profiles, direct high scores, aggregate stats, round ids, and campaign progress under `frogs-and-flies.save.v2`.
- Current campaign progress stores seen prologue ids, selected campaign/level ids, level unlock/pass/best score/stars/objective stats, and `lastPlayedAt`.
- Current campaign progress does not retain per-attempt result summaries.

This was acceptable for M2.7 because campaign levels reused the Classic slice, and M2.7 explicitly allowed existing local high-score behavior. It is now the wrong product boundary: future campaign-only species, scoring, and modes should not leak into direct Classic leaderboards.

## Goals

- Add a stable campaign attempt identity for every campaign-launched level round.
- Persist a bounded campaign results ledger in local saves.
- Keep campaign attempt summaries tied to stable campaign and level ids.
- Update campaign progress bests, stars, pass counts, unlocks, and the new ledger exactly once per campaign attempt.
- Prevent campaign-launched rounds from writing Classic Single high scores.
- Keep direct Classic Single and Local Versus high-score, stat, started-round, and completed-round behavior unchanged.
- Keep M2.9 encounter profile ids as runtime/content metadata only, not persisted campaign results identity.
- Keep the ledger small, validated, exportable, importable, and safe for localStorage.
- Provide DOM/test markers that make campaign attempt identity and ledger recording observable in Playwright.

## Key Design Decisions Evaluated

- **Save schema bump:** accept v3. A persisted attempt ledger is new durable player data and v2 has no place to validate or export it cleanly.
- **Ledger bound:** accept last 50 global campaign attempts. The ledger stays simple and small, while each attempt still carries `campaignId` and `levelId` for later filtering.
- **Persisted identity:** store `campaignId`, `levelId`, and `attemptId`; do not store encounter profile ids. Encounter profiles are tunable runtime/content metadata, not stable result identity.
- **Classic high-score separation:** campaign attempts must not write Classic Single high scores. Direct Classic Single and Local Versus behavior remains unchanged.
- **Aggregate stats:** campaign attempt summaries count inside campaign progress only. M2.10 should not add or reuse top-level aggregate stats for campaign history.

## Non-Goals/Scope Guards

- No mosquito or other new insect species.
- No new levels, campaigns, prologues, modes, biomes, bosses, hazards, power-ups, assets, audio, backend, localization, monetization, accounts, cloud save, telemetry, analytics, or online leaderboard.
- No new scoring model beyond storing the current result stats for campaign attempts.
- No broad `src/game/**` refactor. The deterministic game layer should remain campaign-agnostic.
- No attempt to reconstruct or remove older campaign-created Classic high-score rows from existing v2 saves.
- No new campaign history screen or full ledger browser in M2.10.
- No aggregate stats expansion. Campaign attempt counts live inside campaign progress only.
- No persistence of encounter profile ids, content profile ids, visual tone, asset ids, or future species ids in attempt summaries.

If implementation appears to require any of these, stop and return `BLOCKED_SCOPE_EXPANSION` to consolidation.

## Proposed Model And Data Flow

M2.10 should split round recording by product context:

- **Direct match context:** Classic Single or Local Versus launched from Play, keyboard shortcuts, replay outside campaign, or initial runtime params. These rounds keep using `recordRoundStarted()` and `recordRoundCompleted()` exactly as today.
- **Campaign attempt context:** A level launched from Campaign, Prologue, Replay Level, Next Level, or campaign Continue. These rounds receive a campaign attempt identity and record only through campaign progress.

Recommended runtime identity shape:

```ts
type ActiveRoundContext =
  | {
      kind: 'direct'
      roundId: string
      mode: 'classic-single' | 'local-versus'
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

`encounterProfileId` may remain in runtime context for M2.9 DOM markers, but it must not be persisted in the attempt ledger. The persisted identity should be `campaignId` and `levelId`.

Recommended persisted attempt summary:

```ts
interface CampaignAttemptSummary {
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
```

Fields are intentionally current-result facts, not future content taxonomy. A future species/scoring milestone can add campaign-only result details with another schema decision when those fields exist.

Recommended campaign progress shape:

```ts
interface CampaignProgress {
  seenPrologueIds: string[]
  levels: Record<string, CampaignLevelProgress>
  attempts: CampaignAttemptSummary[]
  lastSelectedCampaignId?: string
  lastSelectedLevelId?: string
}
```

Ledger bound decision: persist the last 50 global campaign attempts.

Rationale:

- A single chronological ledger is simpler than nested per-level arrays and fits the current one-campaign, three-level product.
- Each entry stores `campaignId` and `levelId`, so level-specific views can filter later without schema churn.
- Existing per-level `objectiveStats` already carries durable aggregate attempts, passes, best score, best catches, and best time.
- A 50-entry cap is small enough for localStorage and export/import while preserving useful recent history.

Ledger behavior:

- Append a completed campaign attempt after objective evaluation.
- Deduplicate by `attemptId`; a repeated results refresh must not append or increment objective stats twice.
- Trim to the newest 50 entries after append.
- Preserve insertion order from oldest to newest.
- Validate imported/saved attempts by known `campaignId` and `levelId`, finite non-negative numeric stats, valid timestamp strings, and valid stars.
- Drop malformed or unknown-id attempts during validation instead of failing the whole save.

Campaign result data flow:

1. Campaign launch resolves the level, content profile, and encounter profile as M2.9 already does.
2. Runtime creates a direct `roundId` for simulation bookkeeping and a `campaignAttemptId` for campaign persistence. A clear prefix such as `campaign:<campaignId>:<levelId>:<session>:<counter>` is acceptable.
3. Runtime starts the game as `classic-single` with encounter tuning, but marks the active context as `kind: 'campaign'`.
4. Runtime must not call `recordRoundStarted()` for campaign attempts unless the implementation keeps a runtime-only idempotency id that is not written to top-level save stats. Direct started-round semantics remain direct-only.
5. On results, runtime builds player stats from P1, applies campaign smoke overrides only when active campaign context exists, evaluates the objective, and calls a new campaign-progress recorder.
6. The campaign recorder updates the level bests/stars/objective stats/unlocks and appends the bounded attempt summary in one immutable operation.
7. Runtime saves the updated SaveManager v3 document.
8. The generic high-score recorder is skipped for campaign attempts, so `highScores.classicSingle` is unchanged by campaign play.

Direct match data flow:

1. Direct Classic Single and Local Versus continue calling `recordRoundStarted()` on start.
2. Direct results continue calling `recordRoundCompleted()` once.
3. Direct high-score status and High Scores screen behavior remain unchanged.
4. Direct rounds do not create `CampaignAttemptSummary` entries.

## Save Schema/Migration Decision

M2.10 should bump SaveManager from v2 to v3.

Reason: a persisted campaign attempt ledger is new durable player data. The existing v2 campaign progress shape stores only current bests and aggregate objective stats, which is not sufficient for a results ledger or stable campaign attempt identity. Keeping this as an unversioned optional v2 field would make export/import and migration semantics ambiguous.

Required v3 storage decisions:

- New `SAVE_SCHEMA_VERSION = 3`.
- New primary key: `frogs-and-flies.save.v3`.
- Preserve legacy keys:
  - `frogs-and-flies.save.v2` for M2.7-M2.9 saves and rollback.
  - `frogs-and-flies.save.v1` for M2.6 saves and rollback.
- Load order: v3 first, then v2, then v1.
- Save writes only v3 after migration/defaulting.
- Do not delete v2 or v1 keys during migration.

Migration rules:

- **v3 load:** validate all current fields plus `campaign.attempts`, trimming the ledger to the last 50 valid entries.
- **v2 to v3:** preserve settings, input profiles, high scores, aggregate stats, started/completed round ids, seen prologue ids, selected campaign/level ids, and every known level progress field. Add `campaign.attempts = []`.
- **v1 to v3:** preserve existing v1 core fields as current v1-to-v2 does, initialize campaign progress with current defaults, and set `campaign.attempts = []`.
- **unsupported future versions:** keep returning `unsupported-version` defaults.
- **import/export:** export v3 JSON. Import accepts v1, v2, and v3 through the same migration path.

Compatibility notes:

- M2.10 can read existing v2 saves and upgrade them in memory and then into the v3 key.
- M2.9 rollback can still read the preserved v2 key, but it will not see M2.10 campaign attempts recorded only in v3.
- Existing v2 high-score rows are not cleaned up during migration because M2.9 did not persist enough context to prove which Classic Single scores came from campaign attempts.
- From M2.10 onward, new campaign attempts must not add more rows to direct Classic high scores.

## Runtime Behavior And UI/DOM Markers

Runtime should make round scope explicit instead of inferring campaign state from `mode === 'classic-single'`.

Required behavior:

- Starting direct Classic or Local Versus clears active campaign context and active campaign attempt markers.
- Starting a campaign level sets active campaign level, encounter profile marker, and campaign attempt id.
- Restarting a campaign level creates a new campaign attempt id.
- Replay Level creates a new campaign attempt id for the same level.
- Next Level creates a new campaign attempt id for the next level.
- Changing to Classic Modes or using `Digit1`/`Digit2` clears campaign context and starts/preview-resets direct mode behavior as M2.9 does.
- Campaign results should show the existing campaign pass/fail/stars/actions.
- Direct results should continue showing high-score status.
- Campaign results should not claim "New local high score recorded" for the campaign attempt. A neutral text such as "Campaign result recorded." is acceptable if the existing high-score line remains visible.
- High Scores remains a local direct Classic Single and Local Versus screen. It does not list campaign ledger entries in M2.10.

Recommended DOM markers on the shell:

- `data-active-round-scope="direct"` or `"campaign"`.
- `data-campaign-attempt-id="<attemptId>"` while a campaign attempt is active or on its campaign result screen.
- `data-campaign-attempt-recorded="true|false"` for campaign result idempotency visibility.
- `data-campaign-attempt-ledger-count="<n>"` after save sync.
- Existing `data-active-campaign-level` stays.
- Existing `data-campaign-encounter-profile` stays while a campaign level is active, but remains non-persisted.
- Existing `data-campaign-result-level`, `data-campaign-result-passed`, and `data-campaign-result-stars` stay.
- Add `data-campaign-result-attempt-id="<attemptId>"` to the campaign result status element.

Markers should be absent when they do not apply rather than set to misleading empty campaign values. Existing M2.9 tests for clearing encounter markers should continue to pass.

## Testing And Verification Strategy

Focused unit coverage:

- SaveManager defaults create v3 with `campaign.attempts = []`, primary key `frogs-and-flies.save.v3`, and preserved v2/v1 key constants.
- v2 migration preserves existing progress and initializes an empty ledger.
- v1 migration still preserves core fields and initializes default campaign progress plus an empty ledger.
- Import/export round trips v3 with validated campaign attempts.
- Future versions remain unsupported.
- Malformed attempt entries, unknown campaign ids, unknown level ids, invalid numbers, invalid stars, and invalid timestamps are dropped safely.
- Campaign attempt recording appends one summary, updates level progress, and unlocks next levels as current campaign progress does.
- Campaign attempt recording is idempotent by `attemptId`.
- Ledger trimming keeps only the newest 50 global campaign attempts.
- Campaign attempt recording does not mutate `highScores`, top-level `stats`, `startedRoundIds`, or `completedRoundIds`.
- `recordRoundCompleted()` direct Classic Single and Local Versus behavior remains unchanged.

Focused E2E coverage:

- A fresh campaign failure writes SaveManager v3, appends one campaign attempt, leaves `highScores.classicSingle` empty, and does not unlock the next level.
- A campaign pass writes a campaign attempt, updates level stars/pass/unlock state, and leaves direct high scores unchanged.
- Replay Level and Next Level create distinct campaign attempt ids and ledger entries.
- Direct Classic Single still writes Classic Single high scores and does not set campaign attempt markers.
- Local Versus still writes Local Versus high scores and does not set campaign attempt markers.
- `data-campaign-encounter-profile` remains runtime-only and still does not appear in saved JSON.
- Loading an existing v2 save upgrades to v3 and keeps campaign progress visible after reload.

Regression gates:

```bash
npm run test:unit -- tests/unit/saveManager.test.ts tests/unit/campaignProgress.test.ts
npm run test:unit -- tests/unit/campaignRegistry.test.ts tests/unit/encounterProfiles.test.ts tests/unit/difficultyOptions.test.ts tests/unit/spawn.test.ts tests/unit/deterministicReplay.test.ts tests/unit/localVersus.test.ts
npm run build
npx playwright test tests/e2e/m27-campaign-flow.spec.ts tests/e2e/m29-encounter-profiles.spec.ts --project=chromium
```

Full pre-deploy gate, if implementation lands:

```bash
npm test
```

Docs gates should update README claims and any README tests from v2 to v3 after implementation. The spec itself does not require running the full game test suite.

## Rollout/Deployment Notes

- M2.10 is local-only persistence and runtime logic. No backend, service worker asset list, image/audio manifest, Docker/nginx, or Coolify configuration change is required.
- A normal production build will ship the updated JavaScript bundle and v3 migration code.
- Existing v2 users migrate on first load after deployment. Their preserved v2 key remains available for rollback.
- Rollback to M2.9 will read the old v2 key and ignore v3 attempts. Campaign progress made only after v3 migration may not appear after rollback, which is acceptable for a no-backend local save milestone.
- Production smoke should verify one direct Classic high-score path and one campaign path against `https://frog.resline.net` after deployment.
- Do not commit generated `dist/`, Playwright reports, or localStorage exports.

## Risks/Open Questions

### Risk: Existing v2 Classic high scores may already include campaign attempts

Mitigation: do not guess. M2.10 prevents new leakage but preserves old rows because v2 did not record enough context for safe cleanup.

### Risk: Campaign attempts accidentally keep using direct save paths

Mitigation: make active round scope explicit, add tests that campaign results leave `highScores.classicSingle`, top-level stats, and top-level round ids unchanged, and expose DOM markers for campaign attempt recording.

### Risk: Save schema bump breaks existing users

Mitigation: load v3, then v2, then v1; preserve both legacy keys; add unit tests for v2 and v1 migration; keep validation forgiving for malformed ledger entries.

### Risk: Ledger grows too large

Mitigation: cap at 50 global entries during record and validation. Per-level aggregates remain in existing level progress.

### Risk: Attempt id collisions cause missed records

Mitigation: generate attempt ids with campaign id, level id, runtime session id, and monotonic counter. Deduplicate only exact attempt ids.

### Open Question: Should campaign attempts count in top-level aggregate stats?

Decision for M2.10: no. Campaign attempts count inside campaign progress only. Direct Classic/Versus aggregate stats remain direct-mode stats, which keeps the product boundary clean for future campaign-only scoring.

### Open Question: Should the campaign ledger be player-visible?

Decision for M2.10: no dedicated ledger UI. Results and campaign level rows keep their existing progress presentation; the ledger is persisted for product boundary, validation, and future UI/content work.

## Acceptance Criteria

- SaveManager v3 exists with `campaign.attempts` as a bounded, validated ledger.
- Existing v2 and v1 saves migrate to v3 with empty ledgers and preserved supported fields.
- Campaign attempts persist summaries with `attemptId`, `campaignId`, `levelId`, result stats, pass state, and stars.
- Campaign attempt summaries do not persist encounter profile ids.
- Campaign-launched rounds do not write Classic Single high scores or top-level direct aggregate stats.
- Direct Classic Single and Local Versus save behavior remains unchanged.
- Campaign progress bests/stars/objective stats/unlocks still update exactly once per attempt.
- DOM markers expose active round scope, campaign attempt id, campaign attempt recorded state, and ledger count for tests.
- M2.7 campaign flow and M2.9 encounter profile markers remain green.
- No mosquito/species/content expansion, no new modes, no assets/audio/backend/localization/monetization, and no broad game refactor are introduced.
