import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8')

describe('README M2 controls and smoke docs', () => {
  it('documents controls, modes, smoke params, and verification commands', () => {
    for (const text of [
      'Classic Single',
      'Local Versus',
      'P1',
      'P2',
      'AI takeover',
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
})
