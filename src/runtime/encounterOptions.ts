import { POWER_SPAWN_SECONDS } from '../game/constants'
import { getClassicDifficulty } from '../game/difficulty'
import type { CampaignLevelId, EncounterMechanicsProfileDefinition } from '../content/types'
import { resolveCampaignEncounterProfile } from '../content/registry'
import type { ClassicEncounterTuning, ClassicOptions, DifficultyMode, MatchMode } from '../game/types'

export interface EncounterProfileGameOptions {
  durationSeconds?: number
  encounter: ClassicEncounterTuning
}

export interface CampaignLevelEncounterGameOptionsInput {
  mode: MatchMode
  difficulty?: DifficultyMode
  campaignLevelId?: CampaignLevelId
}

export function resolveEncounterProfileGameOptions(
  profile: EncounterMechanicsProfileDefinition,
  classicOptions: ClassicOptions,
): EncounterProfileGameOptions {
  return {
    durationSeconds: profile.roundDurationSeconds,
    encounter: {
      roundDurationSeconds: profile.roundDurationSeconds,
      flySpawnSeconds: classicOptions.flySpawnSeconds * profile.flySpawnSecondsMultiplier,
      flyBand: resolveFlyBand(profile, classicOptions),
      flyVelocity: { ...profile.flyVelocity },
      powerSpawnSeconds: POWER_SPAWN_SECONDS * profile.powerSpawnSecondsMultiplier,
    },
  }
}

export function resolveCampaignLevelEncounterGameOptions(
  input: CampaignLevelEncounterGameOptionsInput,
): EncounterProfileGameOptions | undefined {
  if (!input.campaignLevelId || input.mode !== 'classic-single') {
    return undefined
  }

  const profile = resolveCampaignEncounterProfile(input.campaignLevelId)
  if (!profile) {
    return undefined
  }

  return resolveEncounterProfileGameOptions(profile, getClassicDifficulty(input.difficulty))
}

function resolveFlyBand(
  profile: EncounterMechanicsProfileDefinition,
  classicOptions: ClassicOptions,
): ClassicEncounterTuning['flyBand'] {
  const minY = classicOptions.flyBand.minY + profile.flyBandOffset.minY
  const maxY = Math.max(minY, classicOptions.flyBand.maxY + profile.flyBandOffset.maxY)

  return { minY, maxY }
}
