import { Application } from 'pixi.js'
import { ARENA_HEIGHT, ARENA_WIDTH, FIXED_TIMESTEP_SECONDS } from '../game/constants'
import { createGame } from '../game/createGame'
import { getClassicDifficulty } from '../game/difficulty'
import { createFixedStep } from '../game/fixedStep'
import { buildResults } from '../game/match'
import { drainGameplayAudioEvents, updateGame } from '../game/update'
import { evaluateCampaignObjective } from '../content/objectives'
import {
  getCampaignLevel,
  getNextCampaignLevel,
  HOME_POND_CAMPAIGN,
  HOME_POND_LEVELS,
  HOME_POND_PROLOGUE,
  resolveCampaignEncounterProfile,
} from '../content/registry'
import type { CampaignId, CampaignLevelId, EncounterProfileId } from '../content/types'
import {
  addRuntimeInputAction,
  applyRuntimeInput,
  applyRuntimePointerInput,
  createRuntimeInputState,
  handleRuntimeKeyDown,
  handleRuntimeKeyUp,
  type RuntimeInputAction,
} from './input'
import {
  getFirstUnlockedIncompleteLevel,
  markPrologueSeen,
  recordCampaignLevelResult,
  selectCampaignLevel,
} from './campaignProgress'
import { createGamepadPoller, type GamepadInputSnapshot } from './gamepad'
import { createRenderScene, renderScene, type RenderFrameMarkers, type RenderScene } from '../render/scene'
import { createAudioManager } from './audio'
import { loadGeneratedGameplayAssets } from './assets'
import { createDomState, mountCanvas, syncDom, type CampaignResultDomSummary } from './dom'
import { resolveEncounterProfileGameOptions, type EncounterProfileGameOptions } from './encounterOptions'
import type { RuntimeParams } from './params'
import type { GameState, MatchMode } from '../game/types'
import type { RuntimeOptions } from './options'
import {
  createDefaultSave,
  createSaveManager,
  recordRoundCompleted,
  recordRoundStarted,
  type SaveData,
  type SaveLoadStatus,
  type SaveWriteStatus,
} from './save'
import { createInitialShellState, reduceShellState, type ShellAction, type ShellState } from './shell'
import {
  DEFAULT_INPUT_PROFILE,
  detectBindingConflict,
  isBrowserReservedShortcut,
  resetProfileToDefaults,
  type InputActionId,
  type InputBinding,
  type InputDeviceType,
  type InputProfile,
} from './inputBindings'

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

export interface RuntimePersistenceServices {
  saveManager?: ReturnType<typeof createSaveManager>
  saveData?: SaveData
  saveStatus?: SaveLoadStatus | SaveWriteStatus
}

interface ActiveCampaignContext {
  campaignId: CampaignId
  levelId: CampaignLevelId
  encounterProfileId: EncounterProfileId
  attemptId: string
  launchedFrom: 'campaign'
}

type RuntimeGameParams = RuntimeParams & Partial<EncounterProfileGameOptions>

export interface RuntimeCampaignLevelEncounterHandoff {
  encounterProfileId: EncounterProfileId
  gameOptions: EncounterProfileGameOptions
}

export function resolveCampaignLevelRuntimeEncounter(
  levelId: CampaignLevelId,
  difficulty: RuntimeOptions['difficulty'],
): RuntimeCampaignLevelEncounterHandoff | undefined {
  const profile = resolveCampaignEncounterProfile(levelId)
  if (!profile) {
    return undefined
  }

  return {
    encounterProfileId: profile.id,
    gameOptions: resolveEncounterProfileGameOptions(profile, getClassicDifficulty(difficulty)),
  }
}

export async function startRuntime(
  root: HTMLElement,
  runtimeParams: RuntimeParams,
  persistence: RuntimePersistenceServices = {},
): Promise<RuntimeHandle> {
  const dom = createDomState(root)
  let currentRuntimeParams: RuntimeGameParams = runtimeParams
  let game = createInitialGame(currentRuntimeParams)
  let fixedStep = createRuntimeFixedStep(currentRuntimeParams)
  const saveManager = persistence.saveManager ?? createSaveManager()
  let saveData = persistence.saveData ?? createDefaultSave()
  let saveStatus: SaveLoadStatus | SaveWriteStatus = persistence.saveStatus ?? 'defaulted'
  let storageAvailable = saveStatus !== 'storage-unavailable'
  let shellState: ShellState = createInitialShellState(currentRuntimeParams.mode)
  let prologuePanelIndex = 0
  let activeCampaignContext: ActiveCampaignContext | undefined
  let latestCampaignResultSummary: CampaignResultDomSummary | undefined
  let campaignResultRecordedAttemptId = ''
  const runtimeSessionId = createRuntimeSessionId()
  let roundCounter = 0
  let activeRoundId = ''
  let roundRecorded = false
  let highScoreStatus = 'Local high score status pending.'
  const runtimeInput = createRuntimeInputState(readSelectedInputProfile(saveData))
  let remappingAction: InputActionId | undefined
  let gamepadSnapshot: GamepadInputSnapshot = {
    connected: false,
    activeInputDevice: 'none',
    actions: [],
  }
  let previousGamepadActions = new Set<InputActionId>()
  const gamepadPoller = createGamepadPoller({
    onSnapshot(snapshot) {
      gamepadSnapshot = snapshot
      if (snapshot.activeInputDevice === 'gamepad') {
        runtimeInput.activeInputDevice = 'gamepad'
      }
    },
  })
  const audio = createAudioManager({
    muted: currentRuntimeParams.options.mute,
    masterVolume: currentRuntimeParams.options.masterVolume,
    sfxVolume: currentRuntimeParams.options.sfxVolume,
    musicVolume: currentRuntimeParams.options.musicVolume,
    monoAudio: currentRuntimeParams.options.monoAudio,
  })
  let scene: RenderScene | undefined
  let destroyed = false
  let removeResizeListener: (() => void) | undefined

  const refresh = () => {
    if (destroyed) {
      return
    }
    if (game.phase === 'results') {
      showResultsIfNeeded()
      recordCompletedRoundIfNeeded()
      recordCampaignResultIfNeeded()
    }
    syncDom(dom, game, currentRuntimeParams.options, audio.getState(), {
      shell: shellState,
      saveStatus,
      storageAvailable,
      roundRecorded,
      highScoreStatus,
      save: saveData,
      campaign: HOME_POND_CAMPAIGN,
      campaignLevels: HOME_POND_LEVELS,
      prologue: HOME_POND_PROLOGUE,
      prologuePanelIndex,
      activeCampaignLevelId: activeCampaignContext?.levelId,
      activeCampaignEncounterProfileId: activeCampaignContext?.encounterProfileId,
      latestCampaignResultSummary,
    })
    syncInputRuntimeMarkers(dom.shell, runtimeInput, gamepadSnapshot)
    if (dom.canvas) {
      syncInputRuntimeMarkers(dom.canvas, runtimeInput, gamepadSnapshot)
    }
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

  function transitionShell(action: ShellAction): void {
    const next = reduceShellState(shellState, action)
    shellState = next.state
  }

  function clearActiveCampaignContext(): void {
    activeCampaignContext = undefined
    latestCampaignResultSummary = undefined
    campaignResultRecordedAttemptId = ''
  }

  function beginRound(): void {
    roundCounter += 1
    activeRoundId = `${runtimeSessionId}:${currentRuntimeParams.mode}:${currentRuntimeParams.seed}:${roundCounter}`
    roundRecorded = false
    highScoreStatus = 'Local high score status pending.'
    persistSave(recordRoundStarted(saveData, activeRoundId))
  }

  function startGameplay(): void {
    const gameplayParams = withoutCampaignEncounterParams({ ...currentRuntimeParams, mode: shellState.selectedMode })
    if (game.mode !== shellState.selectedMode || currentRuntimeParams.encounter) {
      resetGame(gameplayParams)
    }
    clearActiveCampaignContext()
    beginRound()
    transitionShell({ type: 'startGameplay' })
    runCommand('start')
  }

  function launchCampaignLevel(levelId: CampaignLevelId): void {
    const level = getCampaignLevel(levelId)
    if (!level || saveData.campaign.levels[level.id]?.unlocked !== true) {
      return
    }
    const encounterHandoff = resolveCampaignLevelRuntimeEncounter(level.id, currentRuntimeParams.options.difficulty)
    if (!encounterHandoff) {
      return
    }

    latestCampaignResultSummary = undefined
    campaignResultRecordedAttemptId = ''
    persistSave({
      ...saveData,
      campaign: selectCampaignLevel(saveData.campaign, level.campaignId, level.id),
    })
    resetGame({
      ...currentRuntimeParams,
      mode: 'classic-single',
      // Runtime query duration stays on RuntimeParams and wins; profile duration stays inside encounter tuning.
      encounter: encounterHandoff.gameOptions.encounter,
    })
    transitionShell({ type: 'startCampaignLevel' })
    beginRound()
    activeCampaignContext = {
      campaignId: level.campaignId,
      levelId: level.id,
      encounterProfileId: encounterHandoff.encounterProfileId,
      attemptId: activeRoundId,
      launchedFrom: 'campaign',
    }
    runCommand('start')
  }

  function showResultsIfNeeded(): void {
    if (shellState.screen !== 'results') {
      transitionShell({ type: 'showResults' })
    }
  }

  function recordCompletedRoundIfNeeded(): void {
    if (roundRecorded || !activeRoundId) {
      return
    }

    const beforeCount = scoreEntriesForMode(saveData, currentRuntimeParams.mode).length
    const nextSave = recordRoundCompleted(saveData, {
      roundId: activeRoundId,
      mode: currentRuntimeParams.mode,
      difficulty: currentRuntimeParams.options.difficulty,
      seed: currentRuntimeParams.seed,
      completedAt: new Date().toISOString(),
      durationSeconds: game.durationSeconds,
      winner: game.results?.winner ?? buildResults(game).winner,
      players: game.players.map((player) => ({
        id: player.id,
        score: player.score,
        catches: player.stats.catches,
        attempts: player.stats.attempts,
        splashes: player.stats.misses,
        maxCombo: player.stats.combo,
      })),
    })
    const afterCount = scoreEntriesForMode(nextSave, currentRuntimeParams.mode).length

    roundRecorded = true
    highScoreStatus = afterCount > beforeCount ? 'New local high score recorded.' : 'Local high score already recorded.'
    persistSave(nextSave)
  }

  function recordCampaignResultIfNeeded(): void {
    const context = activeCampaignContext
    if (!context || !activeRoundId || context.attemptId !== activeRoundId || campaignResultRecordedAttemptId === activeRoundId) {
      return
    }

    const level = getCampaignLevel(context.levelId)
    if (!level) {
      return
    }

    const player = game.players[0]
    const stats = {
      score: currentRuntimeParams.campaignSmokeScore ?? player?.score ?? 0,
      catches: currentRuntimeParams.campaignSmokeCatches ?? player?.stats.catches ?? 0,
      timeRemainingSeconds: game.remainingSeconds,
    }
    const evaluation = evaluateCampaignObjective(level, stats)
    const nextCampaignProgress = recordCampaignLevelResult(
      saveData.campaign,
      level,
      evaluation,
      stats,
      new Date().toISOString(),
    )
    const nextLevel = evaluation.passed ? getNextCampaignLevel(level.id) : undefined

    campaignResultRecordedAttemptId = activeRoundId
    persistSave({
      ...saveData,
      campaign: nextCampaignProgress,
    })
    latestCampaignResultSummary = {
      levelId: level.id,
      statusText: formatCampaignResultStatus(level.chapterLabel, evaluation.passed, nextLevel?.chapterLabel),
      passed: evaluation.passed,
      stars: evaluation.stars,
      ...(nextLevel && nextCampaignProgress.levels[nextLevel.id]?.unlocked ? { nextLevelId: nextLevel.id } : {}),
    }
  }

  function persistCurrentSettings(): void {
    persistSave({
      ...saveData,
      settings: {
        ...saveData.settings,
        difficulty: currentRuntimeParams.options.difficulty,
        showTimer: currentRuntimeParams.options.showTimer,
        reducedMotion: currentRuntimeParams.options.reducedMotion,
        highContrast: currentRuntimeParams.options.highContrast,
        mute: currentRuntimeParams.options.mute,
        masterVolume: currentRuntimeParams.options.masterVolume,
        sfxVolume: currentRuntimeParams.options.sfxVolume,
        musicVolume: currentRuntimeParams.options.musicVolume,
        monoAudio: currentRuntimeParams.options.monoAudio,
      },
    })
  }

  function persistSave(nextSave: SaveData): void {
    const result = saveManager.save(nextSave)
    saveData = result.data
    saveStatus = result.status
    storageAvailable = result.status !== 'storage-unavailable'
    runtimeInput.profile = readSelectedInputProfile(saveData)
  }

  const resetGame = (nextRuntimeParams: RuntimeGameParams = currentRuntimeParams, start = false) => {
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
    if (latestCampaignResultSummary?.levelId) {
      launchCampaignLevel(latestCampaignResultSummary.levelId)
      return
    }
    transitionShell({ type: shellState.screen === 'results' ? 'replay' : 'startGameplay' })
    clearActiveCampaignContext()
    beginRound()
    resetGame(withoutCampaignEncounterParams(currentRuntimeParams), true)
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
      } else if (game.phase === 'start') {
        startGameplay()
      }
      return
    }

    if (action.type === 'pause-toggle') {
      if (game.phase === 'pause') {
        transitionShell({ type: 'resume' })
        runCommand('resume')
      } else {
        transitionShell({ type: 'pause' })
        runCommand('pause')
      }
      return
    }

    resetGame(withoutCampaignEncounterParams({ ...currentRuntimeParams, mode: action.mode }))
  }

  const handleStartClick = () => {
    if (game.phase === 'results') {
      replay()
      return
    }
    startGameplay()
  }
  const handlePlayClick = () => {
    transitionShell({ type: 'play' })
    refresh()
  }
  const handleCampaignClick = () => {
    transitionShell({ type: 'openCampaign' })
    refresh()
  }
  const handleOpenSettingsClick = () => {
    transitionShell({ type: 'openSettings' })
    refresh()
  }
  const handleOpenHighScoresClick = () => {
    transitionShell({ type: 'openHighScores' })
    refresh()
  }
  const handleMainMenuClick = () => {
    clearActiveCampaignContext()
    transitionShell({ type: 'mainMenu' })
    refresh()
  }
  const handleCampaignMainMenuClick = () => {
    clearActiveCampaignContext()
    transitionShell({ type: 'mainMenu' })
    refresh()
  }
  const handleCampaignContinueClick = () => {
    const level = getFirstUnlockedIncompleteLevel(saveData.campaign, HOME_POND_CAMPAIGN)
    if (level) {
      launchCampaignLevel(level.id)
    }
  }
  const handleCampaignLevelListClick = (event: Event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-campaign-level-id]')
    const levelId = readActiveCampaignLevelId(button?.getAttribute('data-campaign-level-id') ?? undefined)
    if (levelId) {
      launchCampaignLevel(levelId)
    }
  }
  const handleStartPrologueClick = () => {
    prologuePanelIndex = 0
    transitionShell({ type: 'openPrologue' })
    refresh()
  }
  const handleReplayPrologueClick = () => {
    prologuePanelIndex = 0
    transitionShell({ type: 'openPrologue' })
    refresh()
  }
  const handlePrologueNextClick = () => {
    prologuePanelIndex = Math.min(prologuePanelIndex + 1, HOME_POND_PROLOGUE.panels.length - 1)
    refresh()
  }
  const handlePrologueBackClick = () => {
    prologuePanelIndex = Math.max(prologuePanelIndex - 1, 0)
    refresh()
  }
  const handlePrologueSkipClick = () => {
    persistSave({
      ...saveData,
      campaign: markPrologueSeen(saveData.campaign, HOME_POND_PROLOGUE.id),
    })
    transitionShell({ type: 'returnToCampaign' })
    refresh()
  }
  const handlePrologueStartLevelClick = () => {
    persistSave({
      ...saveData,
      campaign: markPrologueSeen(saveData.campaign, HOME_POND_PROLOGUE.id),
    })
    launchCampaignLevel(HOME_POND_PROLOGUE.startLevelId)
  }
  const handlePrologueMainMenuClick = () => {
    clearActiveCampaignContext()
    transitionShell({ type: 'mainMenu' })
    refresh()
  }
  const handleChangeModeClick = () => {
    clearActiveCampaignContext()
    transitionShell({ type: 'changeMode' })
    resetGame(withoutCampaignEncounterParams(currentRuntimeParams))
  }
  const handleCampaignReplayLevelClick = () => {
    if (latestCampaignResultSummary?.levelId) {
      launchCampaignLevel(latestCampaignResultSummary.levelId)
    }
  }
  const handleCampaignNextLevelClick = () => {
    const nextLevelId = latestCampaignResultSummary?.nextLevelId
    if (nextLevelId) {
      launchCampaignLevel(nextLevelId)
    }
  }
  const handleCampaignResultsReturnClick = () => {
    clearActiveCampaignContext()
    transitionShell({ type: 'returnToCampaign' })
    refresh()
  }
  const handleCampaignClassicModesClick = () => {
    clearActiveCampaignContext()
    transitionShell({ type: 'changeMode' })
    resetGame(withoutCampaignEncounterParams(currentRuntimeParams))
  }
  const handleClassicSingleClick = () => selectMode('classic-single')
  const handleLocalVersusClick = () => selectMode('local-versus')
  const handleAssistDifficultyClick = () => resetDifficulty('classic-assist')
  const handleStandardDifficultyClick = () => resetDifficulty('classic-standard')
  const handleExpertDifficultyClick = () => resetDifficulty('classic-expert')
  const handlePauseClick = () => {
    transitionShell({ type: 'pause' })
    runCommand('pause')
  }
  const handleResumeClick = () => {
    transitionShell({ type: 'resume' })
    runCommand('resume')
  }
  const handleRestartClick = () => {
    transitionShell({ type: 'startGameplay' })
    resetGame(activeCampaignContext ? currentRuntimeParams : withoutCampaignEncounterParams(currentRuntimeParams), true)
    beginRound()
    if (activeCampaignContext) {
      activeCampaignContext = {
        ...activeCampaignContext,
        attemptId: activeRoundId,
      }
      campaignResultRecordedAttemptId = ''
    }
  }
  const handleShowTimerChange = () => updateRuntimeOptions({ showTimer: dom.showTimerInput.checked })
  const handleReducedMotionChange = () => updateRuntimeOptions({ reducedMotion: dom.reducedMotionInput.checked })
  const handleHighContrastChange = () => updateRuntimeOptions({ highContrast: dom.highContrastInput.checked })
  const handleMuteChange = () => updateRuntimeOptions({ mute: dom.muteInput.checked })
  const handleVolumeInput = () => {
    const masterVolume = Number.parseFloat(dom.volumeInput.value)
    updateRuntimeOptions({ volume: masterVolume, masterVolume })
  }
  const handleSfxVolumeInput = () => updateRuntimeOptions({ sfxVolume: Number.parseFloat(dom.sfxVolumeInput.value) })
  const handleMusicVolumeInput = () => updateRuntimeOptions({ musicVolume: Number.parseFloat(dom.musicVolumeInput.value) })
  const handleMonoAudioChange = () => updateRuntimeOptions({ monoAudio: dom.monoAudioInput.checked })
  const handleInputProfileChange = () => {
    persistSave({
      ...saveData,
      settings: {
        ...saveData.settings,
        inputProfileId: dom.inputProfileSelect.value,
      },
    })
    refresh()
  }
  const handleInputRemapClick = (event: Event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-input-action]')
    const action = button?.getAttribute('data-input-action')
    if (!isInputActionId(action)) {
      return
    }
    remappingAction = action
    dom.inputRemapStatus.textContent = `Press a key for ${action}.`
    dom.inputRemapStatus.setAttribute('data-remap-state', 'listening')
  }
  const handleResetInputProfileClick = () => {
    const profile = readSelectedInputProfile(saveData)
    writeInputProfile(resetProfileToDefaults(profile))
    dom.inputRemapStatus.textContent = 'Input profile reset to defaults.'
    dom.inputRemapStatus.setAttribute('data-remap-state', 'reset')
    refresh()
  }
  const handleAudioUnlockClick = () => {
    void audio.unlock().then(refresh)
  }

  function selectMode(mode: RuntimeParams['mode']): void {
    transitionShell({ type: 'selectMode', mode })
    resetGame(withoutCampaignEncounterParams({ ...currentRuntimeParams, mode }))
  }

  function resetDifficulty(difficulty: RuntimeOptions['difficulty']): void {
    const nextRuntimeParams: RuntimeGameParams = {
      ...currentRuntimeParams,
      options: { ...currentRuntimeParams.options, difficulty },
    }
    const campaignEncounter = activeCampaignContext
      ? resolveCampaignLevelRuntimeEncounter(activeCampaignContext.levelId, difficulty)
      : undefined
    resetGame(
      campaignEncounter
        ? { ...nextRuntimeParams, encounter: campaignEncounter.gameOptions.encounter }
        : withoutCampaignEncounterParams(nextRuntimeParams),
    )
    persistCurrentSettings()
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
    persistCurrentSettings()
    refresh()
  }

  function syncAudioOptions(): void {
    audio.setMuted(currentRuntimeParams.options.mute)
    audio.setMasterVolume(currentRuntimeParams.options.masterVolume)
    audio.setSfxVolume(currentRuntimeParams.options.sfxVolume)
    audio.setMusicVolume(currentRuntimeParams.options.musicVolume)
    audio.setMonoAudio(currentRuntimeParams.options.monoAudio)
  }

  dom.campaignButton.addEventListener('click', handleCampaignClick)
  dom.playButton.addEventListener('click', handlePlayClick)
  dom.openSettingsButton.addEventListener('click', handleOpenSettingsClick)
  dom.openHighScoresButton.addEventListener('click', handleOpenHighScoresClick)
  dom.campaignStartPrologueButton.addEventListener('click', handleStartPrologueClick)
  dom.campaignContinueButton.addEventListener('click', handleCampaignContinueClick)
  dom.campaignReplayPrologueButton.addEventListener('click', handleReplayPrologueClick)
  dom.campaignMainMenuButton.addEventListener('click', handleCampaignMainMenuClick)
  dom.campaignLevelList.addEventListener('click', handleCampaignLevelListClick)
  dom.prologueNextButton.addEventListener('click', handlePrologueNextClick)
  dom.prologueBackButton.addEventListener('click', handlePrologueBackClick)
  dom.prologueSkipButton.addEventListener('click', handlePrologueSkipClick)
  dom.prologueStartLevelButton.addEventListener('click', handlePrologueStartLevelClick)
  dom.prologueMainMenuButton.addEventListener('click', handlePrologueMainMenuClick)
  dom.campaignReplayLevelButton.addEventListener('click', handleCampaignReplayLevelClick)
  dom.campaignNextLevelButton.addEventListener('click', handleCampaignNextLevelClick)
  dom.campaignResultsReturnButton.addEventListener('click', handleCampaignResultsReturnClick)
  dom.campaignClassicModesButton.addEventListener('click', handleCampaignClassicModesClick)
  dom.mainMenuModeButton.addEventListener('click', handleMainMenuClick)
  dom.mainMenuSettingsButton.addEventListener('click', handleMainMenuClick)
  dom.mainMenuHighScoresButton.addEventListener('click', handleMainMenuClick)
  dom.mainMenuPauseButton.addEventListener('click', handleMainMenuClick)
  dom.mainMenuResultsButton.addEventListener('click', handleMainMenuClick)
  dom.pauseSettingsButton.addEventListener('click', handleOpenSettingsClick)
  dom.restartButton.addEventListener('click', handleRestartClick)
  dom.changeModeButton.addEventListener('click', handleChangeModeClick)
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
  dom.sfxVolumeInput.addEventListener('input', handleSfxVolumeInput)
  dom.musicVolumeInput.addEventListener('input', handleMusicVolumeInput)
  dom.monoAudioInput.addEventListener('change', handleMonoAudioChange)
  dom.inputProfileSelect.addEventListener('change', handleInputProfileChange)
  dom.settingsPanel.addEventListener('click', handleInputRemapClick)
  dom.resetInputProfileButton.addEventListener('click', handleResetInputProfileClick)
  dom.audioUnlockButton.addEventListener('click', handleAudioUnlockClick)

  const handleKeyDown = (event: KeyboardEvent) => {
    if (remappingAction) {
      event.preventDefault()
      completeKeyboardRemap(event)
      return
    }

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
    runtimeInput.activeInputDevice = event.pointerType === 'touch' ? 'touch' : 'pointer'

    if (game.phase === 'start') {
      startGameplay()
    }
  }

  app.canvas.addEventListener('pointerdown', handlePointerDown)
  bindTouchZone(dom.touchLeftButton, 'p1.moveLeft')
  bindTouchZone(dom.touchRightButton, 'p1.moveRight')
  bindTouchZone(dom.touchJumpButton, 'p1.chargeJump')
  bindTouchZone(dom.touchTongueButton, 'p1.tongue')
  bindTouchZone(dom.touchPauseButton, 'ui.pause')
  bindTouchZone(dom.touchConfirmButton, 'ui.confirm')

  refresh()

  const tick = (ticker: { deltaMS: number }) => {
    const deltaSeconds = Math.min(ticker.deltaMS / 1000, 0.25)
    const simulationDeltaSeconds = deltaSeconds * currentRuntimeParams.simulationSpeed

    fixedStep.advance(simulationDeltaSeconds, () => {
      const snapshot = gamepadPoller.poll()
      const nextGamepadActions: Set<InputActionId> = new Set(
        snapshot.actions.filter((action) => action !== 'p1.releaseJump' && action !== 'p2.releaseJump'),
      )
      for (const action of previousGamepadActions) {
        if (!nextGamepadActions.has(action)) {
          runtimeInput.heldActions.delete(action)
          if (action === 'p1.chargeJump') {
            addRuntimeInputAction(runtimeInput, 'p1.releaseJump', false)
          }
          if (action === 'p2.chargeJump') {
            addRuntimeInputAction(runtimeInput, 'p2.releaseJump', false)
          }
        }
      }
      for (const action of nextGamepadActions) {
        addRuntimeInputAction(runtimeInput, action, true)
      }
      previousGamepadActions = nextGamepadActions
      applyRuntimeInput(game, runtimeInput)
      updateGameAndAudio(FIXED_TIMESTEP_SECONDS)
    })

    refresh()
  }
  app.ticker.add(tick)

  return {
    start: startGameplay,
    pause: handlePauseClick,
    resume: handleResumeClick,
    replay,
    destroy: () => {
      destroyed = true
      dom.campaignButton.removeEventListener('click', handleCampaignClick)
      dom.playButton.removeEventListener('click', handlePlayClick)
      dom.openSettingsButton.removeEventListener('click', handleOpenSettingsClick)
      dom.openHighScoresButton.removeEventListener('click', handleOpenHighScoresClick)
      dom.campaignStartPrologueButton.removeEventListener('click', handleStartPrologueClick)
      dom.campaignContinueButton.removeEventListener('click', handleCampaignContinueClick)
      dom.campaignReplayPrologueButton.removeEventListener('click', handleReplayPrologueClick)
      dom.campaignMainMenuButton.removeEventListener('click', handleCampaignMainMenuClick)
      dom.campaignLevelList.removeEventListener('click', handleCampaignLevelListClick)
      dom.prologueNextButton.removeEventListener('click', handlePrologueNextClick)
      dom.prologueBackButton.removeEventListener('click', handlePrologueBackClick)
      dom.prologueSkipButton.removeEventListener('click', handlePrologueSkipClick)
      dom.prologueStartLevelButton.removeEventListener('click', handlePrologueStartLevelClick)
      dom.prologueMainMenuButton.removeEventListener('click', handlePrologueMainMenuClick)
      dom.campaignReplayLevelButton.removeEventListener('click', handleCampaignReplayLevelClick)
      dom.campaignNextLevelButton.removeEventListener('click', handleCampaignNextLevelClick)
      dom.campaignResultsReturnButton.removeEventListener('click', handleCampaignResultsReturnClick)
      dom.campaignClassicModesButton.removeEventListener('click', handleCampaignClassicModesClick)
      dom.mainMenuModeButton.removeEventListener('click', handleMainMenuClick)
      dom.mainMenuSettingsButton.removeEventListener('click', handleMainMenuClick)
      dom.mainMenuHighScoresButton.removeEventListener('click', handleMainMenuClick)
      dom.mainMenuPauseButton.removeEventListener('click', handleMainMenuClick)
      dom.mainMenuResultsButton.removeEventListener('click', handleMainMenuClick)
      dom.pauseSettingsButton.removeEventListener('click', handleOpenSettingsClick)
      dom.restartButton.removeEventListener('click', handleRestartClick)
      dom.changeModeButton.removeEventListener('click', handleChangeModeClick)
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
      dom.sfxVolumeInput.removeEventListener('input', handleSfxVolumeInput)
      dom.musicVolumeInput.removeEventListener('input', handleMusicVolumeInput)
      dom.monoAudioInput.removeEventListener('change', handleMonoAudioChange)
      dom.inputProfileSelect.removeEventListener('change', handleInputProfileChange)
      dom.settingsPanel.removeEventListener('click', handleInputRemapClick)
      dom.resetInputProfileButton.removeEventListener('click', handleResetInputProfileClick)
      dom.audioUnlockButton.removeEventListener('click', handleAudioUnlockClick)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      app.canvas.removeEventListener('pointerdown', handlePointerDown)
      removeResizeListener?.()
      gamepadPoller.destroy()
      app.ticker.remove(tick)
      app.destroy(true)
    },
  }

  function completeKeyboardRemap(event: KeyboardEvent): void {
    if (!remappingAction) {
      return
    }

    const binding: InputBinding = {
      action: remappingAction,
      device: 'keyboard',
      code: event.code,
    }
    const profile = readSelectedInputProfile(saveData)
    const conflict = detectBindingConflict(profile, binding)
    if (isBrowserReservedShortcut(event)) {
      dom.inputRemapStatus.textContent = `${event.code} is reserved by the browser.`
      dom.inputRemapStatus.setAttribute('data-remap-state', 'rejected')
      remappingAction = undefined
      refresh()
      return
    }
    if (conflict) {
      dom.inputRemapStatus.textContent = `${event.code} conflicts with ${conflict.action}.`
      dom.inputRemapStatus.setAttribute('data-remap-state', 'conflict')
      remappingAction = undefined
      refresh()
      return
    }

    writeInputProfile(replaceKeyboardBinding(profile, binding))
    dom.inputRemapStatus.textContent = `${remappingAction} set to ${event.code}.`
    dom.inputRemapStatus.setAttribute('data-remap-state', 'saved')
    remappingAction = undefined
    refresh()
  }

  function writeInputProfile(profile: InputProfile): void {
    const exists = saveData.inputProfiles.some((candidate) => candidate.id === profile.id)
    persistSave({
      ...saveData,
      settings: {
        ...saveData.settings,
        inputProfileId: profile.id,
      },
      inputProfiles: exists
        ? saveData.inputProfiles.map((candidate) => (candidate.id === profile.id ? profile : candidate))
        : [...saveData.inputProfiles, profile],
    })
  }

  function bindTouchZone(element: HTMLElement, action: InputActionId): void {
    const down = (event: PointerEvent) => {
      event.preventDefault()
      runtimeInput.activeInputDevice = 'touch'
      addRuntimeInputAction(runtimeInput, action, true)
      if (action === 'ui.pause') {
        runRuntimeAction({ type: 'pause-toggle' })
      }
      if (action === 'ui.confirm') {
        runRuntimeAction({ type: 'start' })
      }
      refresh()
    }
    const up = (event: PointerEvent) => {
      event.preventDefault()
      runtimeInput.activeInputDevice = 'touch'
      addRuntimeInputAction(runtimeInput, releaseActionFor(action), false)
      refresh()
    }
    element.addEventListener('pointerdown', down)
    element.addEventListener('pointerup', up)
    element.addEventListener('pointercancel', up)
  }
}

function readSelectedInputProfile(save: SaveData): InputProfile {
  const selected = save.inputProfiles.find((profile) => profile.id === save.settings.inputProfileId) ?? save.inputProfiles[0]
  return toRuntimeInputProfile(selected) ?? resetProfileToDefaults(DEFAULT_INPUT_PROFILE)
}

function withoutCampaignEncounterParams(params: RuntimeGameParams): RuntimeGameParams {
  const { encounter: _encounter, ...runtimeParams } = params
  return runtimeParams
}

function toRuntimeInputProfile(profile: SaveData['inputProfiles'][number] | undefined): InputProfile | undefined {
  if (!profile) {
    return undefined
  }

  const bindings = profile.bindings.flatMap((binding) => {
    const action = isInputActionId(binding.action) ? binding.action : undefined
    if (!action) {
      return []
    }
    if (isInputDeviceType(binding.device) && typeof binding.code === 'string') {
      return [{ action, device: binding.device, code: binding.code }]
    }
    return (binding.codes ?? []).map((code) => ({ action, device: 'keyboard' as const, code }))
  })

  return {
    id: profile.id,
    name: profile.name,
    bindings: bindings.length > 0 ? bindings : resetProfileToDefaults(DEFAULT_INPUT_PROFILE).bindings,
  }
}

function replaceKeyboardBinding(profile: InputProfile, binding: InputBinding): InputProfile {
  const linkedAction = linkedReleaseAction(binding.action)
  const nextBindings = profile.bindings.filter((candidate) => {
    if (candidate.device !== 'keyboard') {
      return true
    }
    return candidate.action !== binding.action && candidate.action !== linkedAction
  })
  nextBindings.push(binding)
  if (linkedAction) {
    nextBindings.push({ ...binding, action: linkedAction })
  }

  return {
    ...profile,
    bindings: nextBindings,
  }
}

function linkedReleaseAction(action: InputActionId): InputActionId | undefined {
  if (action === 'p1.chargeJump' || action === 'p1.releaseJump') {
    return action === 'p1.chargeJump' ? 'p1.releaseJump' : 'p1.chargeJump'
  }
  if (action === 'p2.chargeJump' || action === 'p2.releaseJump') {
    return action === 'p2.chargeJump' ? 'p2.releaseJump' : 'p2.chargeJump'
  }
  return undefined
}

function releaseActionFor(action: InputActionId): InputActionId {
  return action === 'p1.chargeJump' ? 'p1.releaseJump' : action === 'p2.chargeJump' ? 'p2.releaseJump' : action
}

function isInputActionId(value: unknown): value is InputActionId {
  return (
    value === 'p1.moveLeft' ||
    value === 'p1.moveRight' ||
    value === 'p1.chargeJump' ||
    value === 'p1.releaseJump' ||
    value === 'p1.tongue' ||
    value === 'p2.moveLeft' ||
    value === 'p2.moveRight' ||
    value === 'p2.chargeJump' ||
    value === 'p2.releaseJump' ||
    value === 'p2.tongue' ||
    value === 'ui.start' ||
    value === 'ui.pause' ||
    value === 'ui.confirm' ||
    value === 'ui.back'
  )
}

function isInputDeviceType(value: unknown): value is InputDeviceType {
  return value === 'keyboard' || value === 'pointer' || value === 'touch' || value === 'gamepad'
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

function createRuntimeSessionId(): string {
  const cryptoApi = globalThis.crypto
  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
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

function syncInputRuntimeMarkers(element: HTMLElement, input: { activeInputDevice: string }, gamepad: GamepadInputSnapshot): void {
  element.setAttribute('data-gamepad-connected', String(gamepad.connected))
  element.setAttribute('data-active-input-device', input.activeInputDevice)
}

function scoreEntriesForMode(save: SaveData, mode: MatchMode): SaveData['highScores']['classicSingle'] {
  return mode === 'classic-single' ? save.highScores.classicSingle : save.highScores.localVersus
}

function formatCampaignResultStatus(
  chapterLabel: string,
  passed: boolean,
  nextChapterLabel: string | undefined,
): string {
  if (!passed) {
    return `${chapterLabel} failed - try again.`
  }
  if (nextChapterLabel) {
    return `${chapterLabel} passed - ${nextChapterLabel} unlocked.`
  }
  return `${chapterLabel} passed - Home Pond complete.`
}

function readActiveCampaignLevelId(value: string | undefined): CampaignLevelId | undefined {
  return HOME_POND_LEVELS.some((level) => level.id === value) ? (value as CampaignLevelId) : undefined
}
