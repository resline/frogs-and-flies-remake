import { Application, Assets, Container, Graphics, Sprite } from 'pixi.js'
import './style.css'
import { ARENA_HEIGHT, ARENA_WIDTH, FIXED_TIMESTEP_SECONDS } from './game/constants'
import { createGame } from './game/createGame'
import { createFixedStep } from './game/fixedStep'
import { buildResults } from './game/match'
import { updateGame } from './game/update'
import { readRuntimeParams, type RuntimeParams } from './runtime/params'
import type { GameState, TimeOfDay } from './game/types'
import type { Texture } from 'pixi.js'

type DomState = {
  shell: HTMLElement
  gameHost: HTMLElement
  canvas?: HTMLCanvasElement
  state: HTMLElement
  score: HTMLElement
  timer: HTMLElement
  timerAlias: HTMLElement
  seed: HTMLElement
  seedAlias: HTMLElement
  results: HTMLElement
  theEnd: HTMLElement
  startButton: HTMLElement
  pauseButton: HTMLElement
  resumeButton: HTMLElement
  replayButton: HTMLElement
}

type GeneratedGameplayAssets = {
  loadedPaths: readonly string[]
  pond: Texture
  frog: Texture
  fly: Texture
  power: Texture
}

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

const GENERATED_GAMEPLAY_ASSET_PATHS = [
  '/assets/pond-arena.png',
  '/assets/frog.png',
  '/assets/fly.png',
  '/assets/power.png',
] as const

const params = readRuntimeParams(new URLSearchParams(window.location.search))
const appRoot = document.querySelector<HTMLElement>('#app')

if (!appRoot) {
  throw new Error('Missing #app mount point')
}

void boot(appRoot, params)

async function boot(root: HTMLElement, runtimeParams: RuntimeParams): Promise<void> {
  const dom = createDomState(root)
  let game = createInitialGame(runtimeParams)
  let fixedStep = createFixedStep(FIXED_TIMESTEP_SECONDS)
  let pendingFire = false
  let pendingTongue = false
  let pendingJumpRelease = false
  const heldKeys = new Set<string>()
  const heldJumpKeys = new Set<string>()
  let scene: RenderScene | undefined

  const refresh = () => {
    syncDom(dom, game)
    if (scene) {
      renderScene(scene, game)
    }
  }

  const runCommand = (command: 'start' | 'pause' | 'resume') => {
    game.commands[command] = true
    updateGame(game, 0)
    refresh()
  }

  const replay = () => {
    game = createGame(runtimeParams)
    fixedStep = createFixedStep(FIXED_TIMESTEP_SECONDS)
    game.commands.start = true
    updateGame(game, 0)
    refresh()
  }

  dom.startButton.addEventListener('click', () => {
    if (game.phase === 'results') {
      replay()
      return
    }
    runCommand('start')
  })
  dom.pauseButton.addEventListener('click', () => runCommand('pause'))
  dom.resumeButton.addEventListener('click', () => runCommand('resume'))
  dom.replayButton.addEventListener('click', replay)

  window.addEventListener('keydown', (event) => {
    heldKeys.add(event.code)

    if (event.code === 'Enter') {
      event.preventDefault()
      if (game.phase === 'pause') {
        runCommand('resume')
      } else if (game.phase === 'results') {
        replay()
      } else {
        runCommand('start')
      }
    }

    if (event.code === 'KeyP') {
      event.preventDefault()
      runCommand(game.phase === 'pause' ? 'resume' : 'pause')
    }

    if (event.code === 'Space') {
      event.preventDefault()
      heldJumpKeys.add(event.code)
    }

    if (event.code === 'KeyT') {
      event.preventDefault()
      pendingTongue = true
    }
  })

  window.addEventListener('keyup', (event) => {
    heldKeys.delete(event.code)

    if (event.code === 'Space') {
      event.preventDefault()
      heldJumpKeys.delete(event.code)
      pendingJumpRelease = true
    }
  })

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
  mountCanvas(dom.gameHost, app.canvas)
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

  app.canvas.addEventListener('pointerdown', (event) => {
    const bounds = app.canvas.getBoundingClientRect()
    const pointerX = ((event.clientX - bounds.left) / bounds.width) * ARENA_WIDTH

    game.player.x = clamp(pointerX, game.player.radius, game.constants.arenaWidth - game.player.radius)
    pendingFire = true
    pendingTongue = true

    if (game.phase === 'start') {
      runCommand('start')
    }
  })

  refresh()

  app.ticker.add((ticker) => {
    const deltaSeconds = Math.min(ticker.deltaMS / 1000, 0.25)

    fixedStep.advance(deltaSeconds, () => {
      game.commands.moveLeft = heldKeys.has('ArrowLeft') || heldKeys.has('KeyA')
      game.commands.moveRight = heldKeys.has('ArrowRight') || heldKeys.has('KeyD')
      game.commands.chargeJump = heldJumpKeys.size > 0
      game.commands.releaseJump = pendingJumpRelease
      game.commands.tongue = pendingTongue
      game.commands.fire = pendingFire
      pendingJumpRelease = false
      pendingTongue = false
      pendingFire = false
      updateGame(game, FIXED_TIMESTEP_SECONDS)
    })

    refresh()
  })
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

function createDomState(root: HTMLElement): DomState {
  const shell = root.querySelector<HTMLElement>('.game-shell') ?? root.querySelector<HTMLElement>('main') ?? getOrCreate(root, 'div', 'game-shell', root)
  const gameHost =
    root.querySelector<HTMLElement>('#canvas-mount') ??
    root.querySelector<HTMLElement>('#game') ??
    getOrCreate(root, 'div', 'game', shell)
  const hud = getOrCreate(root, 'div', 'm0-hud', shell)
  const controls = getOrCreate(root, 'div', 'm0-controls', shell)

  if (shell.tagName !== 'MAIN') {
    shell.classList.add('game-shell')
  }
  shell.style.position = 'relative'

  styleHud(hud)
  styleControls(controls)

  const state = getOrCreateTestElement(root, 'game-state', 'div', hud)
  const score = getOrCreateTestElement(root, 'score', 'output', hud)
  const timer = getOrCreateTestElement(root, 'round-timer', 'output', hud)
  const timerAlias = getOrCreateTestElement(root, 'timer', 'output', hud)
  const seed = getOrCreateTestElement(root, 'round-seed', 'output', hud)
  const seedAlias = getOrCreateTestElement(root, 'seed', 'output', hud)
  const results = getOrCreateTestElement(root, 'results', 'section', hud)
  const theEnd = getOrCreateTestElement(root, 'the-end', 'div', hud)

  const startButton = getOrCreateButton(root, 'start-game', 'Start', controls)
  const pauseButton = getOrCreateButton(root, 'pause-game', 'Pause', controls)
  const resumeButton = getOrCreateButton(root, 'resume-game', 'Resume', controls)
  const replayButton = getOrCreateButton(root, 'replay-game', 'Replay', controls)

  return {
    shell,
    gameHost,
    state,
    score,
    timer,
    timerAlias,
    seed,
    seedAlias,
    results,
    theEnd,
    startButton,
    pauseButton,
    resumeButton,
    replayButton,
  }
}

function mountCanvas(gameHost: HTMLElement, canvas: HTMLCanvasElement): void {
  const resize = () => {
    const availableWidth = Math.max(320, window.innerWidth - 32)
    const availableHeight = Math.max(240, window.innerHeight - 32)
    const scale = Math.min(1, availableWidth / ARENA_WIDTH, availableHeight / ARENA_HEIGHT)
    const width = Math.floor(ARENA_WIDTH * scale)
    const height = Math.floor(ARENA_HEIGHT * scale)

    gameHost.style.setProperty('position', 'fixed', 'important')
    gameHost.style.setProperty('left', '50%', 'important')
    gameHost.style.setProperty('top', '50%', 'important')
    gameHost.style.setProperty('transform', 'translate(-50%, -50%)', 'important')
    gameHost.style.setProperty('z-index', '0', 'important')
    gameHost.style.setProperty('display', 'grid', 'important')
    gameHost.style.setProperty('place-items', 'center', 'important')
    gameHost.style.setProperty('width', `${width}px`, 'important')
    gameHost.style.setProperty('height', `${height}px`, 'important')
    gameHost.style.setProperty('max-width', 'calc(100vw - 32px)', 'important')
    gameHost.style.setProperty('max-height', 'calc(100dvh - 32px)', 'important')

    canvas.style.setProperty('width', `${width}px`, 'important')
    canvas.style.setProperty('height', `${height}px`, 'important')
    canvas.style.setProperty('max-width', 'calc(100vw - 32px)', 'important')
    canvas.style.setProperty('max-height', 'calc(100dvh - 32px)', 'important')
  }

  canvas.setAttribute('aria-label', 'Frogs and Flies game canvas')
  canvas.style.setProperty('touch-action', 'manipulation')
  gameHost.appendChild(canvas)
  resize()
  window.addEventListener('resize', resize)
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

async function loadGeneratedGameplayAssets(canvas: HTMLCanvasElement): Promise<GeneratedGameplayAssets | undefined> {
  try {
    const textures = await Assets.load<Texture>([...GENERATED_GAMEPLAY_ASSET_PATHS])

    canvas.setAttribute('data-assets-loaded', GENERATED_GAMEPLAY_ASSET_PATHS.join(' '))
    return {
      loadedPaths: GENERATED_GAMEPLAY_ASSET_PATHS,
      pond: textures['/assets/pond-arena.png'],
      frog: textures['/assets/frog.png'],
      fly: textures['/assets/fly.png'],
      power: textures['/assets/power.png'],
    }
  } catch (error) {
    canvas.removeAttribute('data-assets-loaded')
    console.warn('Generated gameplay assets failed to load; using procedural fallback.', error)
    return undefined
  }
}

function getOrCreate(root: HTMLElement, tagName: string, id: string, parent: HTMLElement): HTMLElement {
  const existing = root.querySelector<HTMLElement>(`#${id}`)
  if (existing) {
    return existing
  }

  const element = document.createElement(tagName)
  element.id = id
  parent.appendChild(element)
  return element
}

function getOrCreateTestElement(
  root: HTMLElement,
  testId: string,
  tagName: keyof HTMLElementTagNameMap,
  parent: HTMLElement,
): HTMLElement {
  const existing = root.querySelector<HTMLElement>(`[data-testid="${testId}"]`)
  if (existing) {
    return existing
  }

  const element = document.createElement(tagName)
  element.setAttribute('data-testid', testId)
  parent.appendChild(element)
  return element
}

function getOrCreateButton(root: HTMLElement, testId: string, label: string, parent: HTMLElement): HTMLElement {
  const button = getOrCreateTestElement(root, testId, 'button', parent)
  button.textContent = button.textContent?.trim() || label
  button.style.position = 'relative'
  button.style.zIndex = '4'

  if (button instanceof HTMLButtonElement) {
    button.type = 'button'
  }

  return button
}

function styleHud(hud: HTMLElement): void {
  hud.style.position = 'absolute'
  hud.style.top = '16px'
  hud.style.left = '16px'
  hud.style.zIndex = '2'
  hud.style.display = 'flex'
  hud.style.flexWrap = 'wrap'
  hud.style.gap = '8px'
  hud.style.alignItems = 'center'
  hud.style.maxWidth = 'min(760px, calc(100% - 32px))'
  hud.style.pointerEvents = 'none'

  for (const child of Array.from(hud.children) as HTMLElement[]) {
    child.style.pointerEvents = 'auto'
  }
}

function styleControls(controls: HTMLElement): void {
  controls.style.position = 'absolute'
  controls.style.right = '16px'
  controls.style.bottom = '16px'
  controls.style.zIndex = '2'
  controls.style.display = 'flex'
  controls.style.flexWrap = 'wrap'
  controls.style.gap = '8px'
  controls.style.justifyContent = 'flex-end'
  controls.style.maxWidth = 'min(420px, calc(100% - 32px))'
}

function syncDom(dom: DomState, game: GameState): void {
  dom.state.setAttribute('data-state', game.phase)
  dom.state.setAttribute('data-time-of-day', game.timeOfDay)
  syncM1RuntimeMarkers(dom.state, game)
  if (dom.canvas) {
    syncM1RuntimeMarkers(dom.canvas, game)
    dom.canvas.setAttribute('data-testid', 'game-canvas')
    dom.canvas.setAttribute('data-runtime-markers', 'm1')
  }
  dom.state.textContent = `State: ${game.phase}`

  const remainingSeconds = Math.ceil(game.remainingSeconds)
  const scoreText = `Score: ${game.score}`
  const timerText = `Time: ${remainingSeconds}`
  const seedText = `Seed: ${game.seed}`

  dom.score.textContent = scoreText
  dom.score.setAttribute('data-score', String(game.score))
  dom.score.setAttribute('data-combo', String(game.combo))

  for (const element of [dom.timer, dom.timerAlias]) {
    element.textContent = timerText
    element.setAttribute('data-target-seconds', String(game.durationSeconds))
    element.setAttribute('data-remaining-seconds', String(remainingSeconds))
  }

  for (const element of [dom.seed, dom.seedAlias]) {
    element.textContent = seedText
    element.setAttribute('data-seed', String(game.seed))
  }

  dom.theEnd.textContent = game.phase === 'the-end' ? 'THE END' : ''
  dom.theEnd.style.display = game.phase === 'the-end' ? 'block' : 'none'

  dom.results.textContent = `Results: ${game.score}`
  if (game.results) {
    dom.results.setAttribute('data-winner', game.results.winner)
  } else {
    dom.results.removeAttribute('data-winner')
  }
  dom.results.style.display = game.phase === 'results' ? 'block' : 'none'

  styleMarker(dom.state)
  styleMarker(dom.score)
  styleMarker(dom.timer)
  styleMarker(dom.timerAlias)
  styleMarker(dom.seed)
  styleMarker(dom.seedAlias)
  styleMarker(dom.results)
  styleTheEnd(dom.theEnd)
}

function syncM1RuntimeMarkers(element: HTMLElement, game: GameState): void {
  element.setAttribute('data-jump-phase', game.player.jump.phase)
  element.setAttribute('data-jump-airborne', String(game.player.jump.airborne))
  element.setAttribute('data-jump-charge-seconds', formatMarkerSeconds(game.player.jump.chargeSeconds))
  element.setAttribute('data-tongue-phase', game.player.tongue.phase)
  element.setAttribute('data-tongue-result', game.player.tongue.result ?? 'none')
  element.setAttribute('data-combo', String(game.combo))
  element.setAttribute('data-water-phase', game.water.phase)
  element.setAttribute('data-water-splash-seconds', formatMarkerSeconds(game.water.splashSeconds))
  element.setAttribute('data-water-recovery-seconds', formatMarkerSeconds(game.water.recoverySeconds))
}

function formatMarkerSeconds(seconds: number): string {
  return seconds.toFixed(3)
}

function styleMarker(element: HTMLElement): void {
  element.style.border = '1px solid rgba(229, 255, 224, 0.2)'
  element.style.borderRadius = '6px'
  element.style.background = 'rgba(5, 20, 22, 0.74)'
  element.style.color = '#f4fbef'
  element.style.padding = '6px 8px'
  element.style.fontSize = '13px'
  element.style.lineHeight = '1.1'
}

function styleTheEnd(element: HTMLElement): void {
  element.style.position = 'absolute'
  element.style.left = '50%'
  element.style.top = '50%'
  element.style.transform = 'translate(-50%, -50%)'
  element.style.padding = '14px 20px'
  element.style.borderRadius = '6px'
  element.style.background = 'rgba(16, 4, 14, 0.82)'
  element.style.color = '#fff2b8'
  element.style.fontSize = '40px'
  element.style.fontWeight = '800'
  element.style.letterSpacing = '0'
  element.style.pointerEvents = 'none'
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
