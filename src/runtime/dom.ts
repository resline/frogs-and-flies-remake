import { ARENA_HEIGHT, ARENA_WIDTH } from '../game/constants'
import type { GameState, MatchMode, MatchPlayerState } from '../game/types'
import type { CampaignDefinition, CampaignLevelDefinition, CampaignLevelId, PrologueDefinition } from '../content/types'
import { M28_CAMPAIGN_UI_ASSET_PATHS, M28_PROLOGUE_ASSET_PATH_BY_TONE } from './assets'
import type { AudioManagerState } from './audio'
import type { RuntimeOptions } from './options'
import type { SaveData, SaveLoadStatus, SaveWriteStatus } from './save'
import type { ShellState } from './shell'

const [M28_STAR_FILLED_ICON, M28_STAR_EMPTY_ICON, M28_LOCK_ICON, M28_CLEARED_ICON] = M28_CAMPAIGN_UI_ASSET_PATHS

export type DomState = {
  shell: HTMLElement
  gameHost: HTMLElement
  hud: HTMLElement
  controls: HTMLElement
  chromeLayoutKey?: string
  campaignLevelListKey?: string
  activeShellScreen?: ShellState['screen']
  canvas?: HTMLCanvasElement
  state: HTMLElement
  score: HTMLElement
  p1Score: HTMLElement
  p2Score: HTMLElement
  p1ControlSource: HTMLElement
  p2ControlSource: HTMLElement
  timer: HTMLElement
  timerAlias: HTMLElement
  seed: HTMLElement
  seedAlias: HTMLElement
  results: HTMLElement
  theEnd: HTMLElement
  mainMenuPanel: HTMLElement
  modeSelectPanel: HTMLElement
  campaignPanel: HTMLElement
  prologuePanel: HTMLElement
  settingsPanel: HTMLElement
  highScoresPanel: HTMLElement
  gameplayPanel: HTMLElement
  pausePanel: HTMLElement
  resultsActions: HTMLElement
  campaignButton: HTMLElement
  playButton: HTMLElement
  openSettingsButton: HTMLElement
  openHighScoresButton: HTMLElement
  campaignStartPrologueButton: HTMLElement
  campaignContinueButton: HTMLElement
  campaignReplayPrologueButton: HTMLElement
  campaignMainMenuButton: HTMLElement
  campaignLevelList: HTMLElement
  campaignStatus: HTMLElement
  prologueTitle: HTMLElement
  prologueIllustration: HTMLImageElement
  prologueText: HTMLElement
  prologueProgress: HTMLElement
  prologueNextButton: HTMLElement
  prologueBackButton: HTMLElement
  prologueSkipButton: HTMLElement
  prologueStartLevelButton: HTMLElement
  prologueMainMenuButton: HTMLElement
  campaignResultStatus: HTMLElement
  campaignResultStars: HTMLElement
  campaignReplayLevelButton: HTMLElement
  campaignNextLevelButton: HTMLElement
  campaignResultsReturnButton: HTMLElement
  campaignClassicModesButton: HTMLElement
  mainMenuModeButton: HTMLElement
  mainMenuSettingsButton: HTMLElement
  mainMenuHighScoresButton: HTMLElement
  mainMenuPauseButton: HTMLElement
  mainMenuResultsButton: HTMLElement
  pauseSettingsButton: HTMLElement
  restartButton: HTMLElement
  changeModeButton: HTMLElement
  classicSingleButton: HTMLElement
  localVersusButton: HTMLElement
  startButton: HTMLElement
  pauseButton: HTMLElement
  resumeButton: HTMLElement
  replayButton: HTMLElement
  difficultyClassicAssistButton: HTMLElement
  difficultyClassicStandardButton: HTMLElement
  difficultyClassicExpertButton: HTMLElement
  audioUnlockButton: HTMLElement
  showTimerInput: HTMLInputElement
  reducedMotionInput: HTMLInputElement
  highContrastInput: HTMLInputElement
  muteInput: HTMLInputElement
  volumeInput: HTMLInputElement
  sfxVolumeInput: HTMLInputElement
  musicVolumeInput: HTMLInputElement
  monoAudioInput: HTMLInputElement
  inputProfileSelect: HTMLSelectElement
  inputRemapStatus: HTMLElement
  resetInputProfileButton: HTMLElement
  touchLeftButton: HTMLElement
  touchRightButton: HTMLElement
  touchJumpButton: HTMLElement
  touchTongueButton: HTMLElement
  touchPauseButton: HTMLElement
  touchConfirmButton: HTMLElement
}

export interface ShellDomSyncState {
  shell: ShellState
  saveStatus: SaveLoadStatus | SaveWriteStatus
  storageAvailable: boolean
  roundRecorded: boolean
  highScoreStatus?: string
  save: SaveData
  campaign?: CampaignDefinition
  campaignLevels?: readonly CampaignLevelDefinition[]
  prologue?: PrologueDefinition
  prologuePanelIndex?: number
  activeCampaignLevelId?: CampaignLevelId
  latestCampaignResultSummary?: CampaignResultDomSummary
  campaignProgress?: SaveData['campaign']
}

export interface CampaignResultDomSummary {
  levelId: CampaignLevelId
  statusText: string
  passed: boolean
  stars: 0 | 1 | 2 | 3
  nextLevelId?: CampaignLevelId
}

export function createDomState(root: HTMLElement): DomState {
  const shell = root.querySelector<HTMLElement>('.game-shell') ?? root.querySelector<HTMLElement>('main') ?? getOrCreate(root, 'div', 'game-shell', root)
  const gameHost =
    root.querySelector<HTMLElement>('#canvas-mount') ??
    root.querySelector<HTMLElement>('#game') ??
    getOrCreate(root, 'div', 'game', shell)
  const hud = getOrCreate(root, 'div', 'm0-hud', shell)
  const controls = getOrCreate(root, 'div', 'm0-controls', shell)

  shell.classList.add('game-shell')
  shell.setAttribute('data-testid', 'm26-shell')
  hud.setAttribute('data-testid', 'm25-hud')
  hud.setAttribute('role', 'region')
  hud.setAttribute('aria-label', 'Round status')
  controls.setAttribute('data-testid', 'm25-controls')
  controls.setAttribute('role', 'region')
  controls.setAttribute('aria-label', 'Product shell controls')
  shell.style.position = 'relative'

  styleHud(hud)
  styleControls(controls)

  const state = getOrCreateTestElement(root, 'game-state', 'div', hud)
  const score = getOrCreateTestElement(root, 'score', 'output', hud)
  const p1Score = getOrCreateTestElement(root, 'p1-score', 'output', hud)
  const p2Score = getOrCreateTestElement(root, 'p2-score', 'output', hud)
  const p1ControlSource = getOrCreateTestElement(root, 'p1-control-source', 'output', hud)
  const p2ControlSource = getOrCreateTestElement(root, 'p2-control-source', 'output', hud)
  const timer = getOrCreateTestElement(root, 'round-timer', 'output', hud)
  const timerAlias = getOrCreateTestElement(root, 'timer', 'output', hud)
  const seed = getOrCreateTestElement(root, 'round-seed', 'output', hud)
  const seedAlias = getOrCreateTestElement(root, 'seed', 'output', hud)
  const results = getOrCreateTestElement(root, 'results', 'section', hud)
  const theEnd = getOrCreateTestElement(root, 'the-end', 'div', hud)

  const mainMenuPanel = getOrCreate(root, 'section', 'm26-main-menu', controls)
  const modeSelectPanel = getOrCreate(root, 'section', 'm26-mode-select', controls)
  const campaignPanel = getOrCreate(root, 'section', 'm27-campaign', controls)
  const prologuePanel = getOrCreate(root, 'section', 'm27-prologue', controls)
  const settingsPanel = getOrCreate(root, 'section', 'm26-settings', controls)
  const highScoresPanel = getOrCreateTestElement(root, 'high-scores-panel', 'section', controls)
  const gameplayPanel = getOrCreate(root, 'section', 'm26-gameplay-controls', controls)
  const pausePanel = getOrCreate(root, 'section', 'm26-pause', controls)
  const resultsActions = getOrCreate(root, 'div', 'm26-results-actions', results)
  const modeControls = getOrCreate(root, 'div', 'm25-mode-controls', modeSelectPanel)
  const difficultyControls = getOrCreate(root, 'div', 'm25-difficulty-controls', settingsPanel)
  const actionControls = getOrCreate(root, 'div', 'm25-action-controls', modeSelectPanel)
  const audioControls = getOrCreate(root, 'div', 'm25-audio-controls', settingsPanel)
  const replayControls = getOrCreate(root, 'div', 'm25-replay-controls', resultsActions)
  const secondaryControls = getOrCreate(root, 'div', 'm25-secondary-controls', settingsPanel)
  const options = getOrCreate(root, 'div', 'm25-options', settingsPanel)
  campaignPanel.setAttribute('data-testid', 'campaign-home-pond')
  prologuePanel.setAttribute('data-testid', 'campaign-prologue')
  campaignPanel.setAttribute('aria-label', 'Home Pond campaign')
  prologuePanel.setAttribute('aria-label', 'Home Pond prologue')
  campaignPanel.classList.add('m27-campaign-panel')
  prologuePanel.classList.add('m27-prologue-panel')
  for (const panel of [mainMenuPanel, modeSelectPanel, campaignPanel, prologuePanel, settingsPanel, highScoresPanel, gameplayPanel, pausePanel]) {
    panel.classList.add('m26-shell-panel')
    panel.tabIndex = -1
  }
  resultsActions.tabIndex = -1
  modeControls.classList.add('m25-control-group')
  difficultyControls.classList.add('m25-control-group')
  actionControls.classList.add('m25-control-group')
  audioControls.classList.add('m25-control-group')
  replayControls.classList.add('m25-control-group')
  secondaryControls.classList.add('m25-control-group')
  options.classList.add('m25-options')

  const campaignButton = getOrCreateButton(root, 'shell-campaign', 'Campaign', mainMenuPanel)
  const playButton = getOrCreateButton(root, 'shell-play', 'Play', mainMenuPanel)
  const openSettingsButton = getOrCreateButton(root, 'shell-settings', 'Settings', mainMenuPanel)
  const openHighScoresButton = getOrCreateButton(root, 'shell-high-scores', 'High Scores', mainMenuPanel)
  const campaignHeader = getOrCreate(root, 'header', 'm27-campaign-header', campaignPanel)
  const campaignTitle = getOrCreate(root, 'h2', 'm27-campaign-title', campaignHeader)
  const campaignStatus = getOrCreateTestElement(root, 'campaign-status', 'p', campaignHeader)
  const campaignActions = getOrCreate(root, 'div', 'm27-campaign-actions', campaignPanel)
  const campaignLevelList = getOrCreate(root, 'div', 'm27-level-list', campaignPanel)
  const campaignStartPrologueButton = getOrCreateButton(root, 'campaign-start-prologue', 'Start Prologue', campaignActions)
  const campaignContinueButton = getOrCreateButton(root, 'campaign-continue', 'Continue', campaignActions)
  const campaignReplayPrologueButton = getOrCreateButton(root, 'campaign-replay-prologue', 'Replay Prologue', campaignActions)
  const campaignMainMenuButton = getOrCreateButton(root, 'campaign-main-menu', 'Main Menu', campaignActions)
  campaignTitle.textContent = campaignTitle.textContent?.trim() || 'Home Pond'
  campaignLevelList.setAttribute('role', 'list')
  campaignLevelList.setAttribute('aria-label', 'Home Pond prologue levels')
  campaignActions.classList.add('m27-campaign-actions')
  campaignLevelList.classList.add('m27-level-list')
  const prologueTitle = getOrCreate(root, 'h2', 'm27-prologue-title', prologuePanel)
  const prologueIllustration = getOrCreateTestElement(root, 'prologue-illustration', 'img', prologuePanel) as HTMLImageElement
  const prologueText = getOrCreateTestElement(root, 'prologue-text', 'p', prologuePanel)
  const prologueProgress = getOrCreateTestElement(root, 'prologue-progress', 'p', prologuePanel)
  const prologueActions = getOrCreate(root, 'div', 'm27-prologue-actions', prologuePanel)
  const prologueBackButton = getOrCreateButton(root, 'prologue-back', 'Back', prologueActions)
  const prologueNextButton = getOrCreateButton(root, 'prologue-next', 'Next', prologueActions)
  const prologueSkipButton = getOrCreateButton(root, 'prologue-skip', 'Skip', prologueActions)
  const prologueStartLevelButton = getOrCreateButton(root, 'prologue-start-level', 'Start 1-1 First Hunt', prologueActions)
  const prologueMainMenuButton = getOrCreateButton(root, 'prologue-main-menu', 'Main Menu', prologueActions)
  prologueActions.classList.add('m27-prologue-actions')
  prologueIllustration.alt = ''
  prologueIllustration.decoding = 'async'
  prologueIllustration.draggable = false
  prologueIllustration.setAttribute('aria-hidden', 'true')
  prologueIllustration.classList.add('m28-prologue-illustration')
  prologueText.setAttribute('aria-live', 'polite')
  prologueProgress.classList.add('m27-prologue-progress')
  const classicSingleButton = getOrCreateButton(root, 'mode-classic-single', 'Classic Single', modeControls)
  const localVersusButton = getOrCreateButton(root, 'mode-local-versus', 'Local Versus', modeControls)
  const difficultyClassicAssistButton = getOrCreateButton(root, 'difficulty-classic-assist', 'Assist', difficultyControls)
  const difficultyClassicStandardButton = getOrCreateButton(root, 'difficulty-classic-standard', 'Standard', difficultyControls)
  const difficultyClassicExpertButton = getOrCreateButton(root, 'difficulty-classic-expert', 'Expert', difficultyControls)
  const startButton = getOrCreateButton(root, 'start-game', 'Start', actionControls)
  const mainMenuModeButton = getOrCreateButton(root, 'shell-mode-main-menu', 'Main Menu', modeSelectPanel)
  const pauseButton = getOrCreateButton(root, 'pause-game', 'Pause', gameplayPanel)
  const muteInput = getOrCreateCheckbox(root, 'option-mute', 'Mute', audioControls)
  const volumeInput = getOrCreateRange(root, 'option-volume', 'Master volume', audioControls)
  const sfxVolumeInput = getOrCreateRange(root, 'option-sfx-volume', 'SFX volume', audioControls)
  const musicVolumeInput = getOrCreateRange(root, 'option-music-volume', 'Music volume', audioControls)
  const monoAudioInput = getOrCreateCheckbox(root, 'option-mono-audio', 'Mono audio', audioControls)
  const replayButton = getOrCreateButton(root, 'replay-game', 'Replay', replayControls)
  const changeModeButton = getOrCreateButton(root, 'change-mode', 'Change Mode', resultsActions)
  const mainMenuResultsButton = getOrCreateButton(root, 'results-main-menu', 'Main Menu', resultsActions)
  const campaignResultStatus = getOrCreateTestElement(root, 'campaign-result-status', 'div', results)
  const campaignResultStars = getOrCreateTestElement(root, 'campaign-result-stars', 'div', results)
  const campaignReplayLevelButton = getOrCreateButton(root, 'campaign-replay-level', 'Replay Level', resultsActions)
  const campaignNextLevelButton = getOrCreateButton(root, 'campaign-next-level', 'Next Level', resultsActions)
  const campaignResultsReturnButton = getOrCreateButton(root, 'campaign-results-return', 'Campaign', resultsActions)
  const campaignClassicModesButton = getOrCreateButton(root, 'campaign-classic-modes', 'Classic Modes', resultsActions)
  campaignResultStatus.setAttribute('aria-live', 'polite')
  campaignResultStars.setAttribute('aria-hidden', 'true')
  campaignResultStars.classList.add('m28-result-stars')
  const resumeButton = getOrCreateButton(root, 'resume-game', 'Resume', pausePanel)
  const restartButton = getOrCreateButton(root, 'restart-game', 'Restart', pausePanel)
  const pauseSettingsButton = getOrCreateButton(root, 'pause-settings', 'Settings', pausePanel)
  const mainMenuPauseButton = getOrCreateButton(root, 'pause-main-menu', 'Main Menu', pausePanel)
  const audioUnlockButton = getOrCreateButton(root, 'audio-unlock', 'Enable Audio', secondaryControls)
  audioUnlockButton.classList.add('m25-audio-unlock')
  const showTimerInput = getOrCreateCheckbox(root, 'option-show-timer', 'Timer', secondaryControls)
  const reducedMotionInput = getOrCreateCheckbox(root, 'option-reduced-motion', 'Reduced motion', secondaryControls)
  const highContrastInput = getOrCreateCheckbox(root, 'option-high-contrast', 'High contrast', secondaryControls)
  const inputProfileSelect = getOrCreateSelect(root, 'input-profile-select', 'Input profile', settingsPanel)
  const inputRemapPanel = getOrCreate(root, 'div', 'm26-input-remap-panel', settingsPanel)
  const inputRemapStatus = getOrCreateTestElement(root, 'input-remap-status', 'div', inputRemapPanel)
  const resetInputProfileButton = getOrCreateButton(root, 'input-reset-defaults', 'Reset Defaults', inputRemapPanel)
  createInputRemapButtons(root, inputRemapPanel)
  const mainMenuSettingsButton = getOrCreateButton(root, 'settings-main-menu', 'Main Menu', settingsPanel)
  const mainMenuHighScoresButton = getOrCreateButton(root, 'high-scores-main-menu', 'Main Menu', highScoresPanel)
  const touchZones = getOrCreate(root, 'div', 'm26-touch-zones', shell)
  const touchLeftButton = getOrCreateButton(root, 'touch-left', 'Left', touchZones)
  const touchRightButton = getOrCreateButton(root, 'touch-right', 'Right', touchZones)
  const touchJumpButton = getOrCreateButton(root, 'touch-jump', 'Jump', touchZones)
  const touchTongueButton = getOrCreateButton(root, 'touch-tongue', 'Tongue', touchZones)
  const touchPauseButton = getOrCreateButton(root, 'touch-pause', 'Pause', touchZones)
  const touchConfirmButton = getOrCreateButton(root, 'touch-confirm', 'Confirm', touchZones)
  touchZones.setAttribute('data-testid', 'touch-zones')
  touchZones.setAttribute('role', 'group')
  touchZones.setAttribute('aria-label', 'Touch controls')
  touchZones.setAttribute('data-touch-zones-ready', 'true')
  for (const button of [touchLeftButton, touchRightButton, touchJumpButton, touchTongueButton, touchPauseButton, touchConfirmButton]) {
    button.classList.add('m26-touch-zone')
    button.setAttribute('data-touch-zone', 'true')
  }

  const domState = {
    shell,
    gameHost,
    hud,
    controls,
    state,
    score,
    p1Score,
    p2Score,
    p1ControlSource,
    p2ControlSource,
    timer,
    timerAlias,
    seed,
    seedAlias,
    results,
    theEnd,
    mainMenuPanel,
    modeSelectPanel,
    campaignPanel,
    prologuePanel,
    settingsPanel,
    highScoresPanel,
    gameplayPanel,
    pausePanel,
    resultsActions,
    campaignButton,
    playButton,
    openSettingsButton,
    openHighScoresButton,
    campaignStartPrologueButton,
    campaignContinueButton,
    campaignReplayPrologueButton,
    campaignMainMenuButton,
    campaignLevelList,
    campaignStatus,
    prologueTitle,
    prologueIllustration,
    prologueText,
    prologueProgress,
    prologueNextButton,
    prologueBackButton,
    prologueSkipButton,
    prologueStartLevelButton,
    prologueMainMenuButton,
    campaignResultStatus,
    campaignResultStars,
    campaignReplayLevelButton,
    campaignNextLevelButton,
    campaignResultsReturnButton,
    campaignClassicModesButton,
    mainMenuModeButton,
    mainMenuSettingsButton,
    mainMenuHighScoresButton,
    mainMenuPauseButton,
    mainMenuResultsButton,
    pauseSettingsButton,
    restartButton,
    changeModeButton,
    classicSingleButton,
    localVersusButton,
    startButton,
    pauseButton,
    resumeButton,
    replayButton,
    difficultyClassicAssistButton,
    difficultyClassicStandardButton,
    difficultyClassicExpertButton,
    audioUnlockButton,
    showTimerInput,
    reducedMotionInput,
    highContrastInput,
    muteInput,
    volumeInput,
    sfxVolumeInput,
    musicVolumeInput,
    monoAudioInput,
    inputProfileSelect,
    inputRemapStatus,
    resetInputProfileButton,
    touchLeftButton,
    touchRightButton,
    touchJumpButton,
    touchTongueButton,
    touchPauseButton,
    touchConfirmButton,
  }
  layoutChrome(domState)

  return domState
}

export function mountCanvas(gameHost: HTMLElement, canvas: HTMLCanvasElement): () => void {
  const resize = () => {
    const availableWidth = Math.max(320, window.innerWidth - 32)
    const availableHeight = Math.max(240, window.innerHeight - 276)
    const scale = Math.min(1, availableWidth / ARENA_WIDTH, availableHeight / ARENA_HEIGHT)
    const width = Math.floor(ARENA_WIDTH * scale)
    const height = Math.floor(ARENA_HEIGHT * scale)
    const centeredTop = Math.max(16, (window.innerHeight - height) / 2)
    const shortViewportTop = Math.min(window.innerHeight - height - 16, 220)
    const top = Math.max(centeredTop, shortViewportTop)

    gameHost.style.setProperty('position', 'fixed', 'important')
    gameHost.style.setProperty('left', '50%', 'important')
    gameHost.style.setProperty('top', `${top}px`, 'important')
    gameHost.style.setProperty('transform', 'translateX(-50%)', 'important')
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

  canvas.setAttribute('aria-label', 'Frogs and Flies classic match canvas')
  canvas.style.setProperty('touch-action', 'manipulation')
  gameHost.appendChild(canvas)
  resize()
  window.addEventListener('resize', resize)

  return () => window.removeEventListener('resize', resize)
}

export function syncDom(
  dom: DomState,
  game: GameState,
  runtimeOptions?: RuntimeOptions,
  audioState?: AudioManagerState,
  shellSync?: ShellDomSyncState,
): void {
  const options = runtimeOptions ?? {
    difficulty: game.options.difficulty,
    reducedMotion: false,
    highContrast: false,
    showTimer: true,
    mute: false,
    volume: 1,
    masterVolume: 1,
    sfxVolume: 1,
    musicVolume: 0.8,
    monoAudio: false,
  }
  const audioMarkers = audioState ?? {
    available: true,
    unlocked: false,
    muted: options.mute,
    volume: options.volume,
    masterVolume: options.masterVolume,
    sfxVolume: options.sfxVolume,
    musicVolume: options.musicVolume,
    monoAudio: options.monoAudio,
    musicPlaying: false,
    pendingSfxCount: 0,
  }

  dom.state.setAttribute('data-state', game.phase)
  dom.state.setAttribute('data-mode', game.mode)
  dom.state.setAttribute('data-time-of-day', game.timeOfDay)
  dom.state.setAttribute('data-difficulty', game.options.difficulty)
  syncM1RuntimeMarkers(dom.state, game)
  syncPlayerArenaMarkers(dom.state, game)
  if (dom.canvas) {
    syncM1RuntimeMarkers(dom.canvas, game)
    syncPlayerArenaMarkers(dom.canvas, game)
    dom.canvas.setAttribute('data-testid', 'game-canvas')
    dom.canvas.setAttribute('data-runtime-markers', 'm2')
    syncRuntimeOptionMarkers(dom.canvas, options, audioMarkers)
  }
  for (const element of [dom.shell, dom.state, dom.campaignPanel, dom.prologuePanel]) {
    syncRuntimeOptionMarkers(element, options, audioMarkers)
  }
  dom.shell.classList.toggle('is-reduced-motion', options.reducedMotion)
  dom.shell.classList.toggle('is-high-contrast', options.highContrast)
  dom.state.textContent = `State: ${game.phase}`

  const remainingSeconds = Math.ceil(game.remainingSeconds)
  const scoreText = `Score: ${game.score}`
  const timerText = `Time: ${remainingSeconds}`
  const seedText = `Seed: ${game.seed}`

  dom.score.textContent = scoreText
  dom.score.setAttribute('data-score', String(game.score))
  dom.score.setAttribute('data-combo', String(game.combo))

  syncPlayerScore(dom.p1Score, game.players[0], 'P1')
  syncPlayerScore(dom.p2Score, game.players[1], 'P2')
  syncControlSource(dom.p1ControlSource, game.players[0], 'P1')
  syncControlSource(dom.p2ControlSource, game.players[1], 'P2')

  for (const element of [dom.timer, dom.timerAlias]) {
    element.textContent = timerText
    element.setAttribute('data-target-seconds', String(game.durationSeconds))
    element.setAttribute('data-remaining-seconds', String(remainingSeconds))
    element.hidden = !options.showTimer
  }

  for (const element of [dom.seed, dom.seedAlias]) {
    element.textContent = seedText
    element.setAttribute('data-seed', String(game.seed))
  }

  dom.theEnd.textContent = game.phase === 'the-end' ? 'THE END' : ''
  dom.theEnd.style.display = game.phase === 'the-end' ? 'block' : 'none'

  syncResults(dom.results, game)
  syncModeControl(dom.classicSingleButton, game.mode, 'classic-single')
  syncModeControl(dom.localVersusButton, game.mode, 'local-versus')
  syncDifficultyControl(dom.difficultyClassicAssistButton, game.options.difficulty, 'classic-assist')
  syncDifficultyControl(dom.difficultyClassicStandardButton, game.options.difficulty, 'classic-standard')
  syncDifficultyControl(dom.difficultyClassicExpertButton, game.options.difficulty, 'classic-expert')
  syncAudioUnlockControl(dom.audioUnlockButton, audioMarkers)
  syncCheckboxControl(dom.showTimerInput, options.showTimer)
  syncCheckboxControl(dom.reducedMotionInput, options.reducedMotion)
  syncCheckboxControl(dom.highContrastInput, options.highContrast)
  syncCheckboxControl(dom.muteInput, options.mute)
  syncCheckboxControl(dom.monoAudioInput, options.monoAudio)
  dom.volumeInput.value = String(options.volume)
  dom.volumeInput.setAttribute('aria-valuenow', String(options.volume))
  dom.sfxVolumeInput.value = String(options.sfxVolume)
  dom.sfxVolumeInput.setAttribute('aria-valuenow', String(options.sfxVolume))
  dom.musicVolumeInput.value = String(options.musicVolume)
  dom.musicVolumeInput.setAttribute('aria-valuenow', String(options.musicVolume))
  syncInputProfileControl(dom.inputProfileSelect, shellSync?.save)
  if (shellSync) {
    syncShellDom(dom, shellSync)
  }

  for (const element of [
    dom.state,
    dom.score,
    dom.p1Score,
    dom.p2Score,
    dom.p1ControlSource,
    dom.p2ControlSource,
    dom.timer,
    dom.timerAlias,
    dom.seed,
    dom.seedAlias,
    dom.results,
  ]) {
    styleMarker(element)
  }
  styleTheEnd(dom.theEnd)
  layoutChromeWhenNeeded(dom, game.phase, options.showTimer)
}

function syncPlayerScore(element: HTMLElement, player: MatchPlayerState | undefined, fallbackLabel: string): void {
  const score = player?.score ?? 0
  const catches = player?.stats.catches ?? 0
  const attempts = player?.stats.attempts ?? 0
  const accuracy = attempts > 0 ? catches / attempts : 0

  element.textContent = `${player?.label ?? fallbackLabel}: ${score}`
  element.setAttribute('data-score', String(score))
  element.setAttribute('data-caught', String(catches))
  element.setAttribute('data-attempts', String(attempts))
  element.setAttribute('data-accuracy', accuracy.toFixed(3))
}

function syncControlSource(element: HTMLElement, player: MatchPlayerState | undefined, fallbackLabel: string): void {
  const source = player?.controlSource ?? 'human'

  element.textContent = `${player?.label ?? fallbackLabel}: ${source}`
  element.setAttribute('data-control-source', source)
}

function syncResults(element: HTMLElement, game: GameState): void {
  const p1 = game.players[0]
  const p2 = game.players[1]
  const p1Score = String(p1?.score ?? 0)
  const p2Score = String(p2?.score ?? 0)
  const winner = game.results?.winner
  const winnerLabel = winner === 'p1' ? 'P1' : winner === 'p2' ? 'P2' : 'Tie'

  element.setAttribute('data-p1-score', p1Score)
  element.setAttribute('data-p2-score', p2Score)
  if (game.results) {
    element.setAttribute('data-winner', game.results.winner)
  } else {
    element.removeAttribute('data-winner')
  }
  syncResultLine(element, 'results-winner', `Winner: ${winnerLabel}`)
  syncResultLine(element, 'results-p1-score', `P1: ${p1Score}`)
  syncResultLine(element, 'results-p2-score', `P2: ${p2Score}`)
  syncResultLine(element, 'results-p1-stats', formatResultStats(p1, 'P1'))
  syncResultLine(element, 'results-p2-stats', formatResultStats(p2, 'P2'))
  element.style.display = game.phase === 'results' ? 'block' : 'none'
}

function syncShellDom(dom: DomState, shellSync: ShellDomSyncState): void {
  const { shell, save, saveStatus, storageAvailable, roundRecorded, highScoreStatus } = shellSync
  const previousShellScreen = dom.activeShellScreen

  dom.shell.setAttribute('data-shell-screen', shell.screen)
  dom.shell.setAttribute('data-selected-mode', shell.selectedMode)
  dom.shell.setAttribute('data-save-status', saveStatus)
  dom.shell.setAttribute('data-storage-available', String(storageAvailable))
  dom.shell.setAttribute('data-round-recorded', String(roundRecorded))
  syncCampaignShellMarkers(dom, shellSync)

  setPanelVisible(dom.mainMenuPanel, shell.screen === 'main-menu' || shell.screen === 'splash')
  setPanelVisible(dom.modeSelectPanel, shell.screen === 'mode-select')
  setPanelVisible(dom.campaignPanel, shell.screen === 'campaign')
  setPanelVisible(dom.prologuePanel, shell.screen === 'prologue')
  setPanelVisible(dom.settingsPanel, shell.screen === 'settings')
  setPanelVisible(dom.highScoresPanel, shell.screen === 'high-scores')
  setPanelVisible(dom.gameplayPanel, shell.screen === 'gameplay')
  setPanelVisible(dom.pausePanel, shell.screen === 'pause')
  setPanelVisible(dom.resultsActions, shell.screen === 'results')
  if (previousShellScreen && previousShellScreen !== shell.screen) {
    focusShellScreenPanel(dom, shell.screen)
  }
  dom.activeShellScreen = shell.screen

  dom.startButton.hidden = shell.screen !== 'mode-select'
  dom.pauseButton.hidden = shell.screen !== 'gameplay'
  dom.results.hidden = shell.screen !== 'results'
  syncModeControl(dom.classicSingleButton, shell.selectedMode, 'classic-single')
  syncModeControl(dom.localVersusButton, shell.selectedMode, 'local-versus')
  syncCampaignPanel(dom, shellSync)
  syncProloguePanel(dom, shellSync)
  syncHighScores(dom.highScoresPanel, save)
  syncResultLine(dom.results, 'results-high-score-status', highScoreStatus ?? 'Local high score status pending.')
  syncCampaignResultActions(dom, shellSync)
}

function focusShellScreenPanel(dom: DomState, screen: ShellState['screen']): void {
  if (!document.hasFocus()) {
    return
  }

  const panelByScreen: Record<ShellState['screen'], HTMLElement> = {
    splash: dom.mainMenuPanel,
    'main-menu': dom.mainMenuPanel,
    campaign: dom.campaignPanel,
    prologue: dom.prologuePanel,
    'mode-select': dom.modeSelectPanel,
    settings: dom.settingsPanel,
    'high-scores': dom.highScoresPanel,
    gameplay: dom.gameplayPanel,
    pause: dom.pausePanel,
    results: dom.resultsActions,
  }

  panelByScreen[screen].focus({ preventScroll: true })
}

function syncCampaignShellMarkers(dom: DomState, shellSync: ShellDomSyncState): void {
  const campaign = shellSync.campaign
  const prologue = shellSync.prologue
  const progress = shellSync.campaignProgress ?? shellSync.save.campaign
  const prologueSeen = prologue ? progress.seenPrologueIds.includes(prologue.id) : false

  if (campaign) {
    dom.shell.setAttribute('data-campaign-id', campaign.id)
  } else {
    dom.shell.removeAttribute('data-campaign-id')
  }
  dom.shell.setAttribute('data-prologue-seen', String(prologueSeen))
  dom.shell.setAttribute('data-last-selected-campaign-level', progress.lastSelectedLevelId ?? '')
  if (shellSync.activeCampaignLevelId) {
    dom.shell.setAttribute('data-active-campaign-level', shellSync.activeCampaignLevelId)
  } else {
    dom.shell.removeAttribute('data-active-campaign-level')
  }
}

function syncCampaignPanel(dom: DomState, shellSync: ShellDomSyncState): void {
  const campaign = shellSync.campaign
  const prologue = shellSync.prologue
  const levels = shellSync.campaignLevels ?? []
  const progress = shellSync.campaignProgress ?? shellSync.save.campaign
  if (!campaign || !prologue) {
    return
  }

  const prologueSeen = progress.seenPrologueIds.includes(prologue.id)
  const campaignComplete = campaign.levelIds.every((levelId) => progress.levels[levelId]?.passed === true)
  const status = campaignComplete ? 'Complete' : prologueSeen ? 'In Progress' : 'New'

  dom.campaignPanel.setAttribute('data-campaign-id', campaign.id)
  dom.campaignPanel.setAttribute('data-prologue-id', prologue.id)
  dom.campaignStatus.textContent = `${campaign.title} campaign status: ${status}.`
  dom.campaignStatus.setAttribute('data-campaign-status', status.toLowerCase().replace(/\s+/g, '-'))
  dom.campaignStartPrologueButton.hidden = prologueSeen
  dom.campaignContinueButton.hidden = !prologueSeen || campaignComplete
  dom.campaignReplayPrologueButton.hidden = !prologueSeen || !prologue.replayable
  setButtonDisabled(dom.campaignContinueButton, !prologueSeen || campaignComplete)

  const levelListKey = levels
    .map((level) => {
      const levelProgress = progress.levels[level.id]
      return [
        level.id,
        levelProgress?.unlocked === true,
        levelProgress?.passed === true,
        levelProgress?.stars ?? 0,
        levelProgress?.bestScore ?? 0,
      ].join(':')
    })
    .join('|')
  if (dom.campaignLevelListKey !== levelListKey) {
    dom.campaignLevelList.replaceChildren(
      ...levels.map((level) => createCampaignLevelRow(level, progress.levels[level.id])),
    )
    dom.campaignLevelListKey = levelListKey
  }
}

function createCampaignLevelRow(
  level: CampaignLevelDefinition,
  progress: SaveData['campaign']['levels'][string] | undefined,
): HTMLElement {
  const row = document.createElement('article')
  const status = progress?.passed ? 'Passed' : progress?.unlocked ? 'Unlocked' : 'Locked'
  const stars = progress?.stars ?? 0
  const bestScore = progress?.bestScore ?? 0
  const unlocked = progress?.unlocked === true

  row.className = 'm27-level-row'
  row.setAttribute('role', 'listitem')
  row.setAttribute('data-testid', `campaign-level-${level.id}`)
  row.setAttribute('data-level-id', level.id)
  row.setAttribute('data-unlocked', String(progress?.unlocked === true))
  row.setAttribute('data-passed', String(progress?.passed === true))
  row.setAttribute('data-stars', String(stars))
  row.setAttribute('data-best-score', String(bestScore))

  const summary = document.createElement('div')
  summary.className = 'm28-level-summary'
  const statusIcon = createDecorativeImage(
    `campaign-level-status-icon-${level.id}`,
    progress?.passed ? M28_CLEARED_ICON : unlocked ? M28_STAR_EMPTY_ICON : M28_LOCK_ICON,
    'm28-level-status-icon',
  )
  statusIcon.setAttribute('data-icon-state', progress?.passed ? 'cleared' : unlocked ? 'unlocked' : 'locked')
  const textGroup = document.createElement('div')
  textGroup.className = 'm28-level-text'
  const heading = document.createElement('h3')
  heading.textContent = `${level.chapterLabel} ${level.title}`
  const meta = document.createElement('p')
  meta.textContent = `${status} - ${stars} stars - best ${bestScore}`
  meta.className = 'm28-level-meta'
  textGroup.append(heading, meta)
  summary.append(statusIcon, textGroup)

  const starStrip = document.createElement('div')
  starStrip.className = 'm28-star-strip'
  starStrip.setAttribute('data-testid', `campaign-level-stars-${level.id}`)
  starStrip.setAttribute('aria-hidden', 'true')
  renderStarStrip(starStrip, stars)

  const action = document.createElement('button')
  action.type = 'button'
  action.textContent = unlocked ? `${progress?.passed ? 'Replay' : 'Start'} ${level.chapterLabel}` : `Locked ${level.chapterLabel}`
  action.setAttribute('data-testid', `campaign-level-action-${level.id}`)
  action.setAttribute('data-campaign-level-id', level.id)
  action.disabled = !unlocked
  action.setAttribute('aria-disabled', String(!unlocked))

  row.append(summary, starStrip, action)
  return row
}

function syncProloguePanel(dom: DomState, shellSync: ShellDomSyncState): void {
  const prologue = shellSync.prologue
  const level = shellSync.campaignLevels?.find((candidate) => candidate.id === prologue?.startLevelId)
  if (!prologue || prologue.panels.length === 0) {
    return
  }

  const maxIndex = prologue.panels.length - 1
  const panelIndex = Math.max(0, Math.min(shellSync.prologuePanelIndex ?? 0, maxIndex))
  const panel = prologue.panels[panelIndex]
  const isFirstPanel = panelIndex === 0
  const isFinalPanel = panelIndex === maxIndex

  dom.prologuePanel.setAttribute('data-prologue-id', prologue.id)
  dom.prologuePanel.setAttribute('data-prologue-panel-index', String(panelIndex))
  dom.prologuePanel.setAttribute('data-prologue-panel-count', String(prologue.panels.length))
  dom.prologuePanel.setAttribute('data-prologue-tone', panel.visualTone)
  dom.prologueIllustration.setAttribute('src', M28_PROLOGUE_ASSET_PATH_BY_TONE[panel.visualTone])
  dom.prologueIllustration.setAttribute('data-prologue-image-tone', panel.visualTone)
  dom.prologueTitle.textContent = prologue.title
  dom.prologueText.textContent = panel.text
  dom.prologueProgress.textContent = `Panel ${panelIndex + 1} of ${prologue.panels.length}`
  dom.prologueBackButton.hidden = isFirstPanel
  dom.prologueNextButton.hidden = isFinalPanel
  dom.prologueStartLevelButton.hidden = !isFinalPanel
  dom.prologueStartLevelButton.textContent = level ? `Start ${level.chapterLabel} ${level.title}` : 'Start 1-1 First Hunt'
  setButtonDisabled(dom.prologueStartLevelButton, !level)
}

function syncCampaignResultActions(dom: DomState, shellSync: ShellDomSyncState): void {
  const result = shellSync.latestCampaignResultSummary
  const visible = shellSync.shell.screen === 'results' && result !== undefined

  dom.campaignResultStatus.hidden = !visible
  dom.campaignResultStars.hidden = !visible
  dom.campaignReplayLevelButton.hidden = !visible
  dom.campaignResultsReturnButton.hidden = !visible
  dom.campaignClassicModesButton.hidden = !visible
  dom.campaignNextLevelButton.hidden = !visible || !result?.nextLevelId
  dom.replayButton.hidden = visible
  dom.changeModeButton.hidden = visible

  if (!result) {
    dom.campaignResultStatus.textContent = ''
    dom.campaignResultStatus.removeAttribute('data-campaign-result-level')
    dom.campaignResultStatus.removeAttribute('data-campaign-result-passed')
    dom.campaignResultStatus.removeAttribute('data-campaign-result-stars')
    dom.campaignResultStars.replaceChildren()
    return
  }

  dom.campaignResultStatus.textContent = result.statusText
  dom.campaignResultStatus.setAttribute('data-campaign-result-level', result.levelId)
  dom.campaignResultStatus.setAttribute('data-campaign-result-passed', String(result.passed))
  dom.campaignResultStatus.setAttribute('data-campaign-result-stars', String(result.stars))
  if (dom.campaignResultStars.getAttribute('data-stars') !== String(result.stars)) {
    renderStarStrip(dom.campaignResultStars, result.stars)
  }
  if (result.nextLevelId) {
    dom.campaignNextLevelButton.setAttribute('data-next-campaign-level', result.nextLevelId)
  } else {
    dom.campaignNextLevelButton.removeAttribute('data-next-campaign-level')
  }
}

function renderStarStrip(container: HTMLElement, stars: number): void {
  const normalizedStars = Math.max(0, Math.min(3, Math.trunc(stars)))
  const starImages = [0, 1, 2].map((index) => {
    const filled = index < normalizedStars
    const image = createDecorativeImage(
      undefined,
      filled ? M28_STAR_FILLED_ICON : M28_STAR_EMPTY_ICON,
      filled ? 'm28-star-icon m28-star-icon-filled' : 'm28-star-icon m28-star-icon-empty',
    )
    image.setAttribute('data-star-filled', String(filled))
    return image
  })

  container.replaceChildren(...starImages)
  container.setAttribute('data-stars', String(normalizedStars))
}

function createDecorativeImage(testId: string | undefined, src: string, className: string): HTMLImageElement {
  const image = document.createElement('img')

  if (testId) {
    image.setAttribute('data-testid', testId)
  }
  image.src = src
  image.alt = ''
  image.decoding = 'async'
  image.draggable = false
  image.setAttribute('aria-hidden', 'true')
  image.className = className

  return image
}

function syncHighScores(element: HTMLElement, save: SaveData): void {
  const classic = save.highScores.classicSingle[0]
  const versus = save.highScores.localVersus[0]
  const classicText = classic
    ? `Classic Single local best: ${classic.score} points - Seed ${classic.seed}`
    : 'Classic Single local best: none yet'
  const versusText = versus ? `Local Versus local best: ${versus.score} points - Seed ${versus.seed}` : 'Local Versus local best: none yet'

  element.setAttribute('aria-label', 'Local high scores')
  syncResultLine(element, 'high-scores-title', 'Local High Scores')
  syncResultLine(element, 'high-scores-classic-single', classicText)
  syncResultLine(element, 'high-scores-local-versus', versusText)
}

function syncInputProfileControl(element: HTMLSelectElement, save: SaveData | undefined): void {
  const profiles = save?.inputProfiles.length ? save.inputProfiles : [{ id: 'default', name: 'Default' }]
  const selected = save?.settings.inputProfileId ?? 'default'

  element.replaceChildren()
  for (const profile of profiles) {
    const option = document.createElement('option')
    option.value = profile.id
    option.textContent = profile.name
    option.selected = profile.id === selected
    element.appendChild(option)
  }
}

function createInputRemapButtons(root: HTMLElement, parent: HTMLElement): void {
  const actions = [
    ['p1.moveLeft', 'P1 Left'],
    ['p1.moveRight', 'P1 Right'],
    ['p1.chargeJump', 'P1 Jump'],
    ['p1.tongue', 'P1 Tongue'],
    ['p2.moveLeft', 'P2 Left'],
    ['p2.moveRight', 'P2 Right'],
    ['p2.chargeJump', 'P2 Jump'],
    ['p2.tongue', 'P2 Tongue'],
    ['ui.start', 'Start'],
    ['ui.pause', 'Pause'],
    ['ui.confirm', 'Confirm'],
    ['ui.back', 'Back'],
  ] as const

  for (const [action, label] of actions) {
    const button = getOrCreateButton(root, `remap-${action}`, label, parent)
    button.setAttribute('data-input-action', action)
  }
}

function setPanelVisible(element: HTMLElement, visible: boolean): void {
  element.hidden = !visible
  element.style.display = visible ? '' : 'none'
}

function setButtonDisabled(element: HTMLElement, disabled: boolean): void {
  element.toggleAttribute('disabled', disabled)
  element.setAttribute('aria-disabled', String(disabled))
  if (element instanceof HTMLButtonElement) {
    element.disabled = disabled
  }
}

function syncResultLine(parent: HTMLElement, testId: string, text: string): void {
  const existing = parent.querySelector<HTMLElement>(`[data-testid="${testId}"]`)
  const element = existing ?? document.createElement('div')

  element.setAttribute('data-testid', testId)
  element.textContent = text
  if (!existing) {
    parent.appendChild(element)
  }
}

function formatResultStats(player: MatchPlayerState | undefined, fallbackLabel: string): string {
  const catches = player?.stats.catches ?? 0
  const attempts = player?.stats.attempts ?? 0
  const accuracy = attempts > 0 ? catches / attempts : 0

  return `${player?.label ?? fallbackLabel}: caught ${catches}, attempts ${attempts}, accuracy ${(accuracy * 100).toFixed(1)}%, combo ${player?.stats.combo ?? 0}`
}

function syncModeControl(element: HTMLElement, currentMode: MatchMode, mode: MatchMode): void {
  const selected = currentMode === mode

  element.setAttribute('data-selected', String(selected))
  element.setAttribute('aria-pressed', String(selected))
}

function syncDifficultyControl(element: HTMLElement, currentMode: RuntimeOptions['difficulty'], mode: RuntimeOptions['difficulty']): void {
  const selected = currentMode === mode

  element.setAttribute('data-selected', String(selected))
  element.setAttribute('aria-pressed', String(selected))
}

function syncCheckboxControl(element: HTMLInputElement, checked: boolean): void {
  element.checked = checked
  element.setAttribute('aria-checked', String(checked))
}

function syncAudioUnlockControl(element: HTMLElement, audioState: AudioManagerState): void {
  element.textContent = audioState.unlocked ? 'Audio On' : 'Enable Audio'
  element.setAttribute('aria-pressed', String(audioState.unlocked))
  element.setAttribute('data-audio-unlocked', String(audioState.unlocked))
  element.setAttribute('data-audio-available', String(audioState.available))
  element.setAttribute('data-pending-sfx-count', String(audioState.pendingSfxCount))
  element.setAttribute('data-audio-music-playing', String(audioState.musicPlaying))
  element.setAttribute('data-audio-mono', String(audioState.monoAudio))
}

function syncRuntimeOptionMarkers(element: HTMLElement, options: RuntimeOptions, audioState: AudioManagerState): void {
  element.setAttribute('data-difficulty', options.difficulty)
  element.setAttribute('data-reduced-motion', String(options.reducedMotion))
  element.setAttribute('data-high-contrast', String(options.highContrast))
  element.setAttribute('data-show-timer', String(options.showTimer))
  element.setAttribute('data-muted', String(options.mute))
  element.setAttribute('data-volume', options.volume.toFixed(2))
  element.setAttribute('data-master-volume', options.masterVolume.toFixed(2))
  element.setAttribute('data-sfx-volume', options.sfxVolume.toFixed(2))
  element.setAttribute('data-music-volume', options.musicVolume.toFixed(2))
  element.setAttribute('data-mono-audio', String(options.monoAudio))
  element.setAttribute('data-audio-unlocked', String(audioState.unlocked))
  element.setAttribute('data-audio-muted', String(audioState.muted))
  element.setAttribute('data-audio-volume', audioState.volume.toFixed(2))
  element.setAttribute('data-audio-master-volume', audioState.masterVolume.toFixed(2))
  element.setAttribute('data-audio-sfx-volume', audioState.sfxVolume.toFixed(2))
  element.setAttribute('data-audio-music-volume', audioState.musicVolume.toFixed(2))
  element.setAttribute('data-audio-mono', String(audioState.monoAudio))
  element.setAttribute('data-audio-music-playing', String(audioState.musicPlaying))
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

function syncPlayerArenaMarkers(element: HTMLElement, game: GameState): void {
  const [p1, p2] = game.players

  if (p1) {
    element.setAttribute('data-p1-home-lily', p1.state.homeLilyId)
    element.setAttribute('data-p1-facing', p1.state.facing)
    element.setAttribute('data-p1-phase', p1.state.phase)
  }

  if (p2) {
    element.setAttribute('data-p2-home-lily', p2.state.homeLilyId)
    element.setAttribute('data-p2-facing', p2.state.facing)
    element.setAttribute('data-p2-phase', p2.state.phase)
  }
}

function formatMarkerSeconds(seconds: number): string {
  return seconds.toFixed(3)
}

function getOrCreate(root: HTMLElement, tagName: string, id: string, parent: HTMLElement): HTMLElement {
  const existing = root.querySelector<HTMLElement>(`#${id}`)
  if (existing) {
    if (existing.parentElement !== parent) {
      parent.appendChild(existing)
    }
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
    if (existing.parentElement !== parent) {
      parent.appendChild(existing)
    }
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

function getOrCreateCheckbox(root: HTMLElement, testId: string, label: string, parent: HTMLElement): HTMLInputElement {
  const input = getOrCreateLabeledInput(root, testId, label, 'checkbox', parent)
  input.setAttribute('role', 'checkbox')
  return input
}

function getOrCreateRange(root: HTMLElement, testId: string, label: string, parent: HTMLElement): HTMLInputElement {
  const input = getOrCreateLabeledInput(root, testId, label, 'range', parent)
  input.min = '0'
  input.max = '1'
  input.step = '0.05'
  input.setAttribute('aria-label', label)
  return input
}

function getOrCreateSelect(root: HTMLElement, testId: string, label: string, parent: HTMLElement): HTMLSelectElement {
  const existing = root.querySelector<HTMLSelectElement>(`[data-testid="${testId}"]`)
  if (existing) {
    return existing
  }

  const wrapper = document.createElement('label')
  wrapper.className = 'm25-option-control'
  const select = document.createElement('select')
  const text = document.createElement('span')
  select.setAttribute('data-testid', testId)
  select.setAttribute('aria-label', label)
  text.textContent = label
  wrapper.append(select, text)
  parent.appendChild(wrapper)
  return select
}

function getOrCreateLabeledInput(
  root: HTMLElement,
  testId: string,
  label: string,
  type: HTMLInputElement['type'],
  parent: HTMLElement,
): HTMLInputElement {
  const existing = root.querySelector<HTMLInputElement>(`[data-testid="${testId}"]`)
  if (existing) {
    return existing
  }

  const wrapper = document.createElement('label')
  wrapper.className = 'm25-option-control'
  const input = document.createElement('input')
  const text = document.createElement('span')
  input.type = type
  input.setAttribute('data-testid', testId)
  text.textContent = label
  wrapper.append(input, text)
  parent.appendChild(wrapper)
  return input
}

function styleHud(hud: HTMLElement): void {
  hud.style.position = 'fixed'
  hud.style.top = '16px'
  hud.style.left = '16px'
  hud.style.zIndex = '3'
  hud.style.display = 'flex'
  hud.style.flexWrap = 'wrap'
  hud.style.gap = '8px'
  hud.style.alignItems = 'center'
  hud.style.maxWidth = 'min(520px, calc(100vw - 480px))'
  hud.style.pointerEvents = 'none'

  for (const child of Array.from(hud.children) as HTMLElement[]) {
    child.style.pointerEvents = 'auto'
  }
}

function styleControls(controls: HTMLElement): void {
  controls.style.position = 'fixed'
  controls.style.right = '16px'
  controls.style.top = '16px'
  controls.style.zIndex = '3'
  controls.style.display = 'flex'
  controls.style.flexWrap = 'wrap'
  controls.style.gap = '8px'
  controls.style.justifyContent = 'flex-end'
  controls.style.maxWidth = 'min(420px, calc(100% - 32px))'
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

function layoutChrome(dom: DomState): void {
  const isNarrow = window.innerWidth < 760

  if (isNarrow) {
    dom.hud.style.left = '8px'
    dom.hud.style.right = '8px'
    dom.hud.style.maxWidth = 'calc(100vw - 16px)'
    dom.controls.style.left = '8px'
    dom.controls.style.right = '8px'
    dom.controls.style.top = ''
    dom.controls.style.bottom = '8px'
    dom.controls.style.maxWidth = 'calc(100vw - 16px)'
    dom.controls.style.justifyContent = 'flex-start'
    return
  }

  dom.hud.style.left = '16px'
  dom.hud.style.right = ''
  dom.hud.style.maxWidth = 'min(520px, calc(100vw - 480px))'
  dom.controls.style.left = ''
  dom.controls.style.right = '16px'
  dom.controls.style.top = '16px'
  dom.controls.style.bottom = ''
  dom.controls.style.maxWidth = 'min(420px, calc(100vw - 32px))'
  dom.controls.style.justifyContent = 'flex-end'
}

function layoutChromeWhenNeeded(dom: DomState, phase: GameState['phase'], showTimer: boolean): void {
  const nextKey = `${window.innerWidth}:${window.innerHeight}:${phase}:${showTimer}:${dom.results.style.display}`

  if (dom.chromeLayoutKey === nextKey) {
    return
  }

  dom.chromeLayoutKey = nextKey
  layoutChrome(dom)
}
