import { describe, expect, it } from 'vitest'
import { getEncounterProfile } from '../../src/content/registry'
import type { EncounterMechanicsProfileDefinition } from '../../src/content/types'
import { getClassicDifficulty } from '../../src/game/difficulty'
import {
  resolveCampaignLevelEncounterGameOptions,
  resolveEncounterProfileGameOptions,
} from '../../src/runtime/encounterOptions'

describe('M2.9 encounter profile game option resolver', () => {
  it('converts Home Pond encounter profiles into numeric createGame encounter options', () => {
    const baseline = resolveEncounterProfileGameOptions(
      getEncounterProfile('home-pond-baseline-gentle')!,
      getClassicDifficulty('classic-standard'),
    )
    const quick = resolveEncounterProfileGameOptions(
      getEncounterProfile('home-pond-quick-tongue')!,
      getClassicDifficulty('classic-standard'),
    )
    const night = resolveEncounterProfileGameOptions(
      getEncounterProfile('home-pond-nightfall-pressure')!,
      getClassicDifficulty('classic-standard'),
    )

    expect(baseline.durationSeconds).toBeUndefined()
    expect(baseline.encounter.flySpawnSeconds).toBe(0.75)
    expect(baseline.encounter.powerSpawnSeconds).toBe(8)
    expect(baseline.encounter.flyBand).toEqual({ minY: 64, maxY: 250 })
    expect(baseline.encounter.flyVelocity).toEqual({ minVx: -30, maxVx: 30, minVy: 55, maxVy: 95 })

    expect(quick.encounter.flySpawnSeconds).toBeLessThan(baseline.encounter.flySpawnSeconds)
    expect(night.encounter.flySpawnSeconds).toBeLessThan(quick.encounter.flySpawnSeconds)
    expect(night.encounter.powerSpawnSeconds).toBeGreaterThan(baseline.encounter.powerSpawnSeconds)
    expect(
      new Set([baseline.encounter.flyBand.minY, quick.encounter.flyBand.minY, night.encounter.flyBand.minY]).size,
    ).toBe(3)
    expect(quick.encounter.flyBand).toEqual({ minY: 76, maxY: 232 })
    expect(night.encounter.flyBand).toEqual({ minY: 44, maxY: 206 })
  })

  it('returns no encounter override for Classic and Versus launches unless a campaign level is supplied', () => {
    expect(
      resolveCampaignLevelEncounterGameOptions({ mode: 'classic-single', difficulty: 'classic-standard' }),
    ).toBeUndefined()
    expect(
      resolveCampaignLevelEncounterGameOptions({ mode: 'local-versus', difficulty: 'classic-standard' }),
    ).toBeUndefined()

    const campaignOptions = resolveCampaignLevelEncounterGameOptions({
      mode: 'classic-single',
      difficulty: 'classic-standard',
      campaignLevelId: 'home-pond-1-2-quick-tongue',
    })

    expect(campaignOptions?.encounter.flySpawnSeconds).toBeCloseTo(0.63)
    expect(campaignOptions?.encounter.powerSpawnSeconds).toBeCloseTo(9.2)
  })

  it('clamps profile fly band offsets to a valid numeric band', () => {
    const profile: EncounterMechanicsProfileDefinition = {
      ...getEncounterProfile('home-pond-baseline-gentle')!,
      flyBandOffset: { minY: 240, maxY: -260 },
    }

    const options = resolveEncounterProfileGameOptions(profile, getClassicDifficulty('classic-standard'))

    expect(options.encounter.flyBand).toEqual({ minY: 304, maxY: 304 })
  })
})
