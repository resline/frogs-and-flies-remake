import type { MatchPlayerState, PlayerControlSource, PlayerId } from './types'

export function createPlayer(id: PlayerId, label: string, controlSource: PlayerControlSource): MatchPlayerState {
  return {
    id,
    label,
    controlSource,
    score: 0,
  }
}
