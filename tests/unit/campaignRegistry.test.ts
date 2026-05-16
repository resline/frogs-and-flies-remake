import { describe, expect, it } from 'vitest'
import {
  getCampaignLevel,
  getLevelContentProfile,
  HOME_POND_CAMPAIGN,
  HOME_POND_CONTENT_PROFILES,
  HOME_POND_LEVELS,
  M27_CAMPAIGN_REGISTRY,
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
})
