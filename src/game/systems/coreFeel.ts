import type { GameState } from '../types'

const MAX_CHARGE_SECONDS = 0.45
const BASE_JUMP_VELOCITY_Y = -560
const CHARGE_JUMP_VELOCITY_Y = -240
const JUMP_GRAVITY = 900
const LANDED_SECONDS = 0.2
const SPLASH_SECONDS = 0.3
const WATER_RECOVERY_SECONDS = 0.35
const TONGUE_RECOVERY_SECONDS = 0.18
const EPSILON_SECONDS = 0.000001

type RuntimeTongueState = GameState['player']['tongue'] & {
  recoverySeconds?: number
}

export function updateCoreFeel(game: GameState, deltaSeconds: number): void {
  updateJump(game, deltaSeconds)
  updateWater(game, deltaSeconds)
  updateTongue(game, deltaSeconds)
}

function updateJump(game: GameState, deltaSeconds: number): void {
  const { jump } = game.player

  if (jump.phase === 'charging') {
    if (game.commands.releaseJump) {
      startJump(game)
      advanceJump(game, deltaSeconds)
      return
    }

    if (game.commands.chargeJump) {
      jump.chargeSeconds = Math.min(MAX_CHARGE_SECONDS, jump.chargeSeconds + deltaSeconds)
    }
    return
  }

  if (jump.phase === 'idle') {
    game.player.y = game.player.groundY
    jump.airborne = false
    jump.velocityY = 0
    jump.flightSeconds = 0
    jump.landedSeconds = 0

    if (game.commands.chargeJump) {
      jump.phase = 'charging'
      jump.chargeSeconds = Math.min(MAX_CHARGE_SECONDS, deltaSeconds)
    }
    return
  }

  if (jump.phase === 'jumping') {
    advanceJump(game, deltaSeconds)
    return
  }

  jump.landedSeconds += deltaSeconds
  if (jump.landedSeconds + EPSILON_SECONDS >= LANDED_SECONDS) {
    jump.phase = 'idle'
    jump.chargeSeconds = 0
    jump.landedSeconds = 0
  }
}

function startJump(game: GameState): void {
  const { jump } = game.player
  jump.phase = 'jumping'
  jump.airborne = true
  jump.velocityY = BASE_JUMP_VELOCITY_Y + CHARGE_JUMP_VELOCITY_Y * Math.min(jump.chargeSeconds, MAX_CHARGE_SECONDS)
  jump.flightSeconds = 0
  jump.landedSeconds = 0
}

function advanceJump(game: GameState, deltaSeconds: number): void {
  const { jump } = game.player
  jump.flightSeconds += deltaSeconds

  const flightY = jump.velocityY * jump.flightSeconds + 0.5 * JUMP_GRAVITY * jump.flightSeconds * jump.flightSeconds
  game.player.y = game.player.groundY + flightY

  if (game.player.y >= game.player.groundY) {
    game.player.y = game.player.groundY
    jump.phase = 'landed'
    jump.airborne = false
    jump.velocityY = 0
    jump.flightSeconds = 0
    jump.landedSeconds = 0
    startWaterSplash(game)
  }
}

function startWaterSplash(game: GameState): void {
  game.water.phase = 'splash'
  game.water.splashSeconds = 0
  game.water.recoverySeconds = 0
}

function updateWater(game: GameState, deltaSeconds: number): void {
  if (game.water.phase === 'splash') {
    game.water.splashSeconds += deltaSeconds
    if (game.water.splashSeconds + EPSILON_SECONDS >= SPLASH_SECONDS) {
      game.water.phase = 'recovery'
      game.water.recoverySeconds = 0
    }
    return
  }

  if (game.water.phase === 'recovery') {
    game.water.recoverySeconds += deltaSeconds
    if (game.water.recoverySeconds + EPSILON_SECONDS >= WATER_RECOVERY_SECONDS) {
      game.water.phase = 'calm'
      game.water.splashSeconds = 0
      game.water.recoverySeconds = 0
    }
  }
}

function updateTongue(game: GameState, deltaSeconds: number): void {
  const tongue = game.player.tongue as RuntimeTongueState

  if (tongue.phase !== 'recovering') {
    tongue.recoverySeconds = 0
    return
  }

  tongue.recoverySeconds = (tongue.recoverySeconds ?? 0) + deltaSeconds
  if (tongue.recoverySeconds + EPSILON_SECONDS < TONGUE_RECOVERY_SECONDS) {
    return
  }

  tongue.phase = 'ready'
  tongue.result = undefined
  tongue.recoverySeconds = 0
}
