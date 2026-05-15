import { isDifficultyMode } from '../game/difficulty'
import type { DifficultyMode, MatchMode, MatchWinner, PlayerId } from '../game/types'

export const SAVE_SCHEMA_VERSION = 1
export const SAVE_STORAGE_KEY = 'frogs-and-flies.save.v1'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface SaveSettings {
  difficulty: DifficultyMode
  showTimer: boolean
  reducedMotion: boolean
  highContrast: boolean
  mute: boolean
  masterVolume: number
  sfxVolume: number
  musicVolume: number
  monoAudio: boolean
  inputProfileId: string
}

export interface InputBinding {
  action: string
  codes: string[]
  playerId?: PlayerId
}

export interface InputProfile {
  id: string
  name: string
  bindings: InputBinding[]
}

export interface ScoreEntry {
  mode: MatchMode
  difficulty: DifficultyMode
  score: number
  winner?: MatchWinner
  playerId?: PlayerId
  catches: number
  attempts: number
  accuracy: number
  maxCombo: number
  seed: number
  completedAt: string
  durationSeconds: number
}

export interface AggregateStats {
  roundsStarted: number
  roundsCompleted: number
  totalCatches: number
  totalAttempts: number
  totalSplashes: number
  bestCombo: number
  totalPlaySeconds: number
}

export interface SaveData {
  version: typeof SAVE_SCHEMA_VERSION
  settings: SaveSettings
  highScores: {
    classicSingle: ScoreEntry[]
    localVersus: ScoreEntry[]
  }
  stats: AggregateStats
  inputProfiles: InputProfile[]
  completedRoundIds: string[]
  startedRoundIds: string[]
}

export type SaveLoadStatus = 'loaded' | 'defaulted' | 'invalid' | 'unsupported-version' | 'storage-unavailable'
export type SaveWriteStatus = 'saved' | 'invalid' | 'storage-unavailable'

export interface SaveWarning {
  status: SaveLoadStatus | SaveWriteStatus
  message: string
}

export interface SaveLoadResult {
  status: SaveLoadStatus
  data: SaveData
}

export interface SaveWriteResult {
  status: SaveWriteStatus
  data: SaveData
}

export type SaveImportStatus = 'imported' | 'invalid' | 'unsupported-version'

export interface SaveImportResult {
  status: SaveImportStatus
  data?: SaveData
}

export interface RoundPlayerSummary {
  id: PlayerId
  score: number
  catches: number
  attempts: number
  splashes: number
  maxCombo: number
}

export interface RoundCompletionSummary {
  roundId: string
  mode: MatchMode
  difficulty: DifficultyMode
  seed: number
  completedAt: string
  durationSeconds: number
  winner: MatchWinner
  players: RoundPlayerSummary[]
}

const HIGH_SCORE_LIMIT = 10

export function createDefaultSave(_now: () => string = () => new Date().toISOString()): SaveData {
  return {
    version: SAVE_SCHEMA_VERSION,
    settings: {
      difficulty: 'classic-standard',
      showTimer: true,
      reducedMotion: false,
      highContrast: false,
      mute: false,
      masterVolume: 1,
      sfxVolume: 1,
      musicVolume: 0.8,
      monoAudio: false,
      inputProfileId: 'default',
    },
    highScores: {
      classicSingle: [],
      localVersus: [],
    },
    stats: {
      roundsStarted: 0,
      roundsCompleted: 0,
      totalCatches: 0,
      totalAttempts: 0,
      totalSplashes: 0,
      bestCombo: 0,
      totalPlaySeconds: 0,
    },
    inputProfiles: [
      {
        id: 'default',
        name: 'Default',
        bindings: [],
      },
    ],
    completedRoundIds: [],
    startedRoundIds: [],
  }
}

export function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const values = new Map(Object.entries(initial))

  return {
    getItem(key: string): string | null {
      return values.get(key) ?? null
    },
    setItem(key: string, value: string): void {
      values.set(key, value)
    },
    removeItem(key: string): void {
      values.delete(key)
    },
  }
}

export function createSaveManager(options: {
  storage?: StorageLike
  now?: () => string
  onWarning?: (warning: SaveWarning) => void
} = {}) {
  const now = options.now ?? (() => new Date().toISOString())
  const storage = options.storage ?? getBrowserStorage()
  const warn = options.onWarning ?? (() => undefined)

  function defaults(status: SaveLoadStatus): SaveLoadResult {
    return {
      status,
      data: createDefaultSave(now),
    }
  }

  return {
    load(): SaveLoadResult {
      if (!storage) {
        warn({ status: 'storage-unavailable', message: 'Save storage is unavailable.' })
        return defaults('storage-unavailable')
      }

      let text: string | null
      try {
        text = storage.getItem(SAVE_STORAGE_KEY)
      } catch {
        warn({ status: 'storage-unavailable', message: 'Save storage could not be read.' })
        return defaults('storage-unavailable')
      }

      if (text === null) {
        return defaults('defaulted')
      }

      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        warn({ status: 'invalid', message: 'Save data is not valid JSON.' })
        return defaults('invalid')
      }

      if (isFutureVersion(parsed)) {
        warn({ status: 'unsupported-version', message: 'Save data uses an unsupported future version.' })
        return defaults('unsupported-version')
      }

      const data = migrate(parsed)
      if (!data) {
        warn({ status: 'invalid', message: 'Save data could not be validated.' })
        return defaults('invalid')
      }

      return {
        status: 'loaded',
        data,
      }
    },

    save(next: SaveData): SaveWriteResult {
      const data = migrate(next)
      if (!data) {
        warn({ status: 'invalid', message: 'Save data could not be validated.' })
        return {
          status: 'invalid',
          data: createDefaultSave(now),
        }
      }

      if (!storage) {
        warn({ status: 'storage-unavailable', message: 'Save storage is unavailable.' })
        return { status: 'storage-unavailable', data }
      }

      try {
        storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(data))
      } catch {
        warn({ status: 'storage-unavailable', message: 'Save storage could not be written.' })
        return { status: 'storage-unavailable', data }
      }

      return { status: 'saved', data }
    },

    reset(): SaveWriteResult {
      const data = createDefaultSave(now)
      if (!storage) {
        warn({ status: 'storage-unavailable', message: 'Save storage is unavailable.' })
        return { status: 'storage-unavailable', data }
      }

      try {
        storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(data))
      } catch {
        warn({ status: 'storage-unavailable', message: 'Save storage could not be reset.' })
        return { status: 'storage-unavailable', data }
      }

      return { status: 'saved', data }
    },
  }
}

export function migrate(raw: unknown): SaveData | undefined {
  if (!isRecord(raw) || raw.version !== SAVE_SCHEMA_VERSION) {
    return undefined
  }

  switch (raw.version) {
    case 1:
      return validateV1(raw)
    default:
      return undefined
  }
}

export function recordRoundStarted(save: SaveData, roundId: string): SaveData {
  if (save.startedRoundIds.includes(roundId)) {
    return cloneSave(save)
  }

  return {
    ...cloneSave(save),
    stats: {
      ...save.stats,
      roundsStarted: save.stats.roundsStarted + 1,
    },
    startedRoundIds: [...save.startedRoundIds, roundId],
  }
}

export function recordRoundCompleted(save: SaveData, summary: RoundCompletionSummary): SaveData {
  if (save.completedRoundIds.includes(summary.roundId)) {
    return cloneSave(save)
  }

  const entry = createScoreEntry(summary)
  const catches = summary.players.reduce((total, player) => total + player.catches, 0)
  const attempts = summary.players.reduce((total, player) => total + player.attempts, 0)
  const splashes = summary.players.reduce((total, player) => total + player.splashes, 0)
  const bestCombo = Math.max(save.stats.bestCombo, ...summary.players.map((player) => player.maxCombo))
  const highScores = cloneHighScores(save.highScores)
  const key = summary.mode === 'classic-single' ? 'classicSingle' : 'localVersus'
  highScores[key] = [...highScores[key], entry].sort((left, right) => right.score - left.score).slice(0, HIGH_SCORE_LIMIT)

  return {
    ...cloneSave(save),
    highScores,
    stats: {
      roundsStarted: save.stats.roundsStarted,
      roundsCompleted: save.stats.roundsCompleted + 1,
      totalCatches: save.stats.totalCatches + catches,
      totalAttempts: save.stats.totalAttempts + attempts,
      totalSplashes: save.stats.totalSplashes + splashes,
      bestCombo,
      totalPlaySeconds: save.stats.totalPlaySeconds + summary.durationSeconds,
    },
    completedRoundIds: [...save.completedRoundIds, summary.roundId],
  }
}

export function exportJson(save: SaveData): string {
  return JSON.stringify(cloneSave(save), null, 2)
}

export function importJson(json: string): SaveImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { status: 'invalid' }
  }

  if (isFutureVersion(parsed)) {
    return { status: 'unsupported-version' }
  }

  const data = migrate(parsed)
  return data ? { status: 'imported', data } : { status: 'invalid' }
}

function validateV1(raw: Record<string, unknown>): SaveData {
  const defaults = createDefaultSave()

  return {
    version: SAVE_SCHEMA_VERSION,
    settings: validateSettings(raw.settings, defaults.settings),
    highScores: validateHighScores(raw.highScores),
    stats: validateStats(raw.stats, defaults.stats),
    inputProfiles: validateInputProfiles(raw.inputProfiles, defaults.inputProfiles),
    completedRoundIds: validateStringArray(raw.completedRoundIds),
    startedRoundIds: validateStringArray(raw.startedRoundIds),
  }
}

function createScoreEntry(summary: RoundCompletionSummary): ScoreEntry {
  const player = pickScoringPlayer(summary)
  const attempts = Math.max(0, player?.attempts ?? 0)
  const catches = Math.max(0, player?.catches ?? 0)

  return {
    mode: summary.mode,
    difficulty: summary.difficulty,
    score: Math.max(0, player?.score ?? 0),
    winner: summary.winner,
    playerId: summary.winner === 'tie' ? undefined : player?.id,
    catches,
    attempts,
    accuracy: attempts > 0 ? catches / attempts : 0,
    maxCombo: Math.max(0, player?.maxCombo ?? 0),
    seed: summary.seed,
    completedAt: summary.completedAt,
    durationSeconds: summary.durationSeconds,
  }
}

function pickScoringPlayer(summary: RoundCompletionSummary): RoundPlayerSummary | undefined {
  if (summary.winner !== 'tie') {
    return summary.players.find((player) => player.id === summary.winner)
  }

  return [...summary.players].sort((left, right) => right.score - left.score)[0]
}

function cloneSave(save: SaveData): SaveData {
  return {
    version: SAVE_SCHEMA_VERSION,
    settings: { ...save.settings },
    highScores: cloneHighScores(save.highScores),
    stats: { ...save.stats },
    inputProfiles: save.inputProfiles.map((profile) => ({
      ...profile,
      bindings: profile.bindings.map((binding) => ({
        ...binding,
        codes: [...binding.codes],
      })),
    })),
    completedRoundIds: [...save.completedRoundIds],
    startedRoundIds: [...save.startedRoundIds],
  }
}

function cloneHighScores(highScores: SaveData['highScores']): SaveData['highScores'] {
  return {
    classicSingle: highScores.classicSingle.map((entry) => ({ ...entry })),
    localVersus: highScores.localVersus.map((entry) => ({ ...entry })),
  }
}

function validateSettings(raw: unknown, defaults: SaveSettings): SaveSettings {
  if (!isRecord(raw)) {
    return { ...defaults }
  }

  return {
    difficulty: isDifficultyMode(raw.difficulty) ? raw.difficulty : defaults.difficulty,
    showTimer: readBoolean(raw.showTimer, defaults.showTimer),
    reducedMotion: readBoolean(raw.reducedMotion, defaults.reducedMotion),
    highContrast: readBoolean(raw.highContrast, defaults.highContrast),
    mute: readBoolean(raw.mute, defaults.mute),
    masterVolume: readVolume(raw.masterVolume, defaults.masterVolume),
    sfxVolume: readVolume(raw.sfxVolume, defaults.sfxVolume),
    musicVolume: readVolume(raw.musicVolume, defaults.musicVolume),
    monoAudio: readBoolean(raw.monoAudio, defaults.monoAudio),
    inputProfileId: readString(raw.inputProfileId, defaults.inputProfileId),
  }
}

function validateHighScores(raw: unknown): SaveData['highScores'] {
  if (!isRecord(raw)) {
    return { classicSingle: [], localVersus: [] }
  }

  return {
    classicSingle: validateScoreEntries(raw.classicSingle, 'classic-single'),
    localVersus: validateScoreEntries(raw.localVersus, 'local-versus'),
  }
}

function validateScoreEntries(raw: unknown, mode: MatchMode): ScoreEntry[] {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw.flatMap((entry) => validateScoreEntry(entry, mode) ?? [])
}

function validateScoreEntry(raw: unknown, mode: MatchMode): ScoreEntry | undefined {
  if (!isRecord(raw) || raw.mode !== mode || !isDifficultyMode(raw.difficulty)) {
    return undefined
  }

  const score = readNonNegativeNumber(raw.score, Number.NaN)
  const catches = readNonNegativeNumber(raw.catches, Number.NaN)
  const attempts = readNonNegativeNumber(raw.attempts, Number.NaN)
  const maxCombo = readNonNegativeNumber(raw.maxCombo, Number.NaN)
  const seed = readNonNegativeNumber(raw.seed, Number.NaN)
  const durationSeconds = readNonNegativeNumber(raw.durationSeconds, Number.NaN)
  const completedAt = typeof raw.completedAt === 'string' ? raw.completedAt : ''
  if (![score, catches, attempts, maxCombo, seed, durationSeconds].every(Number.isFinite) || !completedAt) {
    return undefined
  }

  return {
    mode,
    difficulty: raw.difficulty,
    score,
    winner: isMatchWinner(raw.winner) ? raw.winner : undefined,
    playerId: isPlayerId(raw.playerId) ? raw.playerId : undefined,
    catches,
    attempts,
    accuracy: readVolume(raw.accuracy, attempts > 0 ? catches / attempts : 0),
    maxCombo,
    seed,
    completedAt,
    durationSeconds,
  }
}

function validateStats(raw: unknown, defaults: AggregateStats): AggregateStats {
  if (!isRecord(raw)) {
    return { ...defaults }
  }

  return {
    roundsStarted: readNonNegativeNumber(raw.roundsStarted, defaults.roundsStarted),
    roundsCompleted: readNonNegativeNumber(raw.roundsCompleted, defaults.roundsCompleted),
    totalCatches: readNonNegativeNumber(raw.totalCatches, defaults.totalCatches),
    totalAttempts: readNonNegativeNumber(raw.totalAttempts, defaults.totalAttempts),
    totalSplashes: readNonNegativeNumber(raw.totalSplashes, defaults.totalSplashes),
    bestCombo: readNonNegativeNumber(raw.bestCombo, defaults.bestCombo),
    totalPlaySeconds: readNonNegativeNumber(raw.totalPlaySeconds, defaults.totalPlaySeconds),
  }
}

function validateInputProfiles(raw: unknown, defaults: InputProfile[]): InputProfile[] {
  if (!Array.isArray(raw)) {
    return [...defaults]
  }

  const profiles = raw.flatMap((profile) => validateInputProfile(profile) ?? [])
  return profiles.length > 0 ? profiles : [...defaults]
}

function validateInputProfile(raw: unknown): InputProfile | undefined {
  if (!isRecord(raw) || typeof raw.id !== 'string' || typeof raw.name !== 'string' || !Array.isArray(raw.bindings)) {
    return undefined
  }

  return {
    id: raw.id,
    name: raw.name,
    bindings: raw.bindings.flatMap((binding) => validateInputBinding(binding) ?? []),
  }
}

function validateInputBinding(raw: unknown): InputBinding | undefined {
  if (!isRecord(raw) || typeof raw.action !== 'string' || !Array.isArray(raw.codes)) {
    return undefined
  }

  return {
    action: raw.action,
    codes: validateStringArray(raw.codes),
    playerId: isPlayerId(raw.playerId) ? raw.playerId : undefined,
  }
}

function getBrowserStorage(): StorageLike | undefined {
  try {
    return typeof globalThis.localStorage === 'undefined' ? undefined : globalThis.localStorage
  } catch {
    return undefined
  }
}

function isFutureVersion(raw: unknown): boolean {
  return isRecord(raw) && typeof raw.version === 'number' && raw.version > SAVE_SCHEMA_VERSION
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function readVolume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, 0, 1) : fallback
}

function readNonNegativeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback
}

function validateStringArray(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((value): value is string => typeof value === 'string') : []
}

function isPlayerId(value: unknown): value is PlayerId {
  return value === 'p1' || value === 'p2'
}

function isMatchWinner(value: unknown): value is MatchWinner {
  return value === 'p1' || value === 'p2' || value === 'tie'
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
