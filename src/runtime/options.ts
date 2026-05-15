import { isDifficultyMode } from '../game/difficulty'
import type { DifficultyMode } from '../game/types'

export interface RuntimeOptions {
  difficulty: DifficultyMode
  reducedMotion: boolean
  highContrast: boolean
  showTimer: boolean
  mute: boolean
  volume: number
}

export function createRuntimeOptions(overrides: Partial<RuntimeOptions> = {}): RuntimeOptions {
  return {
    difficulty: 'classic-standard',
    reducedMotion: false,
    highContrast: false,
    showTimer: true,
    mute: false,
    volume: 1,
    ...overrides,
  }
}

export function readRuntimeOptions(searchParams: URLSearchParams): RuntimeOptions {
  return createRuntimeOptions({
    difficulty: readDifficulty(searchParams.get('difficulty')),
    reducedMotion: readBooleanFlag(searchParams.get('reducedMotion'), false),
    highContrast: readBooleanFlag(searchParams.get('highContrast'), false),
    showTimer: readBooleanFlag(searchParams.get('showTimer'), true),
    mute: readBooleanFlag(searchParams.get('mute'), false),
    volume: readVolume(searchParams.get('volume'), 1),
  })
}

function readDifficulty(value: string | null): DifficultyMode {
  return isDifficultyMode(value) ? value : 'classic-standard'
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
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : fallback
}
