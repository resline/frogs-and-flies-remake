# Frogs and Flies M2.6 Home Pond Product Foundation Design Spec

**Date:** 2026-05-15

**Status:** Draft for implementation planning

**Milestone Name:** M2.6 - Home Pond Product Foundation

**Recommended Direction:** The full product objective is not complete. M2.5 is a deployed vertical slice of one polished Home Pond Classic match, not the finished game described by the broader project direction. M2.6 should harden the product foundation around that slice before M3 adds content breadth.

## Context And Audit Summary

M2 established the Classic Match alpha and runtime foundation:

- PixiJS v8, Vite, TypeScript, deterministic fixed-step simulation, seeded randomness, and smoke parameters are present.
- Classic Single and Local Versus are implemented with two frogs, CPU play, AI takeover, per-player scoring, results, and day/dusk/night/THE END round flow.
- Runtime, game, and render boundaries exist in `src/runtime/**`, `src/game/**`, and `src/render/**`.
- Unit and Playwright coverage exists for match model, AI takeover, scoring, render smoke, and browser flows.

M2.5 then delivered the professional Classic vertical slice:

- The Home Pond arena uses side-lily staging, player facing, jump/tongue phases, splash/recovery, and deterministic stats.
- A richer local asset set exists for Home Pond background, lilies, P1/P2 frog poses, flies, firefly end treatment, splash, catch, and tongue effects.
- M2.5 documented and implemented a no-live-API local asset workflow in `ASSET_MANIFEST.md`.
- A Web Audio baseline exists with unlock, mute, volume, queued SFX, and graceful silent fallback.
- Difficulty, timer visibility, reduced motion, high contrast, audio controls, semantic HTML controls, and responsive no-overlap E2E coverage exist.
- README and deployment notes document Docker/nginx and Coolify static smoke checks.
- The M2.5 implementation plan records passing gates for build, unit tests, E2E tests, full test, Docker build, and final scope review.

The remaining gaps are product-foundation gaps rather than content gaps:

- There is no versioned save layer for settings, high scores, player stats, or future migration.
- Current settings are URL/runtime state only; they do not persist across sessions.
- The shell still behaves like a playable slice shell, not a real product flow with splash, menu, mode select, settings, results, and high-score history around the existing Classic and Local Versus modes.
- Input support is keyboard and pointer/touch oriented; there is no gamepad polling, remapping model, named action registry, conflict handling, or persistence hook.
- Audio is a procedural Web Audio SFX baseline; there is no firm pipeline decision for authored local SFX/music assets, buses, mono handling, or placeholder file paths.
- There is no PWA manifest, service worker, install/offline shell, cache policy, or offline-first deployment smoke.
- Verification is strong for M2.5, but not yet product-grade across browser engines, automated accessibility checks, offline behavior, screenshot overlap regression, and lightweight performance smoke.
- There is still no campaign, biome progression, bosses, online leaderboard, backend, analytics, monetization, shop, payments, ads, final Spine/TexturePacker pipeline, or live image/audio API integration.

## Goal

M2.6 should turn the M2.5 Home Pond vertical slice into a stable local product foundation. The player should be able to launch the app, navigate a real shell, choose Classic Single or Local Versus, adjust and persist settings, play a round, see results, keep local high scores and stats, use clearer input surfaces, hear locally authored placeholder audio where feasible, and load the static app through a hardened PWA/offline deployment path.

The milestone should keep the actual playable content narrow: one Home Pond Classic ruleset with Classic Single and Local Versus.

## Non-Goals

- No new biomes.
- No campaign, story map, progression route, or mission structure.
- No bosses or boss framework.
- No online leaderboard, backend, accounts, cloud save, or multiplayer networking.
- No analytics.
- No monetization, shop, payment, premium split, portal SDK, or ads.
- No new game modes beyond existing Classic Single and Local Versus unless a tiny internal smoke mode already exists only for tests.
- No final Spine pipeline.
- No final TexturePacker pipeline.
- No live OpenAI image API calls.
- No live OpenAI audio API calls.
- No live network/API dependency for assets, audio, saves, settings, leaderboard, or shell boot.

## Approach Options

### Option A - M2.6 Product Foundation

Add local persistence, real shell flow, input foundation, audio pipeline decision, PWA/static hardening, and verification upgrades around the existing M2.5 Home Pond Classic slice.

Tradeoffs:

- Best alignment with the actual repo state: the core slice exists, but product structure is thin.
- Reduces future rework before content breadth multiplies settings, results, input, audio, and deployment assumptions.
- Creates clear seams for later campaign, leaderboard, achievements, and accessibility depth without implementing them now.
- Requires touching several cross-cutting surfaces in implementation, so the plan must sequence storage, shell, input, audio, PWA, and tests carefully.
- Does not create visibly new content, so success must be measured through product stability and acceptance gates rather than new levels.

### Option B - M3 Content Breadth Now

Begin campaign or additional content: more biomes, more enemy patterns, bosses, broader power-ups, progression, and richer visuals.

Tradeoffs:

- Looks closer to the long-range game fantasy.
- High risk because persistence, shell flow, remapping, audio asset policy, offline behavior, and verification are not ready to support a larger product.
- Likely duplicates future work across each mode or biome.
- Makes bug triage harder because product-shell defects and new content defects arrive together.

### Option C - Minimal Persistence Patch

Add only localStorage for settings and high score while leaving shell, input, audio, PWA, and verification mostly unchanged.

Tradeoffs:

- Fastest path to a visible "remembers me" improvement.
- Useful if schedule is extremely constrained.
- Too narrow for the next milestone because the project still lacks a product shell, remapping model, PWA baseline, and multi-browser/accessibility gates.
- Risks baking an underspecified save schema into later systems.

### Recommendation

Choose Option A: M2.6 Product Foundation.

M2.5 is good enough to validate the Home Pond Classic loop, but it is still a vertical slice. The next milestone should make the slice behave like a small product before M3 adds breadth. M3 content should wait until save, shell, input, audio, PWA, and verification foundations are explicit, tested, and documented.

## Detailed Design

### 1. SaveManager v1

M2.6 should introduce a small versioned save manager for local-only browser persistence. It should be boring, typed, deterministic to test, and safe to ignore if storage is unavailable.

Storage target:

- Use `localStorage` as the v1 persistence backend.
- Use one stable key, for example `frogs-and-flies.save.v1`.
- Store a single JSON object with a schema version and subdocuments.
- Never require storage for the game to boot or play.
- Never send save data over the network.

Suggested v1 shape:

```ts
{
  version: 1,
  updatedAt: string,
  settings: {
    difficulty: "classic-assist" | "classic-standard" | "classic-expert",
    showTimer: boolean,
    reducedMotion: boolean,
    highContrast: boolean,
    mute: boolean,
    masterVolume: number,
    sfxVolume: number,
    musicVolume: number,
    monoAudio: boolean,
    inputProfileId: string
  },
  inputProfiles: [
    {
      id: string,
      name: string,
      bindings: Record<string, Binding[]>
    }
  ],
  highScores: {
    classicSingle: ScoreEntry[],
    localVersus: ScoreEntry[]
  },
  stats: {
    roundsStarted: number,
    roundsCompleted: number,
    totalCatches: number,
    totalAttempts: number,
    totalSplashes: number,
    bestCombo: number,
    totalPlaySeconds: number
  }
}
```

High-score entries should capture only local, non-sensitive data:

- mode
- difficulty
- score
- winner or player id where applicable
- catches
- attempts
- accuracy
- max combo
- seed
- completedAt timestamp
- duration seconds

Versioning and migration:

- `SaveManager` should expose `load()`, `save()`, `reset()`, `exportJson()`, and `importJson()` if import/export remains feasible in implementation.
- The loader should validate version, shape, and primitive ranges before accepting data.
- Unknown or future versions should fail closed to defaults with a recoverable warning marker.
- v0 or invalid data should not throw during boot.
- Migration should be implemented as a simple version switch even if only v1 exists.
- Defaults should be generated by code, not copied in several components.

Settings persistence:

- Current URL params remain useful for smoke tests and explicit overrides.
- URL params should override saved settings for that page load but should not necessarily rewrite saved settings until the user changes the setting through UI.
- UI changes should persist settings immediately or through a debounced save.
- Failed writes should update a non-blocking state marker for tests and diagnostics.

Stats and high scores:

- A round start should increment `roundsStarted` only once per round.
- A round completion should update high scores and aggregate stats only once, even if results are re-rendered.
- Local Versus high scores should avoid pretending to be authoritative global leaderboard data.
- Ties should be stored explicitly.

Import/export feasibility:

- If implementation can do it without growing scope, add "Export Save" as a downloadable JSON blob and "Import Save" from a local file picker or text area.
- Import should validate and preview destructive replacement.
- If the UI cost is too high, implement only `exportJson()` and `importJson()` as tested internal SaveManager APIs, then defer visible controls.

### 2. Real Shell Flow

M2.6 should wrap the existing Classic and Local Versus gameplay in a real product shell. The shell should remain lightweight and semantic; it is not a campaign hub.

Required shell states:

- Splash
- Main menu
- Mode select
- Settings
- High scores
- Gameplay
- Pause
- Results

Flow:

- App boot shows a short splash or immediately enters main menu after assets/settings are ready.
- Main menu exposes Play, Settings, High Scores, and Continue/Replay only if meaningful.
- Mode select chooses Classic Single or Local Versus.
- Settings edits difficulty, timer visibility, reduced motion, high contrast, audio, and input profile.
- Gameplay uses the existing M2.5 match.
- Pause offers Resume, Restart, Settings, and Main Menu.
- Results shows winner, scores, catches, attempts, accuracy, combo, high-score status, Replay, Change Mode, and Main Menu.
- High Scores shows local best scores per mode/difficulty with clear local-only language.

State ownership:

- Shell navigation state should live in runtime, not in deterministic game simulation.
- Game simulation should remain authoritative only for gameplay, round results, and deterministic match data.
- The shell can create, pause, destroy, or restart matches, but it should not mutate match internals directly.

Existing modes:

- Classic Single remains P1 versus CPU.
- Local Versus remains P1 versus P2 on one device.
- No new content mode is required.

Accessibility:

- All shell controls should be native focusable HTML controls.
- Focus should move predictably when opening settings, results, pause, and high-score views.
- Canvas gameplay state should continue to expose HTML/test mirrors for critical state.
- The shell should remain usable with keyboard alone.

Layout:

- Avoid nested card structures.
- Keep gameplay visible and uncluttered.
- Results and settings can be panels/modals, but they must not overlap text or controls at common test viewports.

### 3. Input Foundation

M2.6 should formalize input as actions, devices, bindings, and profiles rather than scattered key checks.

Action model:

- Define named actions such as `p1.moveLeft`, `p1.moveRight`, `p1.chargeJump`, `p1.releaseJump`, `p1.tongue`, `p2.moveLeft`, `p2.moveRight`, `p2.chargeJump`, `p2.releaseJump`, `p2.tongue`, `ui.start`, `ui.pause`, `ui.confirm`, and `ui.back`.
- Keep gameplay commands separate from UI navigation commands.
- Convert raw device input into action state, then into game commands.

Keyboard:

- Preserve current defaults:
  - P1: `A/D` or arrows, `Space`, `T`.
  - P2: `J/L`, `I`, `O`.
  - UI: `Enter`, `P`, mode/menu controls through focused buttons.
- Add conflict detection during remapping.
- Browser-reserved shortcuts should be rejected or require confirmation.

Pointer and touch zones:

- Keep pointer/touch functional for P1.
- Add named touch zones for left, right, jump/charge, tongue, pause, and confirm where practical.
- Touch zones should be visible or discoverable when touch mode is active.
- Touch should not break desktop pointer play or focus behavior.

Gamepad:

- Add a polling foundation using the browser Gamepad API.
- Support at least the first connected gamepad for P1 in M2.6 if feasible.
- Map D-pad/left stick to movement, south button to jump/charge, east/right trigger to tongue, start/menu to pause.
- Expose connection and active-device markers for tests.
- If CI cannot reliably emulate gamepads, unit-test mapper functions and keep browser smoke limited to marker behavior.

Remapping:

- Represent bindings as data, not hard-coded conditionals.
- A binding should include device type, code/button/axis, direction or threshold where needed, and action id.
- Remapping UI should allow reset to defaults.
- Persist selected input profile through SaveManager.
- Do not add a complex per-user account model.

Persistence hooks:

- SaveManager stores input profiles and selected profile id.
- Runtime loads profiles at boot and falls back to defaults if invalid.
- Import/export should include bindings if import/export is implemented.

### 4. Audio v1 Pipeline Decision

M2.5 currently uses direct Web Audio oscillators for an autoplay-safe SFX baseline. M2.6 should decide whether to stay with Web Audio v1 or add Howler, then document and implement a local authored asset path.

Decision criteria:

- Bundle size and dependency cost.
- Browser support across Chromium, Firefox, and WebKit.
- Ease of volume buses, mute, mono/downmix, looped music, unlock handling, and testability.
- Ability to gracefully continue when audio files fail.
- Fit with static hosting and offline cache.

Recommended default:

- Stay on direct Web Audio for M2.6 unless the implementation plan proves Howler materially reduces complexity.
- Do not add Howler only for one or two loops if the existing manager can support buffers and buses cleanly.
- If Howler is chosen, package changes must be explicit, bundle impact must be measured, and tests must cover equivalent unlock/failure behavior.

Authored local audio path:

- Use checked-in or human-supplied local files only.
- No live OpenAI image/audio API calls.
- Suggested placeholder paths:
  - `public/audio/sfx/jump.*`
  - `public/audio/sfx/tongue.*`
  - `public/audio/sfx/catch.*`
  - `public/audio/sfx/miss.*`
  - `public/audio/sfx/splash.*`
  - `public/audio/sfx/power.*`
  - `public/audio/sfx/start.*`
  - `public/audio/sfx/pause.*`
  - `public/audio/sfx/results.*`
  - `public/audio/music/home-pond-loop.*`
- File formats should be chosen during implementation based on size and browser compatibility, likely `ogg` plus `mp3` fallback or a single broadly supported `mp3` if simplicity wins.

Buses:

- Master
- SFX
- Music
- UI, optional if cheap

Controls:

- Mute
- Master volume
- SFX volume
- Music volume
- Mono audio toggle
- Audio unlock state

Runtime behavior:

- Audio unlock must still require explicit user gesture.
- Missing or blocked audio must not block gameplay.
- Procedural oscillator SFX can remain as fallback if authored assets are missing.
- Music should start only after unlock and should respect reduced motion only if visual sync is introduced.
- Audio state should persist through SaveManager.

Testing:

- Unit-test bus volume clamping, mute, mono flag, unlock, missing asset fallback, and event routing.
- E2E should assert state markers, not audible output.
- PWA/offline smoke should verify local audio assets, if present, are cached or fail gracefully.

### 5. PWA And Static Deployment Hardening

M2.6 should make the static deployment more product-like without adding a backend.

Manifest:

- Add a web app manifest with app name, short name, description, start URL, display mode, theme/background colors, icons, and orientation preference.
- Link the manifest from `index.html`.
- Reuse existing favicon where acceptable, but define proper icon sizes if assets are available.

Service worker:

- Add a minimal service worker for an offline shell.
- Cache the app shell, build assets, required Home Pond assets, optional audio assets, and manifest/icons.
- Prefer a simple cache-first strategy for immutable build assets and stale-while-revalidate or network-first fallback for the root document if implementation can do so safely.
- Service worker registration should be visible through test markers or logs, but failure must not block the app.
- Include a cache version constant and upgrade cleanup.

Offline shell:

- A previously loaded app should reopen offline to the shell.
- If gameplay assets are cached, a local round should be playable offline.
- If optional audio assets are absent, gameplay should still work silently.
- No network dependency should be introduced for boot.

Docker and Coolify smoke:

- Keep static nginx deployment.
- Verify `/` returns the app.
- Verify manifest returns `200`.
- Verify service worker returns `200` with a JavaScript content type.
- Verify required assets return `200`.
- Verify offline reload through Playwright context routing or browser offline mode if stable.
- Keep the existing Docker/Coolify notes current.

Security and privacy:

- Saves remain local-only.
- No analytics or external tracking.
- Service worker should not cache cross-origin resources.

### 6. Verification Upgrade

M2.6 should upgrade gates from vertical-slice confidence to small-product confidence.

Build and unit:

- `npm run build`
- `npm run test:unit`
- `npm test`

Multi-browser Playwright:

- Run the M2.6 shell and gameplay smoke in Chromium, Firefox, and WebKit if current Playwright config supports it or can be safely extended.
- At minimum cover shell boot, mode select, settings persistence, gameplay start, results, high-score update, and replay.
- Preserve deterministic short-round params for speed.

Accessibility:

- Add an axe-core shell audit if package impact and setup are acceptable.
- Audit main menu, settings, gameplay shell, pause, results, and high-score views.
- Keep canvas limitations explicit; assert semantic shell controls, names, focus, contrast-oriented states, and absence of serious/critical violations.

Screenshot and no-overlap:

- Capture screenshots for splash/menu, settings, gameplay, pause, results, and high scores.
- Assert no major text/control overlap at `390x844`, `800x600`, `1024x768`, `1366x768`, and `1920x1080`.
- Continue canvas nonblank checks.
- Add a screenshot diff only if the repo already has a stable pattern or implementation can keep it low-maintenance.

Performance smoke:

- Add a small performance smoke that checks boot time, long-task-free interaction budget, or average frame update budget in a deterministic short run.
- Keep thresholds loose enough for CI variability.
- Record asset and audio file sizes where practical.
- Performance smoke should catch accidental megabyte-scale regressions or extreme runtime stalls, not enforce final optimization.

PWA/offline:

- Verify manifest and service worker availability.
- Verify app shell reloads offline after a first online load.
- Verify no uncaught errors when storage, audio, or service worker registration is unavailable.

## Acceptance Gates

M2.6 is complete only when all of these are true:

1. The spec and implementation plan both state that the full objective is not complete and M2.5 is only a deployed vertical slice.
2. SaveManager v1 persists settings, high scores, aggregate local stats, schema version, and migration/default behavior.
3. SaveManager handles unavailable, invalid, unknown-version, export, and import paths according to implementation scope.
4. The app has a real shell flow: splash or boot state, main menu, mode select, settings, high scores, gameplay, pause, and results.
5. Classic Single and Local Versus remain the only player-facing gameplay modes.
6. Results update high scores and stats exactly once per completed round.
7. Input is modeled through named actions, default bindings, conflict-aware remapping, and SaveManager persistence hooks.
8. Keyboard and pointer/touch remain functional; gamepad mapping foundation exists or is explicitly deferred with tested mapper boundaries.
9. Audio v1 decision is recorded: Web Audio or Howler, with measured tradeoffs if adding a dependency.
10. Authored local SFX/music placeholder paths are defined without live network/API calls.
11. Audio has master/SFX/music volume concepts, mute, mono flag, unlock behavior, and graceful missing-audio fallback.
12. PWA manifest and service worker/offline shell are implemented and smoke-tested.
13. Docker/nginx and Coolify static deployment notes are updated for manifest, service worker, assets, and offline shell checks.
14. Multi-browser Playwright shell/gameplay smoke passes or any unsupported browser is documented with a blocker.
15. Axe-core or equivalent shell accessibility audit passes for serious/critical issues, if package/setup is accepted in the implementation plan.
16. Screenshot/no-overlap checks cover shell states and common viewports.
17. A small performance smoke runs with clear, loose thresholds.
18. No new biomes, campaign, bosses, backend, online leaderboard, analytics, monetization, shop, payments, ads, final Spine/TexturePacker pipeline, or live OpenAI image/audio API calls are introduced.
19. `npm run build`, focused unit tests, Playwright tests, full test, and Docker/static smoke pass before completion is claimed.

## Risks And Mitigations

| Risk | Mitigation |
|---|---|
| Save schema becomes a future constraint too early. | Keep v1 minimal, versioned, validated, and migration-ready; store only local settings, high scores, and aggregate stats. |
| Shell work grows into campaign/menu art production. | Keep shell states semantic and functional; use existing Home Pond visuals without adding new content systems. |
| Remapping UI becomes too large. | Implement named actions and bindings first; keep visible remap controls minimal with reset-to-defaults. |
| Gamepad support is flaky in CI. | Unit-test mapper logic and expose browser markers; keep E2E coverage to stable paths. |
| Audio dependency churn delays milestone. | Default to current Web Audio unless Howler clearly reduces implementation and testing complexity. |
| Authored audio assets bloat static deployment. | Use small placeholders, record sizes, and allow procedural fallback. |
| Service worker causes stale builds in development or deploy. | Version caches, cleanup old caches on activate, and keep registration disabled or easy to bypass in dev if needed. |
| Offline tests are flaky. | Use a narrow shell reload smoke first; expand only after stable. |
| Multi-browser Playwright exposes existing engine-specific rendering issues. | Treat failures as real blockers for M2.6 product foundation unless a browser is explicitly out of scope. |
| Axe-core setup pulls too much new tooling. | Evaluate package impact in the implementation plan; if rejected, document a manual accessibility gate and revisit. |

## Next Implementation-Plan Handoff Notes

The implementation plan should be TDD-first and split into small commit boundaries:

1. Baseline and dirty-worktree guard.
2. SaveManager v1 unit tests and implementation.
3. Shell state model and semantic DOM flow around existing match creation.
4. Settings/high-score integration with SaveManager.
5. Input action registry, default bindings, mapper tests, and remapping persistence.
6. Gamepad/touch-zone foundation if feasible after keyboard remapping lands.
7. Audio v1 decision checkpoint, then local asset/bus implementation.
8. PWA manifest, service worker, offline shell, and Docker/Coolify smoke.
9. Verification upgrade: multi-browser Playwright, axe-core or agreed equivalent, screenshot/no-overlap, and performance smoke.
10. Final scope audit confirming no excluded M3/content/backend/monetization/API work entered the milestone.

The plan should not start M3 content. M2.6 should finish as a stronger local product shell around the M2.5 Home Pond Classic vertical slice, ready for future breadth.
