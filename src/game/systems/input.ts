import type { GameState } from '../types'

export function applyInput(game: GameState, deltaSeconds: number): void {
  for (const [index, matchPlayer] of game.players.entries()) {
    const player = index === 0 ? game.player : matchPlayer.state
    if (index === 0 && matchPlayer.state !== player) {
      matchPlayer.state.x = player.x
      matchPlayer.state.y = player.y
    }
    const commands = index === 0 ? mergePrimaryCommands(game) : matchPlayer.commands

    if (commands.moveLeft) {
      player.x -= player.speed * deltaSeconds
    }
    if (commands.moveRight) {
      player.x += player.speed * deltaSeconds
    }

    player.x = Math.max(player.radius, Math.min(game.constants.arenaWidth - player.radius, player.x))

    if (index === 0) {
      game.player = player
      matchPlayer.state = player
    }
  }
}

function mergePrimaryCommands(game: GameState): GameState['commands'] {
  const playerCommands = game.players[0]?.commands ?? {}
  return {
    ...playerCommands,
    moveLeft: Boolean(game.commands.moveLeft || playerCommands.moveLeft),
    moveRight: Boolean(game.commands.moveRight || playerCommands.moveRight),
  }
}
