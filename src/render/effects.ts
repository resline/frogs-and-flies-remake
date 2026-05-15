import { Graphics } from 'pixi.js'
import { ARENA_HEIGHT, ARENA_WIDTH } from '../game/constants'
import type { GameState, MatchPlayerState, PlayerState } from '../game/types'
import { paletteFor } from './palette'

export type RenderEffectMarker = 'catch' | 'miss' | 'splash' | 'score'

export type RenderEffectState = {
  lastEffect?: RenderEffectMarker
  previousScores: Map<string, number>
  previousVisibleScores: Map<string, number>
}

export function createRenderEffectState(): RenderEffectState {
  return {
    previousScores: new Map(),
    previousVisibleScores: new Map(),
  }
}

export function drawEffects(scene: Graphics, game: GameState, state: RenderEffectState): RenderEffectMarker | undefined {
  scene.clear()

  const palette = paletteFor(game.timeOfDay)
  const lastEffect = selectLastEffect(game, state)

  drawArenaEffects(scene, game)
  drawTongueEffects(scene, game)
  drawScoreEffects(scene, game, state, lastEffect === 'score')
  drawSplashEffects(scene, game)
  drawTimeTint(scene, game, palette.tint, palette.tintAlpha)
  drawEndFlourish(scene, game, palette.flourish)

  state.lastEffect = lastEffect ?? state.lastEffect
  return state.lastEffect
}

function drawArenaEffects(scene: Graphics, game: GameState): void {
  const palette = paletteFor(game.timeOfDay)

  scene.rect(0, 0, ARENA_WIDTH, 82).fill({ color: palette.hud, alpha: 0.34 })
  scene.rect(0, ARENA_HEIGHT - 90, ARENA_WIDTH, 90).fill({ color: 0x05221c, alpha: 0.26 })

  for (let index = 0; index < 9; index += 1) {
    const x = 74 + index * 86
    const y = 230 + ((index * 47 + game.seed) % 210)
    scene.ellipse(x, y, 38, 9).fill({ color: palette.ripple, alpha: 0.2 })
  }

  scene.ellipse(116, ARENA_HEIGHT - 74, 84, 28).fill({ color: 0x2e7d45, alpha: 0.52 })
  scene.ellipse(ARENA_WIDTH - 116, ARENA_HEIGHT - 74, 84, 28).fill({ color: 0x2b7340, alpha: 0.52 })

  if (game.phase === 'gameplay') {
    for (const [index, player] of getRenderPlayers(game).entries()) {
      const powered = player.matchPlayer.power.remainingSeconds > 0 || (index === 0 && game.power.remainingSeconds > 0)
      scene.circle(player.state.x, player.state.y, player.matchPlayer.catchRadius).stroke({
        width: 2,
        color: powered ? 0xd9ff71 : 0x9fe8ff,
        alpha: 0.25,
      })
    }
  }
}

function drawTongueEffects(scene: Graphics, game: GameState): void {
  for (const player of getRenderPlayers(game)) {
    if (player.state.tongue.phase !== 'recovering' || !player.state.tongue.result) {
      continue
    }

    const color = player.state.tongue.result === 'catch' ? 0xffe36a : 0xff6b8a
    scene.moveTo(player.state.x, player.state.y - 10)
    scene.lineTo(player.state.x, Math.max(90, player.state.y - player.matchPlayer.catchRadius * 0.72))
    scene.stroke({ width: 5, color, alpha: 0.72 })
    scene.circle(player.state.x, player.state.y - player.matchPlayer.catchRadius * 0.54, 12).fill({ color, alpha: 0.26 })
  }
}

function drawScoreEffects(scene: Graphics, game: GameState, state: RenderEffectState, consumeScoreIncrease: boolean): void {
  for (const player of game.players) {
    const previousScore = state.previousScores.get(player.id) ?? player.score
    const scoreIncreasedForMarker = player.score > previousScore
    const previousVisibleScore = state.previousVisibleScores.get(player.id) ?? player.score
    if (player.score > previousVisibleScore) {
      scene.circle(player.state.x, player.state.y - 58, 18).fill({ color: 0xfff178, alpha: 0.38 })
      scene.rect(player.state.x - 18, player.state.y - 80, 36, 5).fill({ color: 0xffffff, alpha: 0.56 })
    }
    state.previousVisibleScores.set(player.id, player.score)
    if (!scoreIncreasedForMarker || consumeScoreIncrease) {
      state.previousScores.set(player.id, player.score)
    }
  }
}

function drawSplashEffects(scene: Graphics, game: GameState): void {
  for (const player of getRenderPlayers(game)) {
    const water = player.matchPlayer.water
    if (water.phase !== 'splash') {
      continue
    }

    const progress = Math.min(1, water.splashSeconds / 0.3)
    const radius = player.state.radius + 18 + progress * 28
    scene.ellipse(player.state.x, player.state.groundY + 7, radius, 12 + progress * 8).stroke({
      width: 4,
      color: 0xbdf4ff,
      alpha: 0.62 - progress * 0.28,
    })
  }
}

function drawTimeTint(scene: Graphics, game: GameState, tint: number, alpha: number): void {
  if (alpha <= 0) {
    return
  }

  scene.rect(0, 0, ARENA_WIDTH, ARENA_HEIGHT).fill({ color: tint, alpha })
  if (game.phase === 'pause') {
    scene.rect(0, 0, ARENA_WIDTH, ARENA_HEIGHT).fill({ color: 0x021011, alpha: 0.18 })
  }
}

function drawEndFlourish(scene: Graphics, game: GameState, color: number): void {
  if (game.phase !== 'the-end' && game.phase !== 'results') {
    return
  }

  const pulse = game.phase === 'the-end' ? Math.min(1, game.theEndElapsedSeconds / Math.max(0.1, game.theEndSeconds)) : 1
  scene.rect(0, 0, ARENA_WIDTH, ARENA_HEIGHT).fill({ color: 0x140912, alpha: 0.16 })
  scene.circle(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 70 + pulse * 90).stroke({ width: 5, color, alpha: 0.28 })
  scene.circle(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 124 + pulse * 120).stroke({ width: 3, color, alpha: 0.18 })
}

function selectLastEffect(game: GameState, state: RenderEffectState): RenderEffectMarker | undefined {
  for (const player of getRenderPlayers(game)) {
    if (player.state.tongue.result === 'catch') {
      return 'catch'
    }
    if (player.state.tongue.result === 'miss') {
      return 'miss'
    }
  }

  if (getRenderPlayers(game).some((player) => player.matchPlayer.water.phase === 'splash')) {
    return 'splash'
  }

  if (game.players.some((player) => player.score > (state.previousScores.get(player.id) ?? player.score))) {
    return 'score'
  }

  return undefined
}

function getRenderPlayers(game: GameState): { matchPlayer: MatchPlayerState; state: PlayerState }[] {
  return game.players.map((matchPlayer, index) => ({
    matchPlayer,
    state: index === 0 ? game.player : matchPlayer.state,
  }))
}
