# Frogs & Flies Remake

M0 is a PixiJS v8 browser vertical slice of a Frogs and Flies-style arcade round. It is a deterministic 60 second single-player slice with fixed-step simulation, seeded spawning, scoring, a Rush power-up, round-state UI, and procedural placeholder rendering.

## Current M0

- PixiJS v8 runtime mounted from Vite.
- Fixed 1/60 second gameplay step with a seeded PRNG.
- Default 60 second round: `start` -> `gameplay` -> `the-end` -> `results`.
- Day, dusk, night, and THE END visual states driven by remaining time.
- One controllable frog that moves horizontally and catches flies within a catch radius.
- Procedural fly and Rush power-up spawning from the deterministic seed.
- Score, combo bonus, and 5 second Rush radius boost.
- Responsive canvas sizing and smoke-test DOM markers for automation.
- Rendering is currently procedural PixiJS `Graphics` placeholder art. Generated bitmap assets exist in `public/assets`, but the runtime does not load them into the scene yet.

## Controls

- `A` / `D` or `Left` / `Right`: move the frog.
- `Space`: fire the tongue while gameplay is active.
- Pointer/touch on the canvas: move to the pointer x-position and fire; from the start state it also starts the round.
- `Enter`: start, resume from pause, or replay after results.
- `P`: pause/resume.
- On-screen controls: `Start`, `Pause`, `Resume`, `Replay`.

## Determinism And Smoke Parameters

- Default seed: `1`.
- Override seed: `/?seed=123`.
- E2E smoke states can force deterministic elapsed/phase checks:
  - `/?seed=123&smokeElapsedSeconds=30`
  - `/?smokeState=results&seed=123`
  - `/?durationSeconds=2&theEndSeconds=1`

## Local Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run test:unit
npm run test:e2e
npm test
```

`npm test` runs Vitest unit tests and Playwright E2E smoke tests.

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

Generated bitmap assets and their provenance are tracked in [ASSET_MANIFEST.md](ASSET_MANIFEST.md). In the current verified M0, those files are present in `public/assets` and `public/favicon.png`; gameplay visuals are still drawn procedurally with PixiJS `Graphics`.
