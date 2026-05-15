import { describe, expect, test } from 'vitest'
import { Graphics, Texture } from 'pixi.js'
import { createGame } from '../../src/game/createGame'
import type { GeneratedGameplayAssets } from '../../src/runtime/assets'
import { createRenderEffectState, drawEffects } from '../../src/render/effects'
import { createRenderScene, renderScene } from '../../src/render/scene'

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

  test('renders bitmap effect sprites for tongue, catch, splash, and THE END treatment', () => {
    const assets = createTestAssets()
    const scene = createRenderScene()
    const game = createGame({ seed: 25, theEndSeconds: 0.1 })

    scene.assets = assets
    game.phase = 'the-end'
    game.players[0].state.tongue.phase = 'extended'
    game.players[0].state.tongue.result = 'catch'
    game.players[0].state.tongue.originX = 120
    game.players[0].state.tongue.originY = 480
    game.players[0].state.tongue.tipX = 260
    game.players[0].state.tongue.tipY = 220
    game.players[0].water.phase = 'splash'
    game.players[0].water.splashSeconds = 0.1

    renderScene(scene, game)

    expect(scene.effectSprites.tongueFlash.texture).toBe(assets.tongueFlash)
    expect(scene.effectSprites.tongueFlash.visible).toBe(true)
    expect(scene.effectSprites.catchPop.texture).toBe(assets.catchPop)
    expect(scene.effectSprites.catchPop.visible).toBe(true)
    expect(scene.effectSprites.splash.texture).toBe(assets.splashRing)
    expect(scene.effectSprites.splash.visible).toBe(true)
    expect(scene.effectSprites.fireflyEnd.texture).toBe(assets.fireflyEnd)
    expect(scene.effectSprites.fireflyEnd.visible).toBe(true)

    scene.root.destroy({ children: true })
  })
})

function createTestAssets(): GeneratedGameplayAssets {
  return {
    loadedPaths: [],
    homePondBackground: new Texture(),
    lilyLeft: new Texture(),
    lilyRight: new Texture(),
    frogP1Idle: new Texture(),
    frogP1Crouch: new Texture(),
    frogP1Airborne: new Texture(),
    frogP1Tongue: new Texture(),
    frogP1Splash: new Texture(),
    frogP2Idle: new Texture(),
    frogP2Crouch: new Texture(),
    frogP2Airborne: new Texture(),
    frogP2Tongue: new Texture(),
    frogP2Splash: new Texture(),
    flyWingA: new Texture(),
    flyWingB: new Texture(),
    fireflyEnd: new Texture(),
    splashRing: new Texture(),
    catchPop: new Texture(),
    tongueFlash: new Texture(),
    pond: new Texture(),
    frog: new Texture(),
    fly: new Texture(),
    power: new Texture(),
  }
}
