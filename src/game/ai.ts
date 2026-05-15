import { AI_TAKEOVER_SECONDS } from './constants'
import { isEntityInTongueRange } from './tongue'
import type { Entity, GameCommands, GameState, MatchPlayerState } from './types'

type AutonomousControlSource = 'cpu-opponent' | 'ai-takeover'

export function processHumanInputMarkers(game: GameState): void {
  for (const [index, player] of game.players.entries()) {
    const hasHumanInput =
      player.commands.humanInput ||
      (index === 0 && hasLegacyPrimaryHumanInput(game.commands)) ||
      (player.controlSource === 'ai-takeover' && hasPerPlayerHumanInput(player.commands))

    if (!hasHumanInput) {
      continue
    }

    player.controlSource = 'human'
    player.lastHumanInputElapsedSeconds = game.elapsedSeconds
  }
}

export function updateAiTakeovers(game: GameState): void {
  for (const player of game.players) {
    if (player.controlSource !== 'human') {
      continue
    }

    if (game.elapsedSeconds - player.lastHumanInputElapsedSeconds >= AI_TAKEOVER_SECONDS) {
      player.controlSource = 'ai-takeover'
    }
  }
}

export function applyAutonomousPlayerCommands(game: GameState): void {
  const suppressCpuOpponent = hasPrimaryHumanCatchCommand(game) || hasPrimaryHumanCatchOpportunity(game)

  for (const player of game.players) {
    if (!isAutonomous(player.controlSource)) {
      continue
    }

    if (player.controlSource === 'cpu-opponent' && suppressCpuOpponent) {
      continue
    }

    player.commands = {
      ...player.commands,
      ...getAutonomousPlayerCommands(game, player),
    }
  }
}

export function getAutonomousPlayerCommands(game: GameState, player: MatchPlayerState): GameCommands {
  const target = getTargetFly(game, player)
  if (!target) {
    return {}
  }

  const commands: GameCommands = {}
  const dx = target.x - player.state.x
  if (dx < -player.state.radius) {
    commands.moveLeft = true
  } else if (dx > player.state.radius) {
    commands.moveRight = true
  }

  if (player.state.tongue.phase === 'ready' && isEntityInTongueRange(player.state, target, player.catchRadius)) {
    commands.tongue = true
  }

  return commands
}

function isAutonomous(controlSource: MatchPlayerState['controlSource']): controlSource is AutonomousControlSource {
  return controlSource === 'cpu-opponent' || controlSource === 'ai-takeover'
}

function hasPrimaryHumanCatchOpportunity(game: GameState): boolean {
  const primary = game.players[0]
  if (!primary || primary.controlSource !== 'human') {
    return false
  }

  const state = game.player
  return game.entityIds.some((id) => {
    const entity = game.entities[id]
    return entity?.kind === 'fly' && isEntityInTongueRange(state, entity, primary.catchRadius)
  })
}

function hasPrimaryHumanCatchCommand(game: GameState): boolean {
  const primary = game.players[0]
  return Boolean(primary?.controlSource === 'human' && (game.commands.fire || game.commands.tongue || primary.commands.fire || primary.commands.tongue))
}

function hasLegacyPrimaryHumanInput(commands: GameCommands): boolean {
  return Boolean(
    commands.moveLeft ||
      commands.moveRight ||
      commands.chargeJump ||
      commands.releaseJump ||
      commands.tongue ||
      commands.fire,
  )
}

function hasPerPlayerHumanInput(commands: GameCommands): boolean {
  return Boolean(commands.moveLeft || commands.moveRight || commands.chargeJump || commands.releaseJump || commands.tongue || commands.fire)
}

function getTargetFly(game: GameState, player: MatchPlayerState): Entity | undefined {
  let target: Entity | undefined
  let targetDistance = Number.POSITIVE_INFINITY

  for (const id of game.entityIds) {
    const entity = game.entities[id]
    if (entity?.kind !== 'fly') {
      continue
    }

    const candidateDistance = distance(player.state.x, player.state.y, entity.x, entity.y)
    if (!target || candidateDistance < targetDistance || (candidateDistance === targetDistance && entity.id < target.id)) {
      target = entity
      targetDistance = candidateDistance
    }
  }

  return target
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by)
}
