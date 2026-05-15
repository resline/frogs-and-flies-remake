import {
  CLASSIC_JUMP_ARC_HEIGHT,
  CLASSIC_JUMP_ASSIST_FORGIVENESS,
  CLASSIC_JUMP_LANDING_TOLERANCE,
  CLASSIC_JUMP_MAX_CHARGE_SECONDS,
  CLASSIC_JUMP_MAX_DURATION_SECONDS,
  CLASSIC_JUMP_MAX_HORIZONTAL_TRAVEL,
  CLASSIC_JUMP_MIN_DURATION_SECONDS,
  CLASSIC_JUMP_MIN_HORIZONTAL_TRAVEL,
  CLASSIC_JUMP_RECOVERY_SECONDS,
  CLASSIC_JUMP_SPLASH_SECONDS,
  CLASSIC_TONGUE_ACTIVE_SECONDS,
  CLASSIC_TONGUE_RECOVERY_SECONDS,
} from '../constants'
import { syncTongueSegment } from '../tongue'
import type { GameCommands, GameState, JumpArcDirection, MatchPlayerState, PlayerState, WaterState } from '../types'

const EPSILON_SECONDS = 0.000001

export function updateCoreFeel(game: GameState, deltaSeconds: number): void {
  const primaryPlayer = game.players[0]

  for (const [index, matchPlayer] of game.players.entries()) {
    const commands = index === 0 ? mergePrimaryCommands(game) : matchPlayer.commands

    updateJump(commands, matchPlayer.state, matchPlayer.water, deltaSeconds, matchPlayer, game)
    updateWater(matchPlayer, matchPlayer.water, deltaSeconds)
    updateTongue(matchPlayer, game, index === 0, deltaSeconds)
  }

  game.player = primaryPlayer?.state ?? game.player
  game.water = primaryPlayer?.water ?? game.water
}

function updateJump(
  commands: GameCommands,
  player: PlayerState,
  water: WaterState,
  deltaSeconds: number,
  matchPlayer?: GameState['players'][number],
  game?: GameState,
): void {
  const { jump } = player

  if (jump.phase === 'charging') {
    player.phase = 'charging'
    player.x = player.homeX
    player.y = player.homeY
    if (commands.releaseJump) {
      startJump(player)
      game?.audioEvents.push('jump')
      advanceJump(player, water, deltaSeconds, matchPlayer, game)
      return
    }

    if (commands.chargeJump) {
      jump.chargeSeconds = Math.min(CLASSIC_JUMP_MAX_CHARGE_SECONDS, jump.chargeSeconds + deltaSeconds)
    }
    return
  }

  if (jump.phase === 'idle') {
    player.phase = 'staged'
    player.x = player.homeX
    player.y = player.homeY
    jump.airborne = false
    jump.velocityY = 0
    jump.flightSeconds = 0
    jump.landedSeconds = 0
    jump.startX = player.homeX
    jump.startY = player.homeY
    jump.targetX = player.homeX
    jump.targetY = player.homeY
    jump.durationSeconds = 0
    jump.travelX = 0
    jump.arcHeight = 0

    if (commands.chargeJump) {
      jump.phase = 'charging'
      player.phase = 'charging'
      jump.chargeSeconds = Math.min(CLASSIC_JUMP_MAX_CHARGE_SECONDS, deltaSeconds)
      if (jump.arcDirection === 0) {
        jump.arcDirection = facingDirectionSign(player)
      }
    }
    return
  }

  if (jump.phase === 'jumping') {
    advanceJump(player, water, deltaSeconds, matchPlayer, game)
    return
  }

  if (player.phase === 'splashing') {
    return
  }

  if (player.phase === 'recovering') {
    return
  }
}

function startJump(player: PlayerState): void {
  const { jump } = player
  const chargeRatio = clamp01(jump.chargeSeconds / CLASSIC_JUMP_MAX_CHARGE_SECONDS)
  const direction = jump.arcDirection === 0 ? facingDirectionSign(player) : jump.arcDirection
  const travelX = lerp(CLASSIC_JUMP_MIN_HORIZONTAL_TRAVEL, CLASSIC_JUMP_MAX_HORIZONTAL_TRAVEL, chargeRatio)

  player.phase = 'airborne'
  jump.phase = 'jumping'
  jump.airborne = true
  jump.velocityY = -CLASSIC_JUMP_ARC_HEIGHT
  jump.flightSeconds = 0
  jump.landedSeconds = 0
  jump.arcDirection = direction
  jump.startX = player.homeX
  jump.startY = player.homeY
  jump.targetX = player.homeX + travelX * direction
  jump.targetY = player.homeY
  jump.durationSeconds = lerp(CLASSIC_JUMP_MIN_DURATION_SECONDS, CLASSIC_JUMP_MAX_DURATION_SECONDS, chargeRatio)
  jump.travelX = Math.abs(jump.targetX - jump.startX)
  jump.arcHeight = CLASSIC_JUMP_ARC_HEIGHT
}

function advanceJump(
  player: PlayerState,
  water: WaterState,
  deltaSeconds: number,
  matchPlayer?: GameState['players'][number],
  game?: GameState,
): void {
  const { jump } = player
  player.phase = 'airborne'
  jump.flightSeconds += deltaSeconds

  const progress = clamp01(jump.flightSeconds / Math.max(jump.durationSeconds, EPSILON_SECONDS))
  player.x = lerp(jump.startX, jump.targetX, progress)
  player.y = lerp(jump.startY, jump.targetY, progress) - jump.arcHeight * Math.sin(Math.PI * progress)

  if (progress + EPSILON_SECONDS < 1) {
    return
  }

  const landingDistance = Math.abs(player.x - player.homeX)
  if (landingDistance <= CLASSIC_JUMP_LANDING_TOLERANCE + CLASSIC_JUMP_ASSIST_FORGIVENESS) {
    finishStagedLanding(player, water)
    return
  }

  startMissedLanding(player, water, matchPlayer, game)
}

function finishStagedLanding(player: PlayerState, water: WaterState): void {
  const { jump } = player
  player.phase = 'staged'
  player.x = player.homeX
  player.y = player.homeY
  jump.phase = 'idle'
  jump.chargeSeconds = 0
  jump.airborne = false
  jump.velocityY = 0
  jump.flightSeconds = 0
  jump.landedSeconds = 0
  jump.intentX = 0
  jump.arcDirection = 0
  water.phase = 'calm'
  water.splashSeconds = 0
  water.recoverySeconds = 0
}

function startMissedLanding(
  player: PlayerState,
  water: WaterState,
  matchPlayer?: GameState['players'][number],
  game?: GameState,
): void {
  const { jump } = player
  player.phase = 'splashing'
  player.y = player.homeY
  jump.phase = 'landed'
  jump.airborne = false
  jump.velocityY = 0
  jump.flightSeconds = 0
  jump.landedSeconds = 0
  water.phase = 'splash'
  water.splashSeconds = 0
  water.recoverySeconds = 0
  if (matchPlayer) {
    matchPlayer.stats.combo = 0
  }
  if (game) {
    game.combo = 0
    game.audioEvents.push('splash')
  }
}

function updateWater(matchPlayer: GameState['players'][number], water: WaterState, deltaSeconds: number): void {
  if (water.phase === 'splash') {
    water.splashSeconds += deltaSeconds
    matchPlayer.state.phase = 'splashing'
    if (water.splashSeconds + EPSILON_SECONDS >= CLASSIC_JUMP_SPLASH_SECONDS) {
      water.phase = 'recovery'
      water.recoverySeconds = 0
      matchPlayer.state.phase = 'recovering'
    }
    return
  }

  if (water.phase === 'recovery') {
    water.recoverySeconds += deltaSeconds
    matchPlayer.state.phase = 'recovering'
    if (water.recoverySeconds + EPSILON_SECONDS >= CLASSIC_JUMP_RECOVERY_SECONDS) {
      water.phase = 'calm'
      water.splashSeconds = 0
      water.recoverySeconds = 0
      finishStagedLanding(matchPlayer.state, water)
    }
  }
}

function facingDirectionSign(player: PlayerState): JumpArcDirection {
  return player.facing === 'left' ? -1 : 1
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function updateTongue(matchPlayer: MatchPlayerState, game: GameState, isPrimary: boolean, deltaSeconds: number): void {
  const player = matchPlayer.state
  const tongue = player.tongue
  syncTongueSegment(player, matchPlayer.catchRadius)

  if (tongue.phase === 'extended') {
    tongue.activeSeconds += deltaSeconds
    if (tongue.activeSeconds + EPSILON_SECONDS < CLASSIC_TONGUE_ACTIVE_SECONDS) {
      return
    }

    if (!tongue.result) {
      matchPlayer.stats.combo = 0
      matchPlayer.stats.misses += 1
      matchPlayer.stats.score = matchPlayer.score
      if (isPrimary) {
        game.combo = 0
      }
      tongue.result = 'miss'
      game.audioEvents.push('miss')
    }

    tongue.phase = 'recovering'
    tongue.recoverySeconds = 0
    return
  }

  if (tongue.phase !== 'recovering') {
    return
  }

  tongue.recoverySeconds += deltaSeconds
  if (tongue.recoverySeconds + EPSILON_SECONDS < CLASSIC_TONGUE_RECOVERY_SECONDS) {
    return
  }

  tongue.phase = 'ready'
  tongue.activeSeconds = 0
  tongue.recoverySeconds = 0
  delete tongue.result
  delete tongue.autoFired
}

function mergePrimaryCommands(game: GameState): GameCommands {
  const playerCommands = game.players[0]?.commands ?? {}
  return {
    ...playerCommands,
    chargeJump: Boolean(game.commands.chargeJump || playerCommands.chargeJump),
    releaseJump: Boolean(game.commands.releaseJump || playerCommands.releaseJump),
  }
}
