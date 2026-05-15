import type { Prng } from './prng'

export type GamePhase = 'start' | 'gameplay' | 'pause' | 'the-end' | 'results'
export type TimeOfDay = 'day' | 'dusk' | 'night' | 'the-end'
export type EntityKind = 'fly' | 'power'
export type PowerKind = 'rush'
export type MatchMode = 'classic-single' | 'local-versus'
export type PlayerId = 'p1' | 'p2'
export type PlayerControlSource = 'human' | 'cpu-opponent' | 'ai-takeover'
export type MatchWinner = PlayerId | 'tie'
export type FacingDirection = 'left' | 'right'
export type HomeLilyId = 'left' | 'right'
export type PlayerPhase = 'staged' | 'charging' | 'airborne' | 'splashing' | 'recovering'
export type JumpArcDirection = -1 | 0 | 1
export type DifficultyMode = 'classic-assist' | 'classic-standard' | 'classic-expert'

export interface FlyBand {
  minY: number
  maxY: number
}

export interface ClassicOptions {
  difficulty: DifficultyMode
  flyBand: FlyBand
  autoTongue: boolean
  jumpForgiveness: number
  flySpawnSeconds: number
}

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
  humanInput?: boolean
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
  homeX: number
  homeY: number
  homeLilyId: HomeLilyId
  facing: FacingDirection
  phase: PlayerPhase
  groundY: number
  landingRadius: number
  radius: number
  speed: number
  jump: JumpState
  tongue: TongueState
}

export interface PlayerStats {
  score: number
  combo: number
  catches: number
  misses: number
  attempts: number
}

export interface MatchPlayerState {
  id: PlayerId
  label: string
  controlSource: PlayerControlSource
  score: number
  stats: PlayerStats
  commands: GameCommands
  lastHumanInputElapsedSeconds: number
  state: PlayerState
  water: WaterState
  power: ActivePower
  catchRadius: number
}

export interface MatchResults {
  winner: MatchWinner
  players: readonly {
    id: PlayerId
    score: number
  }[]
}

export type JumpPhase = 'idle' | 'charging' | 'jumping' | 'landed'
export type TonguePhase = 'ready' | 'extended' | 'recovering'
export type TongueResult = 'catch' | 'miss'
export type WaterPhase = 'calm' | 'splash' | 'recovery'
export type GameplayAudioEventName =
  | 'jump'
  | 'tongue'
  | 'catch'
  | 'miss'
  | 'splash'
  | 'power'
  | 'start'
  | 'pause'
  | 'resume'
  | 'the-end'
  | 'results'

export interface JumpState {
  phase: JumpPhase
  chargeSeconds: number
  airborne: boolean
  velocityY: number
  flightSeconds: number
  landedSeconds: number
  intentX: JumpArcDirection
  arcDirection: JumpArcDirection
  startX: number
  startY: number
  targetX: number
  targetY: number
  durationSeconds: number
  travelX: number
  arcHeight: number
}

export interface TongueState {
  phase: TonguePhase
  result?: TongueResult
  activeSeconds: number
  recoverySeconds: number
  range: number
  width: number
  originX: number
  originY: number
  tipX: number
  tipY: number
  autoFired?: boolean
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
  readonly options: ClassicOptions
  mode: MatchMode
  phase: GamePhase
  timeOfDay: TimeOfDay
  commands: GameCommands
  audioEvents: GameplayAudioEventName[]
  elapsedSeconds: number
  durationSeconds: number
  remainingSeconds: number
  theEndSeconds: number
  theEndElapsedSeconds: number
  players: MatchPlayerState[]
  results?: MatchResults
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
