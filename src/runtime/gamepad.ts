import type { InputActionId } from './inputBindings'

export interface GamepadInputSnapshot {
  connected: boolean
  activeInputDevice: 'gamepad' | 'none'
  actions: InputActionId[]
}

export interface GamepadPoller {
  poll: () => GamepadInputSnapshot
  destroy: () => void
}

const DEFAULT_DEAD_ZONE = 0.25
const SOUTH_BUTTON = 0
const EAST_BUTTON = 1
const RIGHT_TRIGGER = 7
const START_BUTTON = 9
const DPAD_LEFT = 14
const DPAD_RIGHT = 15

export function mapGamepadToInputActions(gamepad: Gamepad | null | undefined, deadZone = DEFAULT_DEAD_ZONE): InputActionId[] {
  if (!gamepad?.connected) {
    return []
  }

  const actions = new Set<InputActionId>()
  const xAxis = gamepad.axes[0] ?? 0

  if (xAxis < -deadZone || buttonPressed(gamepad, DPAD_LEFT)) {
    actions.add('p1.moveLeft')
  }
  if (xAxis > deadZone || buttonPressed(gamepad, DPAD_RIGHT)) {
    actions.add('p1.moveRight')
  }
  if (buttonPressed(gamepad, SOUTH_BUTTON)) {
    actions.add('p1.chargeJump')
    actions.add('p1.releaseJump')
  }
  if (buttonPressed(gamepad, EAST_BUTTON) || buttonPressed(gamepad, RIGHT_TRIGGER)) {
    actions.add('p1.tongue')
  }
  if (buttonPressed(gamepad, START_BUTTON)) {
    actions.add('ui.pause')
  }

  return [...actions]
}

export function readGamepadInputSnapshot(
  getGamepads: () => readonly (Gamepad | null)[] = defaultGetGamepads,
  deadZone = DEFAULT_DEAD_ZONE,
): GamepadInputSnapshot {
  const gamepads = getGamepads()
  const connected = gamepads.some((gamepad) => Boolean(gamepad?.connected))
  const actions = gamepads.flatMap((gamepad) => mapGamepadToInputActions(gamepad, deadZone))

  return {
    connected,
    activeInputDevice: actions.length > 0 ? 'gamepad' : 'none',
    actions: [...new Set(actions)],
  }
}

export function createGamepadPoller(options: {
  getGamepads?: () => readonly (Gamepad | null)[]
  onSnapshot: (snapshot: GamepadInputSnapshot) => void
  deadZone?: number
}): GamepadPoller {
  let destroyed = false

  return {
    poll(): GamepadInputSnapshot {
      const snapshot = readGamepadInputSnapshot(options.getGamepads, options.deadZone)
      if (!destroyed) {
        options.onSnapshot(snapshot)
      }
      return snapshot
    },
    destroy(): void {
      destroyed = true
    },
  }
}

function buttonPressed(gamepad: Gamepad, index: number): boolean {
  const button = gamepad.buttons[index]
  return Boolean(button?.pressed || (button?.value ?? 0) > 0.5)
}

function defaultGetGamepads(): readonly (Gamepad | null)[] {
  return typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function' ? [] : navigator.getGamepads()
}
