import type { GameCommands, GameState, JumpArcDirection } from '../types'

export function applyInput(game: GameState, _deltaSeconds: number): void {
  for (const [index, matchPlayer] of game.players.entries()) {
    const player = index === 0 ? game.player : matchPlayer.state
    if (index === 0 && matchPlayer.state !== player) {
      matchPlayer.state.x = player.x
      matchPlayer.state.y = player.y
    }
    const commands = index === 0 ? mergePrimaryCommands(game) : matchPlayer.commands

    const intentX = jumpIntentFromCommands(commands)
    if (intentX !== 0 && (player.phase === 'staged' || player.phase === 'charging')) {
      player.jump.intentX = intentX
      player.jump.arcDirection = intentX
    }

    if (index === 0) {
      game.player = player
      matchPlayer.state = player
    }
  }
}

function jumpIntentFromCommands(commands: GameCommands): JumpArcDirection {
  if (commands.moveLeft && !commands.moveRight) {
    return -1
  }
  if (commands.moveRight && !commands.moveLeft) {
    return 1
  }
  return 0
}

function mergePrimaryCommands(game: GameState): GameState['commands'] {
  const playerCommands = game.players[0]?.commands ?? {}
  return {
    ...playerCommands,
    moveLeft: Boolean(game.commands.moveLeft || playerCommands.moveLeft),
    moveRight: Boolean(game.commands.moveRight || playerCommands.moveRight),
  }
}
