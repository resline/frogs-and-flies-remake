import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/game/createGame'
import { updateGame } from '../../src/game/update'

const STEP_SECONDS = 1 / 60

function startLocalVersus() {
  const game = createGame({ mode: 'local-versus' })
  game.commands.start = true
  updateGame(game, STEP_SECONDS)
  return game
}

describe('local versus simulation contract', () => {
  it('creates a deterministic local versus match with two human players', () => {
    const game = createGame({ mode: 'local-versus' })
    const [p1, p2] = game.players

    expect(game.seed).toBe(0)
    expect(game.mode).toBe('local-versus')
    expect(p1.controlSource).toBe('human')
    expect(p2.controlSource).toBe('human')
    expect(p1.label).toBe('P1')
    expect(p2.label).toBe('P2')
    expect(p1.state.homeLilyId).toBe('left')
    expect(p2.state.homeLilyId).toBe('right')
    expect(p1.state.facing).toBe('right')
    expect(p2.state.facing).toBe('left')
    expect(p1.state.phase).toBe('staged')
    expect(p2.state.phase).toBe('staged')
  })

  it('keeps P1 and P2 command bags independent across command clearing', () => {
    const game = startLocalVersus()
    const [p1, p2] = game.players

    expect(p1.commands).toEqual({})
    expect(p2.commands).toEqual({})
    expect(p1.commands).not.toBe(p2.commands)

    p1.commands.moveRight = true
    p2.commands.moveLeft = true
    updateGame(game, STEP_SECONDS)

    expect(p1.commands).toEqual({})
    expect(p2.commands).toEqual({})
    expect(p1.commands).not.toBe(p2.commands)
  })

  it('applies P1 movement without moving P2', () => {
    const game = startLocalVersus()
    const [p1, p2] = game.players
    const initialP1X = p1.state.x
    const initialP2X = p2.state.x

    p1.commands.moveRight = true
    updateGame(game, STEP_SECONDS)

    expect(p1.state.x).toBeGreaterThan(initialP1X)
    expect(game.player.x).toBe(p1.state.x)
    expect(p2.state.x).toBe(initialP2X)
  })

  it('applies P2 movement without moving P1 or corrupting the P1 mirror', () => {
    const game = startLocalVersus()
    const [p1, p2] = game.players
    const initialP1X = p1.state.x
    const initialP2X = p2.state.x
    const initialMirrorX = game.player.x

    p2.commands.moveLeft = true
    updateGame(game, STEP_SECONDS)

    expect(p2.state.x).toBeLessThan(initialP2X)
    expect(p1.state.x).toBe(initialP1X)
    expect(game.player.x).toBe(initialMirrorX)
    expect(game.player.x).toBe(p1.state.x)
  })
})
