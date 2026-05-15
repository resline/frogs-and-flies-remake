import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/game/createGame'
import { insertEntity } from '../../src/game/entities'
import type { Entity } from '../../src/game/types'
import { updateGame } from '../../src/game/update'

const STEP_SECONDS = 1 / 60

function startGame(seed = 1) {
  const game = createGame({ seed })
  game.commands.start = true
  updateGame(game, STEP_SECONDS)
  return game
}

function advanceFrames(game: ReturnType<typeof createGame>, frames: number): void {
  for (let frame = 0; frame < frames; frame += 1) {
    updateGame(game, STEP_SECONDS)
  }
}

function advancePastTongueRecovery(game: ReturnType<typeof createGame>): void {
  advanceFrames(game, 24)
}

function advancePastTongueActiveWindow(game: ReturnType<typeof createGame>): void {
  updateGame(game, 0.22)
}

describe('M0 scoring and power', () => {
  it('adds score when a tongue hit catches a fly', () => {
    const game = startGame()
    insertEntity(game, { id: 10, kind: 'fly', x: game.player.homeX, y: game.player.homeY, vx: 0, radius: 24 })
    game.commands.fire = true
    updateGame(game, STEP_SECONDS)
    expect(game.players[0].score).toBeGreaterThan(0)
    expect(game.players[0].stats.score).toBe(game.players[0].score)
    expect(game.players[0].stats.attempts).toBe(1)
    expect(game.players[0].stats.catches).toBe(1)
    expect(game.players[1].score).toBe(0)
    expect(game.players[1].stats).toEqual({ score: 0, combo: 0, catches: 0, misses: 0, attempts: 0 })
    expect(game.score).toBe(game.players[0].score)
    expect(game.entities[10]).toBeUndefined()
  })

  it('adds a combo bonus for consecutive catches', () => {
    const game = startGame()

    insertEntity(game, { id: 10, kind: 'fly', x: game.player.homeX, y: game.player.homeY, vx: 0, radius: 8 })
    game.commands.fire = true
    updateGame(game, STEP_SECONDS)
    const firstCatchScore = game.players[0].score
    expect(game.players[0].stats.combo).toBe(1)
    expect(game.combo).toBe(game.players[0].stats.combo)

    advancePastTongueRecovery(game)
    insertEntity(game, { id: 11, kind: 'fly', x: game.player.homeX, y: game.player.homeY, vx: 0, radius: 8 })
    game.commands.fire = true
    updateGame(game, STEP_SECONDS)
    expect(game.players[0].stats.combo).toBe(2)
    expect(game.players[0].stats.attempts).toBe(2)
    expect(game.players[0].stats.catches).toBe(2)
    expect(game.combo).toBe(game.players[0].stats.combo)
    expect(game.players[0].score).toBeGreaterThan(firstCatchScore * 2)
    expect(game.score).toBe(game.players[0].score)
  })

  it('activates a timed boost when collecting power', () => {
    const game = startGame()
    insertEntity(game, { id: 11, kind: 'power', powerKind: 'rush', x: game.player.x, y: game.player.y, vx: 0, radius: 24 })
    updateGame(game, STEP_SECONDS)
    expect(game.players[0].power.kind).toBe('rush')
    expect(game.players[0].power.remainingSeconds).toBe(5)
    expect(game.players[0].catchRadius).toBe(game.constants.rushCatchRadius)
    expect(game.power).toEqual(game.players[0].power)
    expect(game.catchRadius).toBe(game.players[0].catchRadius)
    expect(game.players[1].power.kind).toBeUndefined()
    expect(game.players[1].catchRadius).toBe(game.constants.baseCatchRadius)
  })

  it('Rush expands catch radius for exactly 5 deterministic seconds', () => {
    const game = startGame()
    const rushOnlyFlyX = game.player.homeX + game.constants.baseCatchRadius + 8

    insertEntity(game, { id: 12, kind: 'fly', x: rushOnlyFlyX, y: game.player.homeY, vx: 0, radius: 8 })
    game.commands.fire = true
    updateGame(game, STEP_SECONDS)
    expect(game.players[0].score).toBe(0)
    expect(game.entities[12]).toBeDefined()

    insertEntity(game, { id: 11, kind: 'power', powerKind: 'rush', x: game.player.homeX, y: game.player.homeY, vx: 0, radius: 24 })
    updateGame(game, STEP_SECONDS)
    expect(game.players[0].power.kind).toBe('rush')
    expect(game.power.kind).toBe(game.players[0].power.kind)

    game.commands.fire = true
    updateGame(game, STEP_SECONDS)
    expect(game.players[0].score).toBeGreaterThan(0)
    expect(game.score).toBe(game.players[0].score)
    expect(game.entities[12]).toBeUndefined()

    updateGame(game, 5)
    expect(game.players[0].power.kind).toBeUndefined()
    expect(game.players[0].power.remainingSeconds).toBe(0)
    expect(game.players[0].catchRadius).toBe(game.constants.baseCatchRadius)
    expect(game.power).toEqual(game.players[0].power)
    expect(game.catchRadius).toBe(game.players[0].catchRadius)
  })

  it('removes the combo after firing without a catch', () => {
    const game = startGame()
    insertEntity(game, { id: 10, kind: 'fly', x: game.player.homeX, y: game.player.homeY, vx: 0, radius: 8 })

    game.commands.fire = true
    updateGame(game, STEP_SECONDS)
    expect(game.players[0].stats.combo).toBe(1)
    expect(game.combo).toBe(game.players[0].stats.combo)

    advancePastTongueRecovery(game)
    game.commands.fire = true
    updateGame(game, STEP_SECONDS)
    advancePastTongueActiveWindow(game)
    expect(game.players[0].stats.combo).toBe(0)
    expect(game.players[0].stats.attempts).toBe(2)
    expect(game.players[0].stats.misses).toBe(1)
    expect(game.combo).toBe(game.players[0].stats.combo)
  })

  it('keeps P2 scoring and power isolated when P1 catches and collects', () => {
    const game = startGame()
    const [p1, p2] = game.players

    insertEntity(game, { id: 10, kind: 'fly', x: game.player.homeX, y: game.player.homeY, vx: 0, radius: 8 })
    insertEntity(game, { id: 11, kind: 'power', powerKind: 'rush', x: game.player.homeX, y: game.player.homeY, vx: 0, radius: 8 })

    game.commands.fire = true
    updateGame(game, STEP_SECONDS)

    expect(p1.score).toBe(game.constants.baseFlyScore)
    expect(p1.stats).toEqual({ score: game.constants.baseFlyScore, combo: 1, catches: 1, misses: 0, attempts: 1 })
    expect(p1.power.kind).toBe('rush')
    expect(p1.catchRadius).toBe(game.constants.rushCatchRadius)
    expect(p2.score).toBe(0)
    expect(p2.stats).toEqual({ score: 0, combo: 0, catches: 0, misses: 0, attempts: 0 })
    expect(p2.power.kind).toBeUndefined()
    expect(p2.catchRadius).toBe(game.constants.baseCatchRadius)
  })

  it('lets P2 catch, miss, and collect rush without changing P1 state', () => {
    const game = startGame()
    const [p1, p2] = game.players

    p1.state.x = 100
    p1.state.y = 500
    p2.state.x = 700
    p2.state.y = 500

    insertEntity(game, { id: 10, kind: 'fly', x: 700, y: 500, vx: 0, radius: 8 })
    insertEntity(game, { id: 11, kind: 'power', powerKind: 'rush', x: 700, y: 500, vx: 0, radius: 8 })
    p2.commands.fire = true
    updateGame(game, STEP_SECONDS)

    expect(p2.score).toBe(game.constants.baseFlyScore)
    expect(p2.stats).toEqual({ score: game.constants.baseFlyScore, combo: 1, catches: 1, misses: 0, attempts: 1 })
    expect(p2.power.kind).toBe('rush')
    expect(p2.catchRadius).toBe(game.constants.rushCatchRadius)
    expect(p1.score).toBe(0)
    expect(p1.stats).toEqual({ score: 0, combo: 0, catches: 0, misses: 0, attempts: 0 })
    expect(p1.power.kind).toBeUndefined()
    expect(p1.catchRadius).toBe(game.constants.baseCatchRadius)

    advancePastTongueRecovery(game)
    p2.commands.fire = true
    updateGame(game, STEP_SECONDS)
    advancePastTongueActiveWindow(game)

    expect(p2.stats.combo).toBe(0)
    expect(p2.stats.attempts).toBe(2)
    expect(p2.stats.misses).toBe(1)
    expect(p1.stats.misses).toBe(0)

    updateGame(game, 5)
    expect(p2.power.kind).toBeUndefined()
    expect(p2.power.remainingSeconds).toBe(0)
    expect(p2.catchRadius).toBe(game.constants.baseCatchRadius)
    expect(p1.power.kind).toBeUndefined()
    expect(p1.catchRadius).toBe(game.constants.baseCatchRadius)
  })
})
