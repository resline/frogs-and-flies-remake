import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/game/createGame'

describe('classic side-lily arena', () => {
  it('stages classic single players on mirrored home lilies', () => {
    const game = createGame({ seed: 25, mode: 'classic-single' })
    const [p1, p2] = game.players

    expect(p1.id).toBe('p1')
    expect(p1.label).toBe('P1')
    expect(p1.controlSource).toBe('human')
    expect(p1.state.homeLilyId).toBe('left')
    expect(p1.state.facing).toBe('right')
    expect(p1.state.x).toBeLessThan(game.constants.arenaWidth / 2)
    expect(p1.state.phase).toBe('staged')

    expect(p2.id).toBe('p2')
    expect(p2.label).toBe('CPU')
    expect(p2.controlSource).toBe('cpu-opponent')
    expect(p2.state.homeLilyId).toBe('right')
    expect(p2.state.facing).toBe('left')
    expect(p2.state.x).toBeGreaterThan(game.constants.arenaWidth / 2)
    expect(p2.state.phase).toBe('staged')

    expect(p1.state.homeX).toBe(p1.state.x)
    expect(p1.state.homeY).toBe(p1.state.y)
    expect(p2.state.homeX).toBe(p2.state.x)
    expect(p2.state.homeY).toBe(p2.state.y)
    expect(p1.state.landingRadius).toBe(p2.state.landingRadius)
    expect(p1.state.landingRadius).toBeGreaterThan(0)
  })

  it('keeps local versus labels human controlled while preserving mirrored lilies', () => {
    const game = createGame({ seed: 25, mode: 'local-versus' })
    const [p1, p2] = game.players

    expect(p1.label).toBe('P1')
    expect(p2.label).toBe('P2')
    expect(p1.controlSource).toBe('human')
    expect(p2.controlSource).toBe('human')
    expect(p1.state.homeLilyId).toBe('left')
    expect(p2.state.homeLilyId).toBe('right')
    expect(p1.state.facing).toBe('right')
    expect(p2.state.facing).toBe('left')
    expect(p1.state.landingRadius).toBe(p2.state.landingRadius)
  })
})
