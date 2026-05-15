import type { Entity, GameState } from './types'

export function insertEntity(game: GameState, entity: Entity): void {
  game.entities[entity.id] = entity
  if (!game.entityIds.includes(entity.id)) {
    game.entityIds.push(entity.id)
  }
  game.nextEntityId = Math.max(game.nextEntityId, entity.id + 1)
}

export function removeEntity(game: GameState, id: number): void {
  delete game.entities[id]
  const index = game.entityIds.indexOf(id)
  if (index >= 0) {
    game.entityIds.splice(index, 1)
  }
}
