import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  BASE_CATCH_RADIUS,
  BASE_FLY_SCORE,
  COMBO_BONUS_SCORE,
  POWER_SPAWN_SECONDS,
  ROUND_DURATION_SECONDS,
  RUSH_CATCH_RADIUS,
  RUSH_SECONDS,
  THE_END_SECONDS,
} from './constants'
import { getClassicDifficulty } from './difficulty'
import { createPlayers } from './match'
import { createActivePower, createWaterState } from './player'
import { createPrng } from './prng'
import type { ClassicOptions, DifficultyMode, GameState, MatchMode } from './types'

export interface CreateGameOptions {
  seed?: number
  mode?: MatchMode
  durationSeconds?: number
  theEndSeconds?: number
  difficulty?: DifficultyMode
  options?: Pick<ClassicOptions, 'difficulty'>
}

export function createGame(options: CreateGameOptions): GameState {
  const seed = options.seed ?? 0
  const mode = options.mode ?? 'classic-single'
  const durationSeconds = options.durationSeconds ?? ROUND_DURATION_SECONDS
  const theEndSeconds = options.theEndSeconds ?? THE_END_SECONDS
  const classicOptions = getClassicDifficulty(options.options?.difficulty ?? options.difficulty)
  const players = createPlayers(mode)
  const primaryPlayer = players[0]

  return {
    seed,
    prng: createPrng(seed),
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
      flySpawnSeconds: classicOptions.flySpawnSeconds,
      powerSpawnSeconds: POWER_SPAWN_SECONDS,
    },
    options: classicOptions,
    mode,
    phase: 'start',
    timeOfDay: 'day',
    commands: {},
    audioEvents: [],
    elapsedSeconds: 0,
    durationSeconds,
    remainingSeconds: durationSeconds,
    theEndSeconds,
    theEndElapsedSeconds: 0,
    players,
    player: primaryPlayer.state,
    entities: {},
    entityIds: [],
    nextEntityId: 1,
    spawn: {
      flySeconds: 0,
      powerSeconds: 0,
    },
    score: 0,
    combo: 0,
    power: primaryPlayer.power ?? createActivePower(),
    catchRadius: primaryPlayer.catchRadius,
    water: primaryPlayer.water ?? createWaterState(),
  }
}
