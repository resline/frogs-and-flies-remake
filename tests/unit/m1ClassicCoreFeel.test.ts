import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/game/createGame'
import { insertEntity } from '../../src/game/entities'
import type { Entity, GameState } from '../../src/game/types'
import { updateGame } from '../../src/game/update'

type JumpPhase = 'idle' | 'charging' | 'jumping' | 'landed'
type TonguePhase = 'ready' | 'extended' | 'recovering'
type TongueResult = 'catch' | 'miss'
type WaterPhase = 'calm' | 'splash' | 'recovery'

type M1Commands = GameState['commands'] & {
  chargeJump?: boolean
  releaseJump?: boolean
  tongue?: boolean
}

type M1GameState = GameState & {
  player: GameState['player'] & {
    groundY?: number
    jump?: {
      phase: JumpPhase
      chargeSeconds: number
      airborne: boolean
      velocityY: number
    }
    tongue?: {
      phase: TonguePhase
      result?: TongueResult
    }
  }
  water?: {
    phase: WaterPhase
    splashSeconds: number
    recoverySeconds: number
  }
}

const STEP_SECONDS = 1 / 60

function startGame(seed = 101): M1GameState {
  const game = createGame({ seed }) as M1GameState
  game.commands.start = true
  updateGame(game, STEP_SECONDS)
  return game
}

function commands(game: GameState): M1Commands {
  return game.commands as M1Commands
}

function p1(game: GameState) {
  return game.players[0]
}

function p2(game: GameState) {
  return game.players[1]
}

function advanceFrames(game: GameState, frames: number, frameCommands?: (frame: number) => void): void {
  for (let frame = 0; frame < frames; frame += 1) {
    frameCommands?.(frame)
    updateGame(game, STEP_SECONDS)
  }
}

function insertFlyAt(game: GameState, entity: Pick<Entity, 'id' | 'x' | 'y'>): void {
  insertEntity(game, {
    id: entity.id,
    kind: 'fly',
    x: entity.x,
    y: entity.y,
    vx: 0,
    vy: 0,
    radius: 12,
  })
}

function expectTongueReady(game: M1GameState): void {
  expect(game.player.tongue?.phase).toBe('ready')
  expect(p1(game).state.tongue.phase).toBe('ready')
  expect(game.player.tongue?.result).toBeUndefined()
  expect(p1(game).state.tongue.result).toBeUndefined()
}

describe('M1 Classic Core Feel', () => {
  it('preserves a legacy pre-start aim position when starting with tongue input', () => {
    const game = createGame({ seed: 101 }) as M1GameState
    const aimX = 740

    game.player.x = aimX
    insertFlyAt(game, { id: 22, x: aimX, y: game.player.y })
    commands(game).start = true
    commands(game).tongue = true
    updateGame(game, STEP_SECONDS)

    expect(p1(game).state.x).toBe(aimX)
    expect(game.player.x).toBe(aimX)
    expect(game.entities[22]).toBeUndefined()
    expect(game.score).toBe(game.constants.baseFlyScore)
    expect(p1(game).state.tongue.result).toBe('catch')
  })

  it('applies P1 movement commands to P1 without moving P2', () => {
    const game = startGame()
    const initialP1X = p1(game).state.x
    const initialP2X = p2(game).state.x

    commands(game).moveRight = true
    updateGame(game, STEP_SECONDS)

    expect(p1(game).state.x).toBeGreaterThan(initialP1X)
    expect(game.player.x).toBe(p1(game).state.x)
    expect(p2(game).state.x).toBe(initialP2X)
    expect(p2(game).commands).toEqual({})
  })

  it('applies P1 per-player movement commands to P1 without moving P2', () => {
    const game = startGame()
    const initialP1X = p1(game).state.x
    const initialP2X = p2(game).state.x

    p1(game).commands.moveRight = true
    updateGame(game, STEP_SECONDS)

    expect(p1(game).state.x).toBeGreaterThan(initialP1X)
    expect(game.player.x).toBe(p1(game).state.x)
    expect(p2(game).state.x).toBe(initialP2X)
  })

  it('applies P1 per-player charged jump commands to P1 without changing P2 jump', () => {
    const game = startGame()
    const p2Jump = { ...p2(game).state.jump }

    advanceFrames(game, 18, () => {
      p1(game).commands.chargeJump = true
    })
    expect(p1(game).state.jump.phase).toBe('charging')
    expect(game.player.jump?.phase).toBe('charging')
    expect(p2(game).state.jump).toEqual(p2Jump)

    p1(game).commands.releaseJump = true
    updateGame(game, STEP_SECONDS)

    expect(p1(game).state.jump.phase).toBe('jumping')
    expect(game.player.jump?.phase).toBe('jumping')
    expect(p1(game).state.jump.velocityY).toBeLessThan(0)
    expect(p2(game).state.jump).toEqual(p2Jump)
  })

  it('transitions charged jump through idle, charging, jumping, landed, and recovery idle', () => {
    const game = startGame()
    const groundY = game.player.groundY
    const p2Jump = { ...p2(game).state.jump }

    expect(game.player.jump?.phase).toBe('idle')
    expect(p1(game).state.jump.phase).toBe('idle')
    expect(game.player.jump?.airborne).toBe(false)
    expect(p1(game).state.jump.airborne).toBe(false)
    expect(game.player.y).toBe(groundY)
    expect(p1(game).state.y).toBe(groundY)

    advanceFrames(game, 18, () => {
      commands(game).chargeJump = true
    })
    expect(game.player.jump?.phase).toBe('charging')
    expect(p1(game).state.jump.phase).toBe('charging')
    expect(game.player.jump?.chargeSeconds).toBeCloseTo(0.3, 5)
    expect(p1(game).state.jump.chargeSeconds).toBeCloseTo(0.3, 5)
    expect(game.player.jump?.airborne).toBe(false)
    expect(p1(game).state.jump.airborne).toBe(false)
    expect(game.player.y).toBe(groundY)
    expect(p1(game).state.y).toBe(groundY)
    expect(p2(game).state.jump).toEqual(p2Jump)

    commands(game).releaseJump = true
    updateGame(game, STEP_SECONDS)
    expect(game.player.jump?.phase).toBe('jumping')
    expect(p1(game).state.jump.phase).toBe('jumping')
    expect(game.player.jump?.airborne).toBe(true)
    expect(p1(game).state.jump.airborne).toBe(true)
    expect(game.player.jump?.velocityY).toBeLessThan(0)
    expect(p1(game).state.jump.velocityY).toBeLessThan(0)
    expect(game.player.y).toBeLessThan(groundY)
    expect(p1(game).state.y).toBe(game.player.y)
    expect(p2(game).state.jump).toEqual(p2Jump)

    advanceFrames(game, 90)
    expect(game.player.jump?.phase).toBe('landed')
    expect(p1(game).state.jump.phase).toBe('landed')
    expect(game.player.jump?.airborne).toBe(false)
    expect(p1(game).state.jump.airborne).toBe(false)
    expect(game.player.y).toBe(groundY)
    expect(p1(game).state.y).toBe(groundY)
    expect(p2(game).state.jump).toEqual(p2Jump)

    advanceFrames(game, 12)
    expect(game.player.jump?.phase).toBe('idle')
    expect(p1(game).state.jump.phase).toBe('idle')
    expect(p2(game).state.jump).toEqual(p2Jump)
  })

  it('allows an airborne tongue catch without cancelling jump momentum', () => {
    const game = startGame()

    advanceFrames(game, 12, () => {
      commands(game).chargeJump = true
    })
    commands(game).releaseJump = true
    updateGame(game, STEP_SECONDS)
    advanceFrames(game, 8)

    expect(game.player.jump?.phase).toBe('jumping')
    expect(game.player.jump?.airborne).toBe(true)

    const preCatchVelocityY = game.player.jump?.velocityY
    insertFlyAt(game, { id: 20, x: game.player.x, y: game.player.y - 96 })

    commands(game).tongue = true
    updateGame(game, STEP_SECONDS)

    expect(game.entities[20]).toBeUndefined()
    expect(game.score).toBe(game.constants.baseFlyScore)
    expect(game.combo).toBe(1)
    expect(game.player.tongue?.phase).toBe('recovering')
    expect(p1(game).state.tongue.phase).toBe('recovering')
    expect(game.player.tongue?.result).toBe('catch')
    expect(p1(game).state.tongue.result).toBe('catch')
    expect(game.player.jump?.phase).toBe('jumping')
    expect(p1(game).state.jump.phase).toBe('jumping')
    expect(game.player.jump?.velocityY).toBe(preCatchVelocityY)
    expect(p1(game).state.jump.velocityY).toBe(preCatchVelocityY)
    expect(p2(game).state.tongue).toEqual({ phase: 'ready' })

    advanceFrames(game, 12)
    expectTongueReady(game)
    expect(p2(game).state.tongue).toEqual({ phase: 'ready' })
  })

  it('records a tongue miss, resets combo, and returns the tongue to ready', () => {
    const game = startGame()
    game.score = 45
    game.combo = 3
    insertFlyAt(game, { id: 21, x: game.player.x + 360, y: game.player.y - 160 })

    commands(game).tongue = true
    updateGame(game, STEP_SECONDS)

    expect(game.entities[21]).toBeDefined()
    expect(game.score).toBe(45)
    expect(game.combo).toBe(0)
    expect(game.player.tongue?.phase).toBe('recovering')
    expect(p1(game).state.tongue.phase).toBe('recovering')
    expect(game.player.tongue?.result).toBe('miss')
    expect(p1(game).state.tongue.result).toBe('miss')
    expect(p2(game).state.tongue).toEqual({ phase: 'ready' })

    advanceFrames(game, 12)
    expectTongueReady(game)
    expect(p2(game).state.tongue).toEqual({ phase: 'ready' })
  })

  it('recovers P2 tongue without mutating P1 tongue', () => {
    const game = startGame()

    p1(game).state.x = 100
    p1(game).state.y = 500
    p2(game).state.x = 700
    p2(game).state.y = 500
    insertFlyAt(game, { id: 23, x: 700, y: 500 })

    p2(game).commands.tongue = true
    updateGame(game, STEP_SECONDS)

    expect(p2(game).state.tongue.phase).toBe('recovering')
    expect(p2(game).state.tongue.result).toBe('catch')
    expect(p1(game).state.tongue).toEqual({ phase: 'ready' })
    expect(game.player.tongue).toEqual({ phase: 'ready' })

    advanceFrames(game, 12)

    expect(p2(game).state.tongue).toEqual({ phase: 'ready' })
    expect(p1(game).state.tongue).toEqual({ phase: 'ready' })
    expect(game.player.tongue).toEqual({ phase: 'ready' })
  })

  it('turns a water landing into splash, recovery, and calm states', () => {
    const game = startGame()
    const p2Water = { ...p2(game).water }

    advanceFrames(game, 24, () => {
      commands(game).chargeJump = true
    })
    commands(game).releaseJump = true
    updateGame(game, STEP_SECONDS)

    advanceFrames(game, 90)
    expect(game.player.jump?.phase).toBe('landed')
    expect(p1(game).state.jump.phase).toBe('landed')
    expect(game.water?.phase).toBe('splash')
    expect(p1(game).water.phase).toBe('splash')
    expect(game.water?.splashSeconds).toBeGreaterThan(0)
    expect(p1(game).water.splashSeconds).toBeGreaterThan(0)
    expect(p2(game).water).toEqual(p2Water)

    advanceFrames(game, 18)
    expect(game.water?.phase).toBe('recovery')
    expect(p1(game).water.phase).toBe('recovery')
    expect(game.water?.recoverySeconds).toBeGreaterThan(0)
    expect(p1(game).water.recoverySeconds).toBeGreaterThan(0)
    expect(p2(game).water).toEqual(p2Water)

    advanceFrames(game, 24)
    expect(game.water?.phase).toBe('calm')
    expect(p1(game).water.phase).toBe('calm')
    expect(game.player.jump?.phase).toBe('idle')
    expect(p1(game).state.jump.phase).toBe('idle')
    expect(p2(game).water).toEqual(p2Water)
  })
})
