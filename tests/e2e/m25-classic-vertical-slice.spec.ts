import { expect, test } from '@playwright/test'

const REQUIRED_M25_ASSETS = [
  'home-pond-background.png',
  'lily-left.png',
  'lily-right.png',
  'frog-p1-idle.png',
  'frog-p2-idle.png',
  'fly-wing-a.png',
  'firefly-end.png',
] as const

test.describe('Frogs and Flies 2 M2.5 Classic Vertical Slice', () => {
  test('loads expanded Home Pond asset set into the PixiJS runtime', async ({ page }) => {
    await page.goto('/?seed=25&durationSeconds=3&theEndSeconds=0.1')

    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible()

    await expect
      .poll(async () => (await canvas.getAttribute('data-assets-loaded')) ?? '', { timeout: 30_000 })
      .toEqual(expect.stringContaining('home-pond-background.png'))

    const loadedAssets = (await canvas.getAttribute('data-assets-loaded')) ?? ''

    for (const asset of REQUIRED_M25_ASSETS) {
      expect(loadedAssets).toContain(asset)
    }
  })
})
