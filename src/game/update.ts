import { updateCollision } from './systems/collision'
import { applyInput } from './systems/input'
import { updateMovement } from './systems/movement'
import { updatePower } from './systems/power'
import { updateSpawn } from './systems/spawn'
import { updateTimer } from './systems/timer'
import type { GameState } from './types'

export function updateGame(game: GameState, deltaSeconds: number): void {
  applyCommands(game)
  if (game.phase === 'gameplay') {
    applyInput(game, deltaSeconds)
    updatePower(game, deltaSeconds)
    updateCollision(game)
    updateSpawn(game, deltaSeconds)
    updateMovement(game, deltaSeconds)
  }
  updateTimer(game, deltaSeconds)
  clearCommands(game)
}

function applyCommands(game: GameState): void {
  if (game.commands.start && (game.phase === 'start' || game.phase === 'results')) {
    game.phase = 'gameplay'
    game.remainingSeconds = game.durationSeconds
    game.theEndElapsedSeconds = 0
  }

  if (game.commands.pause && game.phase === 'gameplay') {
    game.phase = 'pause'
  }

  if (game.commands.resume && game.phase === 'pause') {
    game.phase = 'gameplay'
  }
}

function clearCommands(game: GameState): void {
  game.commands = {}
}
