import { removeEntity } from '../entities'
import { findFirstTongueHit, isEntityInTongueRange, syncTongueSegment } from '../tongue'
import { activateRush } from './power'
import type { GameCommands, GameState, MatchPlayerState, PlayerState } from '../types'

interface CollisionActor {
  player: MatchPlayerState
  state: PlayerState
  commands: GameCommands
  isPrimary: boolean
}

export function updateCollision(game: GameState): void {
  collectPower(game)

  for (const actor of getCatchActors(game)) {
    startTongueAttempt(game, actor)
  }

  for (const actor of getCollisionActors(game)) {
    resolveActiveTongueHit(game, actor)
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
          game.audioEvents.push('power')
        }
        removeEntity(game, id)
        break
      }
    }
  }
}

function startTongueAttempt(game: GameState, actor: CollisionActor): void {
  if (actor.state.tongue.phase !== 'ready') {
    return
  }

  syncPrimaryPlayerFromLegacyScore(game, actor)
  actor.player.stats.attempts += 1
  syncPlayerScoreStats(actor.player)
  syncTongueSegment(actor.state, actor.player.catchRadius)
  actor.state.tongue.phase = 'extended'
  actor.state.tongue.result = undefined
  actor.state.tongue.activeSeconds = 0
  actor.state.tongue.recoverySeconds = 0
  actor.state.tongue.autoFired = Boolean(actor.commands.fire && !actor.commands.tongue)
  game.audioEvents.push('tongue')
}

function resolveActiveTongueHit(game: GameState, actor: CollisionActor): void {
  if (actor.state.tongue.phase !== 'extended' || actor.state.tongue.result) {
    return
  }

  syncTongueSegment(actor.state, actor.player.catchRadius)
  const caught = findFirstTongueHit(game, actor.state, actor.player.catchRadius)
  if (!caught) {
    return
  }

  const scoreDelta = game.constants.baseFlyScore + actor.player.stats.combo * game.constants.comboBonusScore
  actor.player.score += scoreDelta
  actor.player.stats.combo += 1
  actor.player.stats.catches += 1
  syncPlayerScoreStats(actor.player)
  syncLegacyScoreFromPrimaryPlayer(game, actor)
  removeEntity(game, caught.id)
  actor.state.tongue.result = 'catch'
  game.audioEvents.push('catch')
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by)
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
  return getCollisionActors(game).filter((actor) => hasCatchCommand(actor.commands) || hasAutoTongueTarget(game, actor))
}

function hasCatchCommand(commands: GameCommands): boolean {
  return Boolean(commands.fire || commands.tongue)
}

function hasAutoTongueTarget(game: GameState, actor: CollisionActor): boolean {
  if (!game.options.autoTongue || actor.state.tongue.phase !== 'ready') {
    return false
  }

  return game.entityIds.some((id) => {
    const entity = game.entities[id]
    return entity?.kind === 'fly' && isEntityInTongueRange(actor.state, entity, actor.player.catchRadius)
  })
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
