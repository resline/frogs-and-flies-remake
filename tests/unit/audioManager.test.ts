import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { createGame } from '../../src/game/createGame'
import { insertEntity } from '../../src/game/entities'
import { drainGameplayAudioEvents, updateGame } from '../../src/game/update'
import { LOCAL_AUDIO_ASSET_REGISTRY, createAudioManager } from '../../src/runtime/audio'

const STEP_SECONDS = 1 / 60

type FakeAudioNode = {
  connect: ReturnType<typeof vi.fn>
}

type AudioManagerV1 = ReturnType<typeof createAudioManager> & {
  setMasterVolume?: (volume: number) => void
  setSfxVolume?: (volume: number) => void
  setMusicVolume?: (volume: number) => void
  setMonoAudio?: (enabled: boolean) => void
  playMusic?: (trackName: 'homePondLoop') => void
  stopMusic?: () => void
}

class FakeAudioContext {
  currentTime = 0
  destination: FakeAudioNode = { connect: vi.fn() }
  resumeCalls = 0
  createdOscillators: FakeAudioNode[] = []
  createdGains: (FakeAudioNode & { gain: { value: number; setValueAtTime: ReturnType<typeof vi.fn> } })[] = []
  state: AudioContextState = 'suspended'

  createGain(): FakeAudioNode & { gain: { value: number; setValueAtTime: ReturnType<typeof vi.fn> } } {
    const gain = {
      connect: vi.fn(),
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
      },
    }
    this.createdGains.push(gain)
    return gain
  }

  createOscillator(): FakeAudioNode & {
    frequency: { setValueAtTime: ReturnType<typeof vi.fn> }
    start: ReturnType<typeof vi.fn>
    stop: ReturnType<typeof vi.fn>
    type: OscillatorType
  } {
    const oscillator = {
      connect: vi.fn(),
      frequency: { setValueAtTime: vi.fn() },
      start: vi.fn(),
      stop: vi.fn(),
      type: 'sine' as OscillatorType,
    }
    this.createdOscillators.push(oscillator)
    return oscillator
  }

  resume(): Promise<void> {
    this.resumeCalls += 1
    this.state = 'running'
    return Promise.resolve()
  }
}

function asAudioManagerV1(audio: ReturnType<typeof createAudioManager>): AudioManagerV1 {
  return audio as AudioManagerV1
}

function isLikelyMp3(bytes: Uint8Array): boolean {
  const hasId3Header = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33
  const hasMpegFrameSync = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0
  return hasId3Header || hasMpegFrameSync
}

function startGame(seed = 1) {
  const game = createGame({ seed })
  game.commands.start = true
  updateGame(game, STEP_SECONDS)
  drainGameplayAudioEvents(game)
  return game
}

function advanceFrames(game: ReturnType<typeof createGame>, frames: number, frameCommands?: (frame: number) => void): void {
  for (let frame = 0; frame < frames; frame += 1) {
    frameCommands?.(frame)
    updateGame(game, STEP_SECONDS)
  }
}

describe('audio manager', () => {
  it('fulfills every registered local audio asset path with MP3 files', () => {
    const paths = [
      ...Object.values(LOCAL_AUDIO_ASSET_REGISTRY.sfx).flatMap((entry) => entry ?? []),
      ...Object.values(LOCAL_AUDIO_ASSET_REGISTRY.music).flatMap((entry) => entry ?? []),
    ]

    expect(paths).toEqual([
      '/audio/sfx/jump.mp3',
      '/audio/sfx/tongue.mp3',
      '/audio/sfx/catch.mp3',
      '/audio/sfx/miss.mp3',
      '/audio/sfx/splash.mp3',
      '/audio/sfx/power.mp3',
      '/audio/sfx/start.mp3',
      '/audio/sfx/pause.mp3',
      '/audio/sfx/results.mp3',
      '/audio/music/home-pond-loop.mp3',
    ])

    for (const path of paths) {
      const absolutePath = new URL(`../../public${path}`, import.meta.url)
      expect(existsSync(absolutePath), `${path} exists`).toBe(true)
      const bytes = readFileSync(absolutePath)
      expect(bytes.length, `${path} file size`).toBeGreaterThan(256)
      expect(isLikelyMp3(bytes), `${path} MP3 signature`).toBe(true)
    }
  })

  it('starts locked, unlocks from an explicit gesture, and flushes queued SFX', async () => {
    const context = new FakeAudioContext()
    const audio = createAudioManager({ contextFactory: () => context as unknown as AudioContext })

    expect(audio.getState()).toMatchObject({
      unlocked: false,
      muted: false,
      volume: 1,
      pendingSfxCount: 0,
    })

    audio.playSfx('jump')

    expect(audio.getState().pendingSfxCount).toBe(1)
    expect(context.createdOscillators).toHaveLength(0)

    await expect(audio.unlock()).resolves.toBe(true)

    expect(context.resumeCalls).toBe(1)
    expect(context.createdOscillators).toHaveLength(1)
    expect(context.createdOscillators[0]?.connect).toHaveBeenCalled()
    expect(audio.getState()).toMatchObject({
      unlocked: true,
      pendingSfxCount: 0,
    })
  })

  it('toggles mute and clamps volume before playback', async () => {
    const context = new FakeAudioContext()
    const audio = createAudioManager({ contextFactory: () => context as unknown as AudioContext })

    audio.setVolume(1.8)
    expect(audio.getState().volume).toBe(1)

    audio.setVolume(-0.25)
    expect(audio.getState().volume).toBe(0)

    audio.setVolume(0.35)
    await audio.unlock()
    audio.setMuted(true)
    audio.playSfx('catch')

    expect(audio.getState().muted).toBe(true)
    expect(context.createdOscillators).toHaveLength(0)

    audio.setMuted(false)
    audio.playSfx('catch')

    expect(audio.getState().muted).toBe(false)
    expect(context.createdOscillators).toHaveLength(1)
  })

  it('clamps master, SFX, and music buses independently', () => {
    const audio = asAudioManagerV1(createAudioManager())

    expect(typeof audio.setMasterVolume).toBe('function')
    expect(typeof audio.setSfxVolume).toBe('function')
    expect(typeof audio.setMusicVolume).toBe('function')

    audio.setMasterVolume?.(1.8)
    audio.setSfxVolume?.(-0.25)
    audio.setMusicVolume?.(0.45)

    expect(audio.getState()).toMatchObject({
      masterVolume: 1,
      sfxVolume: 0,
      musicVolume: 0.45,
    })
  })

  it('mutes master output for both SFX and music without losing bus levels', async () => {
    const context = new FakeAudioContext()
    const audio = asAudioManagerV1(
      createAudioManager({
        contextFactory: () => context as unknown as AudioContext,
        masterVolume: 0.75,
        sfxVolume: 0.5,
        musicVolume: 0.25,
      } as Parameters<typeof createAudioManager>[0]),
    )

    await audio.unlock()
    audio.setMuted(true)
    audio.playSfx('catch')
    audio.playMusic?.('homePondLoop')

    expect(context.createdOscillators).toHaveLength(0)
    expect(audio.getState()).toMatchObject({
      muted: true,
      masterVolume: 0.75,
      sfxVolume: 0.5,
      musicVolume: 0.25,
      musicPlaying: false,
    })
  })

  it('stores mono audio preference in manager state', () => {
    const audio = asAudioManagerV1(createAudioManager())

    expect(typeof audio.setMonoAudio).toBe('function')

    audio.setMonoAudio?.(true)

    expect(audio.getState()).toMatchObject({
      monoAudio: true,
    })
  })

  it('falls back to procedural SFX when registered local audio assets are missing', async () => {
    const context = new FakeAudioContext()
    const audio = createAudioManager({
      contextFactory: () => context as unknown as AudioContext,
      assetRegistry: {
        sfx: { jump: ['/audio/sfx/missing-jump.mp3'] },
        music: { homePondLoop: ['/audio/music/missing-loop.mp3'] },
      },
      fetchArrayBuffer: () => Promise.reject(new Error('missing asset')),
    } as Parameters<typeof createAudioManager>[0])

    await audio.unlock()

    expect(() => audio.playSfx('jump')).not.toThrow()
    expect(context.createdOscillators).toHaveLength(1)
  })

  it('keeps unlock gesture-driven when music is requested before unlock', () => {
    const context = new FakeAudioContext()
    const audio = asAudioManagerV1(createAudioManager({ contextFactory: () => context as unknown as AudioContext }))

    audio.playMusic?.('homePondLoop')

    expect(audio.getState()).toMatchObject({
      unlocked: false,
      musicPlaying: false,
    })
    expect(context.resumeCalls).toBe(0)
  })

  it('keeps the queued SFX limit when locked', () => {
    const audio = createAudioManager()

    for (let index = 0; index < 18; index += 1) {
      audio.playSfx('jump')
    }

    expect(audio.getState().pendingSfxCount).toBe(16)
  })

  it('does not throw when audio context creation or playback fails', async () => {
    const audio = createAudioManager({
      contextFactory: () => {
        throw new Error('audio disabled')
      },
    })

    expect(() => audio.playSfx('start')).not.toThrow()
    await expect(audio.unlock()).resolves.toBe(false)
    expect(() => audio.playSfx('results')).not.toThrow()
    expect(audio.getState()).toMatchObject({
      available: false,
      unlocked: false,
    })
  })
})

describe('gameplay audio events', () => {
  it('queues phase transition SFX events and drains them once', () => {
    const game = createGame({ durationSeconds: 0.05, theEndSeconds: 0.05 })

    game.commands.start = true
    updateGame(game, 0)
    expect(drainGameplayAudioEvents(game)).toEqual(['start'])
    expect(drainGameplayAudioEvents(game)).toEqual([])

    game.commands.pause = true
    updateGame(game, 0)
    expect(drainGameplayAudioEvents(game)).toEqual(['pause'])

    game.commands.resume = true
    updateGame(game, 0)
    expect(drainGameplayAudioEvents(game)).toEqual(['resume'])

    updateGame(game, 0.06)
    expect(drainGameplayAudioEvents(game)).toEqual(['the-end'])

    updateGame(game, 0.06)
    expect(drainGameplayAudioEvents(game)).toEqual(['results'])
  })

  it('queues tongue, catch, miss, power, jump, and splash SFX events', () => {
    const game = startGame()

    insertEntity(game, { id: 10, kind: 'fly', x: game.player.homeX, y: game.player.homeY, vx: 0, radius: 8 })
    game.commands.fire = true
    updateGame(game, STEP_SECONDS)
    expect(drainGameplayAudioEvents(game)).toEqual(['tongue', 'catch'])

    advanceFrames(game, 24)
    drainGameplayAudioEvents(game)

    game.commands.fire = true
    updateGame(game, STEP_SECONDS)
    expect(drainGameplayAudioEvents(game)).toEqual(['tongue'])

    updateGame(game, 0.22)
    expect(drainGameplayAudioEvents(game)).toEqual(['miss'])

    insertEntity(game, { id: 11, kind: 'power', powerKind: 'rush', x: game.player.homeX, y: game.player.homeY, vx: 0, radius: 8 })
    updateGame(game, STEP_SECONDS)
    expect(drainGameplayAudioEvents(game)).toEqual(['power'])

    advanceFrames(game, 30, () => {
      game.commands.chargeJump = true
    })
    game.commands.releaseJump = true
    updateGame(game, STEP_SECONDS)
    expect(drainGameplayAudioEvents(game)).toEqual(['jump'])

    advanceFrames(game, 90)
    expect(drainGameplayAudioEvents(game)).toContain('splash')
  })
})
