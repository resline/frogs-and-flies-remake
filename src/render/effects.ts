import { Sprite, Graphics } from 'pixi.js'
import { ARENA_HEIGHT, ARENA_WIDTH } from '../game/constants'
import type { GameState, MatchPlayerState, PlayerState } from '../game/types'
import type { GeneratedGameplayAssets } from '../runtime/assets'
import { paletteFor } from './palette'

export type RenderEffectMarker = 'catch' | 'miss' | 'splash' | 'score'

export type BitmapEffectSprites = {
  splash: Sprite
  catchPop: Sprite
  tongueFlash: Sprite
  fireflyEnd: Sprite
}

export type RenderEffectState = {
  lastEffect?: RenderEffectMarker
  previousScores: Map<string, number>
  previousVisibleScores: Map<string, number>
}

type RenderEffectOptions = {
  reducedMotion: boolean
  highContrast: boolean
}

export function createRenderEffectState(): RenderEffectState {
  return {
    previousScores: new Map(),
    previousVisibleScores: new Map(),
  }
}

export function createBitmapEffectSprites(): BitmapEffectSprites {
  return {
    splash: createEffectSprite('splash-ring'),
    catchPop: createEffectSprite('catch-pop'),
    tongueFlash: createEffectSprite('tongue-flash'),
    fireflyEnd: createEffectSprite('firefly-end'),
  }
}

export function hideBitmapEffectSprites(sprites: BitmapEffectSprites): void {
  for (const sprite of Object.values(sprites)) {
    sprite.visible = false
  }
}

export function drawEffects(
  scene: Graphics,
  game: GameState,
  state: RenderEffectState,
  options: RenderEffectOptions = { reducedMotion: false, highContrast: false },
): RenderEffectMarker | undefined {
  scene.clear()

  const palette = paletteFor(game.timeOfDay)
  const lastEffect = selectLastEffect(game, state)

  drawArenaEffects(scene, game, options)
  drawTongueEffects(scene, game, options)
  drawScoreEffects(scene, game, state, lastEffect === 'score', options)
  drawSplashEffects(scene, game, options)
  drawTimeTint(scene, game, palette.tint, palette.tintAlpha)
  drawEndFlourish(scene, game, palette.flourish, options)

  state.lastEffect = lastEffect ?? state.lastEffect
  return state.lastEffect
}

export function drawBitmapEffectSprites(
  sprites: BitmapEffectSprites,
  game: GameState,
  state: RenderEffectState,
  assets: GeneratedGameplayAssets,
  options: RenderEffectOptions = { reducedMotion: false, highContrast: false },
): void {
  hideBitmapEffectSprites(sprites)
  drawBitmapTongueFlash(sprites, game, assets, options)
  drawBitmapCatchPop(sprites, game, assets, options)
  drawBitmapSplash(sprites, game, assets, options)
  drawBitmapEndFirefly(sprites, game, assets, options)
  state.lastEffect = state.lastEffect
}

function drawArenaEffects(scene: Graphics, game: GameState, options: RenderEffectOptions): void {
  const palette = paletteFor(game.timeOfDay)

  scene.rect(0, 0, ARENA_WIDTH, 82).fill({ color: palette.hud, alpha: 0.34 })
  scene.rect(0, ARENA_HEIGHT - 90, ARENA_WIDTH, 90).fill({ color: 0x05221c, alpha: 0.26 })

  for (let index = 0; index < 9; index += 1) {
    const x = 74 + index * 86
    const y = 230 + ((index * 47 + game.seed) % 210)
    scene.ellipse(x, y, 38, 9).fill({ color: options.highContrast ? 0xc9fff4 : palette.ripple, alpha: options.reducedMotion ? 0.14 : 0.2 })
  }

  scene.ellipse(116, ARENA_HEIGHT - 74, 84, 28).fill({ color: 0x2e7d45, alpha: 0.52 })
  scene.ellipse(ARENA_WIDTH - 116, ARENA_HEIGHT - 74, 84, 28).fill({ color: 0x2b7340, alpha: 0.52 })

  if (game.phase === 'gameplay') {
    for (const [index, player] of getRenderPlayers(game).entries()) {
      const powered = player.matchPlayer.power.remainingSeconds > 0 || (index === 0 && game.power.remainingSeconds > 0)
      scene.circle(player.state.x, player.state.y, player.matchPlayer.catchRadius).stroke({
        width: 2,
        color: powered ? 0xd9ff71 : options.highContrast ? 0xffffff : 0x9fe8ff,
        alpha: options.highContrast ? 0.42 : 0.25,
      })
    }
  }
}

function drawTongueEffects(scene: Graphics, game: GameState, options: RenderEffectOptions): void {
  for (const player of getRenderPlayers(game)) {
    const tongue = player.state.tongue
    if (tongue.phase !== 'extended' && tongue.phase !== 'recovering') {
      continue
    }

    const color = tongue.result === 'catch' ? 0xffe36a : tongue.result === 'miss' ? 0xff6b8a : options.highContrast ? 0xffffff : 0xff9eb6
    const alpha = options.reducedMotion ? 0.6 : tongue.phase === 'extended' ? 0.78 : 0.46
    scene.moveTo(tongue.originX, tongue.originY)
    scene.lineTo(tongue.tipX, tongue.tipY)
    scene.stroke({ width: options.highContrast ? 7 : tongue.result === 'catch' ? 6 : 4, color, alpha })
    if (!options.reducedMotion) {
      scene.circle(tongue.tipX, tongue.tipY, tongue.result === 'catch' ? 12 : 8).fill({ color, alpha: tongue.result ? 0.28 : 0.16 })
    }
  }
}

function drawBitmapTongueFlash(
  sprites: BitmapEffectSprites,
  game: GameState,
  assets: GeneratedGameplayAssets,
  options: RenderEffectOptions,
): void {
  const player = getRenderPlayers(game).find(({ state }) => state.tongue.phase === 'extended' || state.tongue.phase === 'recovering')
  if (!player) {
    return
  }

  const tongue = player.state.tongue
  const dx = tongue.tipX - tongue.originX
  const dy = tongue.tipY - tongue.originY
  const distance = Math.max(28, Math.hypot(dx, dy))

  sprites.tongueFlash.visible = true
  sprites.tongueFlash.texture = assets.tongueFlash
  sprites.tongueFlash.position.set(tongue.originX + dx * 0.5, tongue.originY + dy * 0.5)
  sprites.tongueFlash.width = distance
  sprites.tongueFlash.height = options.highContrast ? 22 : 18
  sprites.tongueFlash.rotation = Math.atan2(dy, dx)
  sprites.tongueFlash.alpha = options.reducedMotion ? 0.48 : tongue.phase === 'extended' ? 0.76 : 0.42
}

function drawBitmapCatchPop(
  sprites: BitmapEffectSprites,
  game: GameState,
  assets: GeneratedGameplayAssets,
  options: RenderEffectOptions,
): void {
  const player = getRenderPlayers(game).find(({ state }) => state.tongue.result === 'catch')
  if (!player) {
    return
  }

  sprites.catchPop.visible = true
  sprites.catchPop.texture = assets.catchPop
  sprites.catchPop.position.set(player.state.tongue.tipX, player.state.tongue.tipY)
  sprites.catchPop.width = 56
  sprites.catchPop.height = 56
  sprites.catchPop.rotation = options.reducedMotion ? 0 : game.elapsedSeconds * 4
  sprites.catchPop.alpha = options.reducedMotion ? 0.58 : 0.82
}

function drawBitmapSplash(
  sprites: BitmapEffectSprites,
  game: GameState,
  assets: GeneratedGameplayAssets,
  options: RenderEffectOptions,
): void {
  const player = getRenderPlayers(game).find(({ matchPlayer }) => matchPlayer.water.phase === 'splash')
  if (!player) {
    return
  }

  const progress = options.reducedMotion ? 0.35 : Math.min(1, player.matchPlayer.water.splashSeconds / 0.3)
  const size = 92 + progress * 74

  sprites.splash.visible = true
  sprites.splash.texture = assets.splashRing
  sprites.splash.position.set(player.state.x, player.state.groundY + 10)
  sprites.splash.width = size
  sprites.splash.height = size
  sprites.splash.alpha = 0.76 - progress * 0.24
}

function drawBitmapEndFirefly(
  sprites: BitmapEffectSprites,
  game: GameState,
  assets: GeneratedGameplayAssets,
  options: RenderEffectOptions,
): void {
  if (game.phase !== 'the-end' && game.phase !== 'results') {
    return
  }

  const pulse = options.reducedMotion
    ? 0.65
    : game.phase === 'the-end'
      ? Math.min(1, game.theEndElapsedSeconds / Math.max(0.1, game.theEndSeconds))
      : 1
  const size = 96 + pulse * 40

  sprites.fireflyEnd.visible = true
  sprites.fireflyEnd.texture = assets.fireflyEnd
  sprites.fireflyEnd.position.set(ARENA_WIDTH / 2, ARENA_HEIGHT / 2 - 62)
  sprites.fireflyEnd.width = size
  sprites.fireflyEnd.height = size
  sprites.fireflyEnd.alpha = 0.84
}

function drawScoreEffects(
  scene: Graphics,
  game: GameState,
  state: RenderEffectState,
  consumeScoreIncrease: boolean,
  options: RenderEffectOptions,
): void {
  for (const player of game.players) {
    const previousScore = state.previousScores.get(player.id) ?? player.score
    const scoreIncreasedForMarker = player.score > previousScore
    const previousVisibleScore = state.previousVisibleScores.get(player.id) ?? player.score
    if (player.score > previousVisibleScore) {
      scene.circle(player.state.x, player.state.y - 58, options.reducedMotion ? 14 : 18).fill({ color: 0xfff178, alpha: options.reducedMotion ? 0.24 : 0.38 })
      scene.rect(player.state.x - 18, player.state.y - 80, 36, 5).fill({ color: options.highContrast ? 0xffffff : 0xfff178, alpha: 0.56 })
    }
    state.previousVisibleScores.set(player.id, player.score)
    if (!scoreIncreasedForMarker || consumeScoreIncrease) {
      state.previousScores.set(player.id, player.score)
    }
  }
}

function drawSplashEffects(scene: Graphics, game: GameState, options: RenderEffectOptions): void {
  for (const player of getRenderPlayers(game)) {
    const water = player.matchPlayer.water
    if (water.phase !== 'splash') {
      continue
    }

    const progress = options.reducedMotion ? 0.35 : Math.min(1, water.splashSeconds / 0.3)
    const radius = player.state.radius + 18 + progress * 28
    scene.ellipse(player.state.x, player.state.groundY + 7, radius, 12 + progress * 8).stroke({
      width: options.highContrast ? 5 : 4,
      color: options.highContrast ? 0xffffff : 0xbdf4ff,
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

function drawEndFlourish(scene: Graphics, game: GameState, color: number, options: RenderEffectOptions): void {
  if (game.phase !== 'the-end' && game.phase !== 'results') {
    return
  }

  const pulse = options.reducedMotion
    ? 0.65
    : game.phase === 'the-end'
      ? Math.min(1, game.theEndElapsedSeconds / Math.max(0.1, game.theEndSeconds))
      : 1
  scene.rect(0, 0, ARENA_WIDTH, ARENA_HEIGHT).fill({ color: 0x140912, alpha: 0.16 })
  scene.circle(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 70 + pulse * 90).stroke({ width: options.highContrast ? 6 : 5, color: options.highContrast ? 0xffffff : color, alpha: options.reducedMotion ? 0.18 : 0.28 })
  if (!options.reducedMotion) {
    scene.circle(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 124 + pulse * 120).stroke({ width: 3, color, alpha: 0.18 })
  }
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

function createEffectSprite(label: string): Sprite {
  const sprite = new Sprite()
  sprite.anchor.set(0.5)
  sprite.visible = false
  sprite.label = label
  return sprite
}
