# Frogs and Flies M2.8 Generated Home Pond Art Pack v1 And Asset/Audio Pipeline Hardening Design Spec

**Date:** 2026-05-17

**Status:** Draft for implementation planning

**Milestone Name:** M2.8 - Generated Home Pond Art Pack v1 And Asset/Audio Pipeline Hardening

**Selected Direction:** Add a generated, professional Home Pond visual pack and fulfill only the already-registered local audio paths. M2.8 is an asset and pipeline hardening milestone, not a new gameplay, campaign, biome, boss, or save milestone.

## Assumptions And Approval Context

- The user has approved current and future stages, so this design-doc step proceeds without additional questions even though the brainstorming workflow normally asks for staged clarification and approval.
- This document is the design step only. It does not generate images, edit runtime code, add audio, or integrate assets.
- M2.7 is complete at current HEAD and deployed to `https://frog.resline.net` as the baseline for M2.8.
- The implementation plan should be written after this spec is accepted, using the existing superpowers plan format.
- The user asked for generated sprites and graphics through the ChatGPT/OpenAI image workflow. M2.8 defines that workflow and provenance requirements, but the shipped browser app must remain static and must not depend on a live OpenAI API or ChatGPT session at runtime.
- "GPT image 2.0" is treated as the preferred human-facing generation workflow label from the request. Implementation should use the current available OpenAI/ChatGPT image generation product at that time, record the exact tool/model label actually used in `ASSET_MANIFEST.md`, and fall back to local stand-ins if live generation is unavailable.
- Minimal audio in M2.8 means satisfying existing local registry paths in `src/runtime/audio.ts`. It does not mean a final audio engine, Howler migration, adaptive OST, audio sprites, or a full SFX catalogue.

## Current State After M2.7

M2.7 turned the local product foundation into the first campaign path:

- The app is a PixiJS v8, Vite, TypeScript browser game with deterministic fixed-step gameplay.
- Classic Single and Local Versus remain the gameplay modes, with Campaign as a shell route that launches existing Classic Single Home Pond matches.
- The Home Pond Campaign Prologue has one campaign, one prologue, three levels, objective/star evaluation, unlocks, replay, results actions, and SaveManager v2 progress.
- The shell includes Main Menu, Mode Select, Campaign, Prologue, Settings, High Scores, Gameplay, Pause, and Results.
- The service worker caches the static shell and current Home Pond assets under cache name `frogs-and-flies-m26-v2`.
- `src/runtime/assets.ts` loads current Home Pond PNGs through Pixi `Assets`, with fallback behavior if the generated asset load fails.
- `ASSET_MANIFEST.md` documents early generated M0 assets and local SVG-rendered M2.5 stand-ins.
- `src/runtime/audio.ts` registers optional local MP3 paths, but `public/audio/**` does not exist in M2.7. Missing audio files are handled by procedural Web Audio fallback.
- Current Home Pond visuals are functional and tested, but most M2.5 production slice art is local SVG stand-in output rather than a cohesive generated art pack.

M2.7 still does not satisfy the full product objective. The biggest visible gap now is not another route or save field; it is the professional generated visual identity and repeatable asset pipeline needed before more campaign content, insects, biomes, and bosses are added.

## Why M2.8 Is Next

The project documentation targets a modern browser sequel with attractive hand-drawn 2D presentation, authored sprites, parallax-ready pond art, readable effects, and a production asset pipeline. M2.7 gives the game a product container and campaign structure, but it still reuses M2.5 stand-ins and has no checked-in local audio files.

M2.8 should solve the smallest asset problem that unlocks future content:

- Replace the visible Home Pond stand-in feel with a cohesive generated art pack.
- Keep Classic, Local Versus, and Campaign behavior intact.
- Prove a repeatable generation, processing, manifest, cache, and verification path.
- Fulfill the already-registered local audio paths so the audio registry, PWA cache, MIME checks, and missing-asset fallback are tested against real files.
- Avoid broad content, simulation, or save changes while hardening the rails future biomes and insect packs will use.

## Options Considered

### Option A - Visual-Only Generated Home Pond Pack

Generate and integrate a richer Home Pond visual pack, update asset loading, update the manifest, and add visual verification. Leave `public/audio/**` absent.

Tradeoffs:

- Lowest asset scope and strongest focus on "attractive graphics".
- Avoids audio file format and cache questions.
- Leaves a known M2.7 gap: runtime registers local audio paths that do not exist.
- Keeps PWA/audio tests exercising only fallback paths, not real local asset fulfillment.

### Option B - Generated Home Pond Pack Plus Minimal Existing Audio Path Fulfillment

Generate and integrate the Home Pond visual pack, add prologue and campaign UI visuals, update manifest/cache/tests, and add small local MP3 files for only the paths already listed in `LOCAL_AUDIO_ASSET_REGISTRY`.

Tradeoffs:

- Best fit for the consolidated decision.
- Directly improves the player-visible product and closes the known `public/audio/**` gap.
- Keeps audio narrow by refusing new event names, Howler, audio sprites, adaptive mixing, and final OST work.
- Requires slightly broader filesystem, manifest, MIME, cache, and Docker smoke verification.

### Option C - Full Audiovisual Pipeline

Add generated art, authored audio, atlasing/spritesheets, audio sprites, full music pass, final naming conventions, and broader tooling for future biomes.

Tradeoffs:

- Moves closer to the project documentation's final production pipeline.
- Too broad for M2.8 and likely to block on tool choice, compression, art direction, and new runtime abstractions.
- Risks touching rendering, audio, service worker, tests, and gameplay at the same time.

### Recommendation

Choose Option B.

M2.8 should be a generated Home Pond Art Pack v1 with minimal audio path fulfillment. It should make the current M2.7 game look and feel more professional while proving the asset manifest, processing, cache, MIME, screenshot, Docker, and production smoke path for future content packs.

## Scope

M2.8 includes:

- A generated Home Pond art pack v1 stored under `public/assets/m28/**`.
- Runtime loading of M2.8 gameplay art through the existing Pixi asset path, with the current M2.5/M0 assets retained as fallback.
- Three generated prologue panel images for the existing Home Pond prologue tones: dawn, day, and dusk.
- Generated or locally processed campaign UI icons for stars, lock, and cleared state.
- Small local MP3 files for the exact audio paths already registered in `LOCAL_AUDIO_ASSET_REGISTRY`.
- `ASSET_MANIFEST.md` updates with prompts, generation workflow, provenance, dimensions, alpha/opacity, post-processing, file sizes, and fallback notes.
- PWA cache name bump and cache list parity for required M2.8 visuals and present audio files.
- Unit verification for manifest/filesystem/cache parity, PNG dimensions/alpha, and audio registry path fulfillment.
- Playwright verification for asset URLs, MIME types, offline availability, visual visibility, no-overlap screenshots, campaign/prologue/results polish, and graceful audio fallback.
- Docker/nginx and Coolify production smoke for the new static assets after implementation.

## Strict Non-Goals

- No new biome beyond Home Pond.
- No new campaign levels.
- No bosses, Queen Bee, or boss framework.
- No new insects, hazards, power-ups, spawn profiles, scoring rules, or gameplay balance changes.
- No changes in `src/game/**` unless a failing test proves an existing unrelated bug blocks asset rendering. Campaign/art concepts must not be imported into deterministic simulation.
- No SaveManager schema bump or campaign progress model change.
- No new player-facing mode such as Survival, Time Attack, Daily, or Atari Mode.
- No world map, shop, FrogCoins, achievements, skins, gallery, backend, accounts, cloud save, analytics, telemetry, ads, payments, monetization, or online leaderboard.
- No PL/EN localization pass.
- No Spine, TexturePacker, atlas runtime, skeletal animation, or sprite-sheet migration requirement.
- No Howler migration, audio sprites, adaptive music engine, final OST, or full SFX library.
- No runtime OpenAI, ChatGPT, image, audio, or other live API dependency.
- No external CDN dependency. All shipped assets are same-origin static files.

If implementation appears to require any non-goal, the worker should stop and return `BLOCKED_SCOPE_EXPANSION` to consolidation.

## Exact Visual Asset Set

M2.8 should add the following final runtime image files under `public/assets/m28/`. File names use `m28-` and `-v1` so the new pack can coexist with M2.5 fallback assets.

### Gameplay Art Pack

| Runtime file | Role | Dimensions | Transparency | Notes |
| --- | --- | --- | --- | --- |
| `public/assets/m28/m28-home-pond-background-v1.png` | Primary Home Pond arena background | `1600x1200` | opaque | Replaces the M2.5 stand-in texture in runtime mapping; keep readable water, left/right staging, and clear fly lanes. |
| `public/assets/m28/m28-lily-left-v1.png` | Left staging lily | `256x192` | transparent | Oriented toward center; no baked frog. |
| `public/assets/m28/m28-lily-right-v1.png` | Right staging lily | `256x192` | transparent | Oriented toward center; no baked frog. |
| `public/assets/m28/m28-frog-p1-idle-v1.png` | P1 idle frog | `256x256` | transparent | Facing right, readable on lily. |
| `public/assets/m28/m28-frog-p1-crouch-v1.png` | P1 charge/crouch frog | `256x256` | transparent | Same silhouette family as idle. |
| `public/assets/m28/m28-frog-p1-airborne-v1.png` | P1 airborne frog | `256x256` | transparent | Works at current render scale and rotation. |
| `public/assets/m28/m28-frog-p1-tongue-v1.png` | P1 tongue pose | `256x256` | transparent | Mouth/tongue cue readable without baking the full tongue line. |
| `public/assets/m28/m28-frog-p1-splash-v1.png` | P1 splash/recovery pose | `256x256` | transparent | Must not look like a death state. |
| `public/assets/m28/m28-frog-p2-idle-v1.png` | P2 idle frog | `256x256` | transparent | Facing left, distinct warm accent from P1. |
| `public/assets/m28/m28-frog-p2-crouch-v1.png` | P2 charge/crouch frog | `256x256` | transparent | Same silhouette family as P2 idle. |
| `public/assets/m28/m28-frog-p2-airborne-v1.png` | P2 airborne frog | `256x256` | transparent | Facing left. |
| `public/assets/m28/m28-frog-p2-tongue-v1.png` | P2 tongue pose | `256x256` | transparent | Mouth/tongue cue readable without baking full tongue line. |
| `public/assets/m28/m28-frog-p2-splash-v1.png` | P2 splash/recovery pose | `256x256` | transparent | Must not look like a death state. |
| `public/assets/m28/m28-fly-wing-a-v1.png` | Common fly wing-up frame | `96x96` | transparent | Same species as M2.7 common fly; no new insect type. |
| `public/assets/m28/m28-fly-wing-b-v1.png` | Common fly wing-down frame | `96x96` | transparent | Matches frame A proportions. |
| `public/assets/m28/m28-firefly-end-v1.png` | THE END firefly sprite | `128x128` | transparent | Glow readable at end sequence; no text baked into the sprite. |
| `public/assets/m28/m28-splash-ring-v1.png` | Splash VFX | `192x192` | transparent | Soft water ring, alpha edge clean. |
| `public/assets/m28/m28-catch-pop-v1.png` | Catch VFX | `128x128` | transparent | Short pop/burst; readable over sky and water. |
| `public/assets/m28/m28-tongue-flash-v1.png` | Tongue highlight VFX | `128x64` | transparent | Horizontal highlight texture; runtime can scale/rotate. |
| `public/assets/m28/m28-rush-power-v1.png` | Existing Rush/power pickup art | `128x128` | transparent | Refreshes the existing power asset only; does not add a new power-up mechanic. |

M2.8 intentionally chooses a richer single background rather than separate parallax layers. Parallax belongs in a later biome/render milestone after the static art rails are proven.

### Campaign And Prologue Art

| Runtime file | Role | Dimensions | Transparency | Notes |
| --- | --- | --- | --- | --- |
| `public/assets/m28/m28-prologue-dawn-v1.png` | Prologue panel 1 illustration | `1280x720` | opaque | Dawn over Home Pond, no text, no UI baked in. |
| `public/assets/m28/m28-prologue-day-v1.png` | Prologue panel 2 illustration | `1280x720` | opaque | Daylight pond story beat, no text. |
| `public/assets/m28/m28-prologue-dusk-v1.png` | Prologue panel 3 illustration | `1280x720` | opaque | Dusk/nightfall cue, no text. |
| `public/assets/m28/m28-ui-star-filled-v1.png` | Campaign filled star icon | `96x96` | transparent | Decorative icon paired with text/aria labels. |
| `public/assets/m28/m28-ui-star-empty-v1.png` | Campaign empty star icon | `96x96` | transparent | Same bounds as filled star. |
| `public/assets/m28/m28-ui-lock-v1.png` | Campaign locked level icon | `96x96` | transparent | Decorative icon paired with locked text. |
| `public/assets/m28/m28-ui-cleared-v1.png` | Campaign cleared level icon | `96x96` | transparent | Decorative icon paired with pass/cleared text. |

### Legacy Assets Retained As Fallback

The existing files under `public/assets/*.png` remain checked in for fallback and rollback. They should not be deleted in M2.8:

- `home-pond-background.png`
- `lily-left.png`
- `lily-right.png`
- `frog-p1-*.png`
- `frog-p2-*.png`
- `fly-wing-a.png`
- `fly-wing-b.png`
- `firefly-end.png`
- `splash-ring.png`
- `catch-pop.png`
- `tongue-flash.png`
- `pond-arena.png`
- `frog.png`
- `fly.png`
- `power.png`

Implementation may keep the old files out of the primary visible path, but they should remain available for fallback and for comparing before/after screenshots.

## Exact Minimal Audio Path Set

M2.8 should add only the files already listed by `LOCAL_AUDIO_ASSET_REGISTRY`:

| Runtime file | Role | Suggested duration | Format |
| --- | --- | --- | --- |
| `public/audio/sfx/jump.mp3` | Jump cue | `0.08s` to `0.20s` | MP3 |
| `public/audio/sfx/tongue.mp3` | Tongue cue | `0.05s` to `0.16s` | MP3 |
| `public/audio/sfx/catch.mp3` | Catch cue | `0.08s` to `0.25s` | MP3 |
| `public/audio/sfx/miss.mp3` | Miss cue | `0.08s` to `0.25s` | MP3 |
| `public/audio/sfx/splash.mp3` | Splash cue | `0.12s` to `0.35s` | MP3 |
| `public/audio/sfx/power.mp3` | Existing Rush/power cue | `0.12s` to `0.35s` | MP3 |
| `public/audio/sfx/start.mp3` | Start cue | `0.08s` to `0.25s` | MP3 |
| `public/audio/sfx/pause.mp3` | Pause cue | `0.05s` to `0.20s` | MP3 |
| `public/audio/sfx/results.mp3` | Results cue | `0.20s` to `0.70s` | MP3 |
| `public/audio/music/home-pond-loop.mp3` | Home Pond loop | `20s` to `45s` | MP3 |

Do not add local paths for `resume` or `the-end` in M2.8 unless a separate approved task expands the registry. The existing procedural SFX shapes for those events may remain.

Audio constraints:

- Target SFX total size under `500 KB`.
- Target music loop under `1.5 MB`.
- Files should be normalized conservatively to avoid harsh autoplay-unlock surprises.
- The music file should loop cleanly enough for a placeholder production pass, but final adaptive music is out of scope.
- If an MP3 fails to decode or fetch, procedural fallback must still play or no-op without blocking gameplay.

## Generation And Provenance Workflow

### Preferred Image Generation Path

Use the user's ChatGPT/OpenAI image generation access for development-time asset creation only:

1. Create a generation batch folder outside the app runtime, for example:

   ```text
   /home/resline/.codex/generated_images/m28-home-pond-art-pack-v1/<timestamp>/
   ```

2. Generate each image from explicit prompts that include:
   - "original spiritual successor, no Atari/Mattel branding"
   - "premium hand-painted 2D browser game art"
   - exact subject and orientation
   - exact transparency/solid background requirement
   - "no text, no logos, no watermark"
   - consistent Home Pond palette and lighting notes

3. Save raw exports in the generation workspace with names that map to the final asset names.

4. Record in `ASSET_MANIFEST.md`:
   - tool/product label shown by ChatGPT/OpenAI at generation time
   - generation date
   - prompt
   - negative prompt/constraints
   - raw file path or workspace path
   - selected output file
   - post-processing commands
   - final dimensions
   - alpha/opacity result
   - final file size
   - human visual QA notes

5. Commit only the final runtime PNGs and any small source files needed for repeatable processing. Large raw exports can remain in the generated-image workspace if the manifest references them clearly.

### Prompt Families

Use a shared style prefix to keep the pack cohesive:

```text
Premium hand-painted 2D game art for an original Frogs and Flies spiritual successor, warm storybook arcade style, clear silhouettes, readable at small size, saturated but natural pond palette, soft watercolor texture, crisp game-sprite edges, no text, no logos, no watermark, no Atari or Mattel references.
```

Subject prompts should be asset-specific:

- Background: side-on/elevated Home Pond arena with left and right lily staging, fly lanes, reeds, sky gradient, clear gameplay readability.
- Frogs: one frog per frame, side-view, exact facing direction, consistent P1/P2 accents, no shadow baked outside silhouette unless alpha edge stays clean.
- Fly frames: one common fly, matching body position, wing-up and wing-down variants.
- Firefly: one warm glowing firefly without baked "THE END" text.
- VFX: single isolated splash/catch/tongue highlight element.
- UI icons: isolated star/lock/cleared icon, clear at 24px to 48px display size, transparent background.
- Prologue panels: scenic Home Pond moments with no text and no UI baked into the image.

### Transparency And Post-Processing

Prefer direct transparent-background generation for sprites and icons. If that is unavailable or edge quality is poor, generate on a flat chroma key background and process with the existing imagegen chroma-key helper:

```bash
python "${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/scripts/remove_chroma_key.py" \
  --input public/assets/source/m28/raw/<source>.png \
  --out public/assets/m28/<final>.png \
  --auto-key border \
  --soft-matte \
  --transparent-threshold 12 \
  --opaque-threshold 220 \
  --despill \
  --edge-contract 1
```

Then trim or resize with ImageMagick only when it preserves the required canvas size and anchor assumptions. Frog and VFX assets should remain on their specified canvases rather than tight-trimmed if the renderer relies on stable centers.

### Fallback If Live Image Generation Is Unavailable

If live image generation is unavailable during implementation:

- Do not block M2.8 indefinitely.
- Use the existing M2.5 SVG renderer pattern to create local `public/assets/source/m28/*.svg` stand-ins that match the exact M2.8 file names and dimensions.
- Mark those files as "local authored fallback stand-ins" in `ASSET_MANIFEST.md`.
- Keep the same runtime paths, tests, dimensions, cache behavior, and screenshot gates.
- Add a follow-up note that art replacement can happen later without changing runtime contracts.

This fallback is acceptable for pipeline hardening, but the preferred M2.8 completion should use generated bitmap art if the generation workflow is available.

### Audio Creation Provenance

M2.8 audio files may be local authored, procedurally generated offline, or exported from an approved audio tool. The shipped app must only load static same-origin MP3 files.

For each audio file, `ASSET_MANIFEST.md` should record:

- source method/tool
- prompt or synthesis recipe if generated
- sample rate and channel count when known
- duration
- file size
- loop notes for `home-pond-loop.mp3`
- normalization or compression notes
- license/provenance statement

No OpenAI audio API call is required for M2.8. If any external generation is used, it must be a development-time process and must not leave API keys or generated scripts in the runtime bundle.

## Storage, Naming, And Manifest Requirements

### Runtime Storage

- Final image files: `public/assets/m28/*.png`
- Optional small source/intermediate files: `public/assets/source/m28/**`
- Final audio files: `public/audio/sfx/*.mp3` and `public/audio/music/home-pond-loop.mp3`
- No generated files under `dist/`.
- No runtime file should depend on an absolute local path.

### Naming

- Use lower-case kebab-case.
- Prefix M2.8 image assets with `m28-`.
- Suffix visible art pack files with `-v1`.
- Keep final runtime names stable once tests reference them.
- Do not reuse M2.5 file names for M2.8 final assets; keep versioned paths so fallback and rollback stay simple.

### Format

- Runtime images: PNG.
- Opaque scenic images: 8-bit RGBA or RGB PNG with no transparent pixels required.
- Sprite/icon/VFX images: PNG with alpha and at least one transparent pixel.
- Runtime audio: MP3.
- Do not introduce WebP/AVIF, Ogg, WAV, or spritesheets in M2.8 unless a failing browser compatibility issue makes MP3 impossible.

### Manifest

`ASSET_MANIFEST.md` must be updated with a new M2.8 section containing:

- A short status summary.
- The generated-image workspace path or fallback source path.
- A table for every final visual asset: output, source, prompt/provenance, dimensions, transparency, file size, post-processing.
- A table for every audio asset: output, provenance, duration, MIME expectation, file size, loop/fallback notes.
- Explicit note that app runtime makes no live OpenAI/ChatGPT calls.
- Explicit note whether assets are generated via ChatGPT/OpenAI image generation or local fallback stand-ins.
- Verification command references for dimensions/alpha/cache checks.

## Runtime Integration Boundaries

M2.8 may modify:

- `src/runtime/assets.ts` to define M2.8 asset paths, load the new pack, expose loaded path markers, and keep M2.5/M0 fallback.
- `src/render/**` only where the current texture mapping needs to consume the same logical asset fields from M2.8.
- `src/runtime/dom.ts` and `src/style.css` for prologue illustrations and campaign icon presentation.
- `src/runtime/pwa.ts` and `public/service-worker.js` for cache name/version and required asset URLs.
- `src/runtime/audio.ts` only if tests require explicit presence/fetch metadata for the already-registered paths. The registry keys and paths should not expand.
- `README.md`, `ASSET_MANIFEST.md`, and tests.

M2.8 should not modify:

- `src/game/**`
- campaign level definitions, objective thresholds, or SaveManager schema
- runtime smoke score semantics
- Docker/nginx behavior except documentation/smoke expectations, unless static MIME handling fails

Texture load behavior:

- Prefer loading all required M2.8 gameplay textures as a pack.
- If any required M2.8 texture fails, fall back to the existing M2.5/M0 asset mapping or procedural rendering.
- Set a visible marker such as `data-assets-loaded` to include M2.8 paths when the M2.8 pack loads.
- Do not block shell access if art loading fails.

DOM/prologue behavior:

- Prologue panels may show `<img>` or CSS background images for dawn/day/dusk.
- Prologue text remains real HTML text, not baked into images.
- Campaign level status must remain textual, with icons as decorative or properly labelled support.
- High contrast mode must preserve status text visibility even if icons are hidden.

Audio behavior:

- The existing explicit `Enable Audio` unlock remains required.
- Local MP3 fetch/decode failures must not throw or block gameplay.
- Procedural fallback remains available.
- No autoplaying music before unlock.
- Existing mute, master volume, SFX volume, music volume, and mono settings remain authoritative.

## PWA, Cache, And Offline

M2.8 should bump both cache names from `frogs-and-flies-m26-v2` to `frogs-and-flies-m28-v1` or a similarly explicit M2.8 cache name in:

- `src/runtime/pwa.ts`
- `public/service-worker.js`

Cache requirements:

- Required M2.8 gameplay image paths are included in `buildPwaCacheUrls()` and `APP_SHELL_CACHE_URLS`.
- Required prologue and UI icon paths are included in the static cache list.
- Audio paths are included when present, matching the existing optional-audio cache policy or a deliberately tightened policy if all M2.8 audio files are required.
- Runtime JS/CSS cache warming continues to cache same-origin build assets.
- Service worker fetch handling remains same-origin only.
- Offline campaign/prologue/results flow works after one online boot.
- `/service-worker.js` and `/manifest.webmanifest` remain served without immutable long-term caching.

The implementation plan should include a parity test that fails if:

- a required M2.8 asset exists in the manifest but not in the runtime/PWA lists,
- a runtime/PWA path points to a missing file,
- `src/runtime/pwa.ts` and `public/service-worker.js` disagree on cache name or required URLs,
- audio registry paths exist but are omitted from cache behavior unexpectedly.

## Accessibility

- Prologue images must not replace text. Every story beat remains available in semantic HTML text.
- Decorative art and icons should use empty alt text or `aria-hidden="true"` when paired with visible text.
- If an icon is the only visible status cue, it must have an accessible name or adjacent text.
- Focus order for Campaign, Prologue, Results, Settings, and High Scores must remain stable after images are added.
- Reduced motion must disable any image transition or parallax-like CSS effect.
- High contrast mode must keep buttons, level lock state, stars, pass/fail status, and prologue text readable if images are low contrast.
- Screenshot/no-overlap tests should cover campaign and prologue panels after images are visible.

## Performance

M2.8 is allowed to increase static asset weight, but the increase must be controlled.

Targets:

- Total new M2.8 image payload under `6 MB` uncompressed on disk when practical.
- Total new M2.8 audio payload under `2 MB` on disk when practical.
- Initial shell remains usable while Pixi asset loading completes or falls back.
- Campaign/prologue shell interactions remain under the existing coarse Playwright smoke threshold.
- No new long-running main-thread work for image processing at runtime. All processing happens before commit.

Verification should record:

- final file sizes in `ASSET_MANIFEST.md`,
- Vite build output size summary,
- Playwright console/pageerror absence in focused asset tests,
- no blank canvas / no missing icon bounding boxes.

If file sizes exceed the targets, implementation may still pass only if the worker records the reason, verifies performance, and consolidation accepts the tradeoff.

## Security And Privacy

- The app must not include `OPENAI_API_KEY`, ChatGPT credentials, generation prompts containing user secrets, or external service URLs in runtime code.
- Generation logs and raw workspace paths are provenance, not runtime dependencies.
- The service worker must continue to ignore cross-origin requests.
- No analytics, telemetry, account, cloud save, or external leaderboard work is introduced.
- Asset loading remains same-origin static file loading.
- `ASSET_MANIFEST.md` should avoid embedding private subscription identifiers or account details.

## Test And Verification Strategy

### Lightweight Design/Doc Verification

For the spec commit:

```bash
git diff --check
git status --short --branch
```

Run markdown sanity only if an existing project script or installed tool is available.

### Unit Tests For Implementation

Add or update focused tests to cover:

- M2.8 image path registry contains the exact required visual assets.
- Each required PNG exists, has expected dimensions, and matches alpha/opaque expectations using `pngjs`.
- `ASSET_MANIFEST.md` references every required M2.8 visual and audio output.
- `LOCAL_AUDIO_ASSET_REGISTRY` paths exist on disk after M2.8.
- Optional or required audio cache behavior matches the chosen policy.
- `PWA_CACHE_NAME` and service worker cache name both contain `m28`.
- Runtime/PWA/service-worker asset lists are in parity.
- Existing `pwaCache.test.ts` still rejects cross-origin cache URLs and warms same-origin runtime JS/CSS.
- No M2.8 campaign/art import enters `src/game/**`.

Suggested focused commands:

```bash
npm run test:unit -- tests/unit/pwaCache.test.ts
npm run test:unit -- tests/unit/audioManager.test.ts
npm run test:unit -- tests/unit/m28AssetPipeline.test.ts
```

### Playwright Tests For Implementation

Add `tests/e2e/m28-asset-pipeline.spec.ts` covering:

- `/assets/m28/m28-home-pond-background-v1.png` returns `200` with image MIME.
- A representative transparent sprite returns `200` with image MIME.
- `/audio/sfx/jump.mp3` and `/audio/music/home-pond-loop.mp3` return `200` with audio MIME.
- The game canvas reports loaded M2.8 asset paths through `data-assets-loaded`.
- Classic Single starts and shows nonblank Home Pond canvas pixels.
- Campaign level select shows visible star/lock/cleared icon bounding boxes without relying on icons as the only status cue.
- Prologue shows dawn/day/dusk images on the matching panels, with text still visible.
- Results after a campaign smoke round show star visuals and campaign result text.
- Offline reload after online boot reaches Campaign and Prologue with required visuals cached.
- Audio unlock/fallback still does not throw if a route intercept simulates one failed MP3.

Also keep focused regression:

```bash
npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium
npx playwright test tests/e2e/m26-pwa-offline.spec.ts --project=chromium
npx playwright test tests/e2e/m26-accessibility.spec.ts --project=chromium
npx playwright test tests/e2e/m26-performance.spec.ts --project=chromium
```

### Screenshot And No-Overlap QA

Implementation should capture or assert screenshots for at least:

- Main Menu
- Campaign level select fresh save
- Campaign level select with stars/unlocks after smoke progress
- Prologue dawn panel
- Prologue dusk/final panel
- Gameplay Classic Single at start
- Results after campaign smoke pass

Viewport coverage:

- Desktop `1366x768`
- Desktop or laptop `1440x900`
- Narrow responsive `390x844` if existing shell tests already cover it

The test should fail on obvious overlap, zero-size images, hidden required controls, or text clipped inside buttons/panels.

### Build, Docker, And Production Smoke

Final M2.8 implementation gates should include:

```bash
npm run test:unit
npm run build
npm run test:e2e
npm test
docker build -t frogs-and-flies-m28-art-pack .
docker run --rm --name frogs-and-flies-m28 -p 18080:80 frogs-and-flies-m28-art-pack
```

Docker smoke URLs should include:

```text
/
/manifest.webmanifest
/service-worker.js
/assets/m28/m28-home-pond-background-v1.png
/assets/m28/m28-frog-p1-idle-v1.png
/assets/m28/m28-fly-wing-a-v1.png
/assets/m28/m28-prologue-dawn-v1.png
/assets/m28/m28-ui-star-filled-v1.png
/audio/sfx/jump.mp3
/audio/music/home-pond-loop.mp3
```

Production smoke after Coolify deployment should include:

```bash
PLAYWRIGHT_BASE_URL=https://frog.resline.net npx playwright test tests/e2e/m27-campaign-flow.spec.ts --project=chromium
PLAYWRIGHT_BASE_URL=https://frog.resline.net npx playwright test tests/e2e/m28-asset-pipeline.spec.ts --project=chromium
```

Expected production checks:

- root returns `200`,
- manifest returns `200`,
- service worker returns JavaScript MIME,
- representative M2.8 image/audio assets return `200`,
- app reports `running:healthy` in Coolify,
- deployed commit equals pushed HEAD,
- no generated `dist/`, `test-results/`, or `playwright-report/` remains in git.

## Acceptance Criteria

1. The M2.8 visual asset set exists under `public/assets/m28/` with the exact required files and dimensions.
2. The minimal audio files exist under `public/audio/sfx/` and `public/audio/music/` for every path currently registered in `LOCAL_AUDIO_ASSET_REGISTRY`.
3. `ASSET_MANIFEST.md` documents every M2.8 visual and audio asset with prompt/provenance, dimensions/duration, alpha or opacity, post-processing, file size, and no-runtime-live-API notes.
4. Runtime loads M2.8 gameplay textures through `src/runtime/assets.ts` and preserves fallback to existing assets/procedural rendering if M2.8 loading fails.
5. Campaign, Prologue, and Results display M2.8 prologue and UI visuals while preserving semantic text and keyboard focus.
6. Classic Single, Local Versus, and Campaign flow still work with unchanged gameplay semantics.
7. Service worker and PWA cache names are bumped to M2.8 and include required same-origin visual/audio assets.
8. Offline shell verification reaches Campaign and Prologue with cached M2.8 visuals after one online boot.
9. Audio unlock remains gesture-driven, local MP3 failures fall back safely, and no gameplay path depends on successful audio decode.
10. Unit tests cover manifest/filesystem/cache parity, PNG dimensions/alpha, audio registry paths, and PWA cache name/list parity.
11. Playwright covers MIME/URL checks, visual visibility, screenshot/no-overlap, offline availability, and focused M2.7 campaign regression.
12. `npm run test:unit`, `npm run build`, focused E2E, Docker smoke, and production smoke pass before the milestone is called complete.
13. No new biome, boss, level, insect/hazard roster, save schema, backend, monetization, localization, Spine/TexturePacker, Howler, or live runtime API dependency is introduced.

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Generated art style is inconsistent across frogs, flies, icons, and prologue images. | Use a shared style prefix, generate in small batches, visually inspect, and reject mismatched outputs before processing. |
| Alpha halos or chroma-key artifacts make sprites look unprofessional. | Prefer transparent generation; otherwise use chroma-key removal with despill, alpha tests, and screenshot QA over sky/water. |
| Runtime paths become duplicated between assets, PWA, service worker, manifest, and tests. | Add parity tests and keep one exported runtime asset list as the source for TypeScript-side cache logic. |
| PWA serves stale M2.7 assets after deployment. | Bump cache name to M2.8 and verify offline reload after online boot. |
| New images/audio bloat the static bundle. | Record file sizes, keep dimensions fixed, compress PNG/MP3, and cap M2.8 to Home Pond only. |
| Audio work expands into final music/SFX production. | Fulfill only existing registry paths and keep procedural fallback. |
| Prologue art reduces accessibility by carrying narrative meaning only visually. | Keep all narrative content in HTML text; mark images decorative or provide concise labels. |
| Image generation is unavailable or subscription workflow cannot export assets in time. | Use local M2.8 SVG/bitmap stand-ins with the same contracts and mark them as fallback provenance. |
| Asset integration accidentally changes gameplay feel. | Do not touch `src/game/**`; verify M2.7 campaign and M2.6 classic/input/audio regression gates. |

## Rollback And Mitigation Plan

- Keep existing M2.5/M0 assets checked in as fallback.
- Use versioned M2.8 paths under `public/assets/m28/` so a rollback can switch `src/runtime/assets.ts` back to old paths without deleting generated files.
- If an individual M2.8 asset fails visual QA, fallback that logical asset to its M2.5 equivalent while keeping the rest of the pack.
- If audio files fail MIME/decode checks, keep the files out of the required cache list and rely on procedural fallback until corrected.
- If PWA cache update causes offline regression, revert the cache list/name change and redeploy with M2.7 cache behavior while keeping non-PWA local asset loading.
- If production smoke fails after deploy, redeploy the last known good M2.7 commit `14f050fca471e25c3ae9892e3821f0e523fa9ca9` or the previous Coolify deployment, then fix M2.8 offline/cache issues locally.

## Implementation Planning Notes

The M2.8 implementation plan should decompose work into small gated tasks:

1. Baseline audit and dirty guard.
2. Asset contract tests and exact registry/path definitions.
3. Generation/provenance batch and image processing.
4. PNG dimension/alpha validation and manifest update.
5. Runtime visual integration with fallback.
6. Campaign/prologue/results DOM visual polish.
7. Minimal audio file fulfillment and audio tests.
8. PWA/cache/offline parity.
9. E2E screenshot/no-overlap/MIME tests.
10. README/docs update.
11. Final unit/build/full E2E/Docker/Coolify production smoke and scope audit.

Each implementation task should be committed separately and consolidated before the next task when using `eliteteams`.
