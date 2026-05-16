import { describe, expect, it } from 'vitest'
import { evaluateCampaignObjective } from '../../src/content/objectives'
import {
  HOME_POND_CAMPAIGN,
  HOME_POND_PROLOGUE,
  getCampaignLevel,
} from '../../src/content/registry'
import {
  createDefaultCampaignProgress,
  getFirstUnlockedIncompleteLevel,
  isCampaignComplete,
  markPrologueSeen,
  recordCampaignLevelResult,
  selectCampaignLevel,
  validateCampaignProgress,
} from '../../src/runtime/campaignProgress'

const LEVEL_11 = getCampaignLevel('home-pond-1-1-first-hunt')
const LEVEL_12 = getCampaignLevel('home-pond-1-2-quick-tongue')
const LEVEL_13 = getCampaignLevel('home-pond-1-3-nightfall-feast')

if (!LEVEL_11 || !LEVEL_12 || !LEVEL_13) {
  throw new Error('M2.7 campaign levels are missing from the test registry.')
}

describe('campaign progress defaults and selection', () => {
  it('unlocks only the first Home Pond level by default', () => {
    const progress = createDefaultCampaignProgress()

    expect(progress.levels[LEVEL_11.id].unlocked).toBe(true)
    expect(progress.levels[LEVEL_12.id].unlocked).toBe(false)
    expect(progress.levels[LEVEL_13.id].unlocked).toBe(false)
    expect(progress.lastSelectedCampaignId).toBe(HOME_POND_CAMPAIGN.id)
    expect(progress.lastSelectedLevelId).toBe(LEVEL_11.id)
    expect(getFirstUnlockedIncompleteLevel(progress, HOME_POND_CAMPAIGN)?.id).toBe(LEVEL_11.id)
  })

  it('marks prologue seen idempotently and selects campaign levels immutably', () => {
    const progress = createDefaultCampaignProgress()

    const first = markPrologueSeen(progress, HOME_POND_PROLOGUE.id)
    const second = markPrologueSeen(first, HOME_POND_PROLOGUE.id)
    const selected = selectCampaignLevel(second, HOME_POND_CAMPAIGN.id, LEVEL_11.id)

    expect(progress.seenPrologueIds).toEqual([])
    expect(first.seenPrologueIds).toEqual([HOME_POND_PROLOGUE.id])
    expect(second.seenPrologueIds).toEqual([HOME_POND_PROLOGUE.id])
    expect(selected.lastSelectedCampaignId).toBe(HOME_POND_CAMPAIGN.id)
    expect(selected.lastSelectedLevelId).toBe(LEVEL_11.id)
  })
})

describe('campaign level result recording', () => {
  it('records a failed result without unlocking the next level', () => {
    const progress = createDefaultCampaignProgress()
    const evaluation = evaluateCampaignObjective(LEVEL_11, { score: 250, catches: 4 })

    const next = recordCampaignLevelResult(
      progress,
      LEVEL_11,
      evaluation,
      { score: 250, catches: 4 },
      '2026-05-17T10:00:00.000Z',
    )

    expect(next.levels[LEVEL_11.id]).toMatchObject({
      unlocked: true,
      passed: false,
      bestScore: 250,
      stars: 0,
      lastPlayedAt: '2026-05-17T10:00:00.000Z',
      objectiveStats: {
        attempts: 1,
        passes: 0,
        bestScore: 250,
        bestCatches: 4,
      },
    })
    expect(next.levels[LEVEL_12.id].unlocked).toBe(false)
  })

  it('unlocks the next registered level after passing each level', () => {
    const after11 = recordCampaignLevelResult(
      createDefaultCampaignProgress(),
      LEVEL_11,
      evaluateCampaignObjective(LEVEL_11, { score: 700, catches: 8 }),
      { score: 700, catches: 8 },
      '2026-05-17T10:00:00.000Z',
    )
    const after12 = recordCampaignLevelResult(
      after11,
      LEVEL_12,
      evaluateCampaignObjective(LEVEL_12, { score: 900, catches: 9 }),
      { score: 900, catches: 9 },
      '2026-05-17T10:05:00.000Z',
    )
    const after13 = recordCampaignLevelResult(
      after12,
      LEVEL_13,
      evaluateCampaignObjective(LEVEL_13, { score: 1400, catches: 13 }),
      { score: 1400, catches: 13 },
      '2026-05-17T10:10:00.000Z',
    )

    expect(after11.levels[LEVEL_12.id].unlocked).toBe(true)
    expect(after12.levels[LEVEL_13.id].unlocked).toBe(true)
    expect(isCampaignComplete(after13, HOME_POND_CAMPAIGN)).toBe(true)
  })

  it('does not lower best score, catches, or stars on replay', () => {
    const best = recordCampaignLevelResult(
      createDefaultCampaignProgress(),
      LEVEL_11,
      evaluateCampaignObjective(LEVEL_11, { score: 950, catches: 11 }),
      { score: 950, catches: 11 },
      '2026-05-17T10:00:00.000Z',
    )
    const replay = recordCampaignLevelResult(
      best,
      LEVEL_11,
      evaluateCampaignObjective(LEVEL_11, { score: 350, catches: 3 }),
      { score: 350, catches: 3 },
      '2026-05-17T10:15:00.000Z',
    )

    expect(replay.levels[LEVEL_11.id].bestScore).toBe(950)
    expect(replay.levels[LEVEL_11.id].stars).toBe(3)
    expect(replay.levels[LEVEL_11.id].objectiveStats).toMatchObject({
      attempts: 2,
      passes: 2,
      bestScore: 950,
      bestCatches: 11,
    })
  })
})

describe('campaign progress validation', () => {
  it('restores required known levels and ignores unknown saved ids safely', () => {
    const progress = validateCampaignProgress({
      seenPrologueIds: ['home-pond-dawn-prologue', 'unknown-prologue'],
      levels: {
        'unknown-level': {
          unlocked: true,
          passed: true,
          bestScore: 9999,
          stars: 3,
          objectiveStats: { attempts: 1, passes: 1, bestScore: 9999 },
        },
        'home-pond-1-1-first-hunt': {
          unlocked: false,
          passed: false,
          bestScore: -1,
          stars: 9,
          objectiveStats: { attempts: -1, passes: -1, bestScore: Number.NaN },
        },
      },
      lastSelectedCampaignId: 'unknown-campaign',
      lastSelectedLevelId: 'unknown-level',
    })

    expect(progress.seenPrologueIds).toEqual([HOME_POND_PROLOGUE.id])
    expect(Object.keys(progress.levels)).toEqual(HOME_POND_CAMPAIGN.levelIds)
    expect(progress.levels[LEVEL_11.id]).toMatchObject({
      unlocked: true,
      passed: false,
      bestScore: 0,
      stars: 0,
      objectiveStats: { attempts: 0, passes: 0, bestScore: 0 },
    })
    expect(progress.levels[LEVEL_12.id].unlocked).toBe(false)
    expect(progress.lastSelectedCampaignId).toBe(HOME_POND_CAMPAIGN.id)
    expect(progress.lastSelectedLevelId).toBe(LEVEL_11.id)
  })
})
