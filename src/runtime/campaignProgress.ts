import type { CampaignObjectiveEvaluation, CampaignObjectiveStatsInput } from '../content/objectives'
import {
  HOME_POND_CAMPAIGN,
  M27_CAMPAIGN_REGISTRY,
} from '../content/registry'
import type {
  CampaignDefinition,
  CampaignId,
  CampaignLevelDefinition,
  CampaignLevelId,
  CampaignRegistry,
  PrologueId,
} from '../content/types'
import type { CampaignLevelProgress, CampaignProgress } from './save'

interface CampaignResultStats extends CampaignObjectiveStatsInput {
  timeRemainingSeconds?: number
}

export function createDefaultCampaignProgress(): CampaignProgress {
  return {
    seenPrologueIds: [],
    levels: Object.fromEntries(
      M27_CAMPAIGN_REGISTRY.levels.map((level) => [
        level.id,
        createDefaultLevelProgress(level.id === HOME_POND_CAMPAIGN.initialLevelId, level),
      ]),
    ) as CampaignProgress['levels'],
    lastSelectedCampaignId: HOME_POND_CAMPAIGN.id,
    lastSelectedLevelId: HOME_POND_CAMPAIGN.initialLevelId,
  }
}

export function validateCampaignProgress(
  raw: unknown,
  registry: CampaignRegistry = M27_CAMPAIGN_REGISTRY,
): CampaignProgress {
  const defaults = createDefaultCampaignProgress()
  if (!isRecord(raw)) {
    return defaults
  }

  const knownPrologueIds = new Set(registry.prologues.map((prologue) => prologue.id))
  const seenPrologueIds = validateStringArray(raw.seenPrologueIds).filter((id): id is PrologueId =>
    knownPrologueIds.has(id as PrologueId),
  )

  const levels = { ...defaults.levels }
  const rawLevels = isRecord(raw.levels) ? raw.levels : {}
  for (const level of registry.levels) {
    levels[level.id] = validateLevelProgress(rawLevels[level.id], defaults.levels[level.id], level)
  }
  enforceUnlockOrder(levels, HOME_POND_CAMPAIGN)

  const lastSelectedCampaignId = readKnownCampaignId(raw.lastSelectedCampaignId, registry) ?? defaults.lastSelectedCampaignId
  const rawSelectedLevelId = readKnownCampaignLevelId(raw.lastSelectedLevelId, registry)
  const selectedLevelId =
    rawSelectedLevelId && levels[rawSelectedLevelId]?.unlocked
      ? rawSelectedLevelId
      : getFirstUnlockedIncompleteLevel({ seenPrologueIds, levels, lastSelectedCampaignId }, HOME_POND_CAMPAIGN)?.id ??
        defaults.lastSelectedLevelId

  return {
    seenPrologueIds,
    levels,
    lastSelectedCampaignId,
    lastSelectedLevelId: selectedLevelId,
  }
}

export function markPrologueSeen(progress: CampaignProgress, prologueId: PrologueId): CampaignProgress {
  if (progress.seenPrologueIds.includes(prologueId)) {
    return cloneCampaignProgress(progress)
  }

  return {
    ...cloneCampaignProgress(progress),
    seenPrologueIds: [...progress.seenPrologueIds, prologueId],
  }
}

export function selectCampaignLevel(
  progress: CampaignProgress,
  campaignId: CampaignId,
  levelId: CampaignLevelId,
): CampaignProgress {
  const next = validateCampaignProgress(progress)
  const campaign = M27_CAMPAIGN_REGISTRY.campaigns.find((candidate) => candidate.id === campaignId)
  if (!campaign?.levelIds.includes(levelId) || !next.levels[levelId]?.unlocked) {
    return next
  }

  return {
    ...next,
    lastSelectedCampaignId: campaignId,
    lastSelectedLevelId: levelId,
  }
}

export function recordCampaignLevelResult(
  progress: CampaignProgress,
  level: CampaignLevelDefinition,
  evaluation: CampaignObjectiveEvaluation,
  stats: CampaignResultStats,
  playedAt: string,
): CampaignProgress {
  const next = validateCampaignProgress(progress)
  const current = next.levels[level.id] ?? createDefaultLevelProgress(level.id === HOME_POND_CAMPAIGN.initialLevelId, level)
  const score = readNonNegativeNumber(stats.score, 0)
  const catches = stats.catches === undefined ? undefined : readNonNegativeNumber(stats.catches, 0)
  const timeRemainingSeconds =
    stats.timeRemainingSeconds === undefined ? undefined : readNonNegativeNumber(stats.timeRemainingSeconds, 0)
  const objectiveStats = {
    attempts: current.objectiveStats.attempts + 1,
    passes: current.objectiveStats.passes + (evaluation.passed ? 1 : 0),
    bestScore: Math.max(current.objectiveStats.bestScore, score),
    bestCatches: maxOptional(current.objectiveStats.bestCatches, catches),
    bestTimeRemainingSeconds: maxOptional(current.objectiveStats.bestTimeRemainingSeconds, timeRemainingSeconds),
  }

  next.levels[level.id] = {
    unlocked: true,
    passed: current.passed || evaluation.passed,
    bestScore: Math.max(current.bestScore, score),
    stars: maxStars(current.stars, evaluation.stars),
    objectiveStats: stripUndefinedStats(objectiveStats),
    lastPlayedAt: playedAt,
  }

  if (evaluation.passed && level.unlocksLevelId) {
    next.levels[level.unlocksLevelId] = {
      ...next.levels[level.unlocksLevelId],
      unlocked: true,
    }
  }

  return next
}

export function isCampaignComplete(progress: CampaignProgress, campaign: CampaignDefinition): boolean {
  const next = validateCampaignProgress(progress)
  return campaign.levelIds.every((levelId) => next.levels[levelId]?.passed === true)
}

export function getFirstUnlockedIncompleteLevel(
  progress: CampaignProgress,
  campaign: CampaignDefinition,
): CampaignLevelDefinition | undefined {
  const levelsById = new Map(M27_CAMPAIGN_REGISTRY.levels.map((level) => [level.id, level]))
  for (const levelId of campaign.levelIds) {
    if (progress.levels[levelId]?.unlocked && !progress.levels[levelId]?.passed) {
      return levelsById.get(levelId)
    }
  }
  for (const levelId of campaign.levelIds) {
    if (progress.levels[levelId]?.unlocked) {
      return levelsById.get(levelId)
    }
  }
  return levelsById.get(campaign.initialLevelId)
}

export function cloneCampaignProgress(progress: CampaignProgress): CampaignProgress {
  return {
    seenPrologueIds: [...progress.seenPrologueIds],
    levels: Object.fromEntries(
      Object.entries(progress.levels).map(([levelId, levelProgress]) => [
        levelId,
        cloneLevelProgress(levelProgress),
      ]),
    ) as CampaignProgress['levels'],
    lastSelectedCampaignId: progress.lastSelectedCampaignId,
    lastSelectedLevelId: progress.lastSelectedLevelId,
  }
}

function createDefaultLevelProgress(unlocked: boolean, level: CampaignLevelDefinition): CampaignLevelProgress {
  return {
    unlocked,
    passed: false,
    bestScore: 0,
    stars: 0,
    objectiveStats: {
      attempts: 0,
      passes: 0,
      bestScore: 0,
      ...(level.objective.type === 'score-and-catches-at-least' ? { bestCatches: 0 } : {}),
    },
  }
}

function validateLevelProgress(
  raw: unknown,
  defaults: CampaignLevelProgress,
  level: CampaignLevelDefinition,
): CampaignLevelProgress {
  if (!isRecord(raw)) {
    return cloneLevelProgress(defaults)
  }

  const passed = typeof raw.passed === 'boolean' ? raw.passed : defaults.passed
  const objectiveStats = validateObjectiveStats(raw.objectiveStats, defaults.objectiveStats)
  const lastPlayedAt = typeof raw.lastPlayedAt === 'string' ? raw.lastPlayedAt : undefined

  return {
    unlocked: typeof raw.unlocked === 'boolean' ? raw.unlocked : defaults.unlocked,
    passed,
    bestScore: readNonNegativeNumber(raw.bestScore, defaults.bestScore),
    stars: passed ? readStars(raw.stars, defaults.stars) : 0,
    objectiveStats: {
      ...objectiveStats,
      ...(level.objective.type === 'score-and-catches-at-least' && objectiveStats.bestCatches === undefined
        ? { bestCatches: 0 }
        : {}),
    },
    ...(lastPlayedAt ? { lastPlayedAt } : {}),
  }
}

function validateObjectiveStats(
  raw: unknown,
  defaults: CampaignLevelProgress['objectiveStats'],
): CampaignLevelProgress['objectiveStats'] {
  if (!isRecord(raw)) {
    return { ...defaults }
  }

  const attempts = readNonNegativeNumber(raw.attempts, defaults.attempts)
  const passes = Math.min(readNonNegativeNumber(raw.passes, defaults.passes), attempts)
  return stripUndefinedStats({
    attempts,
    passes,
    bestScore: readNonNegativeNumber(raw.bestScore, defaults.bestScore),
    bestCatches: raw.bestCatches === undefined ? defaults.bestCatches : readNonNegativeNumber(raw.bestCatches, 0),
    bestTimeRemainingSeconds:
      raw.bestTimeRemainingSeconds === undefined
        ? defaults.bestTimeRemainingSeconds
        : readNonNegativeNumber(raw.bestTimeRemainingSeconds, 0),
  })
}

function enforceUnlockOrder(levels: CampaignProgress['levels'], campaign: CampaignDefinition): void {
  let previousPassed = true
  for (const [index, levelId] of campaign.levelIds.entries()) {
    const progress = levels[levelId]
    if (!progress) {
      continue
    }
    if (index === 0) {
      progress.unlocked = true
    } else {
      progress.unlocked = progress.unlocked && previousPassed
    }
    previousPassed = progress.passed
  }
}

function cloneLevelProgress(progress: CampaignLevelProgress): CampaignLevelProgress {
  return {
    unlocked: progress.unlocked,
    passed: progress.passed,
    bestScore: progress.bestScore,
    stars: progress.stars,
    objectiveStats: { ...progress.objectiveStats },
    ...(progress.lastPlayedAt ? { lastPlayedAt: progress.lastPlayedAt } : {}),
  }
}

function readKnownCampaignId(raw: unknown, registry: CampaignRegistry): CampaignId | undefined {
  return typeof raw === 'string' && registry.campaigns.some((campaign) => campaign.id === raw) ? (raw as CampaignId) : undefined
}

function readKnownCampaignLevelId(raw: unknown, registry: CampaignRegistry): CampaignLevelId | undefined {
  return typeof raw === 'string' && registry.levels.some((level) => level.id === raw) ? (raw as CampaignLevelId) : undefined
}

function validateStringArray(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((value): value is string => typeof value === 'string') : []
}

function maxOptional(current: number | undefined, next: number | undefined): number | undefined {
  if (next === undefined) {
    return current
  }
  return current === undefined ? next : Math.max(current, next)
}

function maxStars(left: 0 | 1 | 2 | 3, right: 0 | 1 | 2 | 3): 0 | 1 | 2 | 3 {
  return Math.max(left, right) as 0 | 1 | 2 | 3
}

function readStars(raw: unknown, fallback: 0 | 1 | 2 | 3): 0 | 1 | 2 | 3 {
  return typeof raw === 'number' && Number.isFinite(raw) ? (Math.max(0, Math.min(3, Math.floor(raw))) as 0 | 1 | 2 | 3) : fallback
}

function readNonNegativeNumber(raw: unknown, fallback: number): number {
  return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : fallback
}

function stripUndefinedStats(
  stats: CampaignLevelProgress['objectiveStats'],
): CampaignLevelProgress['objectiveStats'] {
  return Object.fromEntries(Object.entries(stats).filter(([, value]) => value !== undefined)) as CampaignLevelProgress['objectiveStats']
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
