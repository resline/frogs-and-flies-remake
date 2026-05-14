# Frogs & Flies Remake

Nowoczesny przeglądarkowy remake klasycznej gry `Frogs and Flies`: dwie żaby na liliach, szybkie muchy, języki z celowaniem, runda na czas, power-up `Rush`, tryb Player vs Player oraz Player vs CPU.

## Tryby i opcje

- `Player vs CPU`: prawa żaba jest sterowana przez komputer.
- `Player vs Player`: obie żaby są sterowane lokalnie z klawiatury.
- Poziomy CPU: `Rookie`, `Pro`, `Elite`.
- Długość rundy: `60`, `90` albo `120` sekund.
- Opcje dźwięku i podpowiedzi celowania są dostępne z menu gry.
- Samouczek jest dostępny z menu gry i opisuje sterowanie oraz zasady.

## Sterowanie

- Lewa żaba: `A` / `D` celowanie po pięciu liniach, `W` albo `Space` język.
- Prawa żaba w PvP: `←` / `→` celowanie po pięciu liniach, `↑` albo `Enter` język.
- `Space`: start / restart.
- `P`: pauza.
- `Esc`: powrót z opcji/samouczka albo pauza podczas gry.

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
