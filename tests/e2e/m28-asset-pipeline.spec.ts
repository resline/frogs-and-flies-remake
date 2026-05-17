import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { PNG } from 'pngjs'

test.use({ serviceWorkers: 'block' })

test.describe('M2.8 runtime asset pipeline', () => {
  test('loads the M2.8 gameplay art pack into the Pixi canvas', async ({ page }) => {
    await page.goto('/?seed=2801&durationSeconds=10&theEndSeconds=0.1')

    await expect(page.getByTestId('game-canvas')).toHaveAttribute('data-assets-pack', 'm28-v1')
    await expect(page.getByTestId('game-canvas')).toHaveAttribute(
      'data-assets-loaded',
      /m28-home-pond-background-v1\.png/,
    )

    await page.getByTestId('shell-play').click()
    await page.getByTestId('mode-classic-single').click()
    await page.getByTestId('start-game').click()

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'gameplay')
    await expectCanvasNonblank(page)
  })

  test('falls back when the M2.8 gameplay art pack is unavailable', async ({ page }) => {
    let blockedM28Background = false
    await page.route('**/assets/m28/m28-home-pond-background-v1.png', (route) => {
      blockedM28Background = true
      return route.abort()
    })
    await page.goto('/?seed=2802&durationSeconds=10&theEndSeconds=0.1')

    await expect(page.getByTestId('game-canvas')).toHaveAttribute('data-assets-pack', /.+/)
    expect(blockedM28Background).toBe(true)
    await expect(page.getByTestId('game-canvas')).toHaveAttribute('data-assets-pack', /legacy|procedural/)
    await expectCanvasNonblank(page)
  })
})

async function expectCanvasNonblank(page: Page): Promise<void> {
  const canvas = page.getByTestId('game-canvas')

  await expect(canvas).toBeVisible()

  const screenshot = PNG.sync.read(await canvas.screenshot())
  const seen = new Set<string>()
  const stride = Math.max(4, Math.floor(screenshot.data.length / 2000 / 4) * 4)

  for (let index = 0; index < screenshot.data.length; index += stride) {
    seen.add(
      `${screenshot.data[index]},${screenshot.data[index + 1]},${screenshot.data[index + 2]},${screenshot.data[index + 3]}`,
    )
  }

  expect(screenshot.width * screenshot.height).toBeGreaterThan(0)
  expect(seen.size).toBeGreaterThan(3)
}
