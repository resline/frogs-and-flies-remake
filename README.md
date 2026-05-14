# Frogs & Flies Remake

Nowoczesny przeglądarkowy remake klasycznej gry `Frogs and Flies`: dwie żaby na liliach, szybkie muchy, języki z celowaniem, runda na czas i power-up `Rush`.

## Sterowanie

- Lewa żaba: `A` / `D` celowanie, `W` język.
- Prawa żaba: `←` / `→` celowanie, `↑` język.
- `Space`: start / restart.
- `P`: pauza.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Docker

```bash
docker build -t frogs-and-flies-remake .
docker run --rm -p 8080:80 frogs-and-flies-remake
```

## Assety

Grafiki gry są bitmapami wygenerowanymi przez wbudowany workflow `image_gen`, zapisanymi i przetworzonymi lokalnie do `public/assets`. Szczegóły źródeł, promptów i plików wynikowych są w [ASSET_MANIFEST.md](ASSET_MANIFEST.md).
