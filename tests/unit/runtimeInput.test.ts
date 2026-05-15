import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/game/createGame'
import { updateGame } from '../../src/game/update'

type RuntimeInputModule = {
  createRuntimeInputState?: () => RuntimeInputState
  handleRuntimeKeyDown?: (input: RuntimeInputState, code: string) => RuntimeInputAction | undefined
  handleRuntimeKeyUp?: (input: RuntimeInputState, code: string) => void
  applyRuntimeInput?: (game: ReturnType<typeof createGame>, input: RuntimeInputState) => void
  applyRuntimePointerInput?: (game: ReturnType<typeof createGame>, input: RuntimeInputState, pointerX: number) => void
}

type RuntimeInputState = {
  heldKeys: Set<string>
}

type RuntimeInputAction =
  | { type: 'start' | 'pause-toggle' }
  | { type: 'mode'; mode: 'classic-single' | 'local-versus' }

const STEP_SECONDS = 1 / 60

async function loadRuntimeInput(): Promise<Required<RuntimeInputModule>> {
  const module = (await import('../../src/runtime/input').catch(() => ({}))) as RuntimeInputModule

  expect(module.createRuntimeInputState).toEqual(expect.any(Function))
  expect(module.handleRuntimeKeyDown).toEqual(expect.any(Function))
  expect(module.handleRuntimeKeyUp).toEqual(expect.any(Function))
  expect(module.applyRuntimeInput).toEqual(expect.any(Function))
  expect(module.applyRuntimePointerInput).toEqual(expect.any(Function))

  return module as Required<RuntimeInputModule>
}

function startGame(mode: 'classic-single' | 'local-versus' = 'local-versus') {
  const game = createGame({ mode })
  game.commands.start = true
  updateGame(game, STEP_SECONDS)
  return game
}

describe('runtime input mapper', () => {
  it('maps non-overlapping keyboard controls to P1 and P2 command bags', async () => {
    const { createRuntimeInputState, handleRuntimeKeyDown, applyRuntimeInput } = await loadRuntimeInput()
    const input = createRuntimeInputState()
    const game = startGame('local-versus')

    handleRuntimeKeyDown(input, 'KeyA')
    handleRuntimeKeyDown(input, 'Space')
    handleRuntimeKeyDown(input, 'KeyT')
    handleRuntimeKeyDown(input, 'KeyL')
    handleRuntimeKeyDown(input, 'KeyI')
    handleRuntimeKeyDown(input, 'KeyO')
    applyRuntimeInput(game, input)

    expect(game.commands).toMatchObject({
      moveLeft: true,
      chargeJump: true,
      tongue: true,
      humanInput: true,
    })
    expect(game.players[0].commands).toMatchObject({
      moveLeft: true,
      chargeJump: true,
      tongue: true,
      humanInput: true,
    })
    expect(game.players[1].commands).toMatchObject({
      moveRight: true,
      chargeJump: true,
      tongue: true,
      humanInput: true,
    })
    expect(game.players[1].commands.moveLeft).toBeUndefined()
  })

  it('keeps Space as P1 jump and KeyT as P1 tongue for M1 classic behavior', async () => {
    const { createRuntimeInputState, handleRuntimeKeyDown, applyRuntimeInput } = await loadRuntimeInput()
    const input = createRuntimeInputState()
    const game = startGame('classic-single')

    handleRuntimeKeyDown(input, 'Space')
    applyRuntimeInput(game, input)
    updateGame(game, STEP_SECONDS)

    expect(game.players[0].state.jump.phase).toBe('charging')
    expect(game.players[0].state.tongue.phase).toBe('ready')

    handleRuntimeKeyDown(input, 'KeyT')
    applyRuntimeInput(game, input)

    expect(game.commands.tongue).toBe(true)
    expect(game.players[0].commands.tongue).toBe(true)
    expect(game.commands.chargeJump).toBe(true)
    expect(game.players[0].commands.chargeJump).toBe(true)
  })

  it('maps P2 local-versus keys to player two without writing legacy P1 commands', async () => {
    const { createRuntimeInputState, handleRuntimeKeyDown, applyRuntimeInput } = await loadRuntimeInput()
    const input = createRuntimeInputState()
    const game = startGame('local-versus')

    handleRuntimeKeyDown(input, 'KeyJ')
    handleRuntimeKeyDown(input, 'KeyO')
    applyRuntimeInput(game, input)

    expect(game.commands.moveLeft).toBeUndefined()
    expect(game.commands.tongue).toBeUndefined()
    expect(game.commands.humanInput).toBeUndefined()
    expect(game.players[0].commands).toEqual({})
    expect(game.players[1].commands).toMatchObject({
      moveLeft: true,
      tongue: true,
      humanInput: true,
    })
  })

  it('ignores P2 local-versus keys in classic single so the CPU opponent stays autonomous', async () => {
    const { createRuntimeInputState, handleRuntimeKeyDown, applyRuntimeInput } = await loadRuntimeInput()
    const input = createRuntimeInputState()
    const game = startGame('classic-single')

    handleRuntimeKeyDown(input, 'KeyJ')
    handleRuntimeKeyDown(input, 'KeyL')
    handleRuntimeKeyDown(input, 'KeyI')
    handleRuntimeKeyDown(input, 'KeyO')
    applyRuntimeInput(game, input)

    expect(game.players[1].commands).toEqual({})

    updateGame(game, STEP_SECONDS)

    expect(game.players[1].controlSource).toBe('cpu-opponent')
  })

  it('maps jump release separately for P1 and P2', async () => {
    const { createRuntimeInputState, handleRuntimeKeyDown, handleRuntimeKeyUp, applyRuntimeInput } = await loadRuntimeInput()
    const input = createRuntimeInputState()
    const game = startGame('local-versus')

    handleRuntimeKeyDown(input, 'Space')
    handleRuntimeKeyDown(input, 'KeyI')
    applyRuntimeInput(game, input)
    handleRuntimeKeyUp(input, 'Space')
    applyRuntimeInput(game, input)

    expect(game.commands.releaseJump).toBe(true)
    expect(game.players[0].commands.releaseJump).toBe(true)
    expect(game.players[1].commands.releaseJump).toBeUndefined()

    handleRuntimeKeyUp(input, 'KeyI')
    applyRuntimeInput(game, input)

    expect(game.players[1].commands.releaseJump).toBe(true)
    expect(game.players[0].commands.releaseJump).toBeUndefined()
  })

  it('maps shared keys and mode shortcuts to runtime actions', async () => {
    const { createRuntimeInputState, handleRuntimeKeyDown } = await loadRuntimeInput()
    const input = createRuntimeInputState()

    expect(handleRuntimeKeyDown(input, 'Enter')).toEqual({ type: 'start' })
    expect(handleRuntimeKeyDown(input, 'KeyP')).toEqual({ type: 'pause-toggle' })
    expect(handleRuntimeKeyDown(input, 'Digit1')).toEqual({ type: 'mode', mode: 'classic-single' })
    expect(handleRuntimeKeyDown(input, 'Digit2')).toEqual({ type: 'mode', mode: 'local-versus' })
  })

  it('maps pointer input to P1 only with legacy top-level compatibility', async () => {
    const { createRuntimeInputState, applyRuntimePointerInput } = await loadRuntimeInput()
    const input = createRuntimeInputState()
    const game = createGame({ mode: 'local-versus' })
    const initialP1X = game.players[0].state.x
    const initialP2X = game.players[1].state.x

    applyRuntimePointerInput(game, input, 160)

    expect(game.player.x).toBe(initialP1X)
    expect(game.players[0].state.x).toBe(initialP1X)
    expect(game.commands).toMatchObject({
      fire: true,
      tongue: true,
      moveRight: true,
      humanInput: true,
    })
    expect(game.players[0].commands).toMatchObject({
      fire: true,
      tongue: true,
      moveRight: true,
      humanInput: true,
    })
    expect(game.players[1].commands).toEqual({})
    expect(game.players[1].state.x).toBe(initialP2X)
  })

  it('keeps pointer catch pending until the next frame input apply', async () => {
    const { createRuntimeInputState, applyRuntimeInput, applyRuntimePointerInput } = await loadRuntimeInput()
    const input = createRuntimeInputState()
    const game = createGame({ mode: 'local-versus' })

    applyRuntimePointerInput(game, input, 160)
    game.commands = {}
    game.players[0].commands = {}

    applyRuntimeInput(game, input)

    expect(game.commands).toMatchObject({
      fire: true,
      tongue: true,
      humanInput: true,
    })
    expect(game.players[0].commands).toMatchObject({
      fire: true,
      tongue: true,
      humanInput: true,
    })
    expect(game.players[1].commands).toEqual({})
  })
})
