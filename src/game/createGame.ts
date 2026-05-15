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
import { createPlayers } from './match'
import { createActivePower, createPlayerState, createWaterState } from './player'
import { createPrng } from './prng'
import type { GameState, MatchMode } from './types'

export interface CreateGameOptions {
  seed: number
  mode?: MatchMode
  durationSeconds?: number
  theEndSeconds?: number
}

export function createGame(options: CreateGameOptions): GameState {
  const mode = options.mode ?? 'classic-single'
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
    mode,
    phase: 'start',
    timeOfDay: 'day',
    commands: {},
    elapsedSeconds: 0,
    durationSeconds,
    remainingSeconds: durationSeconds,
    theEndSeconds,
    theEndElapsedSeconds: 0,
    players: createPlayers(mode),
    player: createPlayerState(),
    entities: {},
    entityIds: [],
    nextEntityId: 1,
    spawn: {
      flySeconds: 0,
      powerSeconds: 0,
    },
    score: 0,
    combo: 0,
    power: createActivePower(),
    catchRadius: BASE_CATCH_RADIUS,
    water: createWaterState(),
  }
}
