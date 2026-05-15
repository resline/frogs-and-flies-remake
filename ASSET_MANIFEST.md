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
