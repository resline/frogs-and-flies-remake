import { describe, expect, it, vi } from 'vitest'
import { createGame } from '../../src/game/createGame'
import { insertEntity } from '../../src/game/entities'
import { drainGameplayAudioEvents, updateGame } from '../../src/game/update'
import { createAudioManager } from '../../src/runtime/audio'

const STEP_SECONDS = 1 / 60

type FakeAudioNode = {
  connect: ReturnType<typeof vi.fn>
}

class FakeAudioContext {
  currentTime = 0
  destination: FakeAudioNode = { connect: vi.fn() }
  resumeCalls = 0
  createdOscillators: FakeAudioNode[] = []
  state: AudioContextState = 'suspended'

  createGain(): FakeAudioNode & { gain: { value: number; setValueAtTime: ReturnType<typeof vi.fn> } } {
    return {
      connect: vi.fn(),
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
      },
    }
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
