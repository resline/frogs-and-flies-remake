# Frogs & Flies Remake

M2.9 adds Home Pond Encounter Mechanics Profiles on top of the M2.8 Generated Home Pond Art Pack v1 and asset/audio pipeline hardening, the M2.7 Home Pond Campaign Prologue, the M2.6 local product foundation, and the M2.5 Home Pond Classic vertical slice. The browser game now has a first campaign path, typed level/content/encounter registry, three Home Pond levels with distinct encounter pacing, results with unlocks and stars, local SaveManager v2 migration, a richer local Home Pond visual pack, fulfilled local audio paths, manifest/cache validation, and offline asset/audio availability. M2.8 remains the current visual/audio baseline. It is not the finished full product: additional insects, hazards, power-ups, levels, biomes, bosses, achievements, skins, localization, online leaderboard, backend services, accounts, monetization, and final production pipelines are still outside this milestone.

## Current M2.9

- PixiJS v8 runtime mounted from Vite with deterministic fixed 1/60 second gameplay.
- Default 180 second round: `start` -> `gameplay` -> `the-end` -> `results`.
- Day, dusk, night, and THE END visual states are driven by remaining time.
- Home Pond Campaign Prologue adds a Campaign entry from Main menu, the Dawn At Home Pond prologue, and three registered levels: 1-1 First Hunt, 1-2 Quick Tongue, and 1-3 Nightfall Feast.
- Home Pond Encounter Mechanics Profiles assign the existing three Home Pond campaign levels to typed encounter profiles: `home-pond-baseline-gentle`, `home-pond-quick-tongue`, and `home-pond-nightfall-pressure`.
- Encounter profile differences are spawn cadence, fly band, fly velocity, and Rush cadence, using only the existing common fly and Rush power entities.
- Campaign launch exposes `data-campaign-encounter-profile` while a campaign level is active.
- Classic Single and Local Versus keep the M2.8 default pacing when they are not launched from Campaign.
- The typed registry contains one Home Pond campaign, one replayable prologue, three level definitions, three existing-Classic content profiles, and three encounter profiles. It deliberately avoids broad content expansion.
- Generated Home Pond Art Pack v1 lives in `public/assets/m28/` and is loaded before the legacy M2.5 Home Pond assets, with procedural rendering still available as final fallback.
- M2.8 player-visible polish includes richer Home Pond gameplay art, prologue dawn/day/dusk visuals, campaign star/lock/cleared icons, result stars, and fulfilled local audio files for existing registered paths.
- The runtime exposes `data-assets-pack="m28-v1"` when the M2.8 gameplay pack loads and preserves legacy `data-assets-loaded` markers for older smoke tests.
- `Classic Single` starts with `P1` as human and `P2` as `cpu-opponent`; `Local Versus` supports two local human frogs.
- Campaign results evaluate objectives, award 0-3 stars, persist best score/objective stats, unlock the next level on pass, and expose Replay Level, Next Level, Campaign, Classic Modes, and Main Menu.
- Product shell flow covers Splash, Main menu, Mode select, Campaign, Prologue, Settings, High Scores, Gameplay, Pause, and Results.
- Local SaveManager v2 stores settings, input profiles, local high scores, local stats, round tracking, campaign progress, prologue seen state, level unlocks, stars, best scores, and selected campaign level.
- SaveManager keeps `frogs-and-flies.save.v1` as a preserved rollback/migration key while `frogs-and-flies.save.v2` is the primary key.
- No save schema bump: M2.9 encounter profiles are static content/runtime tuning and are not persisted in SaveManager v2.
- Input foundation keeps keyboard defaults, pointer/canvas play, Touch zones, Gamepad foundation markers and P1 mapper, Remapping, conflict detection, and Reset Defaults.
- Web Audio v1 handles autoplay-safe unlock, mute, master/SFX/music buses, mono audio preference, local MP3 asset paths, and procedural missing audio fallback.
- PWA metadata and the static service worker use cache name `frogs-and-flies-m28-v1`; PWA cache `m28` covers the app shell, M2.8 visual pack, local audio paths, and legacy fallback assets.
- Multi-browser Playwright coverage, accessibility checks, no-overlap shell screenshots, PWA offline smoke, asset MIME/offline checks, and performance smoke are part of the M2.8 verification gates.
- M2.8 has no runtime OpenAI, ChatGPT, or API dependency. All shipped images and audio are local static files.
- No new insects, hazards, power-ups, levels, biomes, bosses, assets, audio, backend, localization, or monetization.

## Shell Flow

- Splash boots into Main menu after runtime readiness.
- Main menu exposes Campaign, Play, Settings, and High Scores.
- Campaign opens Home Pond with 1-1 First Hunt unlocked by default, 1-2 Quick Tongue and 1-3 Nightfall Feast locked until previous passes, and native buttons for Start Prologue, Continue, Replay Prologue, and Main Menu.
- Prologue shows Dawn At Home Pond panels with Back, Next, Skip, Start 1-1 First Hunt, and Main Menu controls. M2.8 maps the `dawn`, `day`, and `dusk` visual tones to local prologue images.
- Mode select offers Classic Single and Local Versus, then Start.
- Settings owns difficulty, display options, audio options, input profile selection, remap buttons, and Reset Defaults.
- High Scores shows local-only Classic Single and Local Versus best entries.
- Gameplay shows HUD, canvas, touch controls, and Pause.
- Pause exposes Resume, Restart, Settings, and Main Menu.
- Results shows winner, P1/P2 or CPU scores, catch/attempt/accuracy/combo stats, local high-score status, Replay, Change Mode, and Main Menu. Campaign results additionally show objective status, stars, Replay Level, Next Level when available, Campaign, and Classic Modes.
- Campaign level select and campaign results use decorative campaign star/lock/cleared icons while keeping text labels as the accessible source of truth.

## Controls

- `P1`: `A/D` or arrow keys move, `Space` charges/releases jump, and `KeyT` fires the tongue.
- `P2`: `J/L` move, `I` charges/releases jump, and `O` fires the tongue in Local Versus.
- `Enter`: start or confirm shell actions; it also resumes from pause or replays after results.
- `P`: pause/resume.
- `Escape`: bound as the default `ui.back` action in the input profile; visible Main Menu buttons remain the primary shell back path.
- `Digit1` and `Digit2`: runtime mode shortcuts for Classic Single and Local Versus.
- Campaign, Prologue, and Results campaign paths use native buttons, so keyboard Tab/Shift+Tab focus and Enter/Space activation follow browser defaults.
- Pointer on the canvas moves toward pointer x-position and fires; from the start state it can also start gameplay.
- Touch zones expose Left, Right, Jump, Tongue, Pause, and Confirm buttons.
- Gamepad foundation maps a standard gamepad to P1: left stick/D-pad horizontal movement, south button jump, east button or right trigger tongue, and start/menu pause. P2 gamepad binding UI is deferred.
- Remapping is available in Settings for keyboard actions. Conflicts are rejected, saved mappings persist, and Reset Defaults restores the default input profile.

## Save And Privacy

- Primary save key: `frogs-and-flies.save.v2`.
- Legacy rollback key preserved for migration: `frogs-and-flies.save.v1`.
- On first v2 load, SaveManager migrates valid v1 settings, input profiles, high scores, local stats, started round IDs, and completed round IDs, then initializes campaign progress.
- Saved settings include difficulty, timer visibility, reduced motion, high contrast, mute, `masterVolume`, `sfxVolume`, `musicVolume`, `monoAudio`, and selected input profile.
- Saved progress includes input profiles, Classic Single and Local Versus high scores, local stats, started round IDs, completed round IDs, seen prologue IDs, selected campaign, selected level, level unlocks, pass status, stars, best score, and best objective stats.
- URL settings are one-load overrides and do not rewrite saved settings unless the player changes settings in the shell.
- `exportJson` and `importJson` cover the whole SaveManager v2 schema for local JSON round trips. The current shell does not upload, sync, or provide a remote import/export service.
- Save/privacy scope: no backend, account, cloud save, analytics, online leaderboard, ads, payments, telemetry, or live network dependency is required for saves, stats, or campaign progress.

## Assets

Generated bitmap assets and their provenance are tracked in [ASSET_MANIFEST.md](ASSET_MANIFEST.md).

- Current gameplay pack: `public/assets/m28/`.
- Editable fallback source art: `public/assets/source/m28/`.
- M2.8 fallback provenance summary: the OpenAI Image API path was unavailable in the worker environment because `OPENAI_API_KEY` was not set, so the shipped M2.8 visuals are local SVG fallback stand-ins rendered to PNG with Playwright Chromium.
- No runtime image generation occurs. The app loads local static files only and has no runtime OpenAI, ChatGPT, or API dependency.
- Gameplay art includes `/assets/m28/m28-home-pond-background-v1.png`, frog poses, lily staging, fly/firefly art, and VFX sprites.
- Prologue visuals include `/assets/m28/m28-prologue-dawn-v1.png`, `/assets/m28/m28-prologue-day-v1.png`, and `/assets/m28/m28-prologue-dusk-v1.png`.
- Campaign UI art includes `/assets/m28/m28-ui-star-filled-v1.png`, `/assets/m28/m28-ui-star-empty-v1.png`, `/assets/m28/m28-ui-lock-v1.png`, and `/assets/m28/m28-ui-cleared-v1.png`.
- Legacy fallback files remain available at `/assets/home-pond-background.png`, `/assets/frog-p1-idle.png`, `/assets/fly-wing-a.png`, and the other M2.5 paths.
- `public/favicon.png` is referenced by the app shell.

M2.8 asset verification:

```bash
node scripts/check-m28-assets.mjs --images
node scripts/check-m28-assets.mjs --audio
node scripts/check-m28-assets.mjs --parity
```

## Audio

- Audio uses Web Audio v1 directly; Howler is not part of M2.8.
- `Enable Audio` performs the explicit browser unlock gesture. Gameplay SFX queue while locked and flush only after unlock.
- Settings persist mute, `masterVolume`, `sfxVolume`, `musicVolume`, and `monoAudio`.
- M2.8 fulfills the existing local audio registry with `public/audio/sfx/*.mp3` and `public/audio/music/home-pond-loop.mp3`.
- Registered local paths include `public/audio/sfx/jump.mp3`, `public/audio/sfx/tongue.mp3`, `public/audio/sfx/catch.mp3`, `public/audio/sfx/miss.mp3`, `public/audio/sfx/splash.mp3`, `public/audio/sfx/power.mp3`, `public/audio/sfx/start.mp3`, `public/audio/sfx/pause.mp3`, `public/audio/sfx/results.mp3`, and `public/audio/music/home-pond-loop.mp3`.
- Runtime URLs include `/audio/sfx/jump.mp3`, `/audio/sfx/tongue.mp3`, `/audio/sfx/catch.mp3`, `/audio/sfx/miss.mp3`, `/audio/sfx/splash.mp3`, `/audio/sfx/power.mp3`, `/audio/sfx/start.mp3`, `/audio/sfx/pause.mp3`, `/audio/sfx/results.mp3`, and `/audio/music/home-pond-loop.mp3`.
- The audio files are minimal local `ffmpeg` sine-source placeholders for path fulfillment, MIME/cache testing, and offline behavior, not a final authored audio production pass.
- The audio unlock/fallback behavior remains safe: if unlock is denied or a local file fails to load/decode, missing audio fallback uses procedural oscillator SFX and gameplay continues.
- No live OpenAI, ChatGPT, image API, or audio API calls are made by the app or required for local verification.

## Determinism And Smoke Parameters

- Default seed: `1`.
- Override mode: `/?mode=local-versus` or `/?mode=classic-single`.
- Override seed: `/?seed=123`.
- E2E smoke states can force deterministic elapsed/phase checks:
  - `/?seed=123&smokeElapsedSeconds=30`
  - `/?smokeState=results&seed=123`
  - `/?durationSeconds=2&theEndSeconds=1&simulationSpeed=20`
  - `/?durationSeconds=0.25&theEndSeconds=0.1&simulationSpeed=120&campaignSmokeScore=900&campaignSmokeCatches=9`
- Supported smoke params: `mode`, `seed`, `smokeElapsedSeconds`, `smokeState`, `durationSeconds`, `theEndSeconds`, `simulationSpeed`, `campaignSmokeScore`, and `campaignSmokeCatches`.
- `campaignSmokeScore` and `campaignSmokeCatches` are focused E2E helpers used only when a campaign context is active; they do not change ordinary Classic Single or Local Versus scoring/high-score semantics.
- Supported option params: `difficulty=classic-assist|classic-standard|classic-expert`, `showTimer=0|1`, `reducedMotion=0|1`, `highContrast=0|1`, `mute=0|1`, and `volume=0..1`.
- Runtime markers include `data-shell-screen`, `data-save-status`, `data-round-recorded`, `data-active-input-device`, `data-gamepad-connected`, `data-reduced-motion`, `data-high-contrast`, `data-audio-unlocked`, `data-audio-muted`, `data-audio-master-volume`, `data-audio-sfx-volume`, `data-audio-music-volume`, `data-audio-mono`, `data-pwa-registration`, `data-pwa-runtime-cache-ready`, `data-assets-pack`, `data-campaign-id`, `data-prologue-seen`, `data-last-selected-campaign-level`, `data-active-campaign-level`, `data-campaign-encounter-profile`, `data-campaign-result-level`, `data-campaign-result-passed`, and `data-campaign-result-stars`.

## Local Development

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5176 --strictPort
```

Do not assume default Vite port `5173` is free for verification. Use `5176` or another explicit free port and pass `PLAYWRIGHT_BASE_URL` when testing an already-running server.

## Verification

```bash
npm run build
npm run test:unit
npm run test:e2e
npm test
```

`npm test` runs Vitest unit tests and Playwright E2E tests. M2.9 coverage includes encounter profile registry, option resolution, deterministic replay, spawn pacing, unchanged Classic Single and Local Versus defaults, SaveManager v2 persistence scope, and campaign encounter profile markers. M2.8 Playwright coverage remains the visual/audio baseline and includes Chromium, Firefox, and WebKit projects where the environment supports them, plus shell flow, persistence, input, audio, PWA/offline, accessibility, responsive layout, campaign flow, asset MIME/offline checks, and performance smoke.

Focused README gate:

```bash
npm run test:unit -- tests/unit/readmeControls.test.ts
```

Focused M2.9 encounter profile gates:

```bash
npm run test:unit -- tests/unit/campaignRegistry.test.ts tests/unit/encounterProfiles.test.ts tests/unit/difficultyOptions.test.ts tests/unit/spawn.test.ts tests/unit/deterministicReplay.test.ts tests/unit/localVersus.test.ts tests/unit/saveManager.test.ts
npx playwright test tests/e2e/m29-encounter-profiles.spec.ts tests/e2e/m27-campaign-flow.spec.ts --project=chromium
```

Focused M2.8 asset/audio gates:

```bash
node scripts/check-m28-assets.mjs --images
node scripts/check-m28-assets.mjs --audio
node scripts/check-m28-assets.mjs --parity
npm run test:unit -- tests/unit/m28AssetPipeline.test.ts tests/unit/pwaCache.test.ts tests/unit/audioManager.test.ts
npx playwright test tests/e2e/m28-asset-pipeline.spec.ts --project=chromium
```

Focused M2.7 campaign gates:

```bash
npm run test:unit -- tests/unit/campaignRegistry.test.ts tests/unit/campaignObjectives.test.ts tests/unit/campaignProgress.test.ts tests/unit/runtimeParams.test.ts tests/unit/runtimeShell.test.ts
npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium
```

PWA/offline verification:

```bash
npm run test:unit -- tests/unit/pwaCache.test.ts
npm run build
npm run preview -- --host 127.0.0.1 --port 5176 --strictPort
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npx playwright test tests/e2e/m26-pwa-offline.spec.ts --project=chromium
```

Full M2.8 browser gate:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npx playwright test tests/e2e/m26-shell.spec.ts tests/e2e/m26-persistence.spec.ts tests/e2e/m26-input.spec.ts tests/e2e/m26-audio.spec.ts tests/e2e/m26-pwa-offline.spec.ts tests/e2e/m26-accessibility.spec.ts tests/e2e/m26-performance.spec.ts tests/e2e/m27-campaign-flow.spec.ts tests/e2e/m28-asset-pipeline.spec.ts
```

Production campaign and asset smoke after deployment:

```bash
PLAYWRIGHT_BASE_URL=https://frog.resline.net npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium
PLAYWRIGHT_BASE_URL=https://frog.resline.net npx playwright test tests/e2e/m28-asset-pipeline.spec.ts --project=chromium
```

## Build

```bash
npm run build
```

The build runs TypeScript and Vite, producing the static app in `dist`. Do not commit generated `dist/`.

## PWA And Offline Shell

- Manifest path: `/manifest.webmanifest`.
- Service worker path: `/service-worker.js`.
- Cache name: `frogs-and-flies-m28-v1`.
- The app shell caches `/`, the manifest, favicon, M2.8 Home Pond gameplay assets, campaign UI/prologue images, local audio files, legacy fallback Home Pond assets, and same-origin runtime JS/CSS assets.
- M2.8 explicitly verifies offline asset/audio availability for `public/assets/m28/`, `public/audio/sfx/*.mp3`, and `public/audio/music/home-pond-loop.mp3`.
- M2.9 encounter profile metadata is bundled with runtime JavaScript and does not require new asset, audio, or service worker cache paths.
- Campaign and Prologue are bundled in the same static app shell and are available offline after the service worker has cached the shell.
- Offline navigation falls back to the cached local shell. Gameplay remains local-only and does not require backend calls.
- `/service-worker.js` and `/manifest.webmanifest` should be served without immutable long-term caching.

## Docker / nginx / Coolify

```bash
docker build -t frogs-and-flies-remake .
docker run --rm --name frogs-and-flies-m28 -p 18080:80 frogs-and-flies-remake
```

The Docker image builds with the repository `Dockerfile`, uses Node 22 Alpine for the build, and serves `dist` from nginx 1.27 Alpine on container port `80` using `nginx.conf`. Use host port `18080` when `8080` is occupied; the important mapping is `18080:80`.

Coolify and Docker gates:

- Build with the repository `Dockerfile`.
- Publish container port `80`.
- Configure the health check to load `/`.
- Required smoke URLs should return `200`: `/`, `/manifest.webmanifest`, `/service-worker.js`, `/assets/m28/m28-home-pond-background-v1.png`, `/assets/m28/m28-ui-star-filled-v1.png`, `/audio/music/home-pond-loop.mp3`, `/assets/home-pond-background.png`, `/assets/frog-p1-idle.png`, and `/assets/fly-wing-a.png`.
- The service worker should return JavaScript content type and MP3 assets should return an MP3-compatible MIME such as `audio/mpeg`.
- Verify `data-pwa-registration` reports `registered` or a documented non-blocking failure, and an offline reload reaches the local offline shell.
- Verify production campaign flow with `PLAYWRIGHT_BASE_URL=https://frog.resline.net`.
- Verify production asset/audio flow with `PLAYWRIGHT_BASE_URL=https://frog.resline.net`.
- No backend, account, cloud save, analytics, online leaderboard, optional audio service, or runtime generation service is required.

## Non-Goals

- No new insects, hazards, power-ups, levels, biomes, bosses, assets, audio, backend, localization, or monetization.
- No new gameplay rules, levels, biomes, bosses, insect roster, hazards, or power-ups.
- No save schema bump beyond the existing SaveManager v2 campaign progress.
- No backend, account, cloud save, analytics, telemetry, online leaderboard, live API, localization, or monetization.
- No Howler, Spine, TexturePacker, final audio sprite, or full authored audio production pipeline.
- No new Survival, Time Attack, Daily, or Atari Mode.
