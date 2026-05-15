import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/game/createGame'
import { updateGame } from '../../src/game/update'

const STEP_SECONDS = 1 / 60

function start(seed = 7) {
  const game = createGame({ seed, mode: 'classic-single' })
  game.commands.start = true
  updateGame(game, STEP_SECONDS)
  return game
}

describe('M2 match model', () => {
  it('creates a 180 second classic single match with P1 human and P2 CPU', () => {
    const game = createGame({ seed: 7, mode: 'classic-single' })

    expect(game.durationSeconds).toBe(180)
    expect(game.remainingSeconds).toBe(180)
    expect(game.mode).toBe('classic-single')
    expect(game.players.map((player) => player.id)).toEqual(['p1', 'p2'])
    expect(game.players[0].controlSource).toBe('human')
    expect(game.players[1].controlSource).toBe('cpu-opponent')
  })

  it('initializes independent per-player runtime state contracts', () => {
    const game = createGame({ seed: 7, mode: 'classic-single' })
    const [p1, p2] = game.players

    expect(p1.score).toBe(0)
    expect(p2.score).toBe(0)
    expect(p1.stats).toEqual({ score: 0, combo: 0, catches: 0, misses: 0 })
    expect(p2.stats).toEqual({ score: 0, combo: 0, catches: 0, misses: 0 })
    expect(p1.commands).toEqual({})
    expect(p2.commands).toEqual({})

    expect(p1.commands).not.toBe(p2.commands)
    expect(p1.stats).not.toBe(p2.stats)
    expect(p1.state).not.toBe(p2.state)
    expect(p1.state.jump).not.toBe(p2.state.jump)
    expect(p1.state.tongue).not.toBe(p2.state.tongue)
    expect(p1.water).not.toBe(p2.water)
    expect(p1.power).not.toBe(p2.power)

    expect(p1.state).toMatchObject(game.player)
    expect(p2.state).toMatchObject(game.player)
    expect(p1.water).toEqual(game.water)
    expect(p2.water).toEqual(game.water)
    expect(p1.catchRadius).toBe(game.constants.baseCatchRadius)
    expect(p2.catchRadius).toBe(game.constants.baseCatchRadius)
  })

  it('preserves short duration overrides for smoke flows', () => {
    const game = createGame({ seed: 7, mode: 'classic-single', durationSeconds: 2, theEndSeconds: 0.5 })

    expect(game.durationSeconds).toBe(2)
    expect(game.remainingSeconds).toBe(2)
    expect(game.theEndSeconds).toBe(0.5)

    game.commands.start = true
    updateGame(game, STEP_SECONDS)
    updateGame(game, 2)
    expect(game.phase).toBe('the-end')

    updateGame(game, game.theEndSeconds)
    expect(game.phase).toBe('results')
  })

  it('uses 180 second day, dusk, and night checkpoints', () => {
    const game = start()

    expect(game.timeOfDay).toBe('day')

    updateGame(game, 90)
    expect(game.phase).toBe('gameplay')
    expect(game.timeOfDay).toBe('dusk')

    updateGame(game, 60)
    expect(game.phase).toBe('gameplay')
    expect(game.timeOfDay).toBe('night')

    updateGame(game, 30)
    expect(game.phase).toBe('the-end')
    expect(game.timeOfDay).toBe('the-end')
  })

  it('calculates P1, P2, and tie results from isolated scores', () => {
    const game = start()

    game.players[0].score = 20
    game.players[1].score = 10
    updateGame(game, 180)
    updateGame(game, game.theEndSeconds)
    expect(game.results?.winner).toBe('p1')

    const p2 = start()
    p2.players[0].score = 10
    p2.players[1].score = 25
    updateGame(p2, 180)
    updateGame(p2, p2.theEndSeconds)
    expect(p2.results?.winner).toBe('p2')

    const tie = start()
    tie.players[0].score = 15
    tie.players[1].score = 15
    updateGame(tie, 180)
    updateGame(tie, tie.theEndSeconds)
    expect(tie.results?.winner).toBe('tie')
  })
})
