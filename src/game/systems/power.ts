import type { GameState } from '../types'

export function updatePower(game: GameState, deltaSeconds: number): void {
  if (!game.power.kind) {
    game.catchRadius = game.constants.baseCatchRadius
    return
  }

  game.power.remainingSeconds = Math.max(0, game.power.remainingSeconds - deltaSeconds)
  if (game.power.remainingSeconds === 0) {
    game.power.kind = undefined
    game.catchRadius = game.constants.baseCatchRadius
    return
  }

  game.catchRadius = game.constants.rushCatchRadius
}

export function activateRush(game: GameState): void {
  game.power.kind = 'rush'
  game.power.remainingSeconds = game.constants.rushSeconds
  game.catchRadius = game.constants.rushCatchRadius
}
