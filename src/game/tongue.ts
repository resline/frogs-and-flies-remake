import { CLASSIC_TONGUE_MOUTH_OFFSET_Y } from './constants'
import type { Entity, GameState, PlayerState } from './types'

export interface TonguePoint {
  x: number
  y: number
}

export interface TongueSegment {
  originX: number
  originY: number
  tipX: number
  tipY: number
}

export function tongueOriginForPlayer(player: PlayerState): TonguePoint {
  return {
    x: player.x,
    y: player.y + CLASSIC_TONGUE_MOUTH_OFFSET_Y,
  }
}

export function tongueSegmentForPlayer(player: PlayerState, range = player.tongue.range): TongueSegment {
  const origin = tongueOriginForPlayer(player)
  const direction = player.facing === 'left' ? -1 : 1

  return {
    originX: origin.x,
    originY: origin.y,
    tipX: origin.x + range * direction,
    tipY: origin.y,
  }
}

export function syncTongueSegment(player: PlayerState, range = player.tongue.range): void {
  const segment = tongueSegmentForPlayer(player, range)
  player.tongue.range = range
  player.tongue.originX = segment.originX
  player.tongue.originY = segment.originY
  player.tongue.tipX = segment.tipX
  player.tongue.tipY = segment.tipY
}

export function isEntityInTongueRange(
  player: PlayerState,
  entity: Entity | undefined,
  range = player.tongue.range,
): boolean {
  if (!entity || entity.kind !== 'fly') {
    return false
  }

  const segment = tongueSegmentForPlayer(player, range)
  const segmentX = segment.tipX - segment.originX
  const segmentY = segment.tipY - segment.originY
  const lengthSquared = segmentX * segmentX + segmentY * segmentY
  if (lengthSquared <= 0) {
    return false
  }

  const entityX = entity.x - segment.originX
  const entityY = entity.y - segment.originY
  const along = (entityX * segmentX + entityY * segmentY) / Math.sqrt(lengthSquared)
  if (along < 0 || along > range) {
    return false
  }

  const projection = Math.max(0, Math.min(1, (entityX * segmentX + entityY * segmentY) / lengthSquared))
  const closestX = segment.originX + segmentX * projection
  const closestY = segment.originY + segmentY * projection
  const distanceToSegment = Math.hypot(entity.x - closestX, entity.y - closestY)

  return distanceToSegment <= player.tongue.width + entity.radius
}

export function findFirstTongueHit(
  game: GameState,
  player: PlayerState,
  range = player.tongue.range,
): Entity | undefined {
  for (const id of game.entityIds) {
    const entity = game.entities[id]
    if (isEntityInTongueRange(player, entity, range)) {
      return entity
    }
  }
  return undefined
}
