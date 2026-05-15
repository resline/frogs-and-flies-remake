# Frogs & Flies Remake

M0 is a PixiJS v8 browser vertical slice of a Frogs and Flies-style arcade round. It is a deterministic 60 second single-player slice with fixed-step simulation, seeded spawning, scoring, a Rush power-up, round-state UI, and generated sprite rendering with procedural fallback and overlays.

## Current M0

- PixiJS v8 runtime mounted from Vite.
- Fixed 1/60 second gameplay step with a seeded PRNG.
- Default 60 second round: `start` -> `gameplay` -> `the-end` -> `results`.
- Day, dusk, night, and THE END visual states driven by remaining time.
- One controllable frog that moves horizontally and catches flies within a catch radius.
- Procedural fly and Rush power-up spawning from the deterministic seed.
- Score, combo bonus, and 5 second Rush radius boost.
- Responsive canvas sizing and smoke-test DOM markers for automation.
- Gameplay loads `/assets/pond-arena.png`, `/assets/frog.png`, `/assets/fly.png`, and `/assets/power.png` through Pixi `Assets`.
- Runtime rendering uses those generated sprites with procedural fallback paths and PixiJS `Graphics` overlays for gameplay affordances.

## Controls

- Modes: `Classic Single` and `Local Versus`.
- `P1`: `A/D or arrows` move, `Space` jumps, and `KeyT` fires the tongue.
- `P2`: `J/L` move, `I` jumps, and `O` fires the tongue in Local Versus.
- AI takeover controls the second frog in Classic Single.
- Pointer/touch on the canvas: move to the pointer x-position and fire; from the start state it also starts the round.
- `Enter`: start, resume from pause, or replay after results.
- `P`: pause/resume.
- On-screen controls: `Start`, `Pause`, `Resume`, `Replay`.

## Determinism And Smoke Parameters

- Default seed: `1`.
- Override mode: `/?mode=local-versus` or `/?mode=classic-single`.
- Override seed: `/?seed=123`.
- E2E smoke states can force deterministic elapsed/phase checks:
  - `/?seed=123&smokeElapsedSeconds=30`
  - `/?smokeState=results&seed=123`
  - `/?durationSeconds=2&theEndSeconds=1&simulationSpeed=20`
- Supported M2 smoke params: `mode`, `seed`, `smokeElapsedSeconds`, `smokeState`, `durationSeconds`, `theEndSeconds`, `simulationSpeed`.

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

The Docker image builds the app with Node 22 Alpine and serves `dist` from nginx 1.27 Alpine using `nginx.conf`.

## Assets

Generated bitmap assets and their provenance are tracked in [ASSET_MANIFEST.md](ASSET_MANIFEST.md). In the current verified M0, `public/assets/pond-arena.png`, `frog.png`, `fly.png`, and `power.png` are loaded into gameplay through Pixi `Assets`; procedural rendering remains available as fallback and for overlays. `public/favicon.png` is referenced by the app shell.
