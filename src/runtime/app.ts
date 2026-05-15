import { Application } from 'pixi.js'
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
import { createRenderScene, renderScene, type RenderFrameMarkers, type RenderScene } from '../render/scene'
import { loadGeneratedGameplayAssets } from './assets'
import { createDomState, mountCanvas, syncDom } from './dom'
import type { RuntimeParams } from './params'
import type { GameState } from '../game/types'

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
  let fixedStep = createRuntimeFixedStep(currentRuntimeParams)
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
      syncCanvasRenderMarkers(dom.canvas, renderScene(scene, game))
    }
  }

  const resetGame = (nextRuntimeParams = currentRuntimeParams, start = false) => {
    currentRuntimeParams = nextRuntimeParams
    game = createGame(currentRuntimeParams)
    fixedStep = createRuntimeFixedStep(currentRuntimeParams)
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
  const handleClassicSingleClick = () => resetGame({ ...currentRuntimeParams, mode: 'classic-single' })
  const handleLocalVersusClick = () => resetGame({ ...currentRuntimeParams, mode: 'local-versus' })
  const handlePauseClick = () => runCommand('pause')
  const handleResumeClick = () => runCommand('resume')

  dom.classicSingleButton.addEventListener('click', handleClassicSingleClick)
  dom.localVersusButton.addEventListener('click', handleLocalVersusClick)
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
    const simulationDeltaSeconds = deltaSeconds * currentRuntimeParams.simulationSpeed

    fixedStep.advance(simulationDeltaSeconds, () => {
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
      dom.classicSingleButton.removeEventListener('click', handleClassicSingleClick)
      dom.localVersusButton.removeEventListener('click', handleLocalVersusClick)
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

function createRuntimeFixedStep(runtimeParams: RuntimeParams): ReturnType<typeof createFixedStep> {
  return createFixedStep(FIXED_TIMESTEP_SECONDS, Math.max(8, Math.ceil(runtimeParams.simulationSpeed * 8)))
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

function syncCanvasRenderMarkers(canvas: HTMLCanvasElement | undefined, markers: RenderFrameMarkers): void {
  if (!canvas) {
    return
  }

  canvas.setAttribute('data-render-layers', markers.layerNames)
  if (markers.lastEffect) {
    canvas.setAttribute('data-last-effect', markers.lastEffect)
  }
}
