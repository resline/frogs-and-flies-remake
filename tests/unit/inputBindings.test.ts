import { describe, expect, it } from 'vitest'
import {
  DEFAULT_INPUT_PROFILE,
  createDefaultInputProfiles,
  type InputActionId,
} from '../../src/runtime/inputBindings'

const EXPECTED_ACTION_IDS: InputActionId[] = [
  'p1.moveLeft',
  'p1.moveRight',
  'p1.chargeJump',
  'p1.releaseJump',
  'p1.tongue',
  'p2.moveLeft',
  'p2.moveRight',
  'p2.chargeJump',
  'p2.releaseJump',
  'p2.tongue',
  'ui.start',
  'ui.pause',
  'ui.confirm',
  'ui.back',
]

function keyboardCodesFor(action: InputActionId): string[] {
  return DEFAULT_INPUT_PROFILE.bindings
    .filter((binding) => binding.action === action && binding.device === 'keyboard')
    .map((binding) => binding.code)
    .sort()
}

describe('input binding registry', () => {
  it('defines the M2.6 gameplay and UI action ids', () => {
    expect(DEFAULT_INPUT_PROFILE.bindings.map((binding) => binding.action)).toEqual(expect.arrayContaining(EXPECTED_ACTION_IDS))
  })

  it('preserves default keyboard bindings for both players and UI actions', () => {
    expect(keyboardCodesFor('p1.moveLeft')).toEqual(['ArrowLeft', 'KeyA'])
    expect(keyboardCodesFor('p1.moveRight')).toEqual(['ArrowRight', 'KeyD'])
    expect(keyboardCodesFor('p1.chargeJump')).toEqual(['Space'])
    expect(keyboardCodesFor('p1.releaseJump')).toEqual(['Space'])
    expect(keyboardCodesFor('p1.tongue')).toEqual(['KeyT'])

    expect(keyboardCodesFor('p2.moveLeft')).toEqual(['KeyJ'])
    expect(keyboardCodesFor('p2.moveRight')).toEqual(['KeyL'])
    expect(keyboardCodesFor('p2.chargeJump')).toEqual(['KeyI'])
    expect(keyboardCodesFor('p2.releaseJump')).toEqual(['KeyI'])
    expect(keyboardCodesFor('p2.tongue')).toEqual(['KeyO'])

    expect(keyboardCodesFor('ui.start')).toEqual(['Enter'])
    expect(keyboardCodesFor('ui.confirm')).toEqual(['Enter'])
    expect(keyboardCodesFor('ui.pause')).toEqual(['KeyP'])
  })

  it('returns independent default profile copies', () => {
    const [first] = createDefaultInputProfiles()
    const [second] = createDefaultInputProfiles()

    first.bindings[0].code = 'KeyZ'

    expect(second.bindings[0].code).not.toBe('KeyZ')
    expect(DEFAULT_INPUT_PROFILE.bindings[0].code).not.toBe('KeyZ')
  })
})
