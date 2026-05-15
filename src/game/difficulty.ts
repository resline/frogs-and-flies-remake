import { CLASSIC_FLY_BAND_MAX_Y, CLASSIC_FLY_BAND_MIN_Y, CLASSIC_JUMP_ASSIST_FORGIVENESS, FLY_SPAWN_SECONDS } from './constants'
import type { ClassicOptions, DifficultyMode } from './types'

const CLASSIC_DIFFICULTIES: Record<DifficultyMode, ClassicOptions> = {
  'classic-assist': {
    difficulty: 'classic-assist',
    flyBand: {
      minY: CLASSIC_FLY_BAND_MIN_Y + 36,
      maxY: CLASSIC_FLY_BAND_MAX_Y - 42,
    },
    autoTongue: true,
    jumpForgiveness: CLASSIC_JUMP_ASSIST_FORGIVENESS + 14,
    flySpawnSeconds: FLY_SPAWN_SECONDS * 1.2,
  },
  'classic-standard': {
    difficulty: 'classic-standard',
    flyBand: {
      minY: CLASSIC_FLY_BAND_MIN_Y,
      maxY: CLASSIC_FLY_BAND_MAX_Y,
    },
    autoTongue: false,
    jumpForgiveness: CLASSIC_JUMP_ASSIST_FORGIVENESS,
    flySpawnSeconds: FLY_SPAWN_SECONDS,
  },
  'classic-expert': {
    difficulty: 'classic-expert',
    flyBand: {
      minY: CLASSIC_FLY_BAND_MIN_Y - 24,
      maxY: CLASSIC_FLY_BAND_MAX_Y + 48,
    },
    autoTongue: false,
    jumpForgiveness: Math.max(0, CLASSIC_JUMP_ASSIST_FORGIVENESS - 6),
    flySpawnSeconds: FLY_SPAWN_SECONDS * 0.82,
  },
}

export function getClassicDifficulty(difficulty: DifficultyMode = 'classic-standard'): ClassicOptions {
  const options = CLASSIC_DIFFICULTIES[difficulty] ?? CLASSIC_DIFFICULTIES['classic-standard']

  return {
    ...options,
    flyBand: { ...options.flyBand },
  }
}

export function isDifficultyMode(value: unknown): value is DifficultyMode {
  return value === 'classic-assist' || value === 'classic-standard' || value === 'classic-expert'
}
