import type { CampaignLevelDefinition } from './types'

export interface CampaignObjectiveStatsInput {
  score: number
  catches?: number
}

export interface CampaignObjectiveEvaluation {
  passed: boolean
  stars: 0 | 1 | 2 | 3
}

export function evaluateCampaignObjective(
  level: CampaignLevelDefinition,
  stats: CampaignObjectiveStatsInput,
): CampaignObjectiveEvaluation {
  const catches = stats.catches ?? 0
  const objective = level.objective
  const passed =
    objective.type === 'score-at-least'
      ? stats.score >= objective.score
      : stats.score >= objective.score && catches >= (objective.catches ?? 0)

  return {
    passed,
    stars: passed ? calculateCampaignStars(level, stats.score) : 0,
  }
}

export function calculateCampaignStars(level: CampaignLevelDefinition, score: number): 0 | 1 | 2 | 3 {
  const thresholds = level.starThresholds
  if (score >= thresholds.threeStarScore) {
    return 3
  }
  if (score >= thresholds.twoStarScore) {
    return 2
  }
  if (score >= thresholds.oneStarScore) {
    return 1
  }
  return 0
}
