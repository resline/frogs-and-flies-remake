import { isDifficultyMode } from '../game/difficulty'
import type { DifficultyMode } from '../game/types'
import type { SaveSettings } from './save'

export interface RuntimeOptions {
  difficulty: DifficultyMode
  reducedMotion: boolean
  highContrast: boolean
  showTimer: boolean
  mute: boolean
  volume: number
}

export type RuntimeOptionsDefaults = Partial<RuntimeOptions> | Partial<SaveSettings>

export function createRuntimeOptions(
  overrides: Partial<RuntimeOptions> = {},
  savedDefaults: RuntimeOptionsDefaults = {},
): RuntimeOptions {
  return {
    difficulty: 'classic-standard',
    reducedMotion: false,
    highContrast: false,
    showTimer: true,
    mute: false,
    volume: 1,
    ...normalizeRuntimeDefaults(savedDefaults),
    ...overrides,
  }
}

export function readRuntimeOptions(
  searchParams: URLSearchParams,
  savedDefaults: RuntimeOptionsDefaults = {},
): RuntimeOptions {
  const defaults = createRuntimeOptions({}, savedDefaults)

  return createRuntimeOptions(
    {
      difficulty: readDifficulty(searchParams.get('difficulty'), defaults.difficulty),
      reducedMotion: readBooleanFlag(searchParams.get('reducedMotion'), defaults.reducedMotion),
      highContrast: readBooleanFlag(searchParams.get('highContrast'), defaults.highContrast),
      showTimer: readBooleanFlag(searchParams.get('showTimer'), defaults.showTimer),
      mute: readBooleanFlag(searchParams.get('mute'), defaults.mute),
      volume: readVolume(searchParams.get('volume'), defaults.volume),
    },
    defaults,
  )
}

function normalizeRuntimeDefaults(savedDefaults: RuntimeOptionsDefaults): Partial<RuntimeOptions> {
  const defaults = savedDefaults as Partial<RuntimeOptions> & Partial<SaveSettings>
  const normalized: Partial<RuntimeOptions> = {}

  if (isDifficultyMode(defaults.difficulty)) {
    normalized.difficulty = defaults.difficulty
  }
  if (typeof defaults.reducedMotion === 'boolean') {
    normalized.reducedMotion = defaults.reducedMotion
  }
  if (typeof defaults.highContrast === 'boolean') {
    normalized.highContrast = defaults.highContrast
  }
  if (typeof defaults.showTimer === 'boolean') {
    normalized.showTimer = defaults.showTimer
  }
  if (typeof defaults.mute === 'boolean') {
    normalized.mute = defaults.mute
  }
  if (typeof defaults.masterVolume === 'number') {
    normalized.volume = clampVolume(defaults.masterVolume)
  } else if (typeof defaults.volume === 'number') {
    normalized.volume = clampVolume(defaults.volume)
  }

  return normalized
}

function readDifficulty(value: string | null, fallback: DifficultyMode): DifficultyMode {
  return isDifficultyMode(value) ? value : fallback
}

function readBooleanFlag(value: string | null, fallback: boolean): boolean {
  if (value === '1' || value === 'true') {
    return true
  }

  if (value === '0' || value === 'false') {
    return false
  }

  return fallback
}

function readVolume(value: string | null, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? clampVolume(parsed) : fallback
}

function clampVolume(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1
}
