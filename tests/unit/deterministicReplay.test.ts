import { describe, expect, it } from 'vitest'
import { runDeterministicReplay, type ReplayCommandScript } from '../../src/game/replay'

describe('deterministic replay', () => {
  it('replays the same seeded command script with identical scoring and time transitions', () => {
    const script: ReplayCommandScript = [
      { step: 0, commands: { start: true } },
      { step: 12, players: { p1: { tongue: true, humanInput: true } } },
      { step: 36, players: { p1: { moveRight: true, humanInput: true } } },
      { step: 72, players: { p1: { chargeJump: true, humanInput: true } } },
      { step: 84, players: { p1: { releaseJump: true, humanInput: true } } },
      { step: 120, players: { p2: { tongue: true } } },
      { step: 180, players: { p1: { tongue: true, humanInput: true } } },
    ]

    const replayOptions = {
      seed: 90210,
      mode: 'classic-single' as const,
      durationSeconds: 6,
      theEndSeconds: 0.25,
      difficulty: 'classic-standard' as const,
      totalSteps: 390,
      script,
    }

    const first = runDeterministicReplay(replayOptions)
    const second = runDeterministicReplay(replayOptions)

    expect(second.events).toEqual(first.events)
    expect(second.players).toEqual(first.players)
    expect(second.winner).toBe(first.winner)
    expect(second.timeOfDayTransitions).toEqual(first.timeOfDayTransitions)
    expect(first.timeOfDayTransitions.map((transition) => transition.timeOfDay)).toEqual([
      'day',
      'dusk',
      'night',
      'the-end',
    ])
  })
})
