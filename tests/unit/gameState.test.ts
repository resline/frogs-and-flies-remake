import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/game/createGame'
import { updateGame } from '../../src/game/update'

describe('M0 game state', () => {
  it('starts in the start state with a 180 second target', () => {
    const game = createGame({ seed: 100 })
    expect(game.phase).toBe('start')
    expect(game.durationSeconds).toBe(180)
    expect(game.remainingSeconds).toBe(180)
  })

  it('can start, pause, resume, reach THE END, and show results', () => {
    const game = createGame({ seed: 100 })
    game.commands.start = true
    updateGame(game, 1 / 60)
    expect(game.phase).toBe('gameplay')

    game.commands.pause = true
    updateGame(game, 1 / 60)
    expect(game.phase).toBe('pause')

    game.commands.resume = true
    updateGame(game, 1 / 60)
    expect(game.phase).toBe('gameplay')

    updateGame(game, 180)
    expect(game.phase).toBe('the-end')
    expect(game.remainingSeconds).toBe(0)

    updateGame(game, game.theEndSeconds)
    expect(game.phase).toBe('results')
    expect(game.remainingSeconds).toBe(0)
  })

  it('advances the 180 second round through day, dusk, night, THE END, and results', () => {
    const game = createGame({ seed: 100 })
    game.commands.start = true
    updateGame(game, 1 / 60)
    expect(game.phase).toBe('gameplay')
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

    updateGame(game, game.theEndSeconds)
    expect(game.phase).toBe('results')
    expect(game.timeOfDay).toBe('the-end')
  })
})
