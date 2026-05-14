# Asset Manifest

Assety zostały wygenerowane w trybie wbudowanego narzędzia `image_gen` i zapisane pod:

`/home/resline/.codex/generated_images/019e277c-caf7-79c0-8756-489991910257`

Pliki używane przez grę:

- `public/assets/pond-arena.png` - tło stawu 16:9.
- `public/assets/frog.png` - sprite żaby z wyciętym tłem.
- `public/assets/fly.png` - sprite muchy z wyciętym tłem.
- `public/assets/power.png` - sprite power-upu z wyciętym tłem.
- `public/favicon.png` - favicon wyprowadzony z finalnego sprite'a żaby.

Zachowane źródła chroma-key:

- `public/assets/raw/frog-source.png`
- `public/assets/raw/fly-source.png`
- `public/assets/raw/power-source.png`

## Prompty

### Tło

Modern premium remake background for a Frogs and Flies arcade game: tranquil pond arena viewed from a slightly elevated side-on perspective, water surface across the full frame, reed clusters at the far sides, soft lily pad staging areas at left and right, subtle depth and parallax-ready layers. Polished 2D painterly game art, 16:9 landscape, no text, no characters, no watermark.

### Żaba

A premium modern arcade frog character for a Frogs and Flies remake, designed as a readable side-view sprite. One heroic bright green frog crouched on hind legs, facing right, big expressive eyes, athletic compact body, mouth closed, ready to leap. Polished 2D hand-painted game sprite on a perfectly flat solid `#ff00ff` chroma-key background, no shadows, no text, no logos, no watermark.

### Mucha

A polished arcade fly sprite for a Frogs and Flies remake. One oversized cartoon housefly, readable side/top three-quarter view, translucent wings, compact dark body, bright tiny highlights, agile flying pose. Polished 2D hand-painted game sprite on a perfectly flat solid `#00ff00` chroma-key background, no text, no logos, no watermark.

### Power-up

A premium glowing superpower pickup for a Frogs and Flies remake. One small floating golden firefly orb with a lightning-shaped core and subtle wing-like spark accents, designed as a collectible power-up icon. Polished 2D game sprite on a perfectly flat solid `#00ff00` chroma-key background, no text, no logos, no watermark.

## Post-processing

Sprite'y przezroczyste zostały przetworzone helperem:

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

Następnie pliki zostały przycięte przez `convert -trim +repage`.
