import { describe, expect, it } from 'vitest'
import {
  createInitialShellState,
  getVisibleShellControls,
  reduceShellState,
  type ShellAction,
  type ShellState,
} from '../../src/runtime/shell'

describe('M2.6 runtime shell state', () => {
  it('boots into the player-facing shell before gameplay', () => {
    const state = createInitialShellState()

    expect(['splash', 'main-menu']).toContain(state.screen)
    expect(getVisibleShellControls(state)).toEqual(expect.arrayContaining(['play', 'settings', 'high-scores']))
  })

  it('moves from play to the two supported player-facing mode selections', () => {
    const modeSelect = reduceShellState(createInitialShellState(), { type: 'play' })

    expect(modeSelect.state.screen).toBe('mode-select')
    expect(getVisibleShellControls(modeSelect.state)).toEqual(['classic-single', 'local-versus', 'main-menu'])

    const classicSingle = reduceShellState(modeSelect.state, { type: 'selectMode', mode: 'classic-single' })
    const localVersus = reduceShellState(modeSelect.state, { type: 'selectMode', mode: 'local-versus' })

    expect(classicSingle.state).toMatchObject({ screen: 'mode-select', selectedMode: 'classic-single' })
    expect(localVersus.state).toMatchObject({ screen: 'mode-select', selectedMode: 'local-versus' })
  })

  it('allows menu, settings, high-score, gameplay, pause, results, replay, and menu transitions', () => {
    let state = createInitialShellState()

    state = apply(state, { type: 'openSettings' })
    expect(state.screen).toBe('settings')

    state = apply(state, { type: 'mainMenu' })
    state = apply(state, { type: 'openHighScores' })
    expect(state.screen).toBe('high-scores')

    state = apply(state, { type: 'play' })
    state = apply(state, { type: 'selectMode', mode: 'local-versus' })
    state = apply(state, { type: 'startGameplay' })
    expect(state).toMatchObject({ screen: 'gameplay', selectedMode: 'local-versus' })

    state = apply(state, { type: 'pause' })
    expect(state.screen).toBe('pause')

    state = apply(state, { type: 'resume' })
    expect(state.screen).toBe('gameplay')

    state = apply(state, { type: 'showResults' })
    expect(state.screen).toBe('results')

    state = apply(state, { type: 'replay' })
    expect(state).toMatchObject({ screen: 'gameplay', selectedMode: 'local-versus' })

    state = apply(state, { type: 'mainMenu' })
    expect(state.screen).toBe('main-menu')
  })

  it('allows compatibility start and forced-results transitions from the main menu', () => {
    const state = createInitialShellState()

    expect(apply(state, { type: 'startGameplay' }).screen).toBe('gameplay')
    expect(apply(state, { type: 'showResults' }).screen).toBe('results')
  })

  it('returns unchanged state and a typed error for invalid transitions', () => {
    const state = createInitialShellState()

    const paused = reduceShellState(state, { type: 'pause' })
    expect(paused.state).toEqual(state)
    expect(paused.error).toEqual({ code: 'invalid-transition', action: 'pause', screen: state.screen })

    const unsupportedMode = reduceShellState(state, { type: 'selectMode', mode: 'campaign' as never })
    expect(unsupportedMode.state).toEqual(state)
    expect(unsupportedMode.error).toEqual({ code: 'invalid-mode', action: 'selectMode', screen: state.screen })
  })
})

function apply(state: ShellState, action: ShellAction): ShellState {
  const result = reduceShellState(state, action)
  expect(result.error).toBeUndefined()
  return result.state
}
