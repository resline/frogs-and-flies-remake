import type { GameplayAudioEventName } from '../game/types'

export type AudioManagerState = {
  available: boolean
  unlocked: boolean
  muted: boolean
  volume: number
  masterVolume: number
  sfxVolume: number
  musicVolume: number
  monoAudio: boolean
  musicPlaying: boolean
  musicTrackName?: AudioMusicTrackName
  pendingSfxCount: number
}

export type AudioManager = {
  getState: () => AudioManagerState
  unlock: () => Promise<boolean>
  setMuted: (muted: boolean) => void
  setVolume: (volume: number) => void
  setMasterVolume: (volume: number) => void
  setSfxVolume: (volume: number) => void
  setMusicVolume: (volume: number) => void
  setMonoAudio: (enabled: boolean) => void
  playMusic: (trackName: AudioMusicTrackName) => void
  stopMusic: () => void
  playSfx: (eventName: GameplayAudioEventName) => void
}

export type AudioBusName = 'master' | 'sfx' | 'music' | 'ui'
export type AudioMusicTrackName = 'homePondLoop'

export interface AudioAssetRegistry {
  sfx: Partial<Record<GameplayAudioEventName, readonly string[]>>
  music: Partial<Record<AudioMusicTrackName, readonly string[]>>
}

export interface AudioManagerOptions {
  contextFactory?: () => AudioContext
  muted?: boolean
  volume?: number
  masterVolume?: number
  sfxVolume?: number
  musicVolume?: number
  monoAudio?: boolean
  assetRegistry?: AudioAssetRegistry
  fetchArrayBuffer?: (path: string) => Promise<ArrayBuffer>
}

type SfxShape = {
  duration: number
  frequency: number
  gain: number
  type: OscillatorType
}

const MAX_PENDING_SFX = 16

export const LOCAL_AUDIO_ASSET_REGISTRY: AudioAssetRegistry = {
  sfx: {
    jump: ['/audio/sfx/jump.mp3'],
    tongue: ['/audio/sfx/tongue.mp3'],
    catch: ['/audio/sfx/catch.mp3'],
    miss: ['/audio/sfx/miss.mp3'],
    splash: ['/audio/sfx/splash.mp3'],
    power: ['/audio/sfx/power.mp3'],
    start: ['/audio/sfx/start.mp3'],
    pause: ['/audio/sfx/pause.mp3'],
    results: ['/audio/sfx/results.mp3'],
  },
  music: {
    homePondLoop: ['/audio/music/home-pond-loop.mp3'],
  },
}

const SFX_SHAPES: Record<GameplayAudioEventName, SfxShape> = {
  jump: { duration: 0.12, frequency: 420, gain: 0.09, type: 'triangle' },
  tongue: { duration: 0.08, frequency: 620, gain: 0.08, type: 'square' },
  catch: { duration: 0.14, frequency: 860, gain: 0.1, type: 'sine' },
  miss: { duration: 0.14, frequency: 170, gain: 0.08, type: 'sawtooth' },
  splash: { duration: 0.18, frequency: 120, gain: 0.09, type: 'triangle' },
  power: { duration: 0.18, frequency: 980, gain: 0.1, type: 'sine' },
  start: { duration: 0.12, frequency: 520, gain: 0.08, type: 'triangle' },
  pause: { duration: 0.1, frequency: 260, gain: 0.07, type: 'sine' },
  resume: { duration: 0.1, frequency: 460, gain: 0.07, type: 'sine' },
  'the-end': { duration: 0.26, frequency: 220, gain: 0.1, type: 'sawtooth' },
  results: { duration: 0.22, frequency: 700, gain: 0.09, type: 'triangle' },
}

export function createAudioManager(options: AudioManagerOptions = {}): AudioManager {
  const contextFactory = options.contextFactory ?? createBrowserAudioContext
  const assetRegistry = options.assetRegistry ?? LOCAL_AUDIO_ASSET_REGISTRY
  const fetchArrayBuffer = options.fetchArrayBuffer
  const pendingSfx: GameplayAudioEventName[] = []
  let context: AudioContext | undefined
  let available = true
  let unlocked = false
  let muted = Boolean(options.muted)
  let masterVolume = clamp01(options.masterVolume ?? options.volume ?? 1)
  let sfxVolume = clamp01(options.sfxVolume ?? 1)
  let musicVolume = clamp01(options.musicVolume ?? 0.8)
  let monoAudio = Boolean(options.monoAudio)
  let musicPlaying = false
  let musicTrackName: AudioMusicTrackName | undefined

  const ensureContext = (): AudioContext | undefined => {
    if (!available) {
      return undefined
    }

    if (context) {
      return context
    }

    try {
      context = contextFactory()
      return context
    } catch {
      available = false
      return undefined
    }
  }

  const playNow = (eventName: GameplayAudioEventName): void => {
    if (muted || masterVolume <= 0 || sfxVolume <= 0) {
      return
    }

    const assetPaths = assetRegistry.sfx[eventName] ?? []
    if (fetchArrayBuffer && assetPaths.length > 0) {
      void fetchArrayBuffer(assetPaths[0]).catch(() => undefined)
    }

    const audioContext = ensureContext()
    if (!audioContext) {
      return
    }

    try {
      const shape = SFX_SHAPES[eventName]
      const now = audioContext.currentTime
      const gain = audioContext.createGain()
      const oscillator = audioContext.createOscillator()

      oscillator.type = shape.type
      oscillator.frequency.setValueAtTime(shape.frequency, now)
      gain.gain.setValueAtTime(shape.gain * masterVolume * sfxVolume, now)
      oscillator.connect(gain)
      gain.connect(audioContext.destination)
      oscillator.start(now)
      oscillator.stop(now + shape.duration)
    } catch {
      available = false
    }
  }

  const flushPendingSfx = (): void => {
    const events = pendingSfx.splice(0, pendingSfx.length)
    for (const eventName of events) {
      playNow(eventName)
    }
  }

  return {
    getState: () => ({
      available,
      unlocked,
      muted,
      volume: masterVolume,
      masterVolume,
      sfxVolume,
      musicVolume,
      monoAudio,
      musicPlaying,
      musicTrackName,
      pendingSfxCount: pendingSfx.length,
    }),
    unlock: async () => {
      const audioContext = ensureContext()
      if (!audioContext) {
        return false
      }

      try {
        if (audioContext.state === 'suspended') {
          await audioContext.resume()
        }
        unlocked = true
        flushPendingSfx()
        return true
      } catch {
        available = false
        return false
      }
    },
    setMuted: (nextMuted) => {
      muted = nextMuted
      if (muted) {
        pendingSfx.splice(0, pendingSfx.length)
        musicPlaying = false
        musicTrackName = undefined
      }
    },
    setVolume: (nextVolume) => {
      masterVolume = clamp01(nextVolume)
      if (masterVolume <= 0) {
        musicPlaying = false
        musicTrackName = undefined
      }
    },
    setMasterVolume: (nextVolume) => {
      masterVolume = clamp01(nextVolume)
      if (masterVolume <= 0) {
        musicPlaying = false
        musicTrackName = undefined
      }
    },
    setSfxVolume: (nextVolume) => {
      sfxVolume = clamp01(nextVolume)
    },
    setMusicVolume: (nextVolume) => {
      musicVolume = clamp01(nextVolume)
      if (musicVolume <= 0) {
        musicPlaying = false
        musicTrackName = undefined
      }
    },
    setMonoAudio: (enabled) => {
      monoAudio = enabled
    },
    playMusic: (trackName) => {
      if (!unlocked || muted || masterVolume <= 0 || musicVolume <= 0) {
        return
      }

      const assetPaths = assetRegistry.music[trackName] ?? []
      if (fetchArrayBuffer && assetPaths.length > 0) {
        void fetchArrayBuffer(assetPaths[0]).catch(() => undefined)
      }

      if (!ensureContext()) {
        return
      }

      musicPlaying = true
      musicTrackName = trackName
    },
    stopMusic: () => {
      musicPlaying = false
      musicTrackName = undefined
    },
    playSfx: (eventName) => {
      if (muted || masterVolume <= 0 || sfxVolume <= 0) {
        return
      }

      if (!unlocked) {
        pendingSfx.push(eventName)
        if (pendingSfx.length > MAX_PENDING_SFX) {
          pendingSfx.shift()
        }
        return
      }

      playNow(eventName)
    },
  }
}

function createBrowserAudioContext(): AudioContext {
  const AudioContextConstructor =
    globalThis.AudioContext ??
    (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!AudioContextConstructor) {
    throw new Error('Web Audio API is unavailable')
  }

  return new AudioContextConstructor()
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1
}
