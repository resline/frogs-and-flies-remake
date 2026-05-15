import type { Prng } from './prng'

export type GamePhase = 'start' | 'gameplay' | 'pause' | 'the-end' | 'results'
export type TimeOfDay = 'day' | 'dusk' | 'night' | 'the-end'
export type EntityKind = 'fly' | 'power'
export type PowerKind = 'rush'

export interface GameCommands {
  start?: boolean
  pause?: boolean
  resume?: boolean
  fire?: boolean
  tongue?: boolean
  chargeJump?: boolean
  releaseJump?: boolean
  moveLeft?: boolean
  moveRight?: boolean
}

export interface GameConstants {
  roundDurationSeconds: number
  theEndSeconds: number
  arenaWidth: number
  arenaHeight: number
  baseCatchRadius: number
  rushCatchRadius: number
  rushSeconds: number
  baseFlyScore: number
  comboBonusScore: number
  flySpawnSeconds: number
  powerSpawnSeconds: number
}

export interface Entity {
  id: number
  kind: EntityKind
  x: number
  y: number
  vx: number
  vy?: number
  radius: number
  powerKind?: PowerKind
}

export interface PlayerState {
  x: number
  y: number
  groundY: number
  radius: number
  speed: number
  jump: JumpState
  tongue: TongueState
}

export type JumpPhase = 'idle' | 'charging' | 'jumping' | 'landed'
export type TonguePhase = 'ready' | 'extended' | 'recovering'
export type TongueResult = 'catch' | 'miss'
export type WaterPhase = 'calm' | 'splash' | 'recovery'

export interface JumpState {
  phase: JumpPhase
  chargeSeconds: number
  airborne: boolean
  velocityY: number
  flightSeconds: number
  landedSeconds: number
}

export interface TongueState {
  phase: TonguePhase
  result?: TongueResult
}

export interface WaterState {
  phase: WaterPhase
  splashSeconds: number
  recoverySeconds: number
}

export interface ActivePower {
  kind?: PowerKind
  remainingSeconds: number
}

export interface SpawnState {
  flySeconds: number
  powerSeconds: number
}

export interface GameState {
  readonly seed: number
  readonly prng: Prng
  readonly constants: GameConstants
  phase: GamePhase
  timeOfDay: TimeOfDay
  commands: GameCommands
  durationSeconds: number
  remainingSeconds: number
  theEndSeconds: number
  theEndElapsedSeconds: number
  player: PlayerState
  entities: Record<number, Entity>
  entityIds: number[]
  nextEntityId: number
  spawn: SpawnState
  score: number
  combo: number
  power: ActivePower
  catchRadius: number
  water: WaterState
}
