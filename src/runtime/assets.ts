import { Assets, type Texture } from 'pixi.js'

export type GeneratedGameplayAssets = {
  loadedPaths: readonly string[]
  pond: Texture
  frog: Texture
  fly: Texture
  power: Texture
}

export const GENERATED_GAMEPLAY_ASSET_PATHS = [
  '/assets/pond-arena.png',
  '/assets/frog.png',
  '/assets/fly.png',
  '/assets/power.png',
] as const

export async function loadGeneratedGameplayAssets(canvas: HTMLCanvasElement): Promise<GeneratedGameplayAssets | undefined> {
  try {
    const textures = await Assets.load<Texture>([...GENERATED_GAMEPLAY_ASSET_PATHS])

    canvas.setAttribute('data-assets-loaded', GENERATED_GAMEPLAY_ASSET_PATHS.join(' '))
    return {
      loadedPaths: GENERATED_GAMEPLAY_ASSET_PATHS,
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
