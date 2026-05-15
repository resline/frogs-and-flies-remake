import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/game/createGame'
import { updateGame } from '../../src/game/update'
import type { GameState, MatchPlayerState } from '../../src/game/types'

const STEP = 1 / 60

function startGame(): GameState {
  const game = createGame({ seed: 25, mode: 'classic-single' })
  game.commands.start = true
  updateGame(game, STEP)
  return game
}

function p1(game: GameState): MatchPlayerState {
  return game.players[0]
}

function advance(game: GameState, frames: number, frameCommands?: (frame: number) => void): void {
  for (let frame = 0; frame < frames; frame += 1) {
    frameCommands?.(frame)
    updateGame(game, STEP)
  }
}

function chargeAndRelease(game: GameState, frames: number): number {
  const player = p1(game).state

  advance(game, frames, () => {
    game.commands.chargeJump = true
    game.commands.moveRight = true
  })
  expect(player.phase).toBe('charging')
  expect(player.x).toBe(player.homeX)

  game.commands.releaseJump = true
  game.commands.moveRight = true
  updateGame(game, STEP)

  expect(player.phase).toBe('airborne')
  expect(player.jump.phase).toBe('jumping')
  expect(player.jump.airborne).toBe(true)
  expect(player.y).toBeLessThan(player.homeY)

  return Number(player.jump.durationSeconds)
}

describe('classic side-lily jump arcs', () => {
  it('turns horizontal input into jump intent without free walking while staged or charging', () => {
    const game = startGame()
    const player = p1(game).state

    game.commands.moveRight = true
    updateGame(game, STEP)

    expect(player.phase).toBe('staged')
    expect(player.x).toBe(player.homeX)
    expect(player.jump.intentX).toBe(1)

    game.commands.chargeJump = true
    game.commands.moveRight = true
    updateGame(game, STEP)

    expect(player.phase).toBe('charging')
    expect(player.x).toBe(player.homeX)
    expect(player.jump.arcDirection).toBe(1)
  })

  it('uses charge duration to create deterministic short and long jump arcs', () => {
    const shortGame = startGame()
    const longGame = startGame()

    const shortDuration = chargeAndRelease(shortGame, 2)
    const longDuration = chargeAndRelease(longGame, 60)

    expect(shortDuration).toBeGreaterThan(0)
    expect(longDuration).toBeGreaterThan(shortDuration)
    expect(p1(longGame).state.jump.travelX).toBeGreaterThan(p1(shortGame).state.jump.travelX)
  })

  it('moves airborne frogs along a facing-direction parabola and lands back staged on the lily', () => {
    const game = startGame()
    const player = p1(game).state

    chargeAndRelease(game, 18)
    const releaseX = player.x
    const releaseY = player.y

    advance(game, 8)

    expect(player.phase).toBe('airborne')
    expect(player.x).toBeGreaterThan(releaseX)
    expect(player.y).toBeLessThan(releaseY)

    advance(game, 80)

    expect(player.phase).toBe('staged')
    expect(player.jump.phase).toBe('idle')
    expect(player.jump.airborne).toBe(false)
    expect(player.x).toBe(player.homeX)
    expect(player.y).toBe(player.homeY)
  })

  it('splashes, resets combo, recovers, and returns home after missing the lily landing radius', () => {
    const game = startGame()
    const player = p1(game).state
    game.combo = 4
    p1(game).stats.combo = 4

    chargeAndRelease(game, 60)
    player.jump.targetX = player.homeX + player.landingRadius + 160

    advance(game, 47)

    expect(player.phase).toBe('splashing')
    expect(player.jump.phase).toBe('landed')
    expect(player.jump.airborne).toBe(false)
    expect(game.combo).toBe(0)
    expect(p1(game).stats.combo).toBe(0)

    advance(game, 18)
    expect(player.phase).toBe('recovering')

    advance(game, 24)
    expect(player.phase).toBe('staged')
    expect(player.x).toBe(player.homeX)
    expect(player.y).toBe(player.homeY)
  })
})
