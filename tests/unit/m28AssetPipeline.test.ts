import { describe, expect, it } from 'vitest'
import {
  LEGACY_GAMEPLAY_ASSET_PATHS,
  M28_CAMPAIGN_UI_ASSET_PATHS,
  M28_GAMEPLAY_ASSET_PATHS,
  M28_PROLOGUE_ASSET_PATH_BY_TONE,
  M28_REQUIRED_VISUAL_ASSET_PATHS,
} from '../../src/runtime/assets'

describe('M2.8 asset path contract', () => {
  it('declares the generated Home Pond gameplay asset paths without replacing legacy loading yet', () => {
    expect(M28_GAMEPLAY_ASSET_PATHS).toEqual([
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
    ])
    expect(LEGACY_GAMEPLAY_ASSET_PATHS).toEqual(expect.arrayContaining(['/assets/home-pond-background.png']))
  })

  it('declares prologue art paths for the existing campaign visual tones', () => {
    expect(M28_PROLOGUE_ASSET_PATH_BY_TONE).toEqual({
      dawn: '/assets/m28/m28-prologue-dawn-v1.png',
      day: '/assets/m28/m28-prologue-day-v1.png',
      dusk: '/assets/m28/m28-prologue-dusk-v1.png',
    })
  })

  it('declares campaign UI icon paths and a complete visual asset path list', () => {
    expect(M28_CAMPAIGN_UI_ASSET_PATHS).toEqual([
      '/assets/m28/m28-ui-star-filled-v1.png',
      '/assets/m28/m28-ui-star-empty-v1.png',
      '/assets/m28/m28-ui-lock-v1.png',
      '/assets/m28/m28-ui-cleared-v1.png',
    ])
    expect(M28_REQUIRED_VISUAL_ASSET_PATHS).toEqual([
      ...M28_GAMEPLAY_ASSET_PATHS,
      ...Object.values(M28_PROLOGUE_ASSET_PATH_BY_TONE),
      ...M28_CAMPAIGN_UI_ASSET_PATHS,
    ])
  })
})
