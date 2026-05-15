import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/game/createGame'
import { insertEntity } from '../../src/game/entities'
import type { Entity } from '../../src/game/types'
import { updateGame } from '../../src/game/update'

describe('M0 scoring and power', () => {
  it('adds score when a tongue hit catches a fly', () => {
    const game = createGame({ seed: 1 })
    game.commands.start = true
    updateGame(game, 1 / 60)
    insertEntity(game, { id: 10, kind: 'fly', x: 400, y: 300, vx: 0, radius: 24 })
    game.player.x = 400
    game.player.y = 500
    game.commands.fire = true
    updateGame(game, 1 / 60)
    expect(game.score).toBeGreaterThan(0)
    expect(game.entities[10]).toBeUndefined()
  })

  it('adds a combo bonus for consecutive catches', () => {
    const game = createGame({ seed: 1 })
    game.commands.start = true
    updateGame(game, 1 / 60)
    game.player.x = 400
    game.player.y = 500

    insertEntity(game, { id: 10, kind: 'fly', x: 400, y: 500, vx: 0, radius: 8 })
    game.commands.fire = true
    updateGame(game, 1 / 60)
    const firstCatchScore = game.score
    expect(game.combo).toBe(1)

    insertEntity(game, { id: 11, kind: 'fly', x: 400, y: 500, vx: 0, radius: 8 })
    game.commands.fire = true
    updateGame(game, 1 / 60)
    expect(game.combo).toBe(2)
    expect(game.score).toBeGreaterThan(firstCatchScore * 2)
  })

  it('activates a timed boost when collecting power', () => {
    const game = createGame({ seed: 1 })
    game.commands.start = true
    updateGame(game, 1 / 60)
    insertEntity(game, { id: 11, kind: 'power', powerKind: 'rush', x: game.player.x, y: game.player.y, vx: 0, radius: 24 })
    updateGame(game, 1 / 60)
    expect(game.power.kind).toBe('rush')
    expect(game.power.remainingSeconds).toBe(5)
    expect(game.catchRadius).toBe(game.constants.rushCatchRadius)
  })

  it('Rush expands catch radius for exactly 5 deterministic seconds', () => {
    const game = createGame({ seed: 1 })
    game.commands.start = true
    updateGame(game, 1 / 60)

    game.player.x = 400
    game.player.y = 500
    insertEntity(game, { id: 12, kind: 'fly', x: 400 + game.constants.baseCatchRadius + 8, y: 500, vx: 0, radius: 8 })
    game.commands.fire = true
    updateGame(game, 1 / 60)
    expect(game.score).toBe(0)
    expect(game.entities[12]).toBeDefined()

    insertEntity(game, { id: 11, kind: 'power', powerKind: 'rush', x: game.player.x, y: game.player.y, vx: 0, radius: 24 })
    updateGame(game, 1 / 60)
    expect(game.power.kind).toBe('rush')

    game.commands.fire = true
    updateGame(game, 1 / 60)
    expect(game.score).toBeGreaterThan(0)
    expect(game.entities[12]).toBeUndefined()

    updateGame(game, 5)
    expect(game.power.kind).toBeUndefined()
    expect(game.power.remainingSeconds).toBe(0)
    expect(game.catchRadius).toBe(game.constants.baseCatchRadius)
  })

  it('removes the combo after firing without a catch', () => {
    const game = createGame({ seed: 1 })
    game.commands.start = true
    updateGame(game, 1 / 60)
    game.player.x = 400
    game.player.y = 500
    insertEntity(game, { id: 10, kind: 'fly', x: 400, y: 500, vx: 0, radius: 8 })

    game.commands.fire = true
    updateGame(game, 1 / 60)
    expect(game.combo).toBe(1)

    game.commands.fire = true
    updateGame(game, 1 / 60)
    expect(game.combo).toBe(0)
  })
})
