import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/game/createGame'
import { insertEntity } from '../../src/game/entities'
import { updateMovement } from '../../src/game/systems/movement'
import { updateSpawn } from '../../src/game/systems/spawn'
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

  it('uses encounter fly band and velocity for deterministic fly spawns and movement', () => {
    const game = createGame({
      seed: 29,
      encounter: {
        flySpawnSeconds: 0.5,
        powerSpawnSeconds: 12,
        flyBand: { minY: 80, maxY: 120 },
        flyVelocity: { minVx: 80, maxVx: 120, minVy: 130, maxVy: 170 },
      },
    })

    updateSpawn(game, game.constants.flySpawnSeconds)
    const fly = game.entities[game.entityIds[0]]

    expect(fly?.kind).toBe('fly')
    expect(fly?.y).toBeGreaterThanOrEqual(80)
    expect(fly?.y).toBeLessThanOrEqual(120)
    expect(fly?.vx).toBeGreaterThanOrEqual(80)
    expect(fly?.vx).toBeLessThanOrEqual(120)
    expect(fly?.vy).toBeGreaterThanOrEqual(130)
    expect(fly?.vy).toBeLessThanOrEqual(170)

    const startX = fly!.x
    const startY = fly!.y
    const velocityX = fly!.vx
    const velocityY = fly!.vy ?? 0

    updateMovement(game, 0.25)

    expect(fly!.x).toBeCloseTo(startX + velocityX * 0.25)
    expect(fly!.y).toBeCloseTo(startY + velocityY * 0.25)
  })

  it('uses encounter power cadence while keeping Rush powers in the existing entity contract', () => {
    const classic = createGame({ seed: 29 })
    const tuned = createGame({
      seed: 29,
      encounter: {
        flySpawnSeconds: 999,
        powerSpawnSeconds: 12,
      },
    })

    updateSpawn(classic, classic.constants.powerSpawnSeconds)
    updateSpawn(tuned, classic.constants.powerSpawnSeconds)

    expect(Object.values(classic.entities).filter((entity) => entity.kind === 'power')).toHaveLength(1)
    expect(Object.values(tuned.entities).filter((entity) => entity.kind === 'power')).toHaveLength(0)

    updateSpawn(tuned, tuned.constants.powerSpawnSeconds - classic.constants.powerSpawnSeconds)
    const powers = Object.values(tuned.entities).filter((entity) => entity.kind === 'power')

    expect(powers).toHaveLength(1)
    expect(powers[0]).toMatchObject({ kind: 'power', powerKind: 'rush' })
  })
})
