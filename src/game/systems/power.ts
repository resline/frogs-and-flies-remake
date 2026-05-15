import type { GameState, MatchPlayerState } from '../types'

export function updatePower(game: GameState, deltaSeconds: number): void {
  migrateLegacyPowerToPrimaryPlayer(game)

  for (const player of game.players) {
    updatePlayerPower(game, player, deltaSeconds)
  }

  syncLegacyPowerFromPrimaryPlayer(game)
}

export function activateRush(game: GameState, player = game.players[0]): void {
  player.power.kind = 'rush'
  player.power.remainingSeconds = game.constants.rushSeconds
  player.catchRadius = game.constants.rushCatchRadius

  if (player === game.players[0]) {
    syncLegacyPowerFromPrimaryPlayer(game)
  }
}

function updatePlayerPower(game: GameState, player: MatchPlayerState, deltaSeconds: number): void {
  if (!player.power.kind) {
    player.catchRadius = game.constants.baseCatchRadius
    return
  }

  player.power.remainingSeconds = Math.max(0, player.power.remainingSeconds - deltaSeconds)
  if (player.power.remainingSeconds === 0) {
    player.power.kind = undefined
    player.catchRadius = game.constants.baseCatchRadius
    return
  }

  player.catchRadius = game.constants.rushCatchRadius
}

function migrateLegacyPowerToPrimaryPlayer(game: GameState): void {
  const primaryPlayer = game.players[0]
  if (!primaryPlayer || primaryPlayer.power.kind || !game.power.kind) {
    return
  }

  primaryPlayer.power.kind = game.power.kind
  primaryPlayer.power.remainingSeconds = game.power.remainingSeconds
  primaryPlayer.catchRadius = game.catchRadius
}

function syncLegacyPowerFromPrimaryPlayer(game: GameState): void {
  const primaryPlayer = game.players[0]
  if (!primaryPlayer) {
    game.power.kind = undefined
    game.power.remainingSeconds = 0
    game.catchRadius = game.constants.baseCatchRadius
    return
  }

  game.power.kind = primaryPlayer.power.kind
  game.power.remainingSeconds = primaryPlayer.power.remainingSeconds
  game.catchRadius = primaryPlayer.catchRadius
}
