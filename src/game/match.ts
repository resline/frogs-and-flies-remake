import { createPlayer } from './player'
import type { GameState, MatchMode, MatchPlayerState, MatchResults, PlayerId } from './types'

export function createPlayers(mode: MatchMode): MatchPlayerState[] {
  return [
    createPlayer('p1', 'P1', 'human'),
    createPlayer('p2', mode === 'local-versus' ? 'P2' : 'CPU', mode === 'local-versus' ? 'human' : 'cpu-opponent'),
  ]
}

export function getPlayer(game: GameState, id: PlayerId): MatchPlayerState {
  const player = game.players.find((candidate) => candidate.id === id)
  if (!player) {
    throw new Error(`Missing player ${id}`)
  }
  return player
}

export function buildResults(game: GameState): MatchResults {
  const p1 = getPlayer(game, 'p1')
  const p2 = getPlayer(game, 'p2')
  const winner = p1.score === p2.score ? 'tie' : p1.score > p2.score ? p1.id : p2.id

  return {
    winner,
    players: game.players.map((player) => ({
      id: player.id,
      score: player.score,
    })),
  }
}
