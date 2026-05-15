# Frogs and Flies M2.5 Professional Classic Vertical Slice Design Spec

**Date:** 2026-05-15

**Status:** Draft for implementation planning

**Milestone Name:** M2.5 / M3 candidate - Professional Classic Vertical Slice

**Approved Direction:** M2 is complete and deployed at HEAD `f930ac5`, but it is an alpha/runtime foundation rather than the full production objective from `docs/project_documentation.md`. M2.5 should make one Classic Home Pond match feel professional and shippable enough to validate the core before adding campaign breadth, extra biomes, bosses, online systems, or monetization.

## Context And Audit Summary

The full objective is not complete yet because the current repo implements the Classic match skeleton, not the production game described by the project documentation.

Current verified M2 state:

- PixiJS v8 runtime, Vite build, fixed 1/60 second simulation, seeded PRNG, and smoke parameters are present.
- The round flow exists: `start` -> `gameplay` -> `the-end` -> `results`, with 180 second default timing.
- Classic Single runs P1 human versus P2 CPU; Local Versus supports two human players.
- AI takeover exists after idle human input, with DOM markers for control source.
- Basic scoring, combo bonus, Rush power-up, day/dusk/night states, results, README docs, unit tests, and Playwright smoke tests exist.
- Rendering loads four generated bitmaps: `pond-arena.png`, `frog.png`, `fly.png`, and `power.png`, with procedural fallback and simple Pixi graphics overlays.

Gaps against `docs/project_documentation.md`:

- The arena does not yet feel like the canonical side-lily Classic layout. Player spawn/staging and jump/tongue readability are still generic arcade controls around a center-starting frog state.
- The jump model is a compact M2 stand-in, not the documented side lily jump arc with hold strength, airborne tongue timing, splash penalty readability, and strong left/right frog identities.
- Art is a four-image generated placeholder set, not a processed Home Pond vertical-slice asset set with animation stand-ins, atlased variants, lily staging, firefly end treatment, or readable silhouettes.
- There is no audio implementation or SFX/music baseline, despite audio being a visible requirement in the project documentation and roadmap.
- Difficulty/options are limited to mode and smoke parameters; there is no player-facing Easy/Normal style surface, accessibility options, or reduced-motion/high-contrast behavior.
- Desktop UX is functional for tests but not yet a polished shell with professional controls, pause/results flow, focus states, and layout guardrails.
- Determinism is present, but M2.5 needs stricter reproducibility, visual, audio-unlock, and deployment gates before expanding scope.

## Goal

Deliver a professional Classic Home Pond vertical slice: one 180 second Classic match that looks, sounds, controls, and tests like the core of the final game, while staying deliberately narrow.

The slice should prove the sacred core:

- Two frogs staged on opposite side lilies.
- A readable jump arc from lily staging into the air.
- Tongue timing that is visually and mechanically satisfying while airborne.
- Flies as the scoring target.
- Day-to-night match progression.
- Firefly/THE END end-of-round homage.
- Local couch readability for P1 versus CPU or P1 versus P2.

## Non-Goals

- No campaign, story map, progression, save system, or biome sequence.
- No additional production biomes beyond a polished Home Pond Classic arena.
- No bosses, boss framework, boss assets, or boss attack patterns.
- No Survival, Time Attack, Daily Challenge, Atari/Retro Mode, achievements, skins, gallery, shop, or unlock economy.
- No online leaderboard, accounts, backend, analytics submission, or persistence beyond optional local settings if needed for options.
- No monetization, external portal SDKs, ads, payments, store links, or premium/demo split.
- No full localization pass. Keep strings ready for later extraction, but do not implement PL/EN infrastructure in this milestone.
- No final Spine pipeline requirement. M2.5 may use generated sprites, processed frames, and deterministic stand-in animation.
- No mobile-first redesign. Touch can remain functional, but the milestone target is professional desktop Classic UX with responsive guardrails.

## Approach Options

### Option A - Pure Polish On Current M2 Runtime

Keep current mechanics mostly intact, improve CSS, generated assets, effects, and audio cues around existing systems.

Tradeoffs:

- Lowest implementation risk and fastest path.
- Preserves all M2 tests with minimal churn.
- Does not sufficiently address the core audit issue: Classic still may feel like a generic catch-radius arena rather than side-lily Frogs and Flies.

### Option B - Professional Classic Vertical Slice

Constrain scope to one Home Pond Classic match, but deepen core feel: side lily anchors, jump/tongue timing, staged frog identities, richer generated/processed assets, audio baseline, options/accessibility shell, and deterministic visual gates.

Tradeoffs:

- Best alignment with the project documentation's sacred core.
- Creates a strong implementation plan before campaign breadth.
- Requires touching multiple runtime surfaces in the next milestone: simulation, rendering, assets, audio, DOM shell, tests.
- Still avoids high-risk content systems like campaign, bosses, online, and monetization.

### Option C - Start M3 Breadth Now

Add more modes, biomes, power-ups, local leaderboard, campaign scaffolding, and broader UI.

Tradeoffs:

- Looks closer to the original roadmap labels.
- High risk because the core feel, audio, accessibility, and asset pipeline are not mature.
- More likely to multiply placeholder systems and create expensive rework.

### Recommendation

Choose Option B.

The current milestone labels are ahead of the implementation reality. M2.5 should be a quality bridge: one Classic match that can be shown, played, tested, and deployed as a convincing vertical slice. Campaign breadth should wait until the side-lily jump/tongue loop is proven.

## Detailed Design

### Classic Arena Feel

M2.5 keeps a single Home Pond arena at the current logical resolution unless implementation planning proves a safe reason to change it. The visual composition should read as side-on and competitive:

- P1 lily is anchored on the left side; P2/CPU lily is anchored on the right side.
- Each lily has a clear landing/staging zone, a visible rim, and a subtle water contact shadow.
- The central water area is the jump/catch field; flies occupy readable horizontal bands above the water.
- Day, dusk, night, and THE END states should use the same gameplay space but visibly change sky/water tint and firefly treatment.
- HUD and HTML controls must not cover the primary jump arc or fly band.
- P1 and P2 must be distinguishable by more than hue: silhouette, facing, outline, small marker, or lily emblem.
- Results should feel like a match conclusion, not just test text: final score, winner/tie, caught/attempted/accuracy, replay, and mode controls.

Implementation should prefer extending the current layer model (`background`, `gameplay`, `effects`, `ui`) rather than adding a new scene framework.

### Side Lily Staging, Jump Arc, And Tongue Timing

M2 currently has a functional jump/tongue stand-in. M2.5 should make the Classic loop explicit and testable.

Player staging:

- P1 starts on the left lily, facing right.
- P2/CPU starts on the right lily, facing left.
- A player state should know its home lily anchor, facing direction, jump phase, tongue phase, and whether it is staged, airborne, splashing, or recovering.
- In Classic Single, P2 remains CPU-controlled unless the selected mode is Local Versus.
- AI takeover still applies to idle human players, but takeover should use the same staged jump/tongue model as CPU.

Jump model:

- Keep fixed-step deterministic simulation authority.
- Move from generic lateral movement toward lily-based jump intent: charge/hold determines jump strength, horizontal intent determines arc direction, and landing resolves to lily or splash/recovery.
- Initial implementation may use tuned kinematic values rather than the full `docs/project_documentation.md` physics constants, but the values must be named constants and unit-tested.
- Jump duration target: readable arcade arc, roughly 0.55-1.25 seconds depending on charge.
- Recovery target after splash: short but noticeable, roughly 0.6-1.2 seconds total visual/interaction penalty.
- Failed landings should trigger splash, combo loss, and a clear return-to-lily or recovery state.

Tongue timing:

- Tongue can fire only when ready and should be most useful while airborne.
- Manual tongue input remains available on desktop controls.
- Easy-assist may auto-fire only when enabled and only when a fly is in a small forward cone or range; this must be deterministic.
- Active tongue window target: about 150-300 ms, with a visible extend/retract or impact stand-in.
- Collision should be more directional than the current catch-radius-only behavior. A capsule/segment or cone test is acceptable for M2.5 if it remains deterministic and covered by tests.
- Tongue visuals should originate from the frog mouth/facing side, not from a generic vertical line.

### Richer Generated/Processed Assets And Animation Stand-Ins

M2.5 is not the final Spine or TexturePacker milestone, but it should stop looking like a four-image prototype.

Required asset set:

- Home Pond background processed for 16:9 arena use, with left/right lily staging visible.
- Left and right lily pad sprites or layers if they cannot be reliably separated from the background.
- P1 frog and P2 frog readable variants, including at least idle/crouch, jump/airborne, tongue, splash/recover stand-ins.
- Fly sprite variants or frame stand-ins for wing flutter.
- Rush power-up retained or restyled to match the pond.
- Firefly/THE END visual asset or processed stand-in for the end homage.
- Small VFX sprites or procedural effects for tongue flash, catch pop, score popup, water splash, and night firefly glow.

Asset pipeline rules for this milestone:

- Preserve source prompts and post-processing steps in `ASSET_MANIFEST.md` during implementation.
- Keep transparent assets processed from generated sources or authored stand-ins; no opaque chroma-key artifacts in runtime.
- Prefer a simple manifest object and Pixi `Assets` loading consistent with the current runtime.
- Do not require TexturePacker or Spine unless implementation planning proves it is faster than stand-ins.
- Generated assets must be visually inspected and covered by Playwright asset-load assertions.
- Visual stand-ins must have deterministic frame selection or time-based animation driven from simulation/render elapsed time, not `Math.random()`.

Animation stand-ins:

- Frog idle: subtle breathing/squash loop.
- Frog charge: crouch/compress.
- Frog jump: stretched airborne pose with facing.
- Tongue: quick line/sprite extension with catch/miss color treatment.
- Splash: expanding ring plus brief droplets.
- Fly: two-frame wing flutter or sine bob using deterministic phase from entity id and elapsed time.
- Firefly end: simple fly-in/glow around THE END.

### Audio Baseline

M2.5 should add a minimal audio system, not the full 70 MB adaptive soundtrack plan.

Scope:

- Browser-safe audio unlock on explicit user gesture.
- Master and SFX volume controls; Music volume can exist if a loop is added.
- Mute toggle.
- SFX for jump, tongue out, catch, miss, splash, power-up, start/pause/resume, THE END/results.
- Optional short Home Pond ambient loop or low-volume music bed if it can be kept small.
- Mono/downmix option can be represented as an accessibility option even if implemented through simple bus routing.

Technical direction:

- Use Web Audio API directly or add Howler.js in the implementation plan after confirming bundle impact. The project documentation prefers Howler, but M2.5 can start with a small internal audio manager if that is safer.
- Audio playback must never block gameplay if assets fail to load.
- Autoplay restrictions must be handled gracefully with a visible "sound off/unlocked" state in the HTML shell.
- Test hooks should expose audio enabled/muted/unlocked state without relying on audible output in CI.

### Difficulty And Options Surface

M2.5 should expose a small professional setup surface without implementing the full settings system.

Modes:

- Classic Single.
- Local Versus.

Difficulty/options:

- `Classic Assist` / Easy-inspired toggle: safer jump arc, optional auto-tongue assist, and narrower fly band.
- `Classic Standard`: default M2.5 balance with manual tongue.
- Optional `Classic Expert` only if it is cheap: no auto assist, wider fly band, faster flies.

Required options:

- Show/hide explicit round timer. Default may remain visible during alpha, but the design should support the documentation's diegetic timer direction later.
- Reduced motion.
- High contrast or enhanced outlines.
- Mute and volume.
- Restart/replay.
- Pause/resume.

Options can be non-persistent for M2.5 unless implementation planning decides localStorage is necessary and low risk. Any persistence must be versioned and tested.

### Accessibility And Desktop UX Guardrails

Desktop is the target quality bar for M2.5.

HTML shell:

- Keep controls and setup in semantic HTML over the canvas.
- Buttons need accessible names, visible focus states, stable keyboard order, and `aria-pressed` or equivalent state for selected mode/options.
- Results should be readable as HTML, including winner, scores, stats, and replay action.
- Test-only markers can remain, but visible UI should not look like exposed diagnostics.

Canvas/gameplay:

- Canvas has an accessible label.
- Critical gameplay state must have HTML mirrors or live text for tests and assistive tech where practical: state, mode, timer, scores, control source, results.
- Reduced motion disables or softens screen shake, pulsing flashes, heavy bobbing, and rapid glow.
- High contrast/enhanced outlines improve frog, fly, tongue, score, and lily readability.
- Do not rely on hue alone for P1/P2 identity.
- Text must not overlap at 800x600, 1024x768, 1366x768, 1920x1080, and narrow mobile-ish smoke viewports.

Input:

- Preserve current documented keyboard controls unless an implementation plan explicitly migrates them.
- P1 and P2 controls must remain non-overlapping.
- Pause must be reachable from keyboard and visible control.
- Pointer/touch can stay basic, but it must not break desktop play.

### Deterministic Testing And Deployment Gates

M2.5 should strengthen the gate from "runs" to "reproducible and presentable."

Determinism:

- Same seed, same mode, same difficulty/options, and same input script must produce the same final scores, event sequence, and results.
- AI decisions, spawn timing, fly movement, assist behavior, and collision tie-breaks must not use `Math.random()` or wall-clock time.
- Smoke/runtime params must include enough surface to force short rounds, seed, mode, difficulty/assist, elapsed phase, and optionally audio-disabled mode.

Unit tests:

- Side lily player creation and facing.
- Jump charge/arc phase transitions.
- Tongue readiness, active window, catch/miss, and recovery.
- Directional tongue collision or cone/capsule behavior.
- Splash/recovery penalty and combo reset.
- Difficulty/assist changes to fly band, auto tongue, and/or jump forgiveness.
- Audio manager state transitions with mocked audio context.
- Options parsing and reduced-motion/high-contrast flags.
- Deterministic seed replay for a scripted short match.

Playwright tests:

- Classic Single starts with P1 left and CPU/P2 right, with visible HUD and controls.
- Local Versus exposes both human players and separate score/control markers.
- A short seeded round reaches THE END and results.
- Day, dusk, night, and THE END visual markers are present.
- Generated/processed assets load and are visible.
- Audio unlock/mute UI behaves without depending on real sound output.
- Reduced-motion and high-contrast options change runtime markers/styles.
- Responsive screenshots at desktop and tablet/narrow smoke sizes show non-overlapping UI.

Deployment gates:

- `npm run build`
- `npm run test:unit`
- `npm run test:e2e`
- `npm test`
- Docker build equivalent to current repo image.
- Manual smoke in a production preview: start Classic Single, catch/miss, pause/resume, switch Local Versus, force short result, replay.

## Acceptance Criteria

M2.5 is complete only when all of these are true:

1. Classic Single is a 180 second Home Pond match with P1 staged on the left lily and CPU/P2 staged on the right lily.
2. Local Versus uses the same side-lily arena with two human-controlled frogs and separate score/control-source displays.
3. Frog facing, lily anchors, jump phases, tongue phases, splash/recovery, and result state are represented in simulation state and deterministic tests.
4. Jump charge and arc behavior are readable, tunable through named constants, and covered by unit tests.
5. Tongue firing is directional, visually attached to the frog, and covered by catch/miss/recovery tests.
6. At least one assist/easy option and one standard option are exposed in the UI or setup surface, with deterministic behavior and tests.
7. The arena uses richer generated/processed Home Pond assets beyond the M2 four-image baseline, including distinguishable P1/P2 frog states, lily staging, fly animation stand-ins, splash/catch feedback, and THE END/firefly treatment.
8. Asset provenance and post-processing instructions are updated in the asset manifest during implementation.
9. A minimal audio baseline exists with unlock, mute, volume state, and SFX for core actions; gameplay remains functional if audio is unavailable.
10. Reduced-motion and high-contrast/enhanced-outline options affect gameplay presentation and are testable.
11. Desktop UX is polished: semantic controls, visible focus, clean pause/results/replay flow, and no diagnostic-looking UI as the primary player experience.
12. HUD/results text does not overlap at the required smoke viewport sizes.
13. Same seed/options/input script produces identical match results in automated tests.
14. Playwright covers Classic Single, Local Versus, short-result flow, asset loading, options, and responsive layout smoke.
15. Build, unit, E2E, full test, and Docker deployment gates pass before the milestone is considered done.
16. No campaign, biomes beyond Home Pond, bosses, online leaderboard, monetization, or unrelated runtime rewrites are introduced.

## Risks And Mitigations

| Risk | Mitigation |
|---|---|
| Polish expands into campaign breadth. | Enforce the non-goals. Every new feature must serve the one Classic Home Pond match. |
| Jump/tongue refactor breaks M2 determinism. | Add focused red/green tests around side staging, arc, tongue, and seeded replay before changing behavior. |
| Generated assets look inconsistent or create large downloads. | Use a small curated asset set, process transparencies, inspect screenshots, and track file sizes in the manifest. |
| Audio causes flaky CI or autoplay failures. | Test audio state through mocks/test hooks; require graceful silent fallback. |
| Accessibility work becomes a full settings platform. | Implement only reduced motion, high contrast/outline, timer visibility, mute/volume, and semantic controls. |
| UI overlaps the playable area. | Add Playwright screenshot/layout assertions for fixed viewport set before accepting the milestone. |
| AI/assist makes scores nondeterministic or unfair. | Drive all CPU/assist decisions from fixed-step state and seeded PRNG; test scripted outcomes. |
| Directional tongue collision is overbuilt. | Use the simplest deterministic cone or segment/capsule test that solves catch-radius ambiguity. |
| Texture/animation pipeline work delays feel tuning. | Treat Spine/TexturePacker as optional for M2.5; stand-ins are acceptable if they support readable motion. |

## Verification Strategy

Implementation planning should break verification into four gates:

1. Simulation gate: deterministic unit tests for side staging, jump, tongue, collision, difficulty/assist, AI, and results.
2. Presentation gate: Playwright asset visibility, day/dusk/night/THE END states, responsive screenshots, and non-overlap checks.
3. Audio/options gate: audio unlock/mute/volume test hooks, reduced-motion and high-contrast assertions.
4. Deployment gate: build, unit, E2E, full test, Docker build, and manual preview smoke.

M2.5 should not be declared complete because the game "looks better." It is complete when the core Classic match is measurably more professional, deterministic, accessible enough for the current scope, and deployable without opening future content systems.

