# Asset Manifest

This manifest tracks the current generated and locally authored bitmap asset inventory for M0, M2.5, and M2.8.

Status in the current verified M0:

- `public/favicon.png` is referenced by `index.html`.
- `public/assets/pond-arena.png`, `frog.png`, `fly.png`, and `power.png` are loaded into gameplay through Pixi `Assets`.
- The game scene renders those generated sprites with procedural fallback paths and PixiJS v8 `Graphics` overlays.
- Playwright E2E smoke coverage asserts that the generated gameplay assets loaded into the PixiJS runtime.

Generated image workspace:

`/home/resline/.codex/generated_images/019e277c-caf7-79c0-8756-489991910257`

## Available Files

- `public/assets/pond-arena.png` - generated 16:9 pond arena background loaded by gameplay.
- `public/assets/frog.png` - generated frog sprite with transparent background loaded by gameplay.
- `public/assets/fly.png` - generated fly sprite with transparent background loaded by gameplay.
- `public/assets/power.png` - generated Rush power-up sprite with transparent background loaded by gameplay.
- `public/favicon.png` - favicon derived from the generated frog sprite.

Preserved chroma-key source files:

- `public/assets/raw/frog-source.png`
- `public/assets/raw/fly-source.png`
- `public/assets/raw/power-source.png`

## Prompts

### Background

Modern premium remake background for a Frogs and Flies arcade game: tranquil pond arena viewed from a slightly elevated side-on perspective, water surface across the full frame, reed clusters at the far sides, soft lily pad staging areas at left and right, subtle depth and parallax-ready layers. Polished 2D painterly game art, 16:9 landscape, no text, no characters, no watermark.

### Frog

A premium modern arcade frog character for a Frogs and Flies remake, designed as a readable side-view sprite. One heroic bright green frog crouched on hind legs, facing right, big expressive eyes, athletic compact body, mouth closed, ready to leap. Polished 2D hand-painted game sprite on a perfectly flat solid `#ff00ff` chroma-key background, no shadows, no text, no logos, no watermark.

### Fly

A polished arcade fly sprite for a Frogs and Flies remake. One oversized cartoon housefly, readable side/top three-quarter view, translucent wings, compact dark body, bright tiny highlights, agile flying pose. Polished 2D hand-painted game sprite on a perfectly flat solid `#00ff00` chroma-key background, no text, no logos, no watermark.

### Power-up

A premium glowing superpower pickup for a Frogs and Flies remake. One small floating golden firefly orb with a lightning-shaped core and subtle wing-like spark accents, designed as a collectible power-up icon. Polished 2D game sprite on a perfectly flat solid `#00ff00` chroma-key background, no text, no logos, no watermark.

## Post-processing

Transparent sprites were processed with:

```bash
python "${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/scripts/remove_chroma_key.py" \
  --input public/assets/raw/<source>.png \
  --out public/assets/<asset>.png \
  --auto-key border \
  --soft-matte \
  --transparent-threshold 12 \
  --opaque-threshold 220 \
  --despill \
  --edge-contract 1
```

Then the files were trimmed with `convert -trim +repage`.

## M2.5 Home Pond Vertical Slice Assets

No live OpenAI API calls were made during M2.5 implementation.

All M2.5 files below are hand-authored local SVG stand-ins rendered to PNG with:

```bash
mkdir -p public/assets/source/m25 test-results/m25-assets
node scripts/build-m25-assets.mjs
node scripts/build-m25-assets.mjs --check
```

The local renderer uses Playwright Chromium against `file://` SVG sources, aborts HTTP/HTTPS requests, and writes transparent PNG screenshots for sprite assets.

| Output | Source | Prompt/provenance | Dimensions | Transparency | File size |
| --- | --- | --- | --- | --- | --- |
| `public/assets/home-pond-background.png` | `public/assets/source/m25/home-pond-background.svg` | Local SVG Home Pond background with water, reeds, and readable play area. | `1600x1200` | opaque | 427,734 bytes |
| `public/assets/lily-left.png` | `public/assets/source/m25/lily-left.svg` | Local SVG left staging lily, oriented toward center. | `256x192` | transparent | 19,829 bytes |
| `public/assets/lily-right.png` | `public/assets/source/m25/lily-right.svg` | Local SVG right staging lily, oriented toward center. | `256x192` | transparent | 20,297 bytes |
| `public/assets/frog-p1-idle.png` | `public/assets/source/m25/frog-p1-idle.svg` | Local SVG P1 idle frog, facing right, blue-green accents. | `256x256` | transparent | 9,117 bytes |
| `public/assets/frog-p1-crouch.png` | `public/assets/source/m25/frog-p1-crouch.svg` | Local SVG P1 compressed jump-charge frog, facing right. | `256x256` | transparent | 8,698 bytes |
| `public/assets/frog-p1-airborne.png` | `public/assets/source/m25/frog-p1-airborne.svg` | Local SVG P1 airborne frog, facing right. | `256x256` | transparent | 9,115 bytes |
| `public/assets/frog-p1-tongue.png` | `public/assets/source/m25/frog-p1-tongue.svg` | Local SVG P1 tongue pose, facing right, with partial tongue cue. | `256x256` | transparent | 9,039 bytes |
| `public/assets/frog-p1-splash.png` | `public/assets/source/m25/frog-p1-splash.svg` | Local SVG P1 splash/recovery silhouette, facing right. | `256x256` | transparent | 9,623 bytes |
| `public/assets/frog-p2-idle.png` | `public/assets/source/m25/frog-p2-idle.svg` | Local SVG P2 idle frog, facing left, amber-green accents. | `256x256` | transparent | 9,107 bytes |
| `public/assets/frog-p2-crouch.png` | `public/assets/source/m25/frog-p2-crouch.svg` | Local SVG P2 compressed jump-charge frog, facing left. | `256x256` | transparent | 8,718 bytes |
| `public/assets/frog-p2-airborne.png` | `public/assets/source/m25/frog-p2-airborne.svg` | Local SVG P2 airborne frog, facing left. | `256x256` | transparent | 9,086 bytes |
| `public/assets/frog-p2-tongue.png` | `public/assets/source/m25/frog-p2-tongue.svg` | Local SVG P2 tongue pose, facing left, with partial tongue cue. | `256x256` | transparent | 8,914 bytes |
| `public/assets/frog-p2-splash.png` | `public/assets/source/m25/frog-p2-splash.svg` | Local SVG P2 splash/recovery silhouette, facing left. | `256x256` | transparent | 9,602 bytes |
| `public/assets/fly-wing-a.png` | `public/assets/source/m25/fly-wing-a.svg` | Local SVG readable fly with wings up. | `96x96` | transparent | 2,932 bytes |
| `public/assets/fly-wing-b.png` | `public/assets/source/m25/fly-wing-b.svg` | Local SVG matching fly with wings down. | `96x96` | transparent | 2,531 bytes |
| `public/assets/firefly-end.png` | `public/assets/source/m25/firefly-end.svg` | Local SVG warm THE END firefly glow sprite. | `128x128` | transparent | 19,754 bytes |
| `public/assets/splash-ring.png` | `public/assets/source/m25/splash-ring.svg` | Local SVG expanding water ring effect. | `192x192` | transparent | 7,185 bytes |
| `public/assets/catch-pop.png` | `public/assets/source/m25/catch-pop.svg` | Local SVG small catch burst/pop effect. | `128x128` | transparent | 2,965 bytes |
| `public/assets/tongue-flash.png` | `public/assets/source/m25/tongue-flash.svg` | Local SVG short tongue highlight/flash effect. | `128x64` | transparent | 1,897 bytes |

## M2.8 Home Pond Visual Pack v1

Status: complete fallback-authored visual pack for the M2.8 Task 3 asset contract. The exact runtime outputs are under `public/assets/m28/`; editable local sources are under `public/assets/source/m28/`.

Generation path: local authored fallback stand-in. The OpenAI Image API CLI path was unavailable in this worker environment because `OPENAI_API_KEY` was not set, so no live image API call was made for M2.8 Task 3.

Tool/model label: local SVG fallback rendered with `node scripts/build-m28-assets.mjs` through Playwright Chromium screenshots. No model-generated raw image was used for these M2.8 visual outputs.

No-runtime-live-API note: the shipped app uses only local static PNG files and does not call OpenAI, ChatGPT, or any external image service at runtime.

Shared prompt/style provenance used while authoring the fallback sources:

```text
Premium hand-painted 2D game art for an original Frogs and Flies spiritual successor, warm storybook arcade style, clear silhouettes, readable at small size, saturated but natural pond palette, soft watercolor texture, crisp game-sprite edges, no text, no logos, no watermark, no Atari or Mattel references.
```

Post-processing: no chroma-key cleanup was required. Transparent files were rendered from transparent SVG canvases with `omitBackground: true`; opaque files were rendered from filled SVG canvases with `omitBackground: false`. QA is enforced by `node scripts/check-m28-assets.mjs --images`, which verifies dimensions, alpha policy, and manifest provenance.

| Output | Source/raw workspace | Prompt/provenance | Dimensions | Transparency | Post-processing | File size | QA notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `public/assets/m28/m28-home-pond-background-v1.png` | `public/assets/source/m28/m28-home-pond-background-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `1600x1200` | opaque | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 1,631,333 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-lily-left-v1.png` | `public/assets/source/m28/m28-lily-left-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `256x192` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 74,844 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-lily-right-v1.png` | `public/assets/source/m28/m28-lily-right-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `256x192` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 74,164 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-frog-p1-idle-v1.png` | `public/assets/source/m28/m28-frog-p1-idle-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `256x256` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 79,322 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-frog-p1-crouch-v1.png` | `public/assets/source/m28/m28-frog-p1-crouch-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `256x256` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 77,797 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-frog-p1-airborne-v1.png` | `public/assets/source/m28/m28-frog-p1-airborne-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `256x256` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 75,178 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-frog-p1-tongue-v1.png` | `public/assets/source/m28/m28-frog-p1-tongue-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `256x256` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 79,809 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-frog-p1-splash-v1.png` | `public/assets/source/m28/m28-frog-p1-splash-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `256x256` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 79,874 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-frog-p2-idle-v1.png` | `public/assets/source/m28/m28-frog-p2-idle-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `256x256` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 79,592 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-frog-p2-crouch-v1.png` | `public/assets/source/m28/m28-frog-p2-crouch-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `256x256` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 77,848 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-frog-p2-airborne-v1.png` | `public/assets/source/m28/m28-frog-p2-airborne-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `256x256` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 75,274 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-frog-p2-tongue-v1.png` | `public/assets/source/m28/m28-frog-p2-tongue-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `256x256` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 80,475 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-frog-p2-splash-v1.png` | `public/assets/source/m28/m28-frog-p2-splash-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `256x256` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 79,964 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-fly-wing-a-v1.png` | `public/assets/source/m28/m28-fly-wing-a-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `96x96` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 15,438 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-fly-wing-b-v1.png` | `public/assets/source/m28/m28-fly-wing-b-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `96x96` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 16,283 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-firefly-end-v1.png` | `public/assets/source/m28/m28-firefly-end-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `128x128` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 28,178 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-splash-ring-v1.png` | `public/assets/source/m28/m28-splash-ring-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `192x192` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 36,399 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-catch-pop-v1.png` | `public/assets/source/m28/m28-catch-pop-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `128x128` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 28,376 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-tongue-flash-v1.png` | `public/assets/source/m28/m28-tongue-flash-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `128x64` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 12,421 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-rush-power-v1.png` | `public/assets/source/m28/m28-rush-power-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `128x128` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 28,617 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-prologue-dawn-v1.png` | `public/assets/source/m28/m28-prologue-dawn-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `1280x720` | opaque | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 682,158 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-prologue-day-v1.png` | `public/assets/source/m28/m28-prologue-day-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `1280x720` | opaque | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 708,527 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-prologue-dusk-v1.png` | `public/assets/source/m28/m28-prologue-dusk-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `1280x720` | opaque | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 773,921 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-ui-star-filled-v1.png` | `public/assets/source/m28/m28-ui-star-filled-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `96x96` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 16,217 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-ui-star-empty-v1.png` | `public/assets/source/m28/m28-ui-star-empty-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `96x96` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 16,757 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-ui-lock-v1.png` | `public/assets/source/m28/m28-ui-lock-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `96x96` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 14,287 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |
| `public/assets/m28/m28-ui-cleared-v1.png` | `public/assets/source/m28/m28-ui-cleared-v1.svg` | Local authored fallback stand-in using the M2.8 shared style prefix. | `96x96` | transparent | Rendered from SVG with Playwright Chromium; no chroma-key cleanup. | 15,212 bytes | Validator covers dimensions, alpha policy, and manifest provenance. |

## M2.8 Minimal Local Audio Fulfillment

Status: complete minimal local MP3 fulfillment for the existing `LOCAL_AUDIO_ASSET_REGISTRY` paths only. This is not a final audio production pass; it does not add Howler, audio sprites, adaptive music, new registry keys, `resume`, or `the-end` files.

Generation path: local deterministic `ffmpeg` synthesis from `lavfi` sine sources using the exact Task 4 frequency, duration, fade, and volume settings. No live OpenAI, ChatGPT, external audio API, sampled source, or third-party music library was used.

MIME expectation: `audio/mpeg` or another MP3-compatible server MIME. Runtime fallback behavior remains unchanged: if a local file fails to load or decode, the existing procedural Web Audio fallback continues without blocking gameplay.

Normalization/compression notes: short mono MP3 SFX are low-volume sine cues with fade-outs to avoid clicks. The Home Pond loop is a quiet two-tone mono bed with 1s fade-in and 1s fade-out. QA is enforced by `node scripts/check-m28-assets.mjs --audio`, which verifies required paths, file size, MP3 signature, manifest provenance, and optional `ffprobe` duration.

| Output | Source method | Duration | MIME expectation | File size | Normalization/compression | Fallback notes |
| --- | --- | --- | --- | --- | --- | --- |
| `public/audio/sfx/jump.mp3` | `ffmpeg` sine 420 Hz, 0.14s, fade out, volume 0.22. | 0.182857s | `audio/mpeg` | 1,689 bytes | Mono MP3, low-volume cue. | Procedural `jump` SFX remains available if the file fails. |
| `public/audio/sfx/tongue.mp3` | `ffmpeg` sine 620 Hz, 0.10s, fade out, volume 0.18. | 0.130612s | `audio/mpeg` | 1,271 bytes | Mono MP3, low-volume cue. | Procedural `tongue` SFX remains available if the file fails. |
| `public/audio/sfx/catch.mp3` | `ffmpeg` sine 860 Hz, 0.18s, fade out, volume 0.20. | 0.208980s | `audio/mpeg` | 1,898 bytes | Mono MP3, low-volume cue. | Procedural `catch` SFX remains available if the file fails. |
| `public/audio/sfx/miss.mp3` | `ffmpeg` sine 170 Hz, 0.18s, fade out, volume 0.18. | 0.208980s | `audio/mpeg` | 1,898 bytes | Mono MP3, low-volume cue. | Procedural `miss` SFX remains available if the file fails. |
| `public/audio/sfx/splash.mp3` | `ffmpeg` sine 120 Hz, 0.24s, fade out, volume 0.20. | 0.287347s | `audio/mpeg` | 2,525 bytes | Mono MP3, low-volume cue. | Procedural `splash` SFX remains available if the file fails. |
| `public/audio/sfx/power.mp3` | `ffmpeg` sine 980 Hz, 0.24s, fade out, volume 0.18. | 0.287347s | `audio/mpeg` | 2,525 bytes | Mono MP3, low-volume cue. | Procedural `power` SFX remains available if the file fails. |
| `public/audio/sfx/start.mp3` | `ffmpeg` sine 520 Hz, 0.16s, fade out, volume 0.18. | 0.208980s | `audio/mpeg` | 1,898 bytes | Mono MP3, low-volume cue. | Procedural `start` SFX remains available if the file fails. |
| `public/audio/sfx/pause.mp3` | `ffmpeg` sine 260 Hz, 0.12s, fade out, volume 0.16. | 0.156735s | `audio/mpeg` | 1,480 bytes | Mono MP3, low-volume cue. | Procedural `pause` SFX remains available if the file fails. |
| `public/audio/sfx/results.mp3` | `ffmpeg` sine 700 Hz, 0.45s, fade out, volume 0.18. | 0.496327s | `audio/mpeg` | 4,197 bytes | Mono MP3, low-volume cue. | Procedural `results` SFX remains available if the file fails. |
| `public/audio/music/home-pond-loop.mp3` | `ffmpeg` mixed sine 196 Hz + 294 Hz, 24s, 1s fade in/out, volume 0.12. | 24.032653s | `audio/mpeg` | 192,488 bytes | Mono MP3, quiet ambient loop placeholder. | Procedural/no-music fallback remains safe if the file fails. |

## M2.8 Verification Commands

Run these checks after changing any M2.8 asset, audio, manifest, runtime path, or PWA cache entry:

```bash
node scripts/check-m28-assets.mjs --images
node scripts/check-m28-assets.mjs --audio
node scripts/check-m28-assets.mjs --parity
```
