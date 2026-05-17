import { describe, expect, it } from 'vitest'
import {
  getEncounterProfile,
  getEncounterProfileForContentProfile,
  getCampaignLevel,
  getLevelContentProfile,
  HOME_POND_CAMPAIGN,
  HOME_POND_CONTENT_PROFILES,
  HOME_POND_ENCOUNTER_PROFILES,
  HOME_POND_LEVELS,
  M27_CAMPAIGN_REGISTRY,
  resolveCampaignEncounterProfile,
  validateCampaignRegistry,
} from '../../src/content/registry'
import type { CampaignRegistry } from '../../src/content/types'

describe('M2.7 campaign content registry', () => {
  it('registers the narrow Home Pond campaign prologue scope', () => {
    expect(HOME_POND_CAMPAIGN.id).toBe('home-pond')
    expect(HOME_POND_CAMPAIGN.levelIds).toEqual([
      'home-pond-1-1-first-hunt',
      'home-pond-1-2-quick-tongue',
      'home-pond-1-3-nightfall-feast',
    ])
    expect(HOME_POND_LEVELS).toHaveLength(3)
    expect(HOME_POND_CONTENT_PROFILES).toHaveLength(3)
    expect(validateCampaignRegistry()).toEqual([])
    expect(getCampaignLevel('home-pond-1-2-quick-tongue')?.chapterLabel).toBe('1-2')
    expect(getLevelContentProfile('home-pond-night-classic')?.matchMode).toBe('classic-single')
  })

  it('registers typed M2.9 encounter profiles for the existing Home Pond content profiles', () => {
    expect(HOME_POND_ENCOUNTER_PROFILES.map((profile) => profile.id)).toEqual([
      'home-pond-baseline-gentle',
      'home-pond-quick-tongue',
      'home-pond-nightfall-pressure',
    ])
    expect(getLevelContentProfile('home-pond-intro-classic')?.encounterProfileId).toBe(
      'home-pond-baseline-gentle',
    )
    expect(getLevelContentProfile('home-pond-quick-classic')?.encounterProfileId).toBe('home-pond-quick-tongue')
    expect(getLevelContentProfile('home-pond-night-classic')?.encounterProfileId).toBe(
      'home-pond-nightfall-pressure',
    )
    expect(validateCampaignRegistry()).toEqual([])
  })

  it('resolves encounter profiles from content profiles and campaign levels', () => {
    expect(getEncounterProfile('home-pond-quick-tongue')?.id).toBe('home-pond-quick-tongue')
    expect(getEncounterProfileForContentProfile('home-pond-night-classic')?.id).toBe(
      'home-pond-nightfall-pressure',
    )
    expect(resolveCampaignEncounterProfile('home-pond-1-1-first-hunt')?.implementedEntityKinds).toEqual(
      ['fly', 'power'],
    )
  })

  it('reports duplicate level ids in registry fixtures', () => {
    const brokenRegistryWithDuplicateLevelIds: CampaignRegistry = {
      ...M27_CAMPAIGN_REGISTRY,
      levels: [
        M27_CAMPAIGN_REGISTRY.levels[0],
        M27_CAMPAIGN_REGISTRY.levels[0],
        M27_CAMPAIGN_REGISTRY.levels[2],
      ],
    }

    expect(validateCampaignRegistry(brokenRegistryWithDuplicateLevelIds)).toContainEqual(
      expect.objectContaining({ code: 'duplicate-level-id' }),
    )
  })

  it('reports levels that reference missing content profiles', () => {
    const brokenRegistryWithMissingContentProfile: CampaignRegistry = {
      ...M27_CAMPAIGN_REGISTRY,
      levels: [
        {
          ...M27_CAMPAIGN_REGISTRY.levels[0],
          contentProfileId: 'missing-home-pond-profile',
        },
        ...M27_CAMPAIGN_REGISTRY.levels.slice(1),
      ],
    }

    expect(validateCampaignRegistry(brokenRegistryWithMissingContentProfile)).toContainEqual(
      expect.objectContaining({ code: 'missing-content-profile' }),
    )
  })

  it('reports content profiles that reference missing encounter profiles', () => {
    const brokenRegistryWithMissingEncounterProfile = {
      ...M27_CAMPAIGN_REGISTRY,
      contentProfiles: [
        {
          ...M27_CAMPAIGN_REGISTRY.contentProfiles[0],
          encounterProfileId: 'missing-encounter-profile',
        },
        ...M27_CAMPAIGN_REGISTRY.contentProfiles.slice(1),
      ],
    } as CampaignRegistry

    expect(validateCampaignRegistry(brokenRegistryWithMissingEncounterProfile)).toContainEqual(
      expect.objectContaining({ code: 'missing-encounter-profile' }),
    )
  })

  it('reports unsupported encounter entity kinds', () => {
    const brokenRegistryWithUnsupportedEntityKind = {
      ...M27_CAMPAIGN_REGISTRY,
      encounterProfiles: [
        {
          ...HOME_POND_ENCOUNTER_PROFILES[0],
          implementedEntityKinds: ['fly', 'mosquito'],
        },
        ...HOME_POND_ENCOUNTER_PROFILES.slice(1),
      ],
    } as CampaignRegistry

    expect(validateCampaignRegistry(brokenRegistryWithUnsupportedEntityKind)).toContainEqual(
      expect.objectContaining({ code: 'unsupported-encounter-entity-kind' }),
    )
  })

  it('reports duplicate encounter profile ids', () => {
    const brokenRegistryWithDuplicateEncounterProfileId = {
      ...M27_CAMPAIGN_REGISTRY,
      encounterProfiles: [
        HOME_POND_ENCOUNTER_PROFILES[0],
        {
          ...HOME_POND_ENCOUNTER_PROFILES[1],
          id: HOME_POND_ENCOUNTER_PROFILES[0].id,
        },
        HOME_POND_ENCOUNTER_PROFILES[2],
      ],
    } as CampaignRegistry

    expect(validateCampaignRegistry(brokenRegistryWithDuplicateEncounterProfileId)).toContainEqual(
      expect.objectContaining({ code: 'duplicate-encounter-profile-id' }),
    )
  })

  it('reports invalid encounter profile tuning', () => {
    const brokenRegistryWithInvalidEncounterTuning = {
      ...M27_CAMPAIGN_REGISTRY,
      encounterProfiles: [
        {
          ...HOME_POND_ENCOUNTER_PROFILES[0],
          flySpawnSecondsMultiplier: 0,
        },
        ...HOME_POND_ENCOUNTER_PROFILES.slice(1),
      ],
    } as CampaignRegistry

    expect(validateCampaignRegistry(brokenRegistryWithInvalidEncounterTuning)).toContainEqual(
      expect.objectContaining({ code: 'invalid-encounter-profile-tuning' }),
    )
  })

  it('keeps the M2.9 registry scope to the three Home Pond encounter profiles', () => {
    const brokenRegistryWithExtraEncounterProfile = {
      ...M27_CAMPAIGN_REGISTRY,
      encounterProfiles: [
        ...HOME_POND_ENCOUNTER_PROFILES,
        {
          ...HOME_POND_ENCOUNTER_PROFILES[0],
          id: 'home-pond-extra-profile',
        },
      ],
    } as CampaignRegistry

    expect(validateCampaignRegistry(brokenRegistryWithExtraEncounterProfile)).toContainEqual(
      expect.objectContaining({ code: 'invalid-m29-scope' }),
    )
  })
})
