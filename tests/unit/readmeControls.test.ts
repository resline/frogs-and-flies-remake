import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8')

describe('README M2 controls and smoke docs', () => {
  it('documents controls, modes, smoke params, and verification commands', () => {
    for (const text of [
      'Current M2',
      'Default 180 second round',
      'Classic Single',
      'Local Versus',
      'P1',
      'P2',
      '`cpu-opponent`',
      'AI takeover',
      'idle human players',
      'Enter',
      'P',
      'Replay',
      'A/D or arrows',
      'Space',
      'KeyT',
      'J/L',
      'I',
      'O',
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
    ]) {
      expect(readme).toContain(text)
    }
  })

  it('does not document stale M0 or 60-second default wording', () => {
    for (const staleText of [
      'M0 is a PixiJS',
      'Current M0',
      'deterministic 60 second single-player slice',
      'Default 60 second round',
      'AI takeover controls the second frog in Classic Single',
      'current verified M0',
    ]) {
      expect(readme).not.toContain(staleText)
    }
  })
})
