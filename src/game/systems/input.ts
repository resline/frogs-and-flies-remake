import type { GameState } from '../types'

export function applyInput(game: GameState, deltaSeconds: number): void {
  const primaryPlayer = game.players[0]?.state
  const primaryCommands = game.players[0]?.commands
  if (primaryPlayer && game.player !== primaryPlayer) {
    primaryPlayer.x = game.player.x
  }
  const player = primaryPlayer ?? game.player

  if (game.commands.moveLeft || primaryCommands?.moveLeft) {
    player.x -= player.speed * deltaSeconds
  }
  if (game.commands.moveRight || primaryCommands?.moveRight) {
    player.x += player.speed * deltaSeconds
  }

  player.x = Math.max(player.radius, Math.min(game.constants.arenaWidth - player.radius, player.x))
  game.player = player
}
