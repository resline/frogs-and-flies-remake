import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  BASE_CATCH_RADIUS,
  BASE_FLY_SCORE,
  COMBO_BONUS_SCORE,
  FLY_SPAWN_SECONDS,
  POWER_SPAWN_SECONDS,
  ROUND_DURATION_SECONDS,
  RUSH_CATCH_RADIUS,
  RUSH_SECONDS,
  THE_END_SECONDS,
} from './constants'
import { createPrng } from './prng'
import type { GameState } from './types'

export interface CreateGameOptions {
  seed: number
  durationSeconds?: number
  theEndSeconds?: number
}

export function createGame(options: CreateGameOptions): GameState {
  const durationSeconds = options.durationSeconds ?? ROUND_DURATION_SECONDS
  const theEndSeconds = options.theEndSeconds ?? THE_END_SECONDS

  return {
    seed: options.seed,
    prng: createPrng(options.seed),
    constants: {
      roundDurationSeconds: durationSeconds,
      theEndSeconds,
      arenaWidth: ARENA_WIDTH,
      arenaHeight: ARENA_HEIGHT,
      baseCatchRadius: BASE_CATCH_RADIUS,
      rushCatchRadius: RUSH_CATCH_RADIUS,
      rushSeconds: RUSH_SECONDS,
      baseFlyScore: BASE_FLY_SCORE,
      comboBonusScore: COMBO_BONUS_SCORE,
      flySpawnSeconds: FLY_SPAWN_SECONDS,
      powerSpawnSeconds: POWER_SPAWN_SECONDS,
    },
    phase: 'start',
    timeOfDay: 'day',
    commands: {},
    durationSeconds,
    remainingSeconds: durationSeconds,
    theEndSeconds,
    theEndElapsedSeconds: 0,
    player: {
      x: ARENA_WIDTH / 2,
      y: ARENA_HEIGHT - 100,
      groundY: ARENA_HEIGHT - 100,
      radius: 28,
      speed: 320,
      jump: {
        phase: 'idle',
        chargeSeconds: 0,
        airborne: false,
        velocityY: 0,
        flightSeconds: 0,
        landedSeconds: 0,
      },
      tongue: {
        phase: 'ready',
      },
    },
    entities: {},
    entityIds: [],
    nextEntityId: 1,
    spawn: {
      flySeconds: 0,
      powerSeconds: 0,
    },
    score: 0,
    combo: 0,
    power: {
      remainingSeconds: 0,
    },
    catchRadius: BASE_CATCH_RADIUS,
    water: {
      phase: 'calm',
      splashSeconds: 0,
      recoverySeconds: 0,
    },
  }
}
