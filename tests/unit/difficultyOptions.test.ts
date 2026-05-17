import { describe, expect, it } from 'vitest'
import { getEncounterProfile } from '../../src/content/registry'
import { createGame } from '../../src/game/createGame'
import { getClassicDifficulty } from '../../src/game/difficulty'
import { updateSpawn } from '../../src/game/systems/spawn'
import { resolveEncounterProfileGameOptions } from '../../src/runtime/encounterOptions'

describe('classic difficulty options', () => {
  it('defines deterministic fly bands, auto tongue, and jump forgiveness per mode', () => {
    const assist = getClassicDifficulty('classic-assist')
    const standard = getClassicDifficulty('classic-standard')
    const expert = getClassicDifficulty('classic-expert')

    expect(assist.flyBand.maxY).toBeLessThan(standard.flyBand.maxY)
    expect(assist.autoTongue).toBe(true)
    expect(standard.autoTongue).toBe(false)
    expect(assist.jumpForgiveness).toBeGreaterThan(standard.jumpForgiveness)
    expect(expert.jumpForgiveness).toBeLessThan(standard.jumpForgiveness)
    expect(assist.flyVelocity).toEqual({ minVx: -30, maxVx: 30, minVy: 55, maxVy: 95 })
    expect(standard.flyVelocity).toEqual(assist.flyVelocity)
    expect(expert.flyVelocity).toEqual(standard.flyVelocity)
  })

  it('applies difficulty fly bands and spawn cadence to deterministic spawns', () => {
    const assist = createGame({ seed: 5, difficulty: 'classic-assist' })
    const standard = createGame({ seed: 5, difficulty: 'classic-standard' })

    updateSpawn(assist, assist.constants.flySpawnSeconds)
    updateSpawn(standard, standard.constants.flySpawnSeconds)

    const assistFly = assist.entities[assist.entityIds[0]]
    const standardFly = standard.entities[standard.entityIds[0]]

    expect(assist.options.difficulty).toBe('classic-assist')
    expect(assist.options.autoTongue).toBe(true)
    expect(assistFly?.kind).toBe('fly')
    expect(standardFly?.kind).toBe('fly')
    expect(assistFly?.y).toBeGreaterThanOrEqual(assist.options.flyBand.minY)
    expect(assistFly?.y).toBeLessThanOrEqual(assist.options.flyBand.maxY)
    expect(standardFly?.y).toBeGreaterThanOrEqual(standard.options.flyBand.minY)
    expect(standardFly?.y).toBeLessThanOrEqual(standard.options.flyBand.maxY)
    expect(assist.constants.flySpawnSeconds).toBeGreaterThan(standard.constants.flySpawnSeconds)
  })

  it('preserves Classic Single and Local Versus defaults without encounter tuning', () => {
    const classic = createGame({ seed: 5, mode: 'classic-single', difficulty: 'classic-standard' })
    const versus = createGame({ seed: 5, mode: 'local-versus', difficulty: 'classic-standard' })

    expect(classic.constants.flySpawnSeconds).toBe(0.75)
    expect(classic.constants.powerSpawnSeconds).toBe(8)
    expect(classic.durationSeconds).toBe(180)
    expect(classic.options.flyBand).toEqual({ minY: 64, maxY: 250 })
    expect(classic.options.flyVelocity).toEqual({ minVx: -30, maxVx: 30, minVy: 55, maxVy: 95 })
    expect(versus.constants.flySpawnSeconds).toBe(classic.constants.flySpawnSeconds)
    expect(versus.constants.powerSpawnSeconds).toBe(classic.constants.powerSpawnSeconds)
    expect(versus.options.flyBand).toEqual(classic.options.flyBand)
    expect(versus.options.flyVelocity).toEqual(classic.options.flyVelocity)
  })

  it('accepts resolved encounter tuning without mutating Classic defaults', () => {
    const quickOptions = resolveEncounterProfileGameOptions(
      getEncounterProfile('home-pond-quick-tongue')!,
      getClassicDifficulty('classic-standard'),
    )

    const game = createGame({
      seed: 5,
      mode: 'classic-single',
      difficulty: 'classic-standard',
      ...quickOptions,
    })

    expect(game.constants.flySpawnSeconds).toBeCloseTo(0.63)
    expect(game.constants.powerSpawnSeconds).toBeCloseTo(9.2)
    expect(game.options.flyBand).toEqual({ minY: 76, maxY: 232 })
    expect(game.options.flyVelocity).toEqual({ minVx: -36, maxVx: 36, minVy: 65, maxVy: 110 })
    expect(getClassicDifficulty('classic-standard').flyBand).toEqual({ minY: 64, maxY: 250 })
    expect(getClassicDifficulty('classic-standard').flyVelocity).toEqual({
      minVx: -30,
      maxVx: 30,
      minVy: 55,
      maxVy: 95,
    })
  })

  it('uses encounter round duration only when no explicit duration is supplied', () => {
    const fallbackDuration = createGame({
      seed: 5,
      difficulty: 'classic-standard',
      encounter: { roundDurationSeconds: 90 },
    })
    const explicitDuration = createGame({
      seed: 5,
      durationSeconds: 12,
      difficulty: 'classic-standard',
      encounter: { roundDurationSeconds: 90 },
    })

    expect(fallbackDuration.durationSeconds).toBe(90)
    expect(fallbackDuration.constants.roundDurationSeconds).toBe(90)
    expect(explicitDuration.durationSeconds).toBe(12)
    expect(explicitDuration.constants.roundDurationSeconds).toBe(12)
  })
})
