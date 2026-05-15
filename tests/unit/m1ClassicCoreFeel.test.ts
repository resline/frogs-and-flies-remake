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
  expect(game.player.tongue?.result).toBeUndefined()
}

describe('M1 Classic Core Feel', () => {
  it('transitions charged jump through idle, charging, jumping, landed, and recovery idle', () => {
    const game = startGame()
    const groundY = game.player.groundY

    expect(game.player.jump?.phase).toBe('idle')
    expect(game.player.jump?.airborne).toBe(false)
    expect(game.player.y).toBe(groundY)

    advanceFrames(game, 18, () => {
      commands(game).chargeJump = true
    })
    expect(game.player.jump?.phase).toBe('charging')
    expect(game.player.jump?.chargeSeconds).toBeCloseTo(0.3, 5)
    expect(game.player.jump?.airborne).toBe(false)
    expect(game.player.y).toBe(groundY)

    commands(game).releaseJump = true
    updateGame(game, STEP_SECONDS)
    expect(game.player.jump?.phase).toBe('jumping')
    expect(game.player.jump?.airborne).toBe(true)
    expect(game.player.jump?.velocityY).toBeLessThan(0)
    expect(game.player.y).toBeLessThan(groundY)

    advanceFrames(game, 90)
    expect(game.player.jump?.phase).toBe('landed')
    expect(game.player.jump?.airborne).toBe(false)
    expect(game.player.y).toBe(groundY)

    advanceFrames(game, 12)
    expect(game.player.jump?.phase).toBe('idle')
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
    expect(game.player.tongue?.result).toBe('catch')
    expect(game.player.jump?.phase).toBe('jumping')
    expect(game.player.jump?.velocityY).toBe(preCatchVelocityY)

    advanceFrames(game, 12)
    expectTongueReady(game)
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
    expect(game.player.tongue?.result).toBe('miss')

    advanceFrames(game, 12)
    expectTongueReady(game)
  })

  it('turns a water landing into splash, recovery, and calm states', () => {
    const game = startGame()

    advanceFrames(game, 24, () => {
      commands(game).chargeJump = true
    })
    commands(game).releaseJump = true
    updateGame(game, STEP_SECONDS)

    advanceFrames(game, 90)
    expect(game.player.jump?.phase).toBe('landed')
    expect(game.water?.phase).toBe('splash')
    expect(game.water?.splashSeconds).toBeGreaterThan(0)

    advanceFrames(game, 18)
    expect(game.water?.phase).toBe('recovery')
    expect(game.water?.recoverySeconds).toBeGreaterThan(0)

    advanceFrames(game, 24)
    expect(game.water?.phase).toBe('calm')
    expect(game.player.jump?.phase).toBe('idle')
  })
})
