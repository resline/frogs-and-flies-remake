import { Application } from 'pixi.js'
import { ARENA_HEIGHT, ARENA_WIDTH, FIXED_TIMESTEP_SECONDS } from '../game/constants'
import { createGame } from '../game/createGame'
import { createFixedStep } from '../game/fixedStep'
import { buildResults } from '../game/match'
import { drainGameplayAudioEvents, updateGame } from '../game/update'
import {
  applyRuntimeInput,
  applyRuntimePointerInput,
  createRuntimeInputState,
  handleRuntimeKeyDown,
  handleRuntimeKeyUp,
  type RuntimeInputAction,
} from './input'
import { createRenderScene, renderScene, type RenderFrameMarkers, type RenderScene } from '../render/scene'
import { createAudioManager } from './audio'
import { loadGeneratedGameplayAssets } from './assets'
import { createDomState, mountCanvas, syncDom } from './dom'
import type { RuntimeParams } from './params'
import type { GameState } from '../game/types'
import type { RuntimeOptions } from './options'

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
  const audio = createAudioManager({
    muted: currentRuntimeParams.options.mute,
    volume: currentRuntimeParams.options.volume,
  })
  let scene: RenderScene | undefined
  let destroyed = false
  let removeResizeListener: (() => void) | undefined

  const refresh = () => {
    if (destroyed) {
      return
    }
    syncDom(dom, game, currentRuntimeParams.options, audio.getState())
    if (scene) {
      syncCanvasRenderMarkers(dom.canvas, renderScene(scene, game, currentRuntimeParams.options))
    }
  }

  const playGameplayAudioEvents = () => {
    for (const eventName of drainGameplayAudioEvents(game)) {
      audio.playSfx(eventName)
    }
  }

  const updateGameAndAudio = (deltaSeconds: number) => {
    updateGame(game, deltaSeconds)
    playGameplayAudioEvents()
  }

  const resetGame = (nextRuntimeParams = currentRuntimeParams, start = false) => {
    currentRuntimeParams = nextRuntimeParams
    syncAudioOptions()
    game = createGame(currentRuntimeParams)
    fixedStep = createRuntimeFixedStep(currentRuntimeParams)
    if (start) {
      game.commands.start = true
      updateGameAndAudio(0)
    }
    refresh()
  }

  const runCommand = (command: 'start' | 'pause' | 'resume') => {
    game.commands[command] = true
    updateGameAndAudio(0)
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
  const handleAssistDifficultyClick = () => resetDifficulty('classic-assist')
  const handleStandardDifficultyClick = () => resetDifficulty('classic-standard')
  const handleExpertDifficultyClick = () => resetDifficulty('classic-expert')
  const handlePauseClick = () => runCommand('pause')
  const handleResumeClick = () => runCommand('resume')
  const handleShowTimerChange = () => updateRuntimeOptions({ showTimer: dom.showTimerInput.checked })
  const handleReducedMotionChange = () => updateRuntimeOptions({ reducedMotion: dom.reducedMotionInput.checked })
  const handleHighContrastChange = () => updateRuntimeOptions({ highContrast: dom.highContrastInput.checked })
  const handleMuteChange = () => updateRuntimeOptions({ mute: dom.muteInput.checked })
  const handleVolumeInput = () => updateRuntimeOptions({ volume: Number.parseFloat(dom.volumeInput.value) })
  const handleAudioUnlockClick = () => {
    void audio.unlock().then(refresh)
  }

  function resetDifficulty(difficulty: RuntimeOptions['difficulty']): void {
    resetGame({ ...currentRuntimeParams, options: { ...currentRuntimeParams.options, difficulty } })
  }

  function updateRuntimeOptions(options: Partial<RuntimeOptions>): void {
    currentRuntimeParams = {
      ...currentRuntimeParams,
      options: {
        ...currentRuntimeParams.options,
        ...options,
      },
    }
    syncAudioOptions()
    refresh()
  }

  function syncAudioOptions(): void {
    audio.setMuted(currentRuntimeParams.options.mute)
    audio.setVolume(currentRuntimeParams.options.volume)
  }

  dom.classicSingleButton.addEventListener('click', handleClassicSingleClick)
  dom.localVersusButton.addEventListener('click', handleLocalVersusClick)
  dom.difficultyClassicAssistButton.addEventListener('click', handleAssistDifficultyClick)
  dom.difficultyClassicStandardButton.addEventListener('click', handleStandardDifficultyClick)
  dom.difficultyClassicExpertButton.addEventListener('click', handleExpertDifficultyClick)
  dom.startButton.addEventListener('click', handleStartClick)
  dom.pauseButton.addEventListener('click', handlePauseClick)
  dom.resumeButton.addEventListener('click', handleResumeClick)
  dom.replayButton.addEventListener('click', replay)
  dom.showTimerInput.addEventListener('change', handleShowTimerChange)
  dom.reducedMotionInput.addEventListener('change', handleReducedMotionChange)
  dom.highContrastInput.addEventListener('change', handleHighContrastChange)
  dom.muteInput.addEventListener('change', handleMuteChange)
  dom.volumeInput.addEventListener('input', handleVolumeInput)
  dom.audioUnlockButton.addEventListener('click', handleAudioUnlockClick)

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
      updateGameAndAudio(FIXED_TIMESTEP_SECONDS)
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
      dom.difficultyClassicAssistButton.removeEventListener('click', handleAssistDifficultyClick)
      dom.difficultyClassicStandardButton.removeEventListener('click', handleStandardDifficultyClick)
      dom.difficultyClassicExpertButton.removeEventListener('click', handleExpertDifficultyClick)
      dom.startButton.removeEventListener('click', handleStartClick)
      dom.pauseButton.removeEventListener('click', handlePauseClick)
      dom.resumeButton.removeEventListener('click', handleResumeClick)
      dom.replayButton.removeEventListener('click', replay)
      dom.showTimerInput.removeEventListener('change', handleShowTimerChange)
      dom.reducedMotionInput.removeEventListener('change', handleReducedMotionChange)
      dom.highContrastInput.removeEventListener('change', handleHighContrastChange)
      dom.muteInput.removeEventListener('change', handleMuteChange)
      dom.volumeInput.removeEventListener('input', handleVolumeInput)
      dom.audioUnlockButton.removeEventListener('click', handleAudioUnlockClick)
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
  canvas.setAttribute('data-render-reduced-motion', String(markers.reducedMotion))
  canvas.setAttribute('data-render-high-contrast', String(markers.highContrast))
  if (markers.lastEffect) {
    canvas.setAttribute('data-last-effect', markers.lastEffect)
  }
}
