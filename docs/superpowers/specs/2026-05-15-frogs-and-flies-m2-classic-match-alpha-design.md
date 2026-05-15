# Frogs and Flies 2 M2 Classic Match Alpha + Runtime Foundation Design Spec

**Date:** 2026-05-15

**Status:** Approved for implementation planning

**Approved Direction:** Advance the deployed M0/M1 PixiJS browser slice into a complete 180-second Classic Match alpha with two-player match structure, CPU play, AI takeover, deterministic fixed-step simulation, richer match results, and a cleaner runtime architecture. M2 should move toward `docs/project_documentation.md` without attempting to finish the full production game.

## Goal and Context

M0 and M1 are already delivered and deployed. M2 builds on that foundation by turning the current playable slice into a recognizable Classic Match: a timed day-to-night round, two frogs competing for score, clear controls, match conclusion, and replayable results.

The goal is not breadth. M2 should make the core 1982-inspired Classic Single and Local Versus contract feel complete enough for alpha validation while creating maintainable runtime boundaries for later modes, content, effects, and polish.

## Mapping to Project Documentation

M2 maps directly to these project-documentation themes:

- **Classic Single:** one human player competes against a CPU-controlled second frog in a 180-second day-to-night match.
- **Local Versus:** two local human players can compete on the same keyboard/browser session.
- **AI takeover:** any player with no input for 15 seconds is temporarily controlled by CPU logic until that player provides input again.
- **Deterministic/fixed timestep:** gameplay state advances through a fixed simulation step, with seeded randomness and no direct gameplay dependence on wall-clock time or `Math.random()`.
- **Tests:** simulation behavior, match timing, AI takeover, scoring, results, and browser smoke flows are covered by focused unit and Playwright tests.

## Deliverables

- **180s Classic Match:** a full 180-second simulated round with visible countdown and day/dusk/night progression.
- **P1 vs CPU:** Classic Single starts Player 1 against an active CPU Player 2.
- **Local Versus:** a selectable or clearly reachable mode where Player 1 and Player 2 are both human-controlled.
- **AI takeover:** after 15 seconds without player input, that player's frog switches to CPU control; any valid input restores human control.
- **Per-player scoring:** each player has independent score, caught count, attempts or accuracy if already supported, and visible identity.
- **Results and winner:** match end shows both players, final scores, winner, and a tie state when scores match.
- **Runtime cleanup:** split `main.ts` into focused runtime modules without changing the overall stack or rewriting the engine.
- **Render layers:** introduce explicit Pixi display/layer boundaries for background, gameplay entities, effects, and UI/HUD overlays.
- **Professional-feel effects:** add small, cheap effects that improve readability and feel, such as catch pop, score float, tongue/catch feedback, splash, dusk tint, or match-end flourish.
- **README controls update:** implementation must update controls documentation to include P1, P2, pause, mode selection/replay, and AI takeover behavior.

## Non-Goals

- No campaign, story progression, world map, or biome sequence.
- No bosses.
- No skins, cosmetics, unlocks, or achievements.
- No online leaderboard, accounts, persistence, or backend gameplay.
- No localization pass.
- No full audio system, Spine pipeline, or final asset pipeline.
- No mobile UX or touch-first control design.
- No engine rewrite or framework migration.
- No extra game modes beyond Classic Single and Local Versus.

## Proposed Architecture

M2 should preserve the existing PixiJS + TypeScript + Vite architecture and make the runtime easier to extend. Prefer small, explicit modules over a generic framework.

### Suggested Module Boundaries

- `src/main.ts`: thin boot entry only; create app shell, wire DOM root, start runtime.
- `src/runtime/app.ts`: Pixi application lifecycle, resize handling, ticker binding, teardown.
- `src/runtime/assets.ts`: asset loading and fallback handling.
- `src/runtime/layers.ts`: creation and ownership of named render layers.
- `src/runtime/input.ts`: keyboard/pointer input collection, per-player input state, inactivity timestamps.
- `src/runtime/hud.ts`: DOM or Pixi HUD binding for timer, mode, scores, pause/results affordances, and test hooks.
- `src/render/*`: render adapters that project simulation state into Pixi sprites, effects, and layer updates.
- `src/game/*`: deterministic simulation state, fixed-step update, PRNG, spawning, collision, scoring, AI, match state, and results.

Existing filenames may differ; the planner should adapt names to the current codebase. The required outcome is clear ownership: simulation stays testable without Pixi, rendering does not mutate game rules, and boot/lifecycle code does not contain match logic.

### Simulation Responsibilities

- Own the match clock, mode, player roster, scores, entities, PRNG seed, AI state, and end-state results.
- Advance only through the fixed timestep.
- Track per-player last-human-input time for takeover.
- Keep CPU decisions deterministic from simulation state and seeded randomness.
- Produce a results object when the match ends.

### Rendering Responsibilities

- Draw the pond, frogs, flies, tongue/catch feedback, score feedback, and time-of-day presentation.
- Use stable render layers so later effects cannot accidentally cover HUD or core gameplay.
- Keep visual effects non-authoritative: they may react to simulation events, but they must not decide scoring or collisions.

### Input Responsibilities

- Support P1 controls and P2 controls without conflict.
- Provide pause/replay/mode commands.
- Distinguish human input from AI actions so takeover can restore correctly.
- Expose stable test hooks for mode, timer, scores, player control source, and results.

## Acceptance Criteria

- Classic Single runs a 180-second round with P1 human vs CPU.
- Local Versus runs a 180-second round with two human players.
- The match uses fixed-step simulation and seeded deterministic randomness.
- The visible timer starts at 180 seconds and reaches match end through simulation time.
- AI takeover activates for an inactive human player after 15 seconds and deactivates on that player's next valid input.
- Each player has separate score and match stats.
- Results identify Player 1 win, Player 2 win, and tie correctly.
- `main.ts` is reduced to bootstrapping responsibilities, with runtime, input, rendering, and simulation split into focused modules.
- Rendering uses explicit background, gameplay, effects, and HUD/UI layers.
- The match includes minimal polished feedback effects for catching, scoring, splash/miss, and end-of-round or time-of-day transition.
- README controls documentation is updated during implementation.
- Unit and browser tests cover the new match contract.

## Verification Commands

Implementation is complete only after these pass:

```bash
npm run build
npm run test:unit
npm run test:e2e
```

If script names differ at implementation time, use the repository's equivalent build, unit, and Playwright commands and document the substitution in the implementation summary.

## Test Plan

- Unit-test deterministic PRNG and fixed-step accumulation.
- Unit-test 180-second match timer and transition to results.
- Unit-test scoring isolation between Player 1 and Player 2.
- Unit-test winner and tie calculation.
- Unit-test AI takeover threshold at 15 seconds and human-input restoration.
- Unit-test CPU-controlled decisions using deterministic seeded state where practical.
- Playwright-test Classic Single start, visible canvas, countdown, score visibility, pause/resume, and results.
- Playwright-test Local Versus selection/start and both players' visible score slots.
- Playwright-test stable test hooks for current mode, game state, timer, scores, player control source, and results.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| `main.ts` cleanup grows into an engine rewrite. | Restrict refactor to ownership boundaries needed by M2; keep current stack and behavior. |
| AI takeover conflicts with CPU opponent logic. | Model control source per player: `human`, `cpu-opponent`, or `ai-takeover`, with clear restoration rules. |
| Determinism is broken by render ticker, `Date.now()`, or `Math.random()`. | Keep gameplay time and randomness inside simulation; render receives snapshots/events only. |
| Local Versus controls overlap with browser shortcuts or P1 keys. | Define explicit non-overlapping P1/P2 bindings and document them in README. |
| Visual polish delays match completion. | Limit effects to readability-focused, cheap feedback tied to existing events. |
| 180-second e2e tests become slow. | Use simulation controls, seeded state, or test-only acceleration hooks that do not alter production gameplay rules. |
| Results logic becomes canvas-only and hard to test. | Expose DOM/test-hook state for winner, tie, scores, mode, and match state. |

## Planner Notes

M2 should feel like the first coherent Classic Match alpha: clear match start, competitive play, inactivity takeover, match end, and results. Later milestones can add campaign, content variety, final art/audio, advanced modes, accessibility depth, and mobile UX after this runtime foundation is stable.
