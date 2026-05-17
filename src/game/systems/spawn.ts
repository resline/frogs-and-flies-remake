import { insertEntity } from '../entities'
import type { GameState } from '../types'

export function updateSpawn(game: GameState, deltaSeconds: number): void {
  game.spawn.flySeconds += deltaSeconds
  game.spawn.powerSeconds += deltaSeconds

  while (game.spawn.flySeconds >= game.constants.flySpawnSeconds) {
    game.spawn.flySeconds -= game.constants.flySpawnSeconds
    const flyVelocity = game.options.flyVelocity
    insertEntity(game, {
      id: game.nextEntityId,
      kind: 'fly',
      x: game.prng.int(48, game.constants.arenaWidth - 48),
      y: game.prng.int(game.options.flyBand.minY, game.options.flyBand.maxY),
      vx: game.prng.int(flyVelocity.minVx, flyVelocity.maxVx),
      vy: game.prng.int(flyVelocity.minVy, flyVelocity.maxVy),
      radius: 14,
    })
  }

  while (game.spawn.powerSeconds >= game.constants.powerSpawnSeconds) {
    game.spawn.powerSeconds -= game.constants.powerSpawnSeconds
    insertEntity(game, {
      id: game.nextEntityId,
      kind: 'power',
      powerKind: 'rush',
      x: game.prng.int(64, game.constants.arenaWidth - 64),
      y: -24,
      vx: game.prng.int(-20, 20),
      vy: game.prng.int(45, 70),
      radius: 18,
    })
  }
}
