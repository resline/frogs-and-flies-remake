import { BASE_CATCH_RADIUS } from './constants'
import { facingForPlayer, homeLilyForPlayer } from './arena'
import type {
  ActivePower,
  GameCommands,
  MatchPlayerState,
  PlayerControlSource,
  PlayerId,
  PlayerState,
  PlayerStats,
  WaterState,
} from './types'

export function createPlayer(id: PlayerId, label: string, controlSource: PlayerControlSource): MatchPlayerState {
  const stats = createPlayerStats()

  return {
    id,
    label,
    controlSource,
    score: stats.score,
    stats,
    commands: createPlayerCommands(),
    lastHumanInputElapsedSeconds: 0,
    state: createPlayerState(id),
    water: createWaterState(),
    power: createActivePower(),
    catchRadius: BASE_CATCH_RADIUS,
  }
}

export function createPlayerStats(): PlayerStats {
  return {
    score: 0,
    combo: 0,
    catches: 0,
    misses: 0,
    attempts: 0,
  }
}

export function createPlayerCommands(): GameCommands {
  return {}
}

export function createPlayerState(id: PlayerId = 'p1'): PlayerState {
  const homeLily = homeLilyForPlayer(id)

  return {
    x: homeLily.x,
    y: homeLily.y,
    homeX: homeLily.x,
    homeY: homeLily.y,
    homeLilyId: homeLily.id,
    facing: facingForPlayer(id),
    phase: 'staged',
    groundY: homeLily.y,
    landingRadius: homeLily.landingRadius,
    radius: 28,
    speed: 320,
    jump: {
      phase: 'idle',
      chargeSeconds: 0,
      airborne: false,
      velocityY: 0,
      flightSeconds: 0,
      landedSeconds: 0,
      intentX: 0,
      arcDirection: 0,
      startX: homeLily.x,
      startY: homeLily.y,
      targetX: homeLily.x,
      targetY: homeLily.y,
      durationSeconds: 0,
      travelX: 0,
      arcHeight: 0,
    },
    tongue: {
      phase: 'ready',
    },
  }
}

export function createWaterState(): WaterState {
  return {
    phase: 'calm',
    splashSeconds: 0,
    recoverySeconds: 0,
  }
}

export function createActivePower(): ActivePower {
  return {
    remainingSeconds: 0,
  }
}
