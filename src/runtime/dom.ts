import { ARENA_HEIGHT, ARENA_WIDTH } from '../game/constants'
import type { GameState, MatchPlayerState } from '../game/types'

export type DomState = {
  shell: HTMLElement
  gameHost: HTMLElement
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
  startButton: HTMLElement
  pauseButton: HTMLElement
  resumeButton: HTMLElement
  replayButton: HTMLElement
}

export function createDomState(root: HTMLElement): DomState {
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

  const startButton = getOrCreateButton(root, 'start-game', 'Start', controls)
  const pauseButton = getOrCreateButton(root, 'pause-game', 'Pause', controls)
  const resumeButton = getOrCreateButton(root, 'resume-game', 'Resume', controls)
  const replayButton = getOrCreateButton(root, 'replay-game', 'Replay', controls)

  return {
    shell,
    gameHost,
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
    startButton,
    pauseButton,
    resumeButton,
    replayButton,
  }
}

export function mountCanvas(gameHost: HTMLElement, canvas: HTMLCanvasElement): () => void {
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

  return () => window.removeEventListener('resize', resize)
}

export function syncDom(dom: DomState, game: GameState): void {
  dom.state.setAttribute('data-state', game.phase)
  dom.state.setAttribute('data-mode', game.mode)
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

  syncPlayerScore(dom.p1Score, game.players[0], 'P1')
  syncPlayerScore(dom.p2Score, game.players[1], 'P2')
  syncControlSource(dom.p1ControlSource, game.players[0], 'P1')
  syncControlSource(dom.p2ControlSource, game.players[1], 'P2')

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

  syncResults(dom.results, game)

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
  const p1Score = String(game.players[0]?.score ?? 0)
  const p2Score = String(game.players[1]?.score ?? 0)

  element.textContent = `Results: ${p1Score}-${p2Score}`
  element.setAttribute('data-p1-score', p1Score)
  element.setAttribute('data-p2-score', p2Score)
  if (game.results) {
    element.setAttribute('data-winner', game.results.winner)
  } else {
    element.removeAttribute('data-winner')
  }
  element.style.display = game.phase === 'results' ? 'block' : 'none'
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
