import { Container, Graphics, Sprite } from 'pixi.js'
import type { GeneratedGameplayAssets } from '../runtime/assets'
import type { GameState, MatchPlayerState, PlayerState } from '../game/types'

export type EntitySpriteState = {
  entities: Container
  entitySprites: Map<number, Sprite>
  playerSprites: Map<string, Sprite>
}

export function drawProceduralPlayers(scene: Graphics, game: GameState): void {
  for (const [index, player] of getRenderPlayers(game).entries()) {
    drawProceduralPlayer(scene, player.state, player.matchPlayer, index)
  }
}

export function drawProceduralEntities(scene: Graphics, game: GameState): void {
  for (const id of game.entityIds) {
    const entity = game.entities[id]
    if (!entity) {
      continue
    }

    if (entity.kind === 'fly') {
      scene.ellipse(entity.x - 5, entity.y - 4, 8, 5).fill({ color: 0xdff3ff, alpha: 0.78 })
      scene.ellipse(entity.x + 5, entity.y - 4, 8, 5).fill({ color: 0xdff3ff, alpha: 0.78 })
      scene.circle(entity.x, entity.y, entity.radius).fill({ color: 0x16140f })
      scene.circle(entity.x + 4, entity.y - 4, 3).fill({ color: 0xffe36a })
    } else {
      scene.circle(entity.x, entity.y, entity.radius + 8).fill({ color: 0xf7d154, alpha: 0.26 })
      scene.circle(entity.x, entity.y, entity.radius).fill({ color: 0xfff178 })
      scene.circle(entity.x, entity.y, entity.radius * 0.48).fill({ color: 0x6fe86c })
    }
  }
}

export function drawBitmapPlayers(state: EntitySpriteState, game: GameState, assets: GeneratedGameplayAssets): void {
  const activeIds = new Set<string>()

  for (const [index, player] of getRenderPlayers(game).entries()) {
    const id = player.matchPlayer.id
    activeIds.add(id)

    let sprite = state.playerSprites.get(id)
    if (!sprite) {
      sprite = new Sprite({ texture: assets.frog, anchor: 0.5 })
      state.playerSprites.set(id, sprite)
      state.entities.addChild(sprite)
    }

    sprite.visible = true
    sprite.texture = assets.frog
    sprite.position.set(player.state.x, player.state.y)
    sprite.width = player.state.radius * 3.2
    sprite.height = player.state.radius * 3.2
    sprite.tint = player.matchPlayer.power.remainingSeconds > 0 || (index === 0 && game.power.remainingSeconds > 0) ? 0xdfff9e : playerTint(index)
  }

  for (const [id, sprite] of state.playerSprites) {
    if (activeIds.has(id)) {
      continue
    }

    state.entities.removeChild(sprite)
    sprite.destroy()
    state.playerSprites.delete(id)
  }
}

export function drawBitmapEntities(state: EntitySpriteState, game: GameState, assets: GeneratedGameplayAssets): void {
  const activeIds = new Set<number>()

  for (const id of game.entityIds) {
    const entity = game.entities[id]
    if (!entity) {
      continue
    }

    activeIds.add(id)

    let sprite = state.entitySprites.get(id)
    if (!sprite) {
      sprite = new Sprite({ anchor: 0.5 })
      state.entitySprites.set(id, sprite)
      state.entities.addChild(sprite)
    }

    sprite.visible = true
    sprite.texture = entity.kind === 'fly' ? assets.fly : assets.power
    sprite.position.set(entity.x, entity.y)
    sprite.width = entity.kind === 'fly' ? entity.radius * 4.4 : entity.radius * 3.2
    sprite.height = entity.kind === 'fly' ? entity.radius * 3.2 : entity.radius * 3.2
    sprite.rotation = entity.kind === 'fly' ? Math.sin((entity.x + entity.y) * 0.02) * 0.08 : 0
    sprite.tint = 0xffffff
  }

  for (const [id, sprite] of state.entitySprites) {
    if (activeIds.has(id)) {
      continue
    }

    state.entities.removeChild(sprite)
    sprite.destroy()
    state.entitySprites.delete(id)
  }
}

export function hideBitmapEntities(state: EntitySpriteState): void {
  for (const sprite of state.entitySprites.values()) {
    sprite.visible = false
  }
  for (const sprite of state.playerSprites.values()) {
    sprite.visible = false
  }
}

function drawProceduralPlayer(scene: Graphics, player: PlayerState, matchPlayer: MatchPlayerState, index: number): void {
  const { x, y, radius } = player
  const powered = matchPlayer.power.remainingSeconds > 0
  const body = powered ? 0x94f65f : playerTint(index)
  const belly = powered ? 0xe0ffc6 : index === 0 ? 0xbdf49e : 0xbde9f4

  scene.circle(x, y, radius + 10).fill({ color: 0x163e28, alpha: 0.46 })
  scene.circle(x, y, radius).fill({ color: body })
  scene.circle(x, y + 8, radius * 0.58).fill({ color: belly, alpha: 0.92 })
  scene.circle(x - 12, y - 20, 8).fill({ color: 0xf4fbef })
  scene.circle(x + 12, y - 20, 8).fill({ color: 0xf4fbef })
  scene.circle(x - 12, y - 20, 3).fill({ color: 0x051416 })
  scene.circle(x + 12, y - 20, 3).fill({ color: 0x051416 })
}

function getRenderPlayers(game: GameState): { matchPlayer: MatchPlayerState; state: PlayerState }[] {
  return game.players.map((matchPlayer, index) => ({
    matchPlayer,
    state: index === 0 ? game.player : matchPlayer.state,
  }))
}

function playerTint(index: number): number {
  return index === 0 ? 0x4fc35b : 0x45aee8
}
