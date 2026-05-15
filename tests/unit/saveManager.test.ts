import { describe, expect, it } from 'vitest'
import * as saveApi from '../../src/runtime/save'
import { readRuntimeOptions } from '../../src/runtime/options'
import { readRuntimeParams } from '../../src/runtime/params'

const { SAVE_STORAGE_KEY, createDefaultSave, createMemoryStorage } = saveApi

describe('SaveManager defaults', () => {
  it('creates the v1 default save schema', () => {
    const save = createDefaultSave()

    expect(save.version).toBe(1)
    expect(save.settings.difficulty).toBe('classic-standard')
    expect(save.highScores.classicSingle).toEqual([])
    expect(save.highScores.localVersus).toEqual([])
    expect(save.stats.roundsStarted).toBe(0)
  })
})

describe('SaveManager storage resilience', () => {
  const createSaveManager = () => {
    const candidate = (saveApi as { createSaveManager?: unknown }).createSaveManager
    if (typeof candidate !== 'function') {
      throw new Error('createSaveManager is not implemented')
    }
    return candidate as (options?: {
      storage?: saveApi.StorageLike
      now?: () => string
      onWarning?: (warning: unknown) => void
    }) => {
      load(): { status: string; data: saveApi.SaveData }
    }
  }

  it('returns defaults with defaulted status when the save key is missing', () => {
    const manager = createSaveManager()({
      storage: createMemoryStorage(),
    })

    const result = manager.load()

    expect(result.status).toBe('defaulted')
    expect(result.data).toEqual(createDefaultSave())
  })

  it('returns defaults with invalid status when storage contains malformed JSON', () => {
    const manager = createSaveManager()({
      storage: createMemoryStorage({ [SAVE_STORAGE_KEY]: '{not-json' }),
    })

    const result = manager.load()

    expect(result.status).toBe('invalid')
    expect(result.data).toEqual(createDefaultSave())
  })

  it('returns defaults with unsupported-version status for future saves', () => {
    const manager = createSaveManager()({
      storage: createMemoryStorage({ [SAVE_STORAGE_KEY]: JSON.stringify({ version: 99 }) }),
    })

    const result = manager.load()

    expect(result.status).toBe('unsupported-version')
    expect(result.data).toEqual(createDefaultSave())
  })

  it('returns defaults with storage-unavailable status when storage throws', () => {
    const unavailableStorage: saveApi.StorageLike = {
      getItem() {
        throw new Error('blocked')
      },
      setItem() {
        throw new Error('blocked')
      },
      removeItem() {
        throw new Error('blocked')
      },
    }
    const manager = createSaveManager()({ storage: unavailableStorage })

    const result = manager.load()

    expect(result.status).toBe('storage-unavailable')
    expect(result.data).toEqual(createDefaultSave())
  })

  it('repairs invalid primitive ranges back to safe defaults', () => {
    const raw = createDefaultSave()
    raw.settings.difficulty = 'classic-expert'
    raw.settings.masterVolume = 3
    raw.settings.sfxVolume = -1
    raw.settings.musicVolume = Number.NaN
    raw.stats.roundsStarted = -4
    raw.stats.bestCombo = 6
    const manager = createSaveManager()({
      storage: createMemoryStorage({ [SAVE_STORAGE_KEY]: JSON.stringify(raw) }),
    })

    const result = manager.load()

    expect(result.status).toBe('loaded')
    expect(result.data.settings.difficulty).toBe('classic-expert')
    expect(result.data.settings.masterVolume).toBe(1)
    expect(result.data.settings.sfxVolume).toBe(0)
    expect(result.data.settings.musicVolume).toBe(0.8)
    expect(result.data.stats.roundsStarted).toBe(0)
    expect(result.data.stats.bestCombo).toBe(6)
  })
})

describe('SaveManager round stats and high scores', () => {
  const recordRoundStarted = () => {
    const candidate = (saveApi as { recordRoundStarted?: unknown }).recordRoundStarted
    if (typeof candidate !== 'function') {
      throw new Error('recordRoundStarted is not implemented')
    }
    return candidate as (save: saveApi.SaveData, roundId: string) => saveApi.SaveData
  }

  const recordRoundCompleted = () => {
    const candidate = (saveApi as { recordRoundCompleted?: unknown }).recordRoundCompleted
    if (typeof candidate !== 'function') {
      throw new Error('recordRoundCompleted is not implemented')
    }
    return candidate as (save: saveApi.SaveData, summary: RoundSummary) => saveApi.SaveData
  }

  interface RoundSummary {
    roundId: string
    mode: 'classic-single' | 'local-versus'
    difficulty: 'classic-standard' | 'classic-expert'
    seed: number
    completedAt: string
    durationSeconds: number
    winner: 'p1' | 'p2' | 'tie'
    players: {
      id: 'p1' | 'p2'
      score: number
      catches: number
      attempts: number
      splashes: number
      maxCombo: number
    }[]
  }

  function summary(overrides: Partial<RoundSummary> = {}): RoundSummary {
    return {
      roundId: 'round-1',
      mode: 'classic-single',
      difficulty: 'classic-standard',
      seed: 42,
      completedAt: '2026-05-15T12:00:00.000Z',
      durationSeconds: 180,
      winner: 'p1',
      players: [
        { id: 'p1', score: 120, catches: 8, attempts: 10, splashes: 2, maxCombo: 4 },
        { id: 'p2', score: 80, catches: 5, attempts: 9, splashes: 3, maxCombo: 2 },
      ],
      ...overrides,
    }
  }

  it('increments rounds started once for a round id', () => {
    const save = createDefaultSave()

    const first = recordRoundStarted()(save, 'round-1')
    const second = recordRoundStarted()(first, 'round-1')

    expect(save.stats.roundsStarted).toBe(0)
    expect(first.stats.roundsStarted).toBe(1)
    expect(second.stats.roundsStarted).toBe(1)
    expect(second.startedRoundIds).toEqual(['round-1'])
  })

  it('increments completed aggregate stats once for a round id', () => {
    const save = createDefaultSave()

    const first = recordRoundCompleted()(save, summary())
    const second = recordRoundCompleted()(first, summary())

    expect(first.stats.roundsCompleted).toBe(1)
    expect(first.stats.totalCatches).toBe(13)
    expect(first.stats.totalAttempts).toBe(19)
    expect(first.stats.totalSplashes).toBe(5)
    expect(first.stats.bestCombo).toBe(4)
    expect(first.stats.totalPlaySeconds).toBe(180)
    expect(second.stats).toEqual(first.stats)
    expect(second.completedRoundIds).toEqual(['round-1'])
  })

  it('keeps Classic Single high scores sorted descending and capped to ten entries', () => {
    let save = createDefaultSave()
    for (let index = 0; index < 12; index += 1) {
      save = recordRoundCompleted()(
        save,
        summary({
          roundId: `classic-${index}`,
          players: [
            { id: 'p1', score: index * 10, catches: index, attempts: 10, splashes: 0, maxCombo: index },
            { id: 'p2', score: 0, catches: 0, attempts: 0, splashes: 0, maxCombo: 0 },
          ],
        }),
      )
    }

    expect(save.highScores.classicSingle).toHaveLength(10)
    expect(save.highScores.classicSingle.map((entry) => entry.score)).toEqual([110, 100, 90, 80, 70, 60, 50, 40, 30, 20])
  })

  it('records Local Versus winner or tie without claiming global authority', () => {
    const save = recordRoundCompleted()(
      createDefaultSave(),
      summary({
        mode: 'local-versus',
        winner: 'tie',
        players: [
          { id: 'p1', score: 90, catches: 6, attempts: 8, splashes: 1, maxCombo: 3 },
          { id: 'p2', score: 90, catches: 6, attempts: 7, splashes: 2, maxCombo: 4 },
        ],
      }),
    )

    expect(save.highScores.localVersus).toHaveLength(1)
    expect(save.highScores.localVersus[0]).toMatchObject({
      mode: 'local-versus',
      winner: 'tie',
      score: 90,
      playerId: undefined,
    })
    expect(save.highScores.classicSingle).toEqual([])
  })

  it('writes complete score entry fields for a completed round', () => {
    const save = recordRoundCompleted()(createDefaultSave(), summary())

    expect(save.highScores.classicSingle[0]).toEqual({
      mode: 'classic-single',
      difficulty: 'classic-standard',
      score: 120,
      winner: 'p1',
      playerId: 'p1',
      catches: 8,
      attempts: 10,
      accuracy: 0.8,
      maxCombo: 4,
      seed: 42,
      completedAt: '2026-05-15T12:00:00.000Z',
      durationSeconds: 180,
    })
  })
})

describe('SaveManager import and export', () => {
  const exportJson = () => {
    const candidate = (saveApi as { exportJson?: unknown }).exportJson
    if (typeof candidate !== 'function') {
      throw new Error('exportJson is not implemented')
    }
    return candidate as (save: saveApi.SaveData) => string
  }

  const importJson = () => {
    const candidate = (saveApi as { importJson?: unknown }).importJson
    if (typeof candidate !== 'function') {
      throw new Error('importJson is not implemented')
    }
    return candidate as (json: string) => { status: string; data?: saveApi.SaveData }
  }

  it('exports stable pretty JSON containing version and subdocuments', () => {
    const json = exportJson()(createDefaultSave())

    expect(json).toContain('{\n  "version": 1,')
    expect(json).toContain('"settings"')
    expect(json).toContain('"highScores"')
    expect(json).toContain('"stats"')
    expect(JSON.parse(json)).toEqual(createDefaultSave())
  })

  it('imports only validated save JSON', () => {
    const save = createDefaultSave()
    save.settings.highContrast = true

    const result = importJson()(JSON.stringify(save))

    expect(result.status).toBe('imported')
    expect(result.data?.settings.highContrast).toBe(true)
    expect(result.data?.version).toBe(1)
  })

  it('rejects malformed JSON and unsupported versions', () => {
    expect(importJson()('{nope')).toEqual({ status: 'invalid' })
    expect(importJson()(JSON.stringify({ version: 99 }))).toEqual({ status: 'unsupported-version' })
  })

  it('round-trips input profiles through export and import', () => {
    const save = createDefaultSave()
    save.inputProfiles = [
      {
        id: 'lefty',
        name: 'Lefty',
        bindings: [{ action: 'p1.jump', codes: ['KeyW'], playerId: 'p1' }],
      },
    ]

    const result = importJson()(exportJson()(save))

    expect(result.status).toBe('imported')
    expect(result.data?.inputProfiles).toEqual(save.inputProfiles)
  })
})

describe('runtime options saved defaults', () => {
  it('merges saved settings before URL option overrides without mutating the save settings', () => {
    const savedSettings = {
      ...createDefaultSave().settings,
      difficulty: 'classic-expert' as const,
      highContrast: true,
      mute: true,
      masterVolume: 0.35,
    }

    const options = readRuntimeOptions(new URLSearchParams('difficulty=classic-assist&mute=0'), savedSettings)

    expect(options.difficulty).toBe('classic-assist')
    expect(options.highContrast).toBe(true)
    expect(options.mute).toBe(false)
    expect(options.volume).toBe(0.35)
    expect(savedSettings).toMatchObject({
      difficulty: 'classic-expert',
      highContrast: true,
      mute: true,
      masterVolume: 0.35,
    })
  })

  it('passes saved settings through runtime params before URL overrides', () => {
    const savedSettings = {
      ...createDefaultSave().settings,
      reducedMotion: true,
      showTimer: false,
      masterVolume: 0.25,
    }

    const params = readRuntimeParams(new URLSearchParams('showTimer=1&volume=0.75'), savedSettings)

    expect(params.options.reducedMotion).toBe(true)
    expect(params.options.showTimer).toBe(true)
    expect(params.options.volume).toBe(0.75)
  })
})
