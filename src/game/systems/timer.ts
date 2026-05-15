import { buildResults } from '../match'
import type { GameState, TimeOfDay } from '../types'

export function updateTimer(game: GameState, deltaSeconds: number): void {
  if (game.phase === 'gameplay') {
    game.elapsedSeconds = Math.min(game.durationSeconds, game.elapsedSeconds + deltaSeconds)
    game.remainingSeconds = Math.max(0, game.remainingSeconds - deltaSeconds)
    if (game.remainingSeconds === 0) {
      game.phase = 'the-end'
      game.theEndElapsedSeconds = 0
      game.results ??= buildResults(game)
    }
  } else if (game.phase === 'the-end') {
    game.theEndElapsedSeconds += deltaSeconds
    if (game.theEndElapsedSeconds >= game.theEndSeconds) {
      game.phase = 'results'
    }
  }

  game.timeOfDay = getTimeOfDay(game)
}

function getTimeOfDay(game: GameState): TimeOfDay {
  if (game.phase === 'the-end' || game.phase === 'results' || game.remainingSeconds <= 0) {
    return 'the-end'
  }

  const elapsedRatio = game.durationSeconds > 0 ? (game.durationSeconds - game.remainingSeconds) / game.durationSeconds : 1

  if (elapsedRatio < 0.5) {
    return 'day'
  }

  if (elapsedRatio < 5 / 6) {
    return 'dusk'
  }

  return 'night'
}
