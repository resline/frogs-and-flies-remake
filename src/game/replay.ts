import { FIXED_TIMESTEP_SECONDS } from './constants'
import { createGame, type CreateGameOptions } from './createGame'
import { createFixedStep } from './fixedStep'
import { drainGameplayAudioEvents, updateGame } from './update'
import type { GameCommands, GameplayAudioEventName, GameState, MatchWinner, PlayerId, TimeOfDay } from './types'

export type ReplayCommandScript = readonly ReplayCommandFrame[]

export interface ReplayCommandFrame {
  step: number
  commands?: GameCommands
  players?: Partial<Record<PlayerId, GameCommands>>
}

export interface DeterministicReplayOptions extends CreateGameOptions {
  totalSteps: number
  script?: ReplayCommandScript
}

export interface ReplayEvent {
  step: number
  name: GameplayAudioEventName
}

export interface ReplayPlayerSummary {
  id: PlayerId
  score: number
  catches: number
  attempts: number
}

export interface TimeOfDayTransition {
  step: number
  timeOfDay: TimeOfDay
}

export interface DeterministicReplaySummary {
  events: ReplayEvent[]
  players: ReplayPlayerSummary[]
  winner: MatchWinner | undefined
  timeOfDayTransitions: TimeOfDayTransition[]
}

export function runDeterministicReplay(options: DeterministicReplayOptions): DeterministicReplaySummary {
  const game = createGame(options)
  const fixedStep = createFixedStep(FIXED_TIMESTEP_SECONDS, 1)
  const scriptByStep = groupScriptByStep(options.script ?? [])
  const events: ReplayEvent[] = []
  const timeOfDayTransitions: TimeOfDayTransition[] = [{ step: 0, timeOfDay: game.timeOfDay }]

  for (let step = 0; step < options.totalSteps; step += 1) {
    applyCommandFrames(game, scriptByStep.get(step) ?? [])
    fixedStep.advance(FIXED_TIMESTEP_SECONDS, () => updateGame(game, FIXED_TIMESTEP_SECONDS))

    for (const name of drainGameplayAudioEvents(game)) {
      events.push({ step, name })
    }

    const lastTransition = timeOfDayTransitions[timeOfDayTransitions.length - 1]
    if (lastTransition?.timeOfDay !== game.timeOfDay) {
      timeOfDayTransitions.push({ step, timeOfDay: game.timeOfDay })
    }
  }

  return {
    events,
    players: game.players.map((player) => ({
      id: player.id,
      score: player.score,
      catches: player.stats.catches,
      attempts: player.stats.attempts,
    })),
    winner: game.results?.winner,
    timeOfDayTransitions,
  }
}

function groupScriptByStep(script: ReplayCommandScript): Map<number, ReplayCommandFrame[]> {
  const frames = new Map<number, ReplayCommandFrame[]>()

  for (const frame of script) {
    const existing = frames.get(frame.step)
    if (existing) {
      existing.push(frame)
    } else {
      frames.set(frame.step, [frame])
    }
  }

  return frames
}

function applyCommandFrames(game: GameState, frames: readonly ReplayCommandFrame[]): void {
  for (const frame of frames) {
    if (frame.commands) {
      Object.assign(game.commands, frame.commands)
    }

    for (const player of game.players) {
      const commands = frame.players?.[player.id]
      if (!commands) {
        continue
      }

      Object.assign(player.commands, commands)
      if (player.id === 'p1') {
        Object.assign(game.commands, commands)
      }
    }
  }
}
