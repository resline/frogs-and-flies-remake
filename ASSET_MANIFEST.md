# Asset Manifest

This manifest tracks the current generated bitmap asset inventory for M0.

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
