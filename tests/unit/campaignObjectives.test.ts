import { describe, expect, it } from 'vitest'
import { HOME_POND_LEVELS, M27_CAMPAIGN_REGISTRY, validateCampaignRegistry } from '../../src/content/registry'
import { evaluateCampaignObjective } from '../../src/content/objectives'
import type { CampaignRegistry } from '../../src/content/types'

const level11 = HOME_POND_LEVELS[0]
const level12 = HOME_POND_LEVELS[1]

describe('M2.7 campaign objective evaluation', () => {
  it('requires the level objective before awarding stars', () => {
    expect(evaluateCampaignObjective(level11, { score: 299, catches: 20 })).toMatchObject({ passed: false, stars: 0 })
    expect(evaluateCampaignObjective(level11, { score: 300, catches: 0 })).toMatchObject({ passed: true, stars: 1 })
    expect(evaluateCampaignObjective(level11, { score: 900, catches: 0 })).toMatchObject({ passed: true, stars: 3 })
  })

  it('requires both score and catches for combined objectives', () => {
    expect(evaluateCampaignObjective(level12, { score: 800, catches: 7 })).toMatchObject({ passed: false })
    expect(evaluateCampaignObjective(level12, { score: 800, catches: 8 })).toMatchObject({ passed: true, stars: 2 })
  })

  it('reports descending star thresholds through registry validation', () => {
    const registryWithDescendingStars: CampaignRegistry = {
      ...M27_CAMPAIGN_REGISTRY,
      levels: [
        {
          ...M27_CAMPAIGN_REGISTRY.levels[0],
          starThresholds: {
            oneStarScore: 900,
            twoStarScore: 600,
            threeStarScore: 300,
          },
        },
        ...M27_CAMPAIGN_REGISTRY.levels.slice(1),
      ],
    }

    expect(validateCampaignRegistry(registryWithDescendingStars)).toContainEqual(
      expect.objectContaining({ code: 'invalid-star-thresholds' }),
    )
  })
})
