import { Assets, type Texture } from 'pixi.js'

export type GeneratedGameplayAssets = {
  loadedPaths: readonly string[]
  homePondBackground: Texture
  lilyLeft: Texture
  lilyRight: Texture
  frogP1Idle: Texture
  frogP1Crouch: Texture
  frogP1Airborne: Texture
  frogP1Tongue: Texture
  frogP1Splash: Texture
  frogP2Idle: Texture
  frogP2Crouch: Texture
  frogP2Airborne: Texture
  frogP2Tongue: Texture
  frogP2Splash: Texture
  flyWingA: Texture
  flyWingB: Texture
  fireflyEnd: Texture
  splashRing: Texture
  catchPop: Texture
  tongueFlash: Texture
  pond: Texture
  frog: Texture
  fly: Texture
  power: Texture
}

export const GENERATED_GAMEPLAY_ASSET_PATHS = [
  '/assets/home-pond-background.png',
  '/assets/lily-left.png',
  '/assets/lily-right.png',
  '/assets/frog-p1-idle.png',
  '/assets/frog-p1-crouch.png',
  '/assets/frog-p1-airborne.png',
  '/assets/frog-p1-tongue.png',
  '/assets/frog-p1-splash.png',
  '/assets/frog-p2-idle.png',
  '/assets/frog-p2-crouch.png',
  '/assets/frog-p2-airborne.png',
  '/assets/frog-p2-tongue.png',
  '/assets/frog-p2-splash.png',
  '/assets/fly-wing-a.png',
  '/assets/fly-wing-b.png',
  '/assets/firefly-end.png',
  '/assets/splash-ring.png',
  '/assets/catch-pop.png',
  '/assets/tongue-flash.png',
  '/assets/pond-arena.png',
  '/assets/frog.png',
  '/assets/fly.png',
  '/assets/power.png',
] as const

export const LEGACY_GAMEPLAY_ASSET_PATHS = GENERATED_GAMEPLAY_ASSET_PATHS

export const M28_GAMEPLAY_ASSET_PATHS = [
  '/assets/m28/m28-home-pond-background-v1.png',
  '/assets/m28/m28-lily-left-v1.png',
  '/assets/m28/m28-lily-right-v1.png',
  '/assets/m28/m28-frog-p1-idle-v1.png',
  '/assets/m28/m28-frog-p1-crouch-v1.png',
  '/assets/m28/m28-frog-p1-airborne-v1.png',
  '/assets/m28/m28-frog-p1-tongue-v1.png',
  '/assets/m28/m28-frog-p1-splash-v1.png',
  '/assets/m28/m28-frog-p2-idle-v1.png',
  '/assets/m28/m28-frog-p2-crouch-v1.png',
  '/assets/m28/m28-frog-p2-airborne-v1.png',
  '/assets/m28/m28-frog-p2-tongue-v1.png',
  '/assets/m28/m28-frog-p2-splash-v1.png',
  '/assets/m28/m28-fly-wing-a-v1.png',
  '/assets/m28/m28-fly-wing-b-v1.png',
  '/assets/m28/m28-firefly-end-v1.png',
  '/assets/m28/m28-splash-ring-v1.png',
  '/assets/m28/m28-catch-pop-v1.png',
  '/assets/m28/m28-tongue-flash-v1.png',
  '/assets/m28/m28-rush-power-v1.png',
] as const

export const M28_PROLOGUE_ASSET_PATH_BY_TONE = {
  dawn: '/assets/m28/m28-prologue-dawn-v1.png',
  day: '/assets/m28/m28-prologue-day-v1.png',
  dusk: '/assets/m28/m28-prologue-dusk-v1.png',
} as const

export const M28_CAMPAIGN_UI_ASSET_PATHS = [
  '/assets/m28/m28-ui-star-filled-v1.png',
  '/assets/m28/m28-ui-star-empty-v1.png',
  '/assets/m28/m28-ui-lock-v1.png',
  '/assets/m28/m28-ui-cleared-v1.png',
] as const

export const M28_REQUIRED_VISUAL_ASSET_PATHS = [
  ...M28_GAMEPLAY_ASSET_PATHS,
  ...Object.values(M28_PROLOGUE_ASSET_PATH_BY_TONE),
  ...M28_CAMPAIGN_UI_ASSET_PATHS,
] as const

export async function loadGeneratedGameplayAssets(canvas: HTMLCanvasElement): Promise<GeneratedGameplayAssets | undefined> {
  try {
    const textures = await Assets.load<Texture>([...GENERATED_GAMEPLAY_ASSET_PATHS])

    canvas.setAttribute('data-assets-loaded', GENERATED_GAMEPLAY_ASSET_PATHS.join(' '))
    return {
      loadedPaths: GENERATED_GAMEPLAY_ASSET_PATHS,
      homePondBackground: textures['/assets/home-pond-background.png'],
      lilyLeft: textures['/assets/lily-left.png'],
      lilyRight: textures['/assets/lily-right.png'],
      frogP1Idle: textures['/assets/frog-p1-idle.png'],
      frogP1Crouch: textures['/assets/frog-p1-crouch.png'],
      frogP1Airborne: textures['/assets/frog-p1-airborne.png'],
      frogP1Tongue: textures['/assets/frog-p1-tongue.png'],
      frogP1Splash: textures['/assets/frog-p1-splash.png'],
      frogP2Idle: textures['/assets/frog-p2-idle.png'],
      frogP2Crouch: textures['/assets/frog-p2-crouch.png'],
      frogP2Airborne: textures['/assets/frog-p2-airborne.png'],
      frogP2Tongue: textures['/assets/frog-p2-tongue.png'],
      frogP2Splash: textures['/assets/frog-p2-splash.png'],
      flyWingA: textures['/assets/fly-wing-a.png'],
      flyWingB: textures['/assets/fly-wing-b.png'],
      fireflyEnd: textures['/assets/firefly-end.png'],
      splashRing: textures['/assets/splash-ring.png'],
      catchPop: textures['/assets/catch-pop.png'],
      tongueFlash: textures['/assets/tongue-flash.png'],
      pond: textures['/assets/pond-arena.png'],
      frog: textures['/assets/frog.png'],
      fly: textures['/assets/fly.png'],
      power: textures['/assets/power.png'],
    }
  } catch (error) {
    canvas.removeAttribute('data-assets-loaded')
    console.warn('Generated gameplay assets failed to load; using procedural fallback.', error)
    return undefined
  }
}
