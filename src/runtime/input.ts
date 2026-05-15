import type { GameCommands, GameState, MatchMode } from '../game/types'

export type RuntimeInputAction =
  | { type: 'start' }
  | { type: 'pause-toggle' }
  | { type: 'mode'; mode: MatchMode }

export type RuntimeInputState = {
  heldKeys: Set<string>
  pendingP1JumpRelease: boolean
  pendingP2JumpRelease: boolean
  pendingP1Fire: boolean
  pendingP1Tongue: boolean
  pendingP2Tongue: boolean
}

const RUNTIME_COMMAND_KEYS = ['moveLeft', 'moveRight', 'chargeJump', 'releaseJump', 'tongue', 'fire', 'humanInput'] as const

export function createRuntimeInputState(): RuntimeInputState {
  return {
    heldKeys: new Set(),
    pendingP1JumpRelease: false,
    pendingP2JumpRelease: false,
    pendingP1Fire: false,
    pendingP1Tongue: false,
    pendingP2Tongue: false,
  }
}

export function handleRuntimeKeyDown(input: RuntimeInputState, code: string): RuntimeInputAction | undefined {
  input.heldKeys.add(code)

  if (code === 'KeyT') {
    input.pendingP1Tongue = true
  }
  if (code === 'KeyO') {
    input.pendingP2Tongue = true
  }

  if (code === 'Enter') {
    return { type: 'start' }
  }
  if (code === 'KeyP') {
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

  if (code === 'Space' && wasHeld) {
    input.pendingP1JumpRelease = true
  }
  if (code === 'KeyI' && wasHeld) {
    input.pendingP2JumpRelease = true
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
    moveLeft: input.heldKeys.has('ArrowLeft') || input.heldKeys.has('KeyA'),
    moveRight: input.heldKeys.has('ArrowRight') || input.heldKeys.has('KeyD'),
    chargeJump: input.heldKeys.has('Space'),
    releaseJump: input.pendingP1JumpRelease,
    fire: input.pendingP1Fire,
    tongue: input.pendingP1Tongue,
  }
  const p2 = {
    moveLeft: input.heldKeys.has('KeyJ'),
    moveRight: input.heldKeys.has('KeyL'),
    chargeJump: input.heldKeys.has('KeyI'),
    releaseJump: input.pendingP2JumpRelease,
    tongue: input.pendingP2Tongue,
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
}

export function applyRuntimePointerInput(game: GameState, input: RuntimeInputState, pointerX: number): void {
  const p1Commands = game.players[0]?.commands
  const x = clamp(pointerX, game.player.radius, game.constants.arenaWidth - game.player.radius)

  input.pendingP1Fire = true
  input.pendingP1Tongue = true

  game.player.x = x
  if (game.players[0]) {
    game.players[0].state.x = x
  }

  writeCommands(game.commands, {
    fire: true,
    tongue: true,
    humanInput: true,
  })
  if (p1Commands) {
    writeCommands(p1Commands, {
      fire: true,
      tongue: true,
      humanInput: true,
    })
  }
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
