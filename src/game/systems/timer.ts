import type { GameState, TimeOfDay } from '../types'

export function updateTimer(game: GameState, deltaSeconds: number): void {
  if (game.phase === 'gameplay') {
    game.remainingSeconds = Math.max(0, game.remainingSeconds - deltaSeconds)
    if (game.remainingSeconds === 0) {
      game.phase = 'the-end'
      game.theEndElapsedSeconds = 0
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

  if (game.remainingSeconds > 30) {
    return 'day'
  }

  if (game.remainingSeconds > 10) {
    return 'dusk'
  }

  return 'night'
}
