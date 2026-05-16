import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8')

describe('README M2.6 product foundation docs', () => {
  it('documents the M2.6 milestone, shell flow, controls, and verification gates', () => {
    for (const text of [
      'Current M2.6',
      'local product foundation',
      'M2.5 Home Pond Classic vertical slice',
      'not the finished full product',
      'Splash',
      'Main menu',
      'Mode select',
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
      'npm run build',
      'npm run test:unit',
      'npm run test:e2e',
      'npm test',
      'PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176',
    ]) {
      expect(readme).toContain(text)
    }
  })

  it('documents local save, audio, PWA, Docker, and non-network scope', () => {
    for (const text of [
      '`frogs-and-flies.save.v1`',
      'settings',
      'input profiles',
      'high scores',
      'local stats',
      '`exportJson`',
      '`importJson`',
      'No backend',
      'account',
      'cloud save',
      'analytics',
      'online leaderboard',
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

  it('does not document stale M0, M2, or 60-second default wording', () => {
    for (const staleText of [
      'M0 is a PixiJS',
      'Current M0',
      'M2 is a PixiJS',
      '## Current M2\n',
      'deterministic 60 second single-player slice',
      'Default 60 second round',
      'AI takeover controls the second frog in Classic Single',
      'current verified M0',
    ]) {
      expect(readme).not.toContain(staleText)
    }
  })
})
