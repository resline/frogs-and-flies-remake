import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8')

describe('README M2.7 campaign prologue docs', () => {
  it('documents the M2.7 campaign prologue, shell flow, controls, and verification gates', () => {
    for (const text of [
      'Current M2.7',
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
      'PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176',
      'PLAYWRIGHT_BASE_URL=https://frog.resline.net',
    ]) {
      expect(readme).toContain(text)
    }
  })

  it('documents campaign saves, migration, audio, PWA, Docker, and non-network scope', () => {
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
      'No live OpenAI audio API calls',
      '/manifest.webmanifest',
      '/service-worker.js',
      'offline shell',
      'container port `80`',
      '`18080:80`',
      '/assets/home-pond-background.png',
      '/assets/frog-p1-idle.png',
      '/assets/fly-wing-a.png',
    ]) {
      expect(readme).toContain(text)
    }
  })

  it('does not document stale M0, M2, M2.6, or campaign-out-of-scope wording', () => {
    for (const staleText of [
      'M0 is a PixiJS',
      'Current M0',
      'M2 is a PixiJS',
      '## Current M2\n',
      'Current M2.6',
      'player-facing modes are exactly `Classic Single` and `Local Versus`',
      'Save key: `frogs-and-flies.save.v1`',
      'campaign remains out of scope',
      'campaign, extra biomes',
      'deterministic 60 second single-player slice',
      'Default 60 second round',
      'AI takeover controls the second frog in Classic Single',
      'current verified M0',
    ]) {
      expect(readme).not.toContain(staleText)
    }
  })
})
