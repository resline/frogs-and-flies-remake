# Frogs & Flies Remake

M2.6 is a local product foundation around the M2.5 Home Pond Classic vertical slice. It hardens the playable Home Pond slice with persistence, a real product shell, input profiles, audio foundations, PWA/offline support, and stronger verification. It is not the finished full product: campaign, extra biomes, bosses, online leaderboard, backend services, accounts, monetization, and final asset/audio pipelines remain out of scope.

## Current M2.6

- PixiJS v8 runtime mounted from Vite with deterministic fixed 1/60 second gameplay.
- Default 180 second round: `start` -> `gameplay` -> `the-end` -> `results`.
- Day, dusk, night, and THE END visual states are driven by remaining time.
- Player-facing modes are exactly `Classic Single` and `Local Versus`.
- `Classic Single` starts with `P1` as human and `P2` as `cpu-opponent`; `Local Versus` supports two local human frogs.
- Home Pond gameplay keeps seeded flies, Rush power-ups, scoring, combo bonus, 5 second Rush radius boost, and generated sprite rendering with procedural fallback.
- Product shell flow covers Splash, Main menu, Mode select, Settings, High Scores, Gameplay, Pause, and Results.
- Local SaveManager v1 stores settings, input profiles, local high scores, local stats, and round tracking in `localStorage`.
- Input foundation includes keyboard defaults, pointer/canvas play, Touch zones, Gamepad foundation markers and P1 mapper, Remapping, conflict detection, and Reset Defaults.
- Web Audio v1 handles autoplay-safe unlock, mute, master/SFX/music buses, mono audio preference, optional local asset paths, and procedural missing audio fallback.
- PWA metadata and a static service worker provide a local offline shell for the Home Pond slice.
- Multi-browser Playwright coverage, accessibility checks, no-overlap shell screenshots, PWA offline smoke, and performance smoke are part of the M2.6 verification gates.

## Shell Flow

- Splash boots into Main menu after runtime readiness.
- Main menu exposes Play, Settings, and High Scores.
- Mode select offers Classic Single and Local Versus only, then Start.
- Settings owns difficulty, display options, audio options, input profile selection, remap buttons, and Reset Defaults.
- High Scores shows local-only Classic Single and Local Versus best entries.
- Gameplay shows HUD, canvas, touch controls, and Pause.
- Pause exposes Resume, Restart, Settings, and Main Menu.
- Results shows winner, P1/P2 or CPU scores, catch/attempt/accuracy/combo stats, local high-score status, Replay, Change Mode, and Main Menu.

## Controls

- `P1`: `A/D` or arrow keys move, `Space` charges/releases jump, and `KeyT` fires the tongue.
- `P2`: `J/L` move, `I` charges/releases jump, and `O` fires the tongue in Local Versus.
- `Enter`: start or confirm shell actions; it also resumes from pause or replays after results.
- `P`: pause/resume.
- `Escape`: bound as the default `ui.back` action in the input profile; visible Main Menu buttons remain the primary shell back path.
- `Digit1` and `Digit2`: runtime mode shortcuts for Classic Single and Local Versus.
- Pointer on the canvas moves toward pointer x-position and fires; from the start state it can also start gameplay.
- Touch zones expose Left, Right, Jump, Tongue, Pause, and Confirm buttons.
- Gamepad foundation maps a standard gamepad to P1: left stick/D-pad horizontal movement, south button jump, east button or right trigger tongue, and start/menu pause. P2 gamepad binding UI is deferred.
- Remapping is available in Settings for keyboard actions. Conflicts are rejected, saved mappings persist, and Reset Defaults restores the default input profile.

## Save And Privacy

- Save key: `frogs-and-flies.save.v1`.
- Saved settings include difficulty, timer visibility, reduced motion, high contrast, mute, `masterVolume`, `sfxVolume`, `musicVolume`, `monoAudio`, and selected input profile.
- Saved progress includes input profiles, Classic Single and Local Versus high scores, local stats, started round IDs, and completed round IDs.
- URL settings are one-load overrides and do not rewrite saved settings unless the player changes settings in the shell.
- `exportJson` and `importJson` cover the whole SaveManager v1 schema for local JSON round trips. The current shell does not upload, sync, or provide a remote import/export service.
- No backend, account, cloud save, analytics, online leaderboard, ads, payments, or live network dependency is required for saves or stats.

## Audio

- Audio uses Web Audio v1 directly; Howler is not part of M2.6.
- `Enable Audio` performs the explicit browser unlock gesture. Gameplay SFX queue while locked and flush only after unlock.
- Settings persist mute, `masterVolume`, `sfxVolume`, `musicVolume`, and `monoAudio`.
- Optional local authored placeholder paths are registered for `/audio/sfx/jump.mp3`, `/audio/sfx/tongue.mp3`, `/audio/sfx/catch.mp3`, `/audio/sfx/miss.mp3`, `/audio/sfx/splash.mp3`, `/audio/sfx/power.mp3`, `/audio/sfx/start.mp3`, `/audio/sfx/pause.mp3`, `/audio/sfx/results.mp3`, and `/audio/music/home-pond-loop.mp3`.
- Those audio files are optional in this milestone. Missing files use procedural oscillator SFX and must not block gameplay.
- No live OpenAI audio API calls are made by the app or required for local verification.

## Determinism And Smoke Parameters

- Default seed: `1`.
- Override mode: `/?mode=local-versus` or `/?mode=classic-single`.
- Override seed: `/?seed=123`.
- E2E smoke states can force deterministic elapsed/phase checks:
  - `/?seed=123&smokeElapsedSeconds=30`
  - `/?smokeState=results&seed=123`
  - `/?durationSeconds=2&theEndSeconds=1&simulationSpeed=20`
- Supported smoke params: `mode`, `seed`, `smokeElapsedSeconds`, `smokeState`, `durationSeconds`, `theEndSeconds`, `simulationSpeed`.
- Supported option params: `difficulty=classic-assist|classic-standard|classic-expert`, `showTimer=0|1`, `reducedMotion=0|1`, `highContrast=0|1`, `mute=0|1`, and `volume=0..1`.
- Runtime markers include `data-shell-screen`, `data-save-status`, `data-round-recorded`, `data-active-input-device`, `data-gamepad-connected`, `data-reduced-motion`, `data-high-contrast`, `data-audio-unlocked`, `data-audio-muted`, `data-audio-master-volume`, `data-audio-sfx-volume`, `data-audio-music-volume`, `data-audio-mono`, `data-pwa-registration`, and `data-pwa-runtime-cache-ready`.

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

`npm test` runs Vitest unit tests and Playwright E2E tests. M2.6 Playwright coverage includes Chromium, Firefox, and WebKit projects where the environment supports them, plus shell flow, persistence, input, audio, PWA/offline, accessibility, and performance smoke.

Focused README gate:

```bash
npm run test:unit -- tests/unit/readmeControls.test.ts
```

PWA/offline verification:

```bash
npm run test:unit -- tests/unit/pwaCache.test.ts
npm run build
npm run preview -- --host 127.0.0.1 --port 5176 --strictPort
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npx playwright test tests/e2e/m26-pwa-offline.spec.ts --project=chromium
```

Full M2.6 browser gate:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npx playwright test tests/e2e/m26-shell.spec.ts tests/e2e/m26-persistence.spec.ts tests/e2e/m26-input.spec.ts tests/e2e/m26-audio.spec.ts tests/e2e/m26-pwa-offline.spec.ts tests/e2e/m26-accessibility.spec.ts tests/e2e/m26-performance.spec.ts
```

## Build

```bash
npm run build
```

The build runs TypeScript and Vite, producing the static app in `dist`. Do not commit generated `dist/`.

## PWA And Offline Shell

- Manifest path: `/manifest.webmanifest`.
- Service worker path: `/service-worker.js`.
- Cache name: `frogs-and-flies-m26-v2`.
- The app shell caches `/`, the manifest, favicon, Home Pond gameplay assets, and same-origin runtime JS/CSS assets.
- Offline navigation falls back to the cached local shell. Gameplay remains local-only and does not require backend calls.
- `/service-worker.js` and `/manifest.webmanifest` should be served without immutable long-term caching.

## Docker / nginx / Coolify

```bash
docker build -t frogs-and-flies-remake .
docker run --rm --name frogs-and-flies-m26 -p 18080:80 frogs-and-flies-remake
```

The Docker image builds with the repository `Dockerfile`, uses Node 22 Alpine for the build, and serves `dist` from nginx 1.27 Alpine on container port `80` using `nginx.conf`. Use host port `18080` when `8080` is occupied; the important mapping is `18080:80`.

Coolify and Docker gates:

- Build with the repository `Dockerfile`.
- Publish container port `80`.
- Configure the health check to load `/`.
- Required smoke URLs should return `200`: `/`, `/manifest.webmanifest`, `/service-worker.js`, `/assets/home-pond-background.png`, `/assets/frog-p1-idle.png`, and `/assets/fly-wing-a.png`.
- The service worker should return JavaScript content type.
- Verify `data-pwa-registration` reports `registered` or a documented non-blocking failure, and an offline reload reaches the local offline shell.
- No backend, account, cloud save, analytics, online leaderboard, or optional audio service is required.

## Assets

Generated bitmap assets and their provenance are tracked in [ASSET_MANIFEST.md](ASSET_MANIFEST.md). In the current verified M2.6 slice, Home Pond gameplay uses generated local PNG assets such as `public/assets/home-pond-background.png`, `public/assets/frog-p1-idle.png`, and `public/assets/fly-wing-a.png` through Pixi `Assets`; procedural rendering remains available as fallback and for overlays. `public/favicon.png` is referenced by the app shell.

No `public/audio/**` files are present in M2.6. Optional audio paths are registered in code for future local files, and missing audio uses procedural fallback.
