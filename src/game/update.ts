import { applyAutonomousPlayerCommands, processHumanInputMarkers, updateAiTakeovers } from './ai'
import { updateCollision } from './systems/collision'
import { updateCoreFeel } from './systems/coreFeel'
import { applyInput } from './systems/input'
import { updateMovement } from './systems/movement'
import { updatePower } from './systems/power'
import { updateSpawn } from './systems/spawn'
import { updateTimer } from './systems/timer'
import type { GameplayAudioEventName, GameState } from './types'

export function updateGame(game: GameState, deltaSeconds: number): void {
  const previousScore = game.score
  const previousPhase = game.phase

  applyCommands(game)
  processHumanInputMarkers(game)
  updateAiTakeovers(game)
  if (game.phase === 'gameplay') {
    applyAutonomousPlayerCommands(game)
    applyInput(game, deltaSeconds)
    updatePower(game, deltaSeconds)
    updateCollision(game)
    updateSpawn(game, deltaSeconds)
    updateMovement(game, deltaSeconds)
    updateCoreFeel(game, deltaSeconds)
  }
  syncPrimaryPlayerScore(game, previousScore)
  updateTimer(game, deltaSeconds)
  queueTimerAudioEvents(game, previousPhase)
  clearCommands(game)
}

export function queueGameplayAudioEvent(game: GameState, eventName: GameplayAudioEventName): void {
  game.audioEvents.push(eventName)
}

export function drainGameplayAudioEvents(game: GameState): GameplayAudioEventName[] {
  return game.audioEvents.splice(0, game.audioEvents.length)
}

function applyCommands(game: GameState): void {
  if (game.commands.start && (game.phase === 'start' || game.phase === 'results')) {
    game.phase = 'gameplay'
    game.remainingSeconds = game.durationSeconds
    game.elapsedSeconds = 0
    game.theEndElapsedSeconds = 0
    game.results = undefined
    queueGameplayAudioEvent(game, 'start')
  }

  if (game.commands.pause && game.phase === 'gameplay') {
    game.phase = 'pause'
    queueGameplayAudioEvent(game, 'pause')
  }

  if (game.commands.resume && game.phase === 'pause') {
    game.phase = 'gameplay'
    queueGameplayAudioEvent(game, 'resume')
  }
}

function queueTimerAudioEvents(game: GameState, previousPhase: GameState['phase']): void {
  if (previousPhase !== 'the-end' && game.phase === 'the-end') {
    queueGameplayAudioEvent(game, 'the-end')
  }

  if (previousPhase !== 'results' && game.phase === 'results') {
    queueGameplayAudioEvent(game, 'results')
  }
}

function clearCommands(game: GameState): void {
  game.commands = {}
  for (const player of game.players) {
    player.commands = {}
  }
}

function syncPrimaryPlayerScore(game: GameState, previousScore: number): void {
  if (game.score !== previousScore) {
    game.players[0].score = game.score
  }
}
