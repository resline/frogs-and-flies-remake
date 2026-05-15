import { removeEntity } from '../entities'
import { activateRush } from './power'
import type { Entity, GameState } from '../types'

type RuntimeTongueState = GameState['player']['tongue'] & {
  recoverySeconds?: number
}

export function updateCollision(game: GameState): void {
  collectPower(game)

  if (game.commands.fire || game.commands.tongue) {
    catchFly(game)
  }
}

function collectPower(game: GameState): void {
  for (const id of [...game.entityIds]) {
    const entity = game.entities[id]
    if (!entity || entity.kind !== 'power') {
      continue
    }

    if (distance(game.player.x, game.player.y, entity.x, entity.y) <= game.player.radius + entity.radius) {
      if (entity.powerKind === 'rush') {
        activateRush(game)
      }
      removeEntity(game, id)
    }
  }
}

function catchFly(game: GameState): void {
  const caught = firstCatchableFly(game)
  if (!caught) {
    game.combo = 0
    recordTongue(game, 'miss')
    return
  }

  game.score += game.constants.baseFlyScore + game.combo * game.constants.comboBonusScore
  game.combo += 1
  removeEntity(game, caught.id)
  recordTongue(game, 'catch')
}

function firstCatchableFly(game: GameState): Entity | undefined {
  for (const id of game.entityIds) {
    const entity = game.entities[id]
    if (entity?.kind === 'fly' && distance(game.player.x, game.player.y, entity.x, entity.y) <= game.catchRadius) {
      return entity
    }
  }
  return undefined
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by)
}

function recordTongue(game: GameState, result: 'catch' | 'miss'): void {
  if (!game.commands.tongue) {
    return
  }

  const tongue = game.player.tongue as RuntimeTongueState
  tongue.phase = 'recovering'
  tongue.result = result
  tongue.recoverySeconds = 0
}
