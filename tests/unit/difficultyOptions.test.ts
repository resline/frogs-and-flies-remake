import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/game/createGame'
import { getClassicDifficulty } from '../../src/game/difficulty'
import { updateSpawn } from '../../src/game/systems/spawn'

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
})
