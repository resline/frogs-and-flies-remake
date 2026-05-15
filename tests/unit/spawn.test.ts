import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/game/createGame'
import { insertEntity } from '../../src/game/entities'
import type { Entity } from '../../src/game/types'
import { updateGame } from '../../src/game/update'

describe('M0 spawning', () => {
  it('spawns the same entities for the same seed', () => {
    const a = createGame({ seed: 42 })
    const b = createGame({ seed: 42 })
    a.commands.start = true
    b.commands.start = true

    for (let i = 0; i < 180; i += 1) {
      updateGame(a, 1 / 60)
      updateGame(b, 1 / 60)
    }

    expect(a.entities).toEqual(b.entities)
    expect(a.entityIds).toEqual(b.entityIds)
  })

  it('keeps entity iteration order independent from record key ordering', () => {
    const game = createGame({ seed: 42 })
    const first: Entity = { id: 20, kind: 'fly', x: 100, y: 100, vx: 0, radius: 8 }
    const second: Entity = { id: 3, kind: 'power', powerKind: 'rush', x: 120, y: 100, vx: 0, radius: 8 }

    insertEntity(game, first)
    insertEntity(game, second)
    insertEntity(game, first)

    expect(game.entities[20]).toEqual(first)
    expect(game.entities[3]).toEqual(second)
    expect(Object.keys(game.entities)).toEqual(['3', '20'])
    expect(game.entityIds).toEqual([20, 3])
  })
})
