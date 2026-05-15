import { describe, expect, test } from 'vitest'
import { Graphics } from 'pixi.js'
import { createGame } from '../../src/game/createGame'
import { createRenderEffectState, drawEffects } from '../../src/render/effects'

describe('drawEffects', () => {
  test('reports score as the last effect when a player score increases', () => {
    const game = createGame({ seed: 7 })
    const effects = new Graphics()
    const state = createRenderEffectState()

    expect(drawEffects(effects, game, state)).toBeUndefined()

    game.players[0].score = 10

    expect(drawEffects(effects, game, state)).toBe('score')
    expect(state.lastEffect).toBe('score')

    effects.destroy()
  })

  test('reports score after catch marker clears for catch-driven score increases', () => {
    const game = createGame({ seed: 7 })
    const effects = new Graphics()
    const state = createRenderEffectState()

    expect(drawEffects(effects, game, state)).toBeUndefined()

    game.players[0].score = 10
    game.player.tongue.phase = 'recovering'
    game.player.tongue.result = 'catch'

    expect(drawEffects(effects, game, state)).toBe('catch')
    expect(state.lastEffect).toBe('catch')

    delete game.player.tongue.result

    expect(drawEffects(effects, game, state)).toBe('score')
    expect(state.lastEffect).toBe('score')

    effects.destroy()
  })
})
