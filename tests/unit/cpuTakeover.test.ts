import { describe, expect, it } from 'vitest'
import { AI_TAKEOVER_SECONDS } from '../../src/game/constants'
import { createGame } from '../../src/game/createGame'
import { insertEntity } from '../../src/game/entities'
import { updateGame } from '../../src/game/update'

const STEP_SECONDS = 1 / 60

function startGame(seed = 505) {
  const game = createGame({ seed, mode: 'classic-single' })
  game.commands.start = true
  updateGame(game, STEP_SECONDS)
  return game
}

function advanceFrames(game: ReturnType<typeof createGame>, frames: number): void {
  for (let frame = 0; frame < frames; frame += 1) {
    updateGame(game, STEP_SECONDS)
  }
}

describe('CPU opponent and AI takeover', () => {
  it('lets the classic CPU opponent take a deterministic catch and clears its transient commands', () => {
    const game = startGame()
    const [p1, p2] = game.players

    p1.state.x = 120
    p1.state.y = 500
    p2.state.x = 680
    p2.state.y = 500
    insertEntity(game, { id: 31, kind: 'fly', x: 680, y: 500, vx: 0, vy: 0, radius: 8 })

    updateGame(game, STEP_SECONDS)

    expect(p2.controlSource).toBe('cpu-opponent')
    expect(p2.score).toBe(game.constants.baseFlyScore)
    expect(p2.stats).toEqual({
      score: game.constants.baseFlyScore,
      combo: 1,
      catches: 1,
      misses: 0,
      attempts: 1,
    })
    expect(p2.commands).toEqual({})
    expect(p1.score).toBe(0)
    expect(game.score).toBe(0)
    expect(game.entities[31]).toBeUndefined()
  })

  it('keeps the classic CPU active when P1 has held legacy input without an immediate catch opportunity', () => {
    const game = startGame()
    const [p1, p2] = game.players

    p1.state.x = 120
    p1.state.y = 500
    p2.state.x = 680
    p2.state.y = 500
    game.commands.chargeJump = true
    insertEntity(game, { id: 32, kind: 'fly', x: 680, y: 500, vx: 0, vy: 0, radius: 8 })

    updateGame(game, STEP_SECONDS)

    expect(p2.controlSource).toBe('cpu-opponent')
    expect(p2.score).toBe(game.constants.baseFlyScore)
    expect(p1.score).toBe(0)
    expect(game.score).toBe(0)
    expect(game.entities[32]).toBeUndefined()
  })

  it('switches idle humans to AI takeover, then restores human control from a valid input marker', () => {
    const game = startGame()
    const [p1, p2] = game.players

    p1.state.x = 400
    p1.state.y = 500
    p2.state.x = 720
    p2.state.y = 500
    p1.lastHumanInputElapsedSeconds = 0
    game.elapsedSeconds = AI_TAKEOVER_SECONDS
    insertEntity(game, { id: 41, kind: 'fly', x: 400, y: 500, vx: 0, vy: 0, radius: 8 })

    updateGame(game, STEP_SECONDS)

    expect(p1.controlSource).toBe('ai-takeover')
    expect(p1.score).toBe(game.constants.baseFlyScore)
    expect(game.score).toBe(p1.score)
    expect(game.entities[41]).toBeUndefined()
    expect(p1.commands).toEqual({})
    expect(p1.lastHumanInputElapsedSeconds).toBe(0)

    const elapsedBeforeHumanInput = game.elapsedSeconds
    insertEntity(game, { id: 42, kind: 'fly', x: 400, y: 500, vx: 0, vy: 0, radius: 8 })
    p1.commands.humanInput = true

    updateGame(game, STEP_SECONDS)

    expect(p1.controlSource).toBe('human')
    expect(p1.lastHumanInputElapsedSeconds).toBe(elapsedBeforeHumanInput)
    expect(p1.score).toBe(game.constants.baseFlyScore)
    expect(game.entities[42]).toBeDefined()
    expect(p1.commands).toEqual({})
  })

  it('restores AI takeover from legacy top-level primary input', () => {
    const game = startGame()
    const [p1] = game.players

    p1.lastHumanInputElapsedSeconds = 0
    game.elapsedSeconds = AI_TAKEOVER_SECONDS

    updateGame(game, STEP_SECONDS)

    expect(p1.controlSource).toBe('ai-takeover')

    const elapsedBeforeHumanInput = game.elapsedSeconds
    game.commands.moveLeft = true

    updateGame(game, STEP_SECONDS)

    expect(p1.controlSource).toBe('human')
    expect(p1.lastHumanInputElapsedSeconds).toBe(elapsedBeforeHumanInput)
  })

  it('restores AI takeover from a normal per-player primary command', () => {
    const game = startGame()
    const [p1] = game.players

    p1.lastHumanInputElapsedSeconds = 0
    game.elapsedSeconds = AI_TAKEOVER_SECONDS

    updateGame(game, STEP_SECONDS)

    expect(p1.controlSource).toBe('ai-takeover')

    const elapsedBeforeHumanInput = game.elapsedSeconds
    p1.commands.moveLeft = true

    updateGame(game, STEP_SECONDS)

    expect(p1.controlSource).toBe('human')
    expect(p1.lastHumanInputElapsedSeconds).toBe(elapsedBeforeHumanInput)
  })

  it('keeps legacy P1 tongue scoring available while P1 holds a jump charge', () => {
    const game = createGame({ seed: 1, mode: 'classic-single' })
    const [p1, p2] = game.players

    game.commands.start = true
    updateGame(game, 0)
    advanceFrames(game, Math.floor(4.8 / STEP_SECONDS))

    game.commands.chargeJump = true
    updateGame(game, STEP_SECONDS)

    expect(p1.controlSource).toBe('human')
    expect(p1.state.jump.phase).toBe('charging')
    expect(game.score).toBe(0)
    expect(p2.score).toBe(0)

    game.commands.chargeJump = true
    game.commands.tongue = true
    updateGame(game, STEP_SECONDS)

    expect(p1.score).toBe(game.constants.baseFlyScore)
    expect(game.score).toBe(game.constants.baseFlyScore)
    expect(p2.score).toBe(0)
  })
})
