import { describe, expect, it } from 'vitest'
import {
  findFirstTongueHit,
  isEntityInTongueRange,
  tongueSegmentForPlayer,
} from '../../src/game/tongue'
import { createGame } from '../../src/game/createGame'
import { insertEntity } from '../../src/game/entities'
import type { Entity, GameState, MatchPlayerState } from '../../src/game/types'
import { updateGame } from '../../src/game/update'

const STEP_SECONDS = 1 / 60

function startGame(seed = 404): GameState {
  const game = createGame({ seed, mode: 'classic-single' })
  game.commands.start = true
  updateGame(game, STEP_SECONDS)
  return game
}

function insertFly(game: GameState, entity: Pick<Entity, 'id' | 'x' | 'y'> & Partial<Entity>): void {
  insertEntity(game, {
    id: entity.id,
    kind: 'fly',
    x: entity.x,
    y: entity.y,
    vx: entity.vx ?? 0,
    vy: entity.vy ?? 0,
    radius: entity.radius ?? 8,
  })
}

function advance(game: GameState, seconds: number): void {
  updateGame(game, seconds)
}

function p1(game: GameState): MatchPlayerState {
  return game.players[0]
}

describe('directional tongue collision', () => {
  it('fires only when ready and exposes a 150-300 ms active window', () => {
    const game = startGame()
    const player = p1(game)

    game.commands.tongue = true
    updateGame(game, STEP_SECONDS)

    expect(player.state.tongue.phase).toBe('extended')
    expect(player.state.tongue.activeSeconds).toBeGreaterThanOrEqual(0)

    game.commands.tongue = true
    updateGame(game, STEP_SECONDS)
    expect(player.stats.attempts).toBe(1)

    advance(game, 0.14)
    expect(player.state.tongue.phase).toBe('extended')

    advance(game, 0.06)
    expect(player.state.tongue.phase).toBe('recovering')
    expect(player.state.tongue.activeSeconds).toBeGreaterThanOrEqual(0.15)
    expect(player.state.tongue.activeSeconds).toBeLessThanOrEqual(0.3)
  })

  it('catches a fly directly forward inside range', () => {
    const game = startGame()
    const player = p1(game)
    const segment = tongueSegmentForPlayer(player.state)

    insertFly(game, { id: 11, x: segment.originX + player.state.tongue.range * 0.55, y: segment.originY })

    game.commands.tongue = true
    updateGame(game, STEP_SECONDS)

    expect(player.score).toBe(game.constants.baseFlyScore)
    expect(player.stats).toEqual({
      score: game.constants.baseFlyScore,
      combo: 1,
      catches: 1,
      misses: 0,
      attempts: 1,
    })
    expect(game.entities[11]).toBeUndefined()
  })

  it('does not catch a fly behind the frog', () => {
    const game = startGame()
    const player = p1(game)
    const segment = tongueSegmentForPlayer(player.state)
    const behindX = segment.originX - player.state.tongue.range * 0.25

    insertFly(game, { id: 12, x: behindX, y: segment.originY })

    game.commands.tongue = true
    updateGame(game, STEP_SECONDS)
    advance(game, 0.22)

    expect(player.score).toBe(0)
    expect(player.stats.attempts).toBe(1)
    expect(player.stats.misses).toBe(1)
    expect(game.entities[12]).toBeDefined()
  })

  it('does not catch a fly outside the tongue capsule width', () => {
    const game = startGame()
    const player = p1(game)
    const segment = tongueSegmentForPlayer(player.state)

    insertFly(game, {
      id: 13,
      x: segment.originX + player.state.tongue.range * 0.5,
      y: segment.originY - player.state.tongue.width - 20,
      radius: 6,
    })

    game.commands.tongue = true
    updateGame(game, STEP_SECONDS)
    advance(game, 0.22)

    expect(isEntityInTongueRange(player.state, game.entities[13])).toBe(false)
    expect(player.score).toBe(0)
    expect(player.stats.misses).toBe(1)
    expect(game.entities[13]).toBeDefined()
  })

  it('records a miss once, resets combo, and keeps the missed fly in play', () => {
    const game = startGame()
    const player = p1(game)
    player.stats.combo = 3
    game.combo = 3

    insertFly(game, { id: 14, x: player.state.homeX - 80, y: player.state.homeY })

    game.commands.tongue = true
    updateGame(game, STEP_SECONDS)
    advance(game, 0.22)
    updateGame(game, STEP_SECONDS)

    expect(player.stats.attempts).toBe(1)
    expect(player.stats.misses).toBe(1)
    expect(player.stats.combo).toBe(0)
    expect(game.combo).toBe(0)
    expect(game.entities[14]).toBeDefined()
  })

  it('records a catch once and removes only the first directional fly hit', () => {
    const game = startGame()
    const player = p1(game)
    const segment = tongueSegmentForPlayer(player.state)

    insertFly(game, { id: 20, x: segment.originX + 120, y: segment.originY, radius: 8 })
    insertFly(game, { id: 21, x: segment.originX + 150, y: segment.originY, radius: 8 })

    expect(findFirstTongueHit(game, player.state)?.id).toBe(20)

    game.commands.tongue = true
    updateGame(game, STEP_SECONDS)
    advance(game, 0.22)

    expect(player.score).toBe(game.constants.baseFlyScore)
    expect(player.stats).toEqual({
      score: game.constants.baseFlyScore,
      combo: 1,
      catches: 1,
      misses: 0,
      attempts: 1,
    })
    expect(game.entities[20]).toBeUndefined()
    expect(game.entities[21]).toBeDefined()
  })
})
