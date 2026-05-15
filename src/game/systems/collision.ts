import { removeEntity } from '../entities'
import { activateRush } from './power'
import type { Entity, GameCommands, GameState, MatchPlayerState, PlayerState } from '../types'

type RuntimeTongueState = GameState['player']['tongue'] & {
  recoverySeconds?: number
}

interface CollisionActor {
  player: MatchPlayerState
  state: PlayerState
  commands: GameCommands
  isPrimary: boolean
}

export function updateCollision(game: GameState): void {
  collectPower(game)

  for (const actor of getCatchActors(game)) {
    catchFly(game, actor)
    clearPerPlayerCatchCommands(actor)
  }
}

function collectPower(game: GameState): void {
  for (const id of [...game.entityIds]) {
    const entity = game.entities[id]
    if (!entity || entity.kind !== 'power') {
      continue
    }

    for (const actor of getCollisionActors(game)) {
      if (distance(actor.state.x, actor.state.y, entity.x, entity.y) <= actor.state.radius + entity.radius) {
        if (entity.powerKind === 'rush') {
          activateRush(game, actor.player)
        }
        removeEntity(game, id)
        break
      }
    }
  }
}

function catchFly(game: GameState, actor: CollisionActor): void {
  syncPrimaryPlayerFromLegacyScore(game, actor)
  actor.player.stats.attempts += 1

  const caught = firstCatchableFly(game, actor)
  if (!caught) {
    actor.player.stats.combo = 0
    actor.player.stats.misses += 1
    syncPlayerScoreStats(actor.player)
    syncLegacyScoreFromPrimaryPlayer(game, actor)
    recordTongue(actor, 'miss')
    return
  }

  const scoreDelta = game.constants.baseFlyScore + actor.player.stats.combo * game.constants.comboBonusScore
  actor.player.score += scoreDelta
  actor.player.stats.combo += 1
  actor.player.stats.catches += 1
  syncPlayerScoreStats(actor.player)
  syncLegacyScoreFromPrimaryPlayer(game, actor)
  removeEntity(game, caught.id)
  recordTongue(actor, 'catch')
}

function firstCatchableFly(game: GameState, actor: CollisionActor): Entity | undefined {
  for (const id of game.entityIds) {
    const entity = game.entities[id]
    if (entity?.kind === 'fly' && distance(actor.state.x, actor.state.y, entity.x, entity.y) <= actor.player.catchRadius) {
      return entity
    }
  }
  return undefined
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by)
}

function recordTongue(actor: CollisionActor, result: 'catch' | 'miss'): void {
  if (!actor.commands.tongue) {
    return
  }

  const tongue = actor.state.tongue as RuntimeTongueState
  tongue.phase = 'recovering'
  tongue.result = result
  tongue.recoverySeconds = 0
}

function getCollisionActors(game: GameState): CollisionActor[] {
  return game.players.map((player, index) => ({
    player,
    state: index === 0 ? game.player : player.state,
    commands: index === 0 ? mergeCommands(game.commands, player.commands) : player.commands,
    isPrimary: index === 0,
  }))
}

function getCatchActors(game: GameState): CollisionActor[] {
  return getCollisionActors(game).filter((actor) => hasCatchCommand(actor.commands))
}

function hasCatchCommand(commands: GameCommands): boolean {
  return Boolean(commands.fire || commands.tongue)
}

function mergeCommands(primaryCommands: GameCommands, playerCommands: GameCommands): GameCommands {
  return {
    ...playerCommands,
    fire: Boolean(primaryCommands.fire || playerCommands.fire),
    tongue: Boolean(primaryCommands.tongue || playerCommands.tongue),
  }
}

function syncPrimaryPlayerFromLegacyScore(game: GameState, actor: CollisionActor): void {
  if (!actor.isPrimary) {
    return
  }

  actor.player.score = game.score
  actor.player.stats.score = game.score
  actor.player.stats.combo = game.combo
}

function syncLegacyScoreFromPrimaryPlayer(game: GameState, actor: CollisionActor): void {
  if (!actor.isPrimary) {
    return
  }

  game.score = actor.player.score
  game.combo = actor.player.stats.combo
}

function syncPlayerScoreStats(player: MatchPlayerState): void {
  player.stats.score = player.score
}

function clearPerPlayerCatchCommands(actor: CollisionActor): void {
  actor.player.commands.fire = false
  actor.player.commands.tongue = false
}
