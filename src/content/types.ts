export type CampaignId = 'home-pond'
export type PrologueId = 'home-pond-dawn-prologue'
export type CampaignLevelId =
  | 'home-pond-1-1-first-hunt'
  | 'home-pond-1-2-quick-tongue'
  | 'home-pond-1-3-nightfall-feast'
export type LevelContentProfileId =
  | 'home-pond-intro-classic'
  | 'home-pond-quick-classic'
  | 'home-pond-night-classic'
export type ArenaId = 'home-pond'
export type RulesetId = 'classic-home-pond'

export interface CampaignDefinition {
  id: CampaignId
  title: string
  prologueId: PrologueId
  initialLevelId: CampaignLevelId
  levelIds: readonly CampaignLevelId[]
}

export interface PrologueDefinition {
  id: PrologueId
  campaignId: CampaignId
  title: string
  panels: readonly ProloguePanelDefinition[]
  startLevelId: CampaignLevelId
  replayable: boolean
}

export interface ProloguePanelDefinition {
  id: string
  text: string
  visualTone: 'dawn' | 'day' | 'dusk'
}

export interface CampaignLevelDefinition {
  id: CampaignLevelId
  campaignId: CampaignId
  chapterLabel: '1-1' | '1-2' | '1-3'
  title: string
  contentProfileId: LevelContentProfileId
  unlocksLevelId?: CampaignLevelId
  objective: CampaignObjectiveDefinition
  starThresholds: CampaignStarThresholds
}

export interface LevelContentProfileDefinition {
  id: LevelContentProfileId
  arenaId: ArenaId
  rulesetId: RulesetId
  matchMode: 'classic-single'
  difficultySource: 'runtime-settings'
  durationSource: 'runtime-defaults'
  homePondContent: 'existing-classic-only'
  visualTone: 'dawn' | 'day' | 'night'
  completion: 'on-results'
}

export interface CampaignObjectiveDefinition {
  type: 'score-at-least' | 'score-and-catches-at-least'
  score: number
  catches?: number
}

export interface CampaignStarThresholds {
  oneStarScore: number
  twoStarScore: number
  threeStarScore: number
}

export interface CampaignRegistry {
  campaigns: readonly CampaignDefinition[]
  prologues: readonly PrologueDefinition[]
  levels: readonly CampaignLevelDefinition[]
  contentProfiles: readonly LevelContentProfileDefinition[]
}

export type CampaignRegistryValidationCode =
  | 'duplicate-campaign-id'
  | 'duplicate-prologue-id'
  | 'duplicate-level-id'
  | 'duplicate-content-profile-id'
  | 'missing-prologue'
  | 'missing-initial-level'
  | 'duplicate-campaign-level-id'
  | 'missing-campaign-level'
  | 'level-campaign-mismatch'
  | 'missing-campaign'
  | 'missing-start-level'
  | 'missing-content-profile'
  | 'unsupported-arena'
  | 'unsupported-ruleset'
  | 'unsupported-match-mode'
  | 'invalid-star-thresholds'
  | 'invalid-unlock-order'
  | 'invalid-m27-scope'

export interface CampaignRegistryValidationError {
  code: CampaignRegistryValidationCode
  id?: string
  message: string
}
