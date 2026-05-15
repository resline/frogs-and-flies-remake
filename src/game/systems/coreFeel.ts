import type { GameCommands, GameState, PlayerState, WaterState } from '../types'

const MAX_CHARGE_SECONDS = 0.45
const BASE_JUMP_VELOCITY_Y = -560
const CHARGE_JUMP_VELOCITY_Y = -240
const JUMP_GRAVITY = 900
const LANDED_SECONDS = 0.2
const SPLASH_SECONDS = 0.3
const WATER_RECOVERY_SECONDS = 0.35
const TONGUE_RECOVERY_SECONDS = 0.18
const EPSILON_SECONDS = 0.000001

type RuntimeTongueState = PlayerState['tongue'] & {
  recoverySeconds?: number
}

export function updateCoreFeel(game: GameState, deltaSeconds: number): void {
  const player = game.players[0]?.state ?? game.player
  const water = game.players[0]?.water ?? game.water
  const commands = mergePrimaryCommands(game)

  updateJump(commands, player, water, deltaSeconds)
  updateWater(water, deltaSeconds)
  for (const matchPlayer of game.players) {
    updateTongue(matchPlayer.state, deltaSeconds)
  }

  game.player = player
  game.water = water
}

function updateJump(commands: GameCommands, player: PlayerState, water: WaterState, deltaSeconds: number): void {
  const { jump } = player

  if (jump.phase === 'charging') {
    if (commands.releaseJump) {
      startJump(player)
      advanceJump(player, water, deltaSeconds)
      return
    }

    if (commands.chargeJump) {
      jump.chargeSeconds = Math.min(MAX_CHARGE_SECONDS, jump.chargeSeconds + deltaSeconds)
    }
    return
  }

  if (jump.phase === 'idle') {
    player.y = player.groundY
    jump.airborne = false
    jump.velocityY = 0
    jump.flightSeconds = 0
    jump.landedSeconds = 0

    if (commands.chargeJump) {
      jump.phase = 'charging'
      jump.chargeSeconds = Math.min(MAX_CHARGE_SECONDS, deltaSeconds)
    }
    return
  }

  if (jump.phase === 'jumping') {
    advanceJump(player, water, deltaSeconds)
    return
  }

  jump.landedSeconds += deltaSeconds
  if (jump.landedSeconds + EPSILON_SECONDS >= LANDED_SECONDS) {
    jump.phase = 'idle'
    jump.chargeSeconds = 0
    jump.landedSeconds = 0
  }
}

function startJump(player: PlayerState): void {
  const { jump } = player
  jump.phase = 'jumping'
  jump.airborne = true
  jump.velocityY = BASE_JUMP_VELOCITY_Y + CHARGE_JUMP_VELOCITY_Y * Math.min(jump.chargeSeconds, MAX_CHARGE_SECONDS)
  jump.flightSeconds = 0
  jump.landedSeconds = 0
}

function advanceJump(player: PlayerState, water: WaterState, deltaSeconds: number): void {
  const { jump } = player
  jump.flightSeconds += deltaSeconds

  const flightY = jump.velocityY * jump.flightSeconds + 0.5 * JUMP_GRAVITY * jump.flightSeconds * jump.flightSeconds
  player.y = player.groundY + flightY

  if (player.y >= player.groundY) {
    player.y = player.groundY
    jump.phase = 'landed'
    jump.airborne = false
    jump.velocityY = 0
    jump.flightSeconds = 0
    jump.landedSeconds = 0
    startWaterSplash(water)
  }
}

function startWaterSplash(water: WaterState): void {
  water.phase = 'splash'
  water.splashSeconds = 0
  water.recoverySeconds = 0
}

function updateWater(water: WaterState, deltaSeconds: number): void {
  if (water.phase === 'splash') {
    water.splashSeconds += deltaSeconds
    if (water.splashSeconds + EPSILON_SECONDS >= SPLASH_SECONDS) {
      water.phase = 'recovery'
      water.recoverySeconds = 0
    }
    return
  }

  if (water.phase === 'recovery') {
    water.recoverySeconds += deltaSeconds
    if (water.recoverySeconds + EPSILON_SECONDS >= WATER_RECOVERY_SECONDS) {
      water.phase = 'calm'
      water.splashSeconds = 0
      water.recoverySeconds = 0
    }
  }
}

function updateTongue(player: PlayerState, deltaSeconds: number): void {
  const tongue = player.tongue as RuntimeTongueState

  if (tongue.phase !== 'recovering') {
    return
  }

  tongue.recoverySeconds = (tongue.recoverySeconds ?? 0) + deltaSeconds
  if (tongue.recoverySeconds + EPSILON_SECONDS < TONGUE_RECOVERY_SECONDS) {
    return
  }

  tongue.phase = 'ready'
  delete tongue.result
  delete tongue.recoverySeconds
}

function mergePrimaryCommands(game: GameState): GameCommands {
  const playerCommands = game.players[0]?.commands ?? {}
  return {
    ...playerCommands,
    chargeJump: Boolean(game.commands.chargeJump || playerCommands.chargeJump),
    releaseJump: Boolean(game.commands.releaseJump || playerCommands.releaseJump),
  }
}
