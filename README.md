# Frogs & Flies Remake

M2 is a PixiJS v8 browser vertical slice of a Frogs and Flies-style arcade round. It is a deterministic local multiplayer-capable slice with fixed-step simulation, seeded spawning, scoring, a Rush power-up, round-state UI, and generated sprite rendering with procedural fallback and overlays.

## Current M2

- PixiJS v8 runtime mounted from Vite.
- Fixed 1/60 second gameplay step with a seeded PRNG.
- Default 180 second round: `start` -> `gameplay` -> `the-end` -> `results`.
- Day, dusk, night, and THE END visual states driven by remaining time.
- Classic Single starts with `P1` as a human player and `P2` as `cpu-opponent`; Local Versus supports two human-controlled frogs.
- Procedural fly and Rush power-up spawning from the deterministic seed.
- Score, combo bonus, and 5 second Rush radius boost.
- Responsive canvas sizing and smoke-test DOM markers for automation.
- Desktop and mobile UI chrome keeps HUD/results/controls out of the primary jump band at common playtest viewports.
- Gameplay loads `/assets/pond-arena.png`, `/assets/frog.png`, `/assets/fly.png`, and `/assets/power.png` through Pixi `Assets`.
- Runtime rendering uses those generated sprites with procedural fallback paths and PixiJS `Graphics` overlays for gameplay affordances.

## Controls

- Modes: `Classic Single` and `Local Versus`.
- `P1`: `A/D or arrows` move, `Space` jumps, and `KeyT` fires the tongue.
- `P2`: `J/L` move, `I` jumps, and `O` fires the tongue in Local Versus.
- In Classic Single, `P2` is the `cpu-opponent`.
- AI takeover is for idle human players.
- Pointer/touch on the canvas: move to the pointer x-position and fire; from the start state it also starts the round.
- `Enter`: start, resume from pause, or replay after results.
- `P`: pause/resume.
- On-screen controls: `Start`, `Pause`, `Resume`, `Replay`.
- Difficulty options: `Classic Assist`, `Classic Standard`, and `Classic Expert`.
- Options UI includes timer visibility, reduced motion, high contrast, mute, volume, and an `Enable Audio` control.
- Mode, difficulty, match, audio, and replay controls are native keyboard-focusable controls with visible focus states and selected/checked ARIA state.
- Reduced motion softens rapid render pulses and rotating effects; high contrast increases outlines/contrast for frogs, flies, tongue, lilies, and UI controls.
- Audio uses an autoplay-safe Web Audio baseline. SFX unlock only after the explicit audio button is pressed, and queued gameplay sounds are dropped safely if browser audio is unavailable.
- PWA metadata and a static service worker support a local offline shell for the Home Pond slice.

## Determinism And Smoke Parameters

- Default seed: `1`.
- Override mode: `/?mode=local-versus` or `/?mode=classic-single`.
- Override seed: `/?seed=123`.
- E2E smoke states can force deterministic elapsed/phase checks:
  - `/?seed=123&smokeElapsedSeconds=30`
  - `/?smokeState=results&seed=123`
  - `/?durationSeconds=2&theEndSeconds=1&simulationSpeed=20`
- Supported M2 smoke params: `mode`, `seed`, `smokeElapsedSeconds`, `smokeState`, `durationSeconds`, `theEndSeconds`, `simulationSpeed`.
- Supported M2.5 option params: `difficulty=classic-assist|classic-standard|classic-expert`, `showTimer=0|1`, `reducedMotion=0|1`, `highContrast=0|1`, `mute=0|1`, and `volume=0..1`.
- Runtime accessibility/audio markers include `data-reduced-motion`, `data-high-contrast`, `data-render-reduced-motion`, `data-render-high-contrast`, `data-audio-unlocked`, `data-audio-muted`, and `data-audio-volume` on the shell/canvas for smoke automation.

## Local Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run build
npm run test:unit
npm run test:e2e
npm test
```

`npm test` runs Vitest unit tests and Playwright E2E smoke tests, including an assertion that generated gameplay assets loaded into the PixiJS runtime.

PWA/offline verification:

```bash
npm run test:unit -- tests/unit/pwaCache.test.ts
npm run build
npm run preview -- --host 127.0.0.1 --port 5176 --strictPort
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 npx playwright test tests/e2e/m26-pwa-offline.spec.ts --project=chromium
```

## Build

```bash
npm run build
```

The build runs TypeScript and Vite, producing the static app in `dist`.

## Docker / nginx

```bash
docker build -t frogs-and-flies-remake .
docker run --rm -p 8080:80 frogs-and-flies-remake
```

The Docker image builds the app with the repository `Dockerfile`, uses Node 22 Alpine for the build, and serves `dist` from nginx 1.27 Alpine on container port `80` using `nginx.conf`.

Coolify / Docker verification:

- Build with the repository `Dockerfile`; the container serves nginx on published container port `80`.
- Configure the health check to load `/`.
- No backend, analytics, account, cloud save, or network service is required.
- Manual smoke URL: `/?durationSeconds=3&theEndSeconds=0.1&simulationSpeed=20`.
- Verify `/manifest.webmanifest`, `/service-worker.js`, and required assets return `200`, for example `/assets/home-pond-background.png`, `/assets/frog-p1-idle.png`, and `/assets/fly-wing-a.png`.
- Verify the service worker registers through the `data-pwa-registration` marker and that an offline reload reaches the local shell.
- If optional audio files are deployed, verify the expected `/audio/...` files return `200`.
- For local Docker verification, substitute the host port when `8080` is occupied, for example `docker run --rm -p 18080:80 frogs-and-flies-remake`.

## Assets

Generated bitmap assets and their provenance are tracked in [ASSET_MANIFEST.md](ASSET_MANIFEST.md). In the current verified M2, `public/assets/pond-arena.png`, `frog.png`, `fly.png`, and `power.png` are loaded into gameplay through Pixi `Assets`; procedural rendering remains available as fallback and for overlays. `public/favicon.png` is referenced by the app shell.
