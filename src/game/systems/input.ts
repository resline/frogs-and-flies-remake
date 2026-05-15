import type { GameState } from '../types'

export function applyInput(game: GameState, deltaSeconds: number): void {
  if (game.commands.moveLeft) {
    game.player.x -= game.player.speed * deltaSeconds
  }
  if (game.commands.moveRight) {
    game.player.x += game.player.speed * deltaSeconds
  }

  game.player.x = Math.max(game.player.radius, Math.min(game.constants.arenaWidth - game.player.radius, game.player.x))
}
