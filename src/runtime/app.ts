import { Application, Container, Graphics, Sprite } from 'pixi.js'
import { ARENA_HEIGHT, ARENA_WIDTH, FIXED_TIMESTEP_SECONDS } from '../game/constants'
import { createGame } from '../game/createGame'
import { createFixedStep } from '../game/fixedStep'
import { buildResults } from '../game/match'
import { updateGame } from '../game/update'
import {
  applyRuntimeInput,
  applyRuntimePointerInput,
  createRuntimeInputState,
  handleRuntimeKeyDown,
  handleRuntimeKeyUp,
  type RuntimeInputAction,
} from './input'
import { loadGeneratedGameplayAssets, type GeneratedGameplayAssets } from './assets'
import { createDomState, mountCanvas, syncDom } from './dom'
import type { RuntimeParams } from './params'
import type { GameState, TimeOfDay } from '../game/types'

type RenderScene = {
  root: Container
  pond: Sprite
  fallback: Graphics
  effects: Graphics
  player: Sprite
  entities: Container
  entitySprites: Map<number, Sprite>
  overlay: Graphics
  assets?: GeneratedGameplayAssets
}

const RUNTIME_PREVENT_DEFAULT_CODES = new Set([
  'ArrowLeft',
  'ArrowRight',
  'KeyA',
  'KeyD',
  'Space',
  'KeyT',
  'KeyJ',
  'KeyL',
  'KeyI',
  'KeyO',
  'Enter',
  'KeyP',
  'Digit1',
  'Digit2',
])

export type RuntimeHandle = {
  start: () => void
  pause: () => void
  resume: () => void
  replay: () => void
  destroy: () => void
}

export async function startRuntime(root: HTMLElement, runtimeParams: RuntimeParams): Promise<RuntimeHandle> {
  const dom = createDomState(root)
  let currentRuntimeParams = runtimeParams
  let game = createInitialGame(currentRuntimeParams)
  let fixedStep = createFixedStep(FIXED_TIMESTEP_SECONDS)
  const runtimeInput = createRuntimeInputState()
  let scene: RenderScene | undefined
  let destroyed = false
  let removeResizeListener: (() => void) | undefined

  const refresh = () => {
    if (destroyed) {
      return
    }
    syncDom(dom, game)
    if (scene) {
      renderScene(scene, game)
    }
  }

  const resetGame = (nextRuntimeParams = currentRuntimeParams, start = false) => {
    currentRuntimeParams = nextRuntimeParams
    game = createGame(currentRuntimeParams)
    fixedStep = createFixedStep(FIXED_TIMESTEP_SECONDS)
    if (start) {
      game.commands.start = true
      updateGame(game, 0)
    }
    refresh()
  }

  const runCommand = (command: 'start' | 'pause' | 'resume') => {
    game.commands[command] = true
    updateGame(game, 0)
    refresh()
  }

  const replay = () => {
    resetGame(currentRuntimeParams, true)
  }

  const runRuntimeAction = (action: RuntimeInputAction | undefined) => {
    if (!action) {
      return
    }

    if (action.type === 'start') {
      if (game.phase === 'pause') {
        runCommand('resume')
      } else if (game.phase === 'results') {
        replay()
      } else {
        runCommand('start')
      }
      return
    }

    if (action.type === 'pause-toggle') {
      runCommand(game.phase === 'pause' ? 'resume' : 'pause')
      return
    }

    resetGame({ ...currentRuntimeParams, mode: action.mode })
  }

  const handleStartClick = () => {
    if (game.phase === 'results') {
      replay()
      return
    }
    runCommand('start')
  }
  const handlePauseClick = () => runCommand('pause')
  const handleResumeClick = () => runCommand('resume')

  dom.startButton.addEventListener('click', handleStartClick)
  dom.pauseButton.addEventListener('click', handlePauseClick)
  dom.resumeButton.addEventListener('click', handleResumeClick)
  dom.replayButton.addEventListener('click', replay)

  const handleKeyDown = (event: KeyboardEvent) => {
    if (RUNTIME_PREVENT_DEFAULT_CODES.has(event.code)) {
      event.preventDefault()
    }

    runRuntimeAction(handleRuntimeKeyDown(runtimeInput, event.code))
  }

  const handleKeyUp = (event: KeyboardEvent) => {
    if (RUNTIME_PREVENT_DEFAULT_CODES.has(event.code)) {
      event.preventDefault()
    }

    handleRuntimeKeyUp(runtimeInput, event.code)
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)

  const app = new Application()
  await app.init({
    width: ARENA_WIDTH,
    height: ARENA_HEIGHT,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    backgroundColor: 0x06252b,
  })

  scene = createRenderScene()
  app.stage.addChild(scene.root)
  removeResizeListener = mountCanvas(dom.gameHost, app.canvas)
  dom.canvas = app.canvas
  void loadGeneratedGameplayAssets(app.canvas).then((assets) => {
    if (!assets || !scene) {
      return
    }

    scene.assets = assets
    scene.pond.texture = assets.pond
    scene.pond.width = ARENA_WIDTH
    scene.pond.height = ARENA_HEIGHT
    scene.player.texture = assets.frog
    refresh()
  })

  const handlePointerDown = (event: PointerEvent) => {
    const bounds = app.canvas.getBoundingClientRect()
    const pointerX = ((event.clientX - bounds.left) / bounds.width) * ARENA_WIDTH

    applyRuntimePointerInput(game, runtimeInput, pointerX)

    if (game.phase === 'start') {
      runCommand('start')
    }
  }

  app.canvas.addEventListener('pointerdown', handlePointerDown)

  refresh()

  const tick = (ticker: { deltaMS: number }) => {
    const deltaSeconds = Math.min(ticker.deltaMS / 1000, 0.25)

    fixedStep.advance(deltaSeconds, () => {
      applyRuntimeInput(game, runtimeInput)
      updateGame(game, FIXED_TIMESTEP_SECONDS)
    })

    refresh()
  }
  app.ticker.add(tick)

  return {
    start: () => runCommand('start'),
    pause: () => runCommand('pause'),
    resume: () => runCommand('resume'),
    replay,
    destroy: () => {
      destroyed = true
      dom.startButton.removeEventListener('click', handleStartClick)
      dom.pauseButton.removeEventListener('click', handlePauseClick)
      dom.resumeButton.removeEventListener('click', handleResumeClick)
      dom.replayButton.removeEventListener('click', replay)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      app.canvas.removeEventListener('pointerdown', handlePointerDown)
      removeResizeListener?.()
      app.ticker.remove(tick)
      app.destroy(true)
    },
  }
}

function createInitialGame(runtimeParams: RuntimeParams): GameState {
  const game = createGame(runtimeParams)
  const fixedStep = createFixedStep(FIXED_TIMESTEP_SECONDS)

  if (runtimeParams.smokeElapsedSeconds !== undefined) {
    game.commands.start = true
    updateGame(game, 0)
    advanceByFixedStep(game, fixedStep, runtimeParams.smokeElapsedSeconds)
  }

  if (runtimeParams.smokeState) {
    game.phase = runtimeParams.smokeState
    if (game.phase === 'results') {
      game.remainingSeconds = 0
      game.timeOfDay = 'the-end'
      game.results ??= buildResults(game)
    }
  }

  return game
}

function advanceByFixedStep(game: GameState, fixedStep: ReturnType<typeof createFixedStep>, elapsedSeconds: number): void {
  let remainingSeconds = elapsedSeconds

  while (remainingSeconds >= FIXED_TIMESTEP_SECONDS) {
    fixedStep.advance(FIXED_TIMESTEP_SECONDS, () => updateGame(game, FIXED_TIMESTEP_SECONDS))
    remainingSeconds -= FIXED_TIMESTEP_SECONDS
  }

  if (remainingSeconds > 0) {
    fixedStep.advance(remainingSeconds, () => updateGame(game, FIXED_TIMESTEP_SECONDS))
  }
}

function createRenderScene(): RenderScene {
  const root = new Container()
  const pond = new Sprite()
  const fallback = new Graphics()
  const effects = new Graphics()
  const player = new Sprite({ anchor: 0.5 })
  const entities = new Container()
  const overlay = new Graphics()

  pond.visible = false
  player.visible = false

  root.addChild(pond)
  root.addChild(fallback)
  root.addChild(effects)
  root.addChild(player)
  root.addChild(entities)
  root.addChild(overlay)

  return {
    root,
    pond,
    fallback,
    effects,
    player,
    entities,
    entitySprites: new Map(),
    overlay,
  }
}

function renderScene(scene: RenderScene, game: GameState): void {
  if (scene.assets) {
    renderBitmapScene(scene, game)
    return
  }

  hideBitmapScene(scene)
  renderProceduralScene(scene.fallback, game)
}

function renderBitmapScene(scene: RenderScene, game: GameState): void {
  const assets = scene.assets
  if (!assets) {
    return
  }

  scene.pond.visible = true
  scene.fallback.clear()
  scene.effects.clear()
  scene.overlay.clear()

  drawBitmapEffects(scene.effects, game)
  drawBitmapPlayer(scene.player, game)
  drawBitmapEntities(scene, game, assets)
  drawPhaseOverlay(scene.overlay, game)
}

function hideBitmapScene(scene: RenderScene): void {
  scene.pond.visible = false
  scene.player.visible = false
  scene.effects.clear()
  scene.overlay.clear()

  for (const sprite of scene.entitySprites.values()) {
    sprite.visible = false
  }
}

function renderProceduralScene(scene: Graphics, game: GameState): void {
  const palette = paletteFor(game.timeOfDay)

  scene.clear()
  scene.rect(0, 0, ARENA_WIDTH, ARENA_HEIGHT).fill({ color: palette.sky })
  scene.rect(0, ARENA_HEIGHT * 0.28, ARENA_WIDTH, ARENA_HEIGHT * 0.72).fill({ color: palette.water })
  scene.rect(0, 0, ARENA_WIDTH, 82).fill({ color: palette.hud, alpha: 0.52 })
  scene.rect(0, ARENA_HEIGHT - 90, ARENA_WIDTH, 90).fill({ color: 0x05221c, alpha: 0.76 })

  for (let index = 0; index < 9; index += 1) {
    const x = 74 + index * 86
    const y = 230 + ((index * 47 + game.seed) % 210)
    scene.ellipse(x, y, 38, 9).fill({ color: palette.ripple, alpha: 0.28 })
  }

  scene.ellipse(116, ARENA_HEIGHT - 74, 84, 28).fill({ color: 0x2e7d45 })
  scene.ellipse(ARENA_WIDTH - 116, ARENA_HEIGHT - 74, 84, 28).fill({ color: 0x2b7340 })

  drawPlayer(scene, game)
  drawEntities(scene, game)

  drawPhaseOverlay(scene, game)
}

function drawBitmapEffects(scene: Graphics, game: GameState): void {
  const palette = paletteFor(game.timeOfDay)

  scene.rect(0, 0, ARENA_WIDTH, 82).fill({ color: palette.hud, alpha: 0.38 })
  scene.rect(0, ARENA_HEIGHT - 90, ARENA_WIDTH, 90).fill({ color: 0x05221c, alpha: 0.28 })

  for (let index = 0; index < 9; index += 1) {
    const x = 74 + index * 86
    const y = 230 + ((index * 47 + game.seed) % 210)
    scene.ellipse(x, y, 38, 9).fill({ color: palette.ripple, alpha: 0.2 })
  }

  scene.ellipse(116, ARENA_HEIGHT - 74, 84, 28).fill({ color: 0x2e7d45, alpha: 0.52 })
  scene.ellipse(ARENA_WIDTH - 116, ARENA_HEIGHT - 74, 84, 28).fill({ color: 0x2b7340, alpha: 0.52 })

  if (game.power.remainingSeconds > 0) {
    scene.circle(game.player.x, game.player.y, game.player.radius + 15).fill({ color: 0xd9ff71, alpha: 0.22 })
  }

  if (game.phase === 'gameplay') {
    const powered = game.power.remainingSeconds > 0
    scene.circle(game.player.x, game.player.y, game.catchRadius).stroke({ width: 2, color: powered ? 0xd9ff71 : 0x9fe8ff, alpha: 0.25 })
  }
}

function drawBitmapPlayer(sprite: Sprite, game: GameState): void {
  sprite.visible = true
  sprite.position.set(game.player.x, game.player.y)
  sprite.width = game.player.radius * 3.2
  sprite.height = game.player.radius * 3.2
  sprite.tint = game.power.remainingSeconds > 0 ? 0xdfff9e : 0xffffff
}

function drawBitmapEntities(scene: RenderScene, game: GameState, assets: GeneratedGameplayAssets): void {
  const activeIds = new Set<number>()

  for (const id of game.entityIds) {
    const entity = game.entities[id]
    if (!entity) {
      continue
    }

    activeIds.add(id)

    let sprite = scene.entitySprites.get(id)
    if (!sprite) {
      sprite = new Sprite({ anchor: 0.5 })
      scene.entitySprites.set(id, sprite)
      scene.entities.addChild(sprite)
    }

    sprite.visible = true
    sprite.texture = entity.kind === 'fly' ? assets.fly : assets.power
    sprite.position.set(entity.x, entity.y)
    sprite.width = entity.kind === 'fly' ? entity.radius * 4.4 : entity.radius * 3.2
    sprite.height = entity.kind === 'fly' ? entity.radius * 3.2 : entity.radius * 3.2
    sprite.rotation = entity.kind === 'fly' ? Math.sin((entity.x + entity.y) * 0.02) * 0.08 : 0
  }

  for (const [id, sprite] of scene.entitySprites) {
    if (activeIds.has(id)) {
      continue
    }

    scene.entities.removeChild(sprite)
    sprite.destroy()
    scene.entitySprites.delete(id)
  }
}

function drawPhaseOverlay(scene: Graphics, game: GameState): void {
  if (game.phase === 'pause') {
    scene.rect(0, 0, ARENA_WIDTH, ARENA_HEIGHT).fill({ color: 0x021011, alpha: 0.38 })
  }

  if (game.phase === 'the-end' || game.phase === 'results') {
    scene.rect(0, 0, ARENA_WIDTH, ARENA_HEIGHT).fill({ color: 0x140912, alpha: 0.34 })
  }
}

function drawPlayer(scene: Graphics, game: GameState): void {
  const { x, y, radius } = game.player
  const powered = game.power.remainingSeconds > 0
  const body = powered ? 0x94f65f : 0x4fc35b
  const belly = powered ? 0xe0ffc6 : 0xbdf49e

  scene.circle(x, y, radius + 10).fill({ color: 0x163e28, alpha: 0.46 })
  scene.circle(x, y, radius).fill({ color: body })
  scene.circle(x, y + 8, radius * 0.58).fill({ color: belly, alpha: 0.92 })
  scene.circle(x - 12, y - 20, 8).fill({ color: 0xf4fbef })
  scene.circle(x + 12, y - 20, 8).fill({ color: 0xf4fbef })
  scene.circle(x - 12, y - 20, 3).fill({ color: 0x051416 })
  scene.circle(x + 12, y - 20, 3).fill({ color: 0x051416 })

  if (game.phase === 'gameplay') {
    scene.circle(x, y, game.catchRadius).stroke({ width: 2, color: powered ? 0xd9ff71 : 0x9fe8ff, alpha: 0.25 })
  }
}

function drawEntities(scene: Graphics, game: GameState): void {
  for (const id of game.entityIds) {
    const entity = game.entities[id]
    if (!entity) {
      continue
    }

    if (entity.kind === 'fly') {
      scene.ellipse(entity.x - 5, entity.y - 4, 8, 5).fill({ color: 0xdff3ff, alpha: 0.78 })
      scene.ellipse(entity.x + 5, entity.y - 4, 8, 5).fill({ color: 0xdff3ff, alpha: 0.78 })
      scene.circle(entity.x, entity.y, entity.radius).fill({ color: 0x16140f })
      scene.circle(entity.x + 4, entity.y - 4, 3).fill({ color: 0xffe36a })
    } else {
      scene.circle(entity.x, entity.y, entity.radius + 8).fill({ color: 0xf7d154, alpha: 0.26 })
      scene.circle(entity.x, entity.y, entity.radius).fill({ color: 0xfff178 })
      scene.circle(entity.x, entity.y, entity.radius * 0.48).fill({ color: 0x6fe86c })
    }
  }
}

function paletteFor(timeOfDay: TimeOfDay): {
  sky: number
  water: number
  hud: number
  ripple: number
} {
  if (timeOfDay === 'dusk') {
    return { sky: 0x633b57, water: 0x1f5c68, hud: 0x28172b, ripple: 0xffd28a }
  }

  if (timeOfDay === 'night') {
    return { sky: 0x101f3f, water: 0x0a394a, hud: 0x071225, ripple: 0x8bd5ff }
  }

  if (timeOfDay === 'the-end') {
    return { sky: 0x1a0a16, water: 0x17142b, hud: 0x120710, ripple: 0xfff0a8 }
  }

  return { sky: 0x79c7d2, water: 0x147887, hud: 0x06353a, ripple: 0xd9fff0 }
}
