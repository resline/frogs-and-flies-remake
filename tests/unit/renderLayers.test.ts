import { describe, expect, test } from 'vitest'
import { Container, Texture } from 'pixi.js'
import { createGame } from '../../src/game/createGame'
import { createRenderLayers } from '../../src/runtime/layers'
import type { GeneratedGameplayAssets } from '../../src/runtime/assets'
import { createRenderScene, renderScene } from '../../src/render/scene'

describe('createRenderLayers', () => {
  test('creates a Pixi root container with named render layers in draw order', () => {
    const layers = createRenderLayers()

    expect(layers.root).toBeInstanceOf(Container)
    expect(layers.root.label).toBe('root')
    expect(layers.root.children.map((child) => child.label)).toEqual(['background', 'gameplay', 'effects', 'ui'])
    expect(layers.background.parent).toBe(layers.root)
    expect(layers.gameplay.parent).toBe(layers.root)
    expect(layers.effects.parent).toBe(layers.root)
    expect(layers.ui.parent).toBe(layers.root)
  })

  test('renders expanded bitmap stage assets and phase-specific player sprites', () => {
    const assets = createTestAssets()
    const scene = createRenderScene()
    const game = createGame({ seed: 25 })

    game.players[0].state.phase = 'charging'
    game.players[1].state.phase = 'airborne'
    game.players[1].state.tongue.phase = 'extended'
    game.elapsedSeconds = 0
    game.entityIds = [10]
    game.entities[10] = { id: 10, kind: 'fly', x: 320, y: 160, vx: 0, radius: 12 }
    scene.assets = assets

    renderScene(scene, game)

    expect(scene.pond.texture).toBe(assets.homePondBackground)
    expect(scene.lilySprites.left.texture).toBe(assets.lilyLeft)
    expect(scene.lilySprites.right.texture).toBe(assets.lilyRight)
    expect(scene.lilySprites.left.visible).toBe(true)
    expect(scene.playerSprites.get('p1')?.texture).toBe(assets.frogP1Crouch)
    expect(scene.playerSprites.get('p2')?.texture).toBe(assets.frogP2Tongue)
    expect(scene.entitySprites.get(10)?.texture).toBe(assets.flyWingA)

    game.elapsedSeconds = 1 / 12
    renderScene(scene, game)

    expect(scene.entitySprites.get(10)?.texture).toBe(assets.flyWingB)

    game.entityIds = []
    game.entities = {}
    game.phase = 'start'
    renderScene(scene, game)

    expect(scene.entitySprites.get(-1)?.texture).toBe(assets.flyWingA)
    expect(scene.entitySprites.get(-1)?.visible).toBe(true)

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
