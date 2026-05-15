import { removeEntity } from '../entities'
import type { GameState } from '../types'

export function updateMovement(game: GameState, deltaSeconds: number): void {
  for (const id of [...game.entityIds]) {
    const entity = game.entities[id]
    if (!entity) {
      continue
    }

    entity.x += entity.vx * deltaSeconds
    entity.y += (entity.vy ?? 0) * deltaSeconds

    const outsideX = entity.x < -entity.radius || entity.x > game.constants.arenaWidth + entity.radius
    const outsideY = entity.y < -entity.radius * 4 || entity.y > game.constants.arenaHeight + entity.radius
    if (outsideX || outsideY) {
      removeEntity(game, id)
    }
  }
}
