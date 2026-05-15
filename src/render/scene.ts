import { Container, Graphics, Sprite } from 'pixi.js'
import { ARENA_HEIGHT, ARENA_WIDTH, HOME_POND_LILY_LANDING_RADIUS, HOME_POND_LILY_Y } from '../game/constants'
import type { GameState } from '../game/types'
import type { GeneratedGameplayAssets } from '../runtime/assets'
import { createRenderLayers, RENDER_LAYER_NAMES, type RenderLayers } from '../runtime/layers'
import { drawBitmapEntities, drawBitmapPlayers, drawProceduralEntities, drawProceduralPlayers, hideBitmapEntities } from './entities'
import {
  createBitmapEffectSprites,
  createRenderEffectState,
  drawBitmapEffectSprites,
  drawEffects,
  hideBitmapEffectSprites,
  type BitmapEffectSprites,
  type RenderEffectMarker,
  type RenderEffectState,
} from './effects'
import { paletteFor } from './palette'

export type RenderFrameMarkers = {
  layerNames: string
  lastEffect?: RenderEffectMarker
}

export type RenderScene = {
  root: Container
  layers: RenderLayers
  pond: Sprite
  lilySprites: {
    left: Sprite
    right: Sprite
  }
  background: Graphics
  gameplay: Graphics
  effects: Graphics
  ui: Graphics
  entities: Container
  effectSpriteLayer: Container
  effectSprites: BitmapEffectSprites
  entitySprites: Map<number, Sprite>
  playerSprites: Map<string, Sprite>
  effectState: RenderEffectState
  assets?: GeneratedGameplayAssets
}

export function createRenderScene(): RenderScene {
  const layers = createRenderLayers()
  const pond = new Sprite()
  const lilyLeft = new Sprite()
  const lilyRight = new Sprite()
  const background = new Graphics()
  const gameplay = new Graphics()
  const effects = new Graphics()
  const ui = new Graphics()
  const entities = new Container()
  const effectSpriteLayer = new Container()
  const effectSprites = createBitmapEffectSprites()

  pond.visible = false
  lilyLeft.visible = false
  lilyRight.visible = false
  lilyLeft.anchor.set(0.5)
  lilyRight.anchor.set(0.5)
  lilyLeft.label = 'lily-left'
  lilyRight.label = 'lily-right'
  entities.label = 'entities'
  effectSpriteLayer.label = 'effect-sprites'
  effectSpriteLayer.addChild(effectSprites.splash, effectSprites.tongueFlash, effectSprites.catchPop, effectSprites.fireflyEnd)

  layers.background.addChild(pond, background, lilyLeft, lilyRight)
  layers.gameplay.addChild(gameplay, entities)
  layers.effects.addChild(effects, effectSpriteLayer)
  layers.ui.addChild(ui)

  return {
    root: layers.root,
    layers,
    pond,
    lilySprites: {
      left: lilyLeft,
      right: lilyRight,
    },
    background,
    gameplay,
    effects,
    ui,
    entities,
    effectSpriteLayer,
    effectSprites,
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
  scene.pond.texture = assets.homePondBackground
  scene.pond.width = ARENA_WIDTH
  scene.pond.height = ARENA_HEIGHT
  drawBitmapLilies(scene, assets)

  drawBitmapPlayers(scene, game, assets)
  drawBitmapEntities(scene, game, assets)
  drawEffects(scene.effects, game, scene.effectState)
  drawBitmapEffectSprites(scene.effectSprites, game, scene.effectState, assets)
  drawPhaseOverlay(scene.ui, game)
}

function renderProceduralScene(scene: RenderScene, game: GameState): void {
  const palette = paletteFor(game.timeOfDay)

  scene.pond.visible = false
  scene.lilySprites.left.visible = false
  scene.lilySprites.right.visible = false
  hideBitmapEntities(scene)
  hideBitmapEffectSprites(scene.effectSprites)
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

function drawBitmapLilies(scene: RenderScene, assets: GeneratedGameplayAssets): void {
  const lilyWidth = HOME_POND_LILY_LANDING_RADIUS * 3
  const lilyHeight = lilyWidth * 0.75

  scene.lilySprites.left.visible = true
  scene.lilySprites.left.texture = assets.lilyLeft
  scene.lilySprites.left.position.set(HOME_POND_LILY_LANDING_RADIUS * 2.1, HOME_POND_LILY_Y + 18)
  scene.lilySprites.left.width = lilyWidth
  scene.lilySprites.left.height = lilyHeight
  scene.lilySprites.left.tint = 0xffffff

  scene.lilySprites.right.visible = true
  scene.lilySprites.right.texture = assets.lilyRight
  scene.lilySprites.right.position.set(ARENA_WIDTH - HOME_POND_LILY_LANDING_RADIUS * 2.1, HOME_POND_LILY_Y + 18)
  scene.lilySprites.right.width = lilyWidth
  scene.lilySprites.right.height = lilyHeight
  scene.lilySprites.right.tint = 0xffffff
}

function drawPhaseOverlay(scene: Graphics, game: GameState): void {
  if (game.phase === 'pause') {
    scene.rect(0, 0, ARENA_WIDTH, ARENA_HEIGHT).fill({ color: 0x021011, alpha: 0.22 })
  }

  if (game.phase === 'the-end' || game.phase === 'results') {
    scene.rect(0, 0, ARENA_WIDTH, ARENA_HEIGHT).fill({ color: 0x140912, alpha: 0.16 })
  }
}
