import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8')

describe('README M2.8 asset pipeline docs', () => {
  it('documents the current M2.8 asset/audio milestone, campaign flow, controls, and verification gates', () => {
    for (const text of [
      'Current M2.8',
      'Generated Home Pond Art Pack v1',
      'public/assets/m28/',
      'prologue dawn/day/dusk',
      'campaign star/lock/cleared icons',
      '`public/audio/sfx/*.mp3`',
      '`public/audio/music/home-pond-loop.mp3`',
      'PWA cache `m28`',
      'offline asset/audio availability',
      'no runtime OpenAI, ChatGPT, or API dependency',
      'Home Pond Campaign Prologue',
      'M2.5 Home Pond Classic vertical slice',
      'not the finished full product',
      'Splash',
      'Main menu',
      'Mode select',
      'Campaign',
      'Home Pond',
      'Dawn At Home Pond',
      '1-1 First Hunt',
      '1-2 Quick Tongue',
      '1-3 Nightfall Feast',
      'Settings',
      'High Scores',
      'Gameplay',
      'Pause',
      'Results',
      'Default 180 second round',
      'Classic Single',
      'Local Versus',
      'P1',
      'P2',
      '`cpu-opponent`',
      '`A/D` or arrow keys',
      'Enter',
      'P',
      'Escape',
      'Replay',
      'Replay Level',
      'Next Level',
      'Space',
      'KeyT',
      'J/L',
      'I',
      'O',
      'Touch zones',
      'Gamepad foundation',
      'Remapping',
      'Reset Defaults',
      'mode',
      'seed',
      'smokeElapsedSeconds',
      'smokeState',
      'durationSeconds',
      'theEndSeconds',
      'simulationSpeed',
      'campaignSmokeScore',
      'campaignSmokeCatches',
      'npm run build',
      'npm run test:unit',
      'npm run test:e2e',
      'npm test',
      'node scripts/check-m28-assets.mjs --images',
      'node scripts/check-m28-assets.mjs --audio',
      'node scripts/check-m28-assets.mjs --parity',
      'npx playwright test tests/e2e/m28-asset-pipeline.spec.ts --project=chromium',
      'PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176',
      'PLAYWRIGHT_BASE_URL=https://frog.resline.net',
    ]) {
      expect(readme).toContain(text)
    }
  })

  it('documents campaign saves, migration, local audio, PWA, Docker, and non-network scope', () => {
    for (const text of [
      '`frogs-and-flies.save.v2`',
      '`frogs-and-flies.save.v1`',
      'migration',
      'unlocks',
      'stars',
      'settings',
      'input profiles',
      'high scores',
      'local stats',
      '`exportJson`',
      '`importJson`',
      'no backend',
      'account',
      'cloud save',
      'analytics',
      'online leaderboard',
      'offline',
      'Web Audio v1',
      'masterVolume',
      'sfxVolume',
      'musicVolume',
      'monoAudio',
      'Enable Audio',
      'missing audio fallback',
      '/audio/sfx/jump.mp3',
      'public/audio/sfx/jump.mp3',
      'public/audio/music/home-pond-loop.mp3',
      'audio unlock/fallback behavior',
      'No live OpenAI, ChatGPT, image API, or audio API calls',
      '/manifest.webmanifest',
      '/service-worker.js',
      'offline shell',
      'frogs-and-flies-m28-v1',
      'm28-v1',
      'data-assets-pack',
      'container port `80`',
      '`18080:80`',
      '/assets/m28/m28-home-pond-background-v1.png',
      '/assets/m28/m28-ui-star-filled-v1.png',
      '/audio/music/home-pond-loop.mp3',
      '/assets/home-pond-background.png',
      '/assets/frog-p1-idle.png',
      '/assets/fly-wing-a.png',
    ]) {
      expect(readme).toContain(text)
    }
  })

  it('does not document stale milestone or out-of-scope product claims', () => {
    for (const staleText of [
      'M0 is a PixiJS',
      'Current M0',
      'M2 is a PixiJS',
      '## Current M2\n',
      'Current M2.6',
      '## Current M2.7\n',
      'player-facing modes are exactly `Classic Single` and `Local Versus`',
      'Save key: `frogs-and-flies.save.v1`',
      'campaign remains out of scope',
      'campaign, extra biomes',
      'deterministic 60 second single-player slice',
      'Default 60 second round',
      'AI takeover controls the second frog in Classic Single',
      'current verified M0',
      'M2.8 adds new levels',
      'M2.8 adds a new biome',
      'M2.8 adds bosses',
      'M2.8 adds a backend',
      'M2.8 adds localization',
      'M2.8 adds monetization',
    ]) {
      expect(readme).not.toContain(staleText)
    }
  })

  it('documents M2.8 non-goals without overpromising gameplay or platform scope', () => {
    for (const text of [
      'No new gameplay rules, levels, biomes, bosses, insect roster, hazards, or power-ups.',
      'No save schema bump beyond the existing SaveManager v2 campaign progress.',
      'No backend, account, cloud save, analytics, telemetry, online leaderboard, live API, localization, or monetization.',
      'No Howler, Spine, TexturePacker, final audio sprite, or full authored audio production pipeline.',
    ]) {
      expect(readme).toContain(text)
    }
  })
})
