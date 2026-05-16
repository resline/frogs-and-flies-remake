import type { GamePhase } from '../game/types'
import { readRuntimeOptions, type RuntimeOptions, type RuntimeOptionsDefaults } from './options'

export type RuntimeMode = 'classic-single' | 'local-versus'

export type RuntimeParams = {
  seed: number
  mode: RuntimeMode
  durationSeconds?: number
  theEndSeconds?: number
  smokeState?: GamePhase
  smokeElapsedSeconds?: number
  campaignSmokeScore?: number
  campaignSmokeCatches?: number
  simulationSpeed: number
  options: RuntimeOptions
}

export function readRuntimeParams(searchParams: URLSearchParams, savedDefaults: RuntimeOptionsDefaults = {}): RuntimeParams {
  return {
    seed: readPositiveInteger(searchParams.get('seed'), 1),
    mode: readMode(searchParams.get('mode')),
    smokeState: readPhase(searchParams.get('smokeState')),
    smokeElapsedSeconds: readNonNegativeNumber(searchParams.get('smokeElapsedSeconds')),
    campaignSmokeScore: readNonNegativeNumber(searchParams.get('campaignSmokeScore')),
    campaignSmokeCatches: readNonNegativeNumber(searchParams.get('campaignSmokeCatches')),
    durationSeconds: readNonNegativeNumber(searchParams.get('durationSeconds')),
    theEndSeconds: readNonNegativeNumber(searchParams.get('theEndSeconds')),
    simulationSpeed: readPositiveNumber(searchParams.get('simulationSpeed'), 1),
    options: readRuntimeOptions(searchParams, savedDefaults),
  }
}

function readPositiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function readNonNegativeNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined
  }

  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

function readPositiveNumber(value: string | null, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function readMode(value: string | null): RuntimeMode {
  return value === 'local-versus' ? 'local-versus' : 'classic-single'
}

function readPhase(value: string | null): GamePhase | undefined {
  if (value === 'start' || value === 'gameplay' || value === 'pause' || value === 'the-end' || value === 'results') {
    return value
  }
  return undefined
}
