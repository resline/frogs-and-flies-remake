import type { GameCommands, GameState, MatchMode } from '../game/types'
import { DEFAULT_INPUT_PROFILE, type InputActionId, type InputDeviceType, type InputProfile } from './inputBindings'

export type RuntimeInputAction =
  | { type: 'start' }
  | { type: 'pause-toggle' }
  | { type: 'mode'; mode: MatchMode }

export type RuntimeInputState = {
  profile: InputProfile
  heldKeys: Set<string>
  heldActions: Set<InputActionId>
  pendingActions: Set<InputActionId>
  activeInputDevice: InputDeviceType | 'none'
  pendingP1JumpRelease: boolean
  pendingP2JumpRelease: boolean
  pendingP1Fire: boolean
  pendingP1Tongue: boolean
  pendingP2Tongue: boolean
}

const RUNTIME_COMMAND_KEYS = ['moveLeft', 'moveRight', 'chargeJump', 'releaseJump', 'tongue', 'fire', 'humanInput'] as const

export function createRuntimeInputState(profile: InputProfile = DEFAULT_INPUT_PROFILE): RuntimeInputState {
  return {
    profile,
    heldKeys: new Set(),
    heldActions: new Set(),
    pendingActions: new Set(),
    activeInputDevice: 'none',
    pendingP1JumpRelease: false,
    pendingP2JumpRelease: false,
    pendingP1Fire: false,
    pendingP1Tongue: false,
    pendingP2Tongue: false,
  }
}

export function handleRuntimeKeyDown(input: RuntimeInputState, code: string): RuntimeInputAction | undefined {
  input.heldKeys.add(code)
  input.activeInputDevice = 'keyboard'

  const actions = actionsForBinding(input, 'keyboard', code)
  for (const action of actions) {
    if (action.endsWith('.releaseJump')) {
      continue
    }
    input.heldActions.add(action)
    if (action === 'p1.tongue') {
      input.pendingActions.add(action)
      input.pendingP1Tongue = true
    }
    if (action === 'p2.tongue') {
      input.pendingActions.add(action)
      input.pendingP2Tongue = true
    }
  }

  if (actions.includes('ui.start') || actions.includes('ui.confirm')) {
    return { type: 'start' }
  }
  if (actions.includes('ui.pause')) {
    return { type: 'pause-toggle' }
  }
  if (code === 'Digit1') {
    return { type: 'mode', mode: 'classic-single' }
  }
  if (code === 'Digit2') {
    return { type: 'mode', mode: 'local-versus' }
  }

  return undefined
}

export function handleRuntimeKeyUp(input: RuntimeInputState, code: string): void {
  const wasHeld = input.heldKeys.delete(code)
  const actions = actionsForBinding(input, 'keyboard', code)

  for (const action of actions) {
    input.heldActions.delete(action)
    if (action === 'p1.releaseJump' && wasHeld) {
      input.pendingActions.add(action)
      input.pendingP1JumpRelease = true
    }
    if (action === 'p2.releaseJump' && wasHeld) {
      input.pendingActions.add(action)
      input.pendingP2JumpRelease = true
    }
  }
}

export function applyRuntimeInput(game: GameState, input: RuntimeInputState): void {
  const p1Commands = game.players[0]?.commands
  const p2Commands = game.players[1]?.commands

  clearRuntimeCommands(game.commands)
  if (p1Commands) {
    clearRuntimeCommands(p1Commands)
  }
  if (p2Commands) {
    clearRuntimeCommands(p2Commands)
  }

  const p1 = {
    moveLeft: input.heldActions.has('p1.moveLeft'),
    moveRight: input.heldActions.has('p1.moveRight'),
    chargeJump: input.heldActions.has('p1.chargeJump'),
    releaseJump: input.pendingActions.has('p1.releaseJump') || input.pendingP1JumpRelease,
    fire: input.pendingP1Fire,
    tongue: input.pendingActions.has('p1.tongue') || input.pendingP1Tongue,
  }
  const p2 = {
    moveLeft: input.heldActions.has('p2.moveLeft'),
    moveRight: input.heldActions.has('p2.moveRight'),
    chargeJump: input.heldActions.has('p2.chargeJump'),
    releaseJump: input.pendingActions.has('p2.releaseJump') || input.pendingP2JumpRelease,
    tongue: input.pendingActions.has('p2.tongue') || input.pendingP2Tongue,
  }

  writeCommands(game.commands, p1)
  if (p1Commands) {
    writeCommands(p1Commands, p1)
  }
  if (game.mode === 'local-versus' && p2Commands) {
    writeCommands(p2Commands, p2)
  }

  input.pendingP1JumpRelease = false
  input.pendingP2JumpRelease = false
  input.pendingP1Fire = false
  input.pendingP1Tongue = false
  input.pendingP2Tongue = false
  input.pendingActions.clear()
}

export function applyRuntimePointerInput(game: GameState, input: RuntimeInputState, pointerX: number): void {
  const p1Commands = game.players[0]?.commands
  const clampedX = clamp(pointerX, game.player.radius, game.constants.arenaWidth - game.player.radius)
  const pointsRight = clampedX >= game.player.homeX
  const pointerCommands: GameCommands = {
    fire: true,
    tongue: true,
    humanInput: true,
    moveRight: pointsRight,
    moveLeft: !pointsRight,
  }

  input.pendingP1Fire = true
  input.pendingP1Tongue = true
  input.activeInputDevice = 'pointer'

  writeCommands(game.commands, pointerCommands)
  if (p1Commands) {
    writeCommands(p1Commands, pointerCommands)
  }
}

export function addRuntimeInputAction(input: RuntimeInputState, action: InputActionId, held: boolean): void {
  if (held) {
    input.heldActions.add(action)
    if (action === 'p1.tongue' || action === 'p2.tongue') {
      input.pendingActions.add(action)
    }
    return
  }

  input.heldActions.delete(action)
  if (action === 'p1.releaseJump' || action === 'p2.releaseJump' || action === 'p1.tongue' || action === 'p2.tongue') {
    input.pendingActions.add(action)
  }
}

function actionsForBinding(input: RuntimeInputState, device: InputDeviceType, code: string): InputActionId[] {
  return input.profile.bindings
    .filter((binding) => binding.device === device && binding.code === code)
    .map((binding) => binding.action)
}

function clearRuntimeCommands(commands: GameCommands): void {
  for (const key of RUNTIME_COMMAND_KEYS) {
    delete commands[key]
  }
}

function writeCommands(commands: GameCommands, next: GameCommands): void {
  let hasHumanInput = false

  for (const key of RUNTIME_COMMAND_KEYS) {
    if (next[key]) {
      commands[key] = true
      hasHumanInput = key !== 'humanInput' || hasHumanInput
    }
  }

  if (hasHumanInput || next.humanInput) {
    commands.humanInput = true
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
