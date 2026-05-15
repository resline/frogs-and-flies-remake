import { describe, expect, it } from 'vitest'
import { mapGamepadToInputActions } from '../../src/runtime/gamepad'

function gamepad(overrides: Partial<Gamepad> = {}): Gamepad {
  const buttons = Array.from({ length: 16 }, () => ({ pressed: false, touched: false, value: 0 }))

  return {
    axes: [0, 0, 0, 0],
    buttons,
    connected: true,
    hapticActuators: [],
    id: 'test-gamepad',
    index: 0,
    mapping: 'standard',
    timestamp: 1,
    vibrationActuator: null,
    ...overrides,
  } as Gamepad
}

describe('gamepad input mapper', () => {
  it('maps D-pad and left stick to P1 horizontal movement', () => {
    const dpadLeft = gamepad({ buttons: withButtons({ 14: 1 }) })
    const stickRight = gamepad({ axes: [0.75, 0, 0, 0] })

    expect(mapGamepadToInputActions(dpadLeft)).toContain('p1.moveLeft')
    expect(mapGamepadToInputActions(stickRight)).toContain('p1.moveRight')
  })

  it('maps south button to jump charge and release action support', () => {
    const actions = mapGamepadToInputActions(gamepad({ buttons: withButtons({ 0: 1 }) }))

    expect(actions).toContain('p1.chargeJump')
    expect(actions).toContain('p1.releaseJump')
  })

  it('maps east button or right trigger to tongue', () => {
    expect(mapGamepadToInputActions(gamepad({ buttons: withButtons({ 1: 1 }) }))).toContain('p1.tongue')
    expect(mapGamepadToInputActions(gamepad({ buttons: withButtons({ 7: 0.8 }) }))).toContain('p1.tongue')
  })

  it('maps start/menu to pause', () => {
    expect(mapGamepadToInputActions(gamepad({ buttons: withButtons({ 9: 1 }) }))).toContain('ui.pause')
  })

  it('uses a dead zone to prevent stick drift', () => {
    expect(mapGamepadToInputActions(gamepad({ axes: [0.1, 0, 0, 0] }))).not.toContain('p1.moveRight')
    expect(mapGamepadToInputActions(gamepad({ axes: [-0.1, 0, 0, 0] }))).not.toContain('p1.moveLeft')
  })

  it('returns no actions for a disconnected gamepad', () => {
    expect(mapGamepadToInputActions(gamepad({ connected: false, buttons: withButtons({ 0: 1, 9: 1 }) }))).toEqual([])
  })
})

function withButtons(pressed: Record<number, number>): GamepadButton[] {
  return Array.from({ length: 16 }, (_, index) => {
    const value = pressed[index] ?? 0
    return {
      pressed: value > 0,
      touched: value > 0,
      value,
    }
  })
}
