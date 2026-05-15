import { Container, Graphics, Sprite } from 'pixi.js'
import { ARENA_HEIGHT, ARENA_WIDTH } from '../game/constants'
import type { GameState } from '../game/types'
import type { GeneratedGameplayAssets } from '../runtime/assets'
import { createRenderLayers, RENDER_LAYER_NAMES, type RenderLayers } from '../runtime/layers'
import { drawBitmapEntities, drawBitmapPlayers, drawProceduralEntities, drawProceduralPlayers, hideBitmapEntities } from './entities'
import { createRenderEffectState, drawEffects, type RenderEffectMarker, type RenderEffectState } from './effects'
import { paletteFor } from './palette'

export type RenderFrameMarkers = {
  layerNames: string
  lastEffect?: RenderEffectMarker
}

export type RenderScene = {
  root: Container
  layers: RenderLayers
  pond: Sprite
  background: Graphics
  gameplay: Graphics
  effects: Graphics
  ui: Graphics
  entities: Container
  entitySprites: Map<number, Sprite>
  playerSprites: Map<string, Sprite>
  effectState: RenderEffectState
  assets?: GeneratedGameplayAssets
}

export function createRenderScene(): RenderScene {
  const layers = createRenderLayers()
  const pond = new Sprite()
  const background = new Graphics()
  const gameplay = new Graphics()
  const effects = new Graphics()
  const ui = new Graphics()
  const entities = new Container()

  pond.visible = false
  entities.label = 'entities'

  layers.background.addChild(pond, background)
  layers.gameplay.addChild(gameplay, entities)
  layers.effects.addChild(effects)
  layers.ui.addChild(ui)

  return {
    root: layers.root,
    layers,
    pond,
    background,
    gameplay,
    effects,
    ui,
    entities,
    entitySprites: new Map(),
    playerSprites: new Map(),
    effectState: createRenderEffectState(),
  }
}

export function renderScene(scene: RenderScene, game: GameState): RenderFrameMarkers {
  if (scene.assets) {
    renderBitmapScene(scene, game)
  } else {
    renderProceduralScene(scene, game)
  }

  return {
    layerNames: RENDER_LAYER_NAMES.join(' '),
    lastEffect: scene.effectState.lastEffect,
  }
}

function renderBitmapScene(scene: RenderScene, game: GameState): void {
  const assets = scene.assets
  if (!assets) {
    return
  }

  scene.pond.visible = true
  scene.background.clear()
  scene.gameplay.clear()
  scene.ui.clear()
  scene.pond.width = ARENA_WIDTH
  scene.pond.height = ARENA_HEIGHT

  drawBitmapPlayers(scene, game, assets)
  drawBitmapEntities(scene, game, assets)
  drawEffects(scene.effects, game, scene.effectState)
  drawPhaseOverlay(scene.ui, game)
}

function renderProceduralScene(scene: RenderScene, game: GameState): void {
  const palette = paletteFor(game.timeOfDay)

  scene.pond.visible = false
  hideBitmapEntities(scene)
  scene.background.clear()
  scene.gameplay.clear()
  scene.ui.clear()

  scene.background.rect(0, 0, ARENA_WIDTH, ARENA_HEIGHT).fill({ color: palette.sky })
  scene.background.rect(0, ARENA_HEIGHT * 0.28, ARENA_WIDTH, ARENA_HEIGHT * 0.72).fill({ color: palette.water })

  drawProceduralPlayers(scene.gameplay, game)
  drawProceduralEntities(scene.gameplay, game)
  drawEffects(scene.effects, game, scene.effectState)
  drawPhaseOverlay(scene.ui, game)
}

function drawPhaseOverlay(scene: Graphics, game: GameState): void {
  if (game.phase === 'pause') {
    scene.rect(0, 0, ARENA_WIDTH, ARENA_HEIGHT).fill({ color: 0x021011, alpha: 0.22 })
  }

  if (game.phase === 'the-end' || game.phase === 'results') {
    scene.rect(0, 0, ARENA_WIDTH, ARENA_HEIGHT).fill({ color: 0x140912, alpha: 0.16 })
  }
}
