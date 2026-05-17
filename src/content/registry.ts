import type {
  ArenaId,
  CampaignDefinition,
  CampaignId,
  CampaignLevelDefinition,
  CampaignLevelId,
  CampaignRegistry,
  CampaignRegistryValidationCode,
  CampaignRegistryValidationError,
  EncounterEntityKind,
  EncounterMechanicsProfileDefinition,
  EncounterProfileId,
  LevelContentProfileDefinition,
  LevelContentProfileId,
  PrologueDefinition,
  PrologueId,
  RulesetId,
} from './types'

const IMPLEMENTED_ARENA_IDS: readonly ArenaId[] = ['home-pond']
const IMPLEMENTED_RULESET_IDS: readonly RulesetId[] = ['classic-home-pond']
const IMPLEMENTED_MATCH_MODES = ['classic-single'] as const
const IMPLEMENTED_ENCOUNTER_ENTITY_KINDS: readonly EncounterEntityKind[] = ['fly', 'power']
const EXPECTED_ENCOUNTER_PROFILE_IDS: readonly EncounterProfileId[] = [
  'home-pond-baseline-gentle',
  'home-pond-quick-tongue',
  'home-pond-nightfall-pressure',
]

export const HOME_POND_CAMPAIGN: CampaignDefinition = {
  id: 'home-pond',
  title: 'Home Pond',
  prologueId: 'home-pond-dawn-prologue',
  initialLevelId: 'home-pond-1-1-first-hunt',
  levelIds: [
    'home-pond-1-1-first-hunt',
    'home-pond-1-2-quick-tongue',
    'home-pond-1-3-nightfall-feast',
  ],
}

export const HOME_POND_PROLOGUE: PrologueDefinition = {
  id: 'home-pond-dawn-prologue',
  campaignId: 'home-pond',
  title: 'Dawn At Home Pond',
  startLevelId: 'home-pond-1-1-first-hunt',
  replayable: true,
  panels: [
    {
      id: 'dawn-breaks',
      text: 'Dawn breaks over Home Pond. Toby Toad wakes on the left lily as the first flies cross the water.',
      visualTone: 'dawn',
    },
    {
      id: 'pond-tale',
      text: 'The old pond tale says the Golden Mother Fly appears only to frogs who master the first hunt.',
      visualTone: 'day',
    },
    {
      id: 'first-task',
      text: "Toby's first task is simple: leap, aim, and catch enough flies before nightfall.",
      visualTone: 'dusk',
    },
  ],
}

export const HOME_POND_LEVELS: readonly CampaignLevelDefinition[] = [
  {
    id: 'home-pond-1-1-first-hunt',
    campaignId: 'home-pond',
    chapterLabel: '1-1',
    title: 'First Hunt',
    contentProfileId: 'home-pond-intro-classic',
    unlocksLevelId: 'home-pond-1-2-quick-tongue',
    objective: { type: 'score-at-least', score: 300 },
    starThresholds: { oneStarScore: 300, twoStarScore: 600, threeStarScore: 900 },
  },
  {
    id: 'home-pond-1-2-quick-tongue',
    campaignId: 'home-pond',
    chapterLabel: '1-2',
    title: 'Quick Tongue',
    contentProfileId: 'home-pond-quick-classic',
    unlocksLevelId: 'home-pond-1-3-nightfall-feast',
    objective: { type: 'score-and-catches-at-least', score: 500, catches: 8 },
    starThresholds: { oneStarScore: 500, twoStarScore: 800, threeStarScore: 1100 },
  },
  {
    id: 'home-pond-1-3-nightfall-feast',
    campaignId: 'home-pond',
    chapterLabel: '1-3',
    title: 'Nightfall Feast',
    contentProfileId: 'home-pond-night-classic',
    objective: { type: 'score-at-least', score: 700 },
    starThresholds: { oneStarScore: 700, twoStarScore: 1000, threeStarScore: 1300 },
  },
]

export const HOME_POND_CONTENT_PROFILES: readonly LevelContentProfileDefinition[] = [
  {
    id: 'home-pond-intro-classic',
    arenaId: 'home-pond',
    rulesetId: 'classic-home-pond',
    matchMode: 'classic-single',
    encounterProfileId: 'home-pond-baseline-gentle',
    difficultySource: 'runtime-settings',
    durationSource: 'runtime-defaults',
    homePondContent: 'existing-classic-only',
    visualTone: 'dawn',
    completion: 'on-results',
  },
  {
    id: 'home-pond-quick-classic',
    arenaId: 'home-pond',
    rulesetId: 'classic-home-pond',
    matchMode: 'classic-single',
    encounterProfileId: 'home-pond-quick-tongue',
    difficultySource: 'runtime-settings',
    durationSource: 'runtime-defaults',
    homePondContent: 'existing-classic-only',
    visualTone: 'day',
    completion: 'on-results',
  },
  {
    id: 'home-pond-night-classic',
    arenaId: 'home-pond',
    rulesetId: 'classic-home-pond',
    matchMode: 'classic-single',
    encounterProfileId: 'home-pond-nightfall-pressure',
    difficultySource: 'runtime-settings',
    durationSource: 'runtime-defaults',
    homePondContent: 'existing-classic-only',
    visualTone: 'night',
    completion: 'on-results',
  },
]

export const HOME_POND_ENCOUNTER_PROFILES: readonly EncounterMechanicsProfileDefinition[] = [
  {
    id: 'home-pond-baseline-gentle',
    label: 'Baseline Gentle',
    implementedEntityKinds: ['fly', 'power'],
    flySpawnSecondsMultiplier: 1,
    flyBandOffset: { minY: 0, maxY: 0 },
    flyVelocity: { minVx: -30, maxVx: 30, minVy: 55, maxVy: 95 },
    powerSpawnSecondsMultiplier: 1,
    tuningNotes: 'Keeps the M2.8 Classic Standard fly cadence, lane, velocity, and Rush pressure.',
  },
  {
    id: 'home-pond-quick-tongue',
    label: 'Quick Tongue',
    implementedEntityKinds: ['fly', 'power'],
    flySpawnSecondsMultiplier: 0.84,
    flyBandOffset: { minY: 12, maxY: -18 },
    flyVelocity: { minVx: -36, maxVx: 36, minVy: 65, maxVy: 110 },
    powerSpawnSecondsMultiplier: 1.15,
    tuningNotes: 'Increases common-fly pressure while keeping the encounter limited to existing fly and Rush entities.',
  },
  {
    id: 'home-pond-nightfall-pressure',
    label: 'Nightfall Pressure',
    implementedEntityKinds: ['fly', 'power'],
    flySpawnSecondsMultiplier: 0.72,
    flyBandOffset: { minY: -20, maxY: -44 },
    flyVelocity: { minVx: -44, maxVx: 44, minVy: 75, maxVy: 125 },
    powerSpawnSecondsMultiplier: 1.45,
    tuningNotes: 'Adds the strongest M2.9 common-fly pressure and rarer Rush cadence for the night finale.',
  },
]

export const M27_CAMPAIGN_REGISTRY: CampaignRegistry = {
  campaigns: [HOME_POND_CAMPAIGN],
  prologues: [HOME_POND_PROLOGUE],
  levels: HOME_POND_LEVELS,
  contentProfiles: HOME_POND_CONTENT_PROFILES,
  encounterProfiles: HOME_POND_ENCOUNTER_PROFILES,
}

export function getCampaign(id: CampaignId): CampaignDefinition | undefined {
  return M27_CAMPAIGN_REGISTRY.campaigns.find((campaign) => campaign.id === id)
}

export function getPrologue(id: PrologueId): PrologueDefinition | undefined {
  return M27_CAMPAIGN_REGISTRY.prologues.find((prologue) => prologue.id === id)
}

export function getCampaignLevel(id: CampaignLevelId): CampaignLevelDefinition | undefined {
  return M27_CAMPAIGN_REGISTRY.levels.find((level) => level.id === id)
}

export function getLevelContentProfile(id: LevelContentProfileId): LevelContentProfileDefinition | undefined {
  return M27_CAMPAIGN_REGISTRY.contentProfiles.find((profile) => profile.id === id)
}

export function getEncounterProfile(id: EncounterProfileId): EncounterMechanicsProfileDefinition | undefined {
  return M27_CAMPAIGN_REGISTRY.encounterProfiles.find((profile) => profile.id === id)
}

export function getEncounterProfileForContentProfile(
  id: LevelContentProfileId,
): EncounterMechanicsProfileDefinition | undefined {
  const contentProfile = getLevelContentProfile(id)
  return contentProfile ? getEncounterProfile(contentProfile.encounterProfileId) : undefined
}

export function resolveCampaignEncounterProfile(
  levelId: CampaignLevelId,
): EncounterMechanicsProfileDefinition | undefined {
  const level = getCampaignLevel(levelId)
  return level ? getEncounterProfileForContentProfile(level.contentProfileId) : undefined
}

export function getNextCampaignLevel(levelId: CampaignLevelId): CampaignLevelDefinition | undefined {
  const level = getCampaignLevel(levelId)
  return level?.unlocksLevelId ? getCampaignLevel(level.unlocksLevelId) : undefined
}

export function validateCampaignRegistry(
  registry: CampaignRegistry = M27_CAMPAIGN_REGISTRY,
): CampaignRegistryValidationError[] {
  const errors: CampaignRegistryValidationError[] = []
  const campaignIds = new Set(registry.campaigns.map((campaign) => campaign.id))
  const prologueIds = new Set(registry.prologues.map((prologue) => prologue.id))
  const levelIds = new Set(registry.levels.map((level) => level.id))
  const contentProfileIds = new Set(registry.contentProfiles.map((profile) => profile.id))
  const encounterProfileIds = new Set(registry.encounterProfiles.map((profile) => profile.id))

  addDuplicateErrors(errors, 'duplicate-campaign-id', registry.campaigns.map((campaign) => campaign.id))
  addDuplicateErrors(errors, 'duplicate-prologue-id', registry.prologues.map((prologue) => prologue.id))
  addDuplicateErrors(errors, 'duplicate-level-id', registry.levels.map((level) => level.id))
  addDuplicateErrors(
    errors,
    'duplicate-content-profile-id',
    registry.contentProfiles.map((profile) => profile.id),
  )
  addDuplicateErrors(
    errors,
    'duplicate-encounter-profile-id',
    registry.encounterProfiles.map((profile) => profile.id),
  )

  for (const campaign of registry.campaigns) {
    if (!prologueIds.has(campaign.prologueId)) {
      addError(errors, 'missing-prologue', campaign.id, `Campaign ${campaign.id} references a missing prologue.`)
    }
    if (!levelIds.has(campaign.initialLevelId)) {
      addError(errors, 'missing-initial-level', campaign.id, `Campaign ${campaign.id} references a missing initial level.`)
    }
    addDuplicateErrors(errors, 'duplicate-campaign-level-id', campaign.levelIds)
    for (const levelId of campaign.levelIds) {
      if (!levelIds.has(levelId)) {
        addError(errors, 'missing-campaign-level', levelId, `Campaign ${campaign.id} references a missing level.`)
      }
      const level = registry.levels.find((candidate) => candidate.id === levelId)
      if (level && level.campaignId !== campaign.id) {
        addError(errors, 'level-campaign-mismatch', levelId, `Level ${levelId} belongs to another campaign.`)
      }
    }
    validateUnlockOrder(errors, campaign, registry.levels)
  }

  for (const prologue of registry.prologues) {
    if (!campaignIds.has(prologue.campaignId)) {
      addError(errors, 'missing-campaign', prologue.id, `Prologue ${prologue.id} references a missing campaign.`)
    }
    if (!levelIds.has(prologue.startLevelId)) {
      addError(errors, 'missing-start-level', prologue.id, `Prologue ${prologue.id} references a missing start level.`)
    }
  }

  for (const level of registry.levels) {
    if (!campaignIds.has(level.campaignId)) {
      addError(errors, 'missing-campaign', level.id, `Level ${level.id} references a missing campaign.`)
    }
    if (!contentProfileIds.has(level.contentProfileId)) {
      addError(errors, 'missing-content-profile', level.id, `Level ${level.id} references a missing content profile.`)
    }
    if (!hasAscendingStarThresholds(level)) {
      addError(errors, 'invalid-star-thresholds', level.id, `Level ${level.id} has invalid star thresholds.`)
    }
  }

  for (const profile of registry.contentProfiles) {
    if (!IMPLEMENTED_ARENA_IDS.includes(profile.arenaId)) {
      addError(errors, 'unsupported-arena', profile.id, `Content profile ${profile.id} uses an unsupported arena.`)
    }
    if (!IMPLEMENTED_RULESET_IDS.includes(profile.rulesetId)) {
      addError(errors, 'unsupported-ruleset', profile.id, `Content profile ${profile.id} uses an unsupported ruleset.`)
    }
    if (!IMPLEMENTED_MATCH_MODES.includes(profile.matchMode)) {
      addError(errors, 'unsupported-match-mode', profile.id, `Content profile ${profile.id} uses an unsupported mode.`)
    }
    if (!encounterProfileIds.has(profile.encounterProfileId)) {
      addError(
        errors,
        'missing-encounter-profile',
        profile.id,
        `Content profile ${profile.id} references a missing encounter profile.`,
      )
    }
  }

  for (const profile of registry.encounterProfiles) {
    for (const entityKind of profile.implementedEntityKinds) {
      if (!isSupportedEncounterEntityKind(entityKind)) {
        addError(
          errors,
          'unsupported-encounter-entity-kind',
          profile.id,
          `Encounter profile ${profile.id} uses unsupported entity kind ${entityKind}.`,
        )
      }
    }
    if (!hasValidEncounterTuning(profile)) {
      addError(
        errors,
        'invalid-encounter-profile-tuning',
        profile.id,
        `Encounter profile ${profile.id} has invalid tuning values.`,
      )
    }
  }

  if (
    registry.campaigns.length !== 1 ||
    registry.prologues.length !== 1 ||
    registry.levels.length !== 3 ||
    registry.contentProfiles.length !== 3 ||
    registry.encounterProfiles.length !== 3 ||
    !hasExpectedEncounterProfileIds(registry.encounterProfiles)
  ) {
    addError(
      errors,
      'invalid-m29-scope',
      'm29',
      'M2.9 registry must stay to one campaign, one prologue, three levels, three content profiles, and three encounter profiles.',
    )
  }

  return errors
}

function addDuplicateErrors(
  errors: CampaignRegistryValidationError[],
  code: CampaignRegistryValidationCode,
  ids: readonly string[],
): void {
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) {
      addError(errors, code, id, `Registry contains duplicate id ${id}.`)
    }
    seen.add(id)
  }
}

function addError(
  errors: CampaignRegistryValidationError[],
  code: CampaignRegistryValidationCode,
  id: string,
  message: string,
): void {
  errors.push({ code, id, message })
}

function hasAscendingStarThresholds(level: CampaignLevelDefinition): boolean {
  const thresholds = level.starThresholds
  return thresholds.oneStarScore <= thresholds.twoStarScore && thresholds.twoStarScore <= thresholds.threeStarScore
}

function isSupportedEncounterEntityKind(entityKind: string): entityKind is EncounterEntityKind {
  return IMPLEMENTED_ENCOUNTER_ENTITY_KINDS.includes(entityKind as EncounterEntityKind)
}

function hasValidEncounterTuning(profile: EncounterMechanicsProfileDefinition): boolean {
  return (
    isPositiveFinite(profile.flySpawnSecondsMultiplier) &&
    isPositiveFinite(profile.powerSpawnSecondsMultiplier) &&
    isOptionalPositiveFinite(profile.roundDurationSeconds) &&
    isFiniteNumber(profile.flyBandOffset.minY) &&
    isFiniteNumber(profile.flyBandOffset.maxY) &&
    isFiniteNumber(profile.flyVelocity.minVx) &&
    isFiniteNumber(profile.flyVelocity.maxVx) &&
    isFiniteNumber(profile.flyVelocity.minVy) &&
    isFiniteNumber(profile.flyVelocity.maxVy) &&
    profile.flyVelocity.minVx <= profile.flyVelocity.maxVx &&
    profile.flyVelocity.minVy <= profile.flyVelocity.maxVy
  )
}

function hasExpectedEncounterProfileIds(profiles: readonly EncounterMechanicsProfileDefinition[]): boolean {
  const profileIds = profiles.map((profile) => profile.id)
  return (
    profileIds.length === EXPECTED_ENCOUNTER_PROFILE_IDS.length &&
    EXPECTED_ENCOUNTER_PROFILE_IDS.every((id) => profileIds.includes(id))
  )
}

function isOptionalPositiveFinite(value: number | undefined): boolean {
  return value === undefined || isPositiveFinite(value)
}

function isPositiveFinite(value: number): boolean {
  return isFiniteNumber(value) && value > 0
}

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value)
}

function validateUnlockOrder(
  errors: CampaignRegistryValidationError[],
  campaign: CampaignDefinition,
  levels: readonly CampaignLevelDefinition[],
): void {
  const levelsById = new Map(levels.map((level) => [level.id, level]))
  for (const [index, levelId] of campaign.levelIds.entries()) {
    const level = levelsById.get(levelId)
    const expectedNextLevelId = campaign.levelIds[index + 1]
    if (!level) {
      continue
    }
    if (level.unlocksLevelId !== expectedNextLevelId) {
      addError(errors, 'invalid-unlock-order', level.id, `Level ${level.id} unlocks the wrong next level.`)
    }
  }
}
