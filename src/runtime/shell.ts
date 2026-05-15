import type { MatchMode } from '../game/types'

export type ShellScreen =
  | 'splash'
  | 'main-menu'
  | 'mode-select'
  | 'settings'
  | 'high-scores'
  | 'gameplay'
  | 'pause'
  | 'results'

export interface ShellState {
  screen: ShellScreen
  selectedMode: MatchMode
}

export type ShellAction =
  | { type: 'bootReady' }
  | { type: 'play' }
  | { type: 'selectMode'; mode: MatchMode }
  | { type: 'openSettings' }
  | { type: 'openHighScores' }
  | { type: 'startGameplay' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'showResults' }
  | { type: 'replay' }
  | { type: 'changeMode' }
  | { type: 'mainMenu' }

export type ShellControl =
  | 'play'
  | 'settings'
  | 'high-scores'
  | 'classic-single'
  | 'local-versus'
  | 'start-gameplay'
  | 'pause'
  | 'resume'
  | 'restart'
  | 'replay'
  | 'change-mode'
  | 'main-menu'

export interface ShellTransitionError {
  code: 'invalid-transition' | 'invalid-mode'
  action: ShellAction['type']
  screen: ShellScreen
}

export interface ShellTransitionResult {
  state: ShellState
  error?: ShellTransitionError
}

export function createInitialShellState(selectedMode: MatchMode = 'classic-single'): ShellState {
  return {
    screen: 'main-menu',
    selectedMode,
  }
}

export function reduceShellState(state: ShellState, action: ShellAction): ShellTransitionResult {
  if (action.type === 'selectMode' && !isPlayerFacingMode(action.mode)) {
    return invalid(state, action.type, 'invalid-mode')
  }

  switch (action.type) {
    case 'bootReady':
      return { state: state.screen === 'splash' ? { ...state, screen: 'main-menu' } : state }
    case 'play':
      return { state: { ...state, screen: 'mode-select' } }
    case 'selectMode':
      return state.screen === 'mode-select'
        ? { state: { ...state, selectedMode: action.mode } }
        : invalid(state, action.type, 'invalid-transition')
    case 'openSettings':
      return { state: { ...state, screen: 'settings' } }
    case 'openHighScores':
      return { state: { ...state, screen: 'high-scores' } }
    case 'startGameplay':
      return state.screen === 'main-menu' || state.screen === 'mode-select' || state.screen === 'results' || state.screen === 'pause'
        ? { state: { ...state, screen: 'gameplay' } }
        : invalid(state, action.type, 'invalid-transition')
    case 'pause':
      return state.screen === 'gameplay' ? { state: { ...state, screen: 'pause' } } : invalid(state, action.type, 'invalid-transition')
    case 'resume':
      return state.screen === 'pause' ? { state: { ...state, screen: 'gameplay' } } : invalid(state, action.type, 'invalid-transition')
    case 'showResults':
      return state.screen === 'main-menu' || state.screen === 'gameplay' || state.screen === 'pause'
        ? { state: { ...state, screen: 'results' } }
        : invalid(state, action.type, 'invalid-transition')
    case 'replay':
      return state.screen === 'results' ? { state: { ...state, screen: 'gameplay' } } : invalid(state, action.type, 'invalid-transition')
    case 'changeMode':
      return state.screen === 'results' || state.screen === 'pause'
        ? { state: { ...state, screen: 'mode-select' } }
        : invalid(state, action.type, 'invalid-transition')
    case 'mainMenu':
      return { state: { ...state, screen: 'main-menu' } }
  }
}

export function getVisibleShellControls(state: ShellState): ShellControl[] {
  switch (state.screen) {
    case 'splash':
    case 'main-menu':
      return ['play', 'settings', 'high-scores']
    case 'mode-select':
      return ['classic-single', 'local-versus', 'main-menu']
    case 'settings':
    case 'high-scores':
      return ['main-menu']
    case 'gameplay':
      return ['pause']
    case 'pause':
      return ['resume', 'restart', 'settings', 'main-menu']
    case 'results':
      return ['replay', 'change-mode', 'main-menu']
  }
}

function isPlayerFacingMode(mode: MatchMode): mode is MatchMode {
  return mode === 'classic-single' || mode === 'local-versus'
}

function invalid(state: ShellState, action: ShellAction['type'], code: ShellTransitionError['code']): ShellTransitionResult {
  return {
    state,
    error: {
      code,
      action,
      screen: state.screen,
    },
  }
}
