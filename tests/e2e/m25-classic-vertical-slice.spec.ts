import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

const REQUIRED_M25_ASSETS = [
  'home-pond-background.png',
  'lily-left.png',
  'lily-right.png',
  'frog-p1-idle.png',
  'frog-p2-idle.png',
  'fly-wing-a.png',
  'firefly-end.png',
] as const

const TAB_SEQUENCE = [
  'mode-classic-single',
  'mode-local-versus',
  'difficulty-classic-assist',
  'difficulty-classic-standard',
  'difficulty-classic-expert',
  'start-game',
  'pause-game',
  'option-mute',
  'option-volume',
  'replay-game',
] as const

const RESPONSIVE_VIEWPORTS = [
  { width: 800, height: 600 },
  { width: 1024, height: 768 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
] as const

test.describe('Frogs and Flies 2 M2.5 Classic Vertical Slice', () => {
  test.describe.configure({ mode: 'serial' })

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

  test('exposes keyboard-accessible controls and option state markers', async ({ page }) => {
    await page.goto('/?seed=25&difficulty=classic-standard&reducedMotion=0&highContrast=0&mute=0&volume=0.75')

    await expect(page.getByTestId('game-canvas')).toHaveAccessibleName('Frogs and Flies classic match canvas')
    await expect(page.getByTestId('mode-classic-single')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('mode-local-versus')).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByTestId('difficulty-classic-standard')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('option-mute')).toHaveAttribute('aria-checked', 'false')
    await expect(page.getByTestId('option-volume')).toHaveAttribute('aria-valuenow', '0.75')

    await page.keyboard.press('Tab')
    for (const testId of TAB_SEQUENCE) {
      await expectFocusedTestId(page, testId)
      await page.keyboard.press('Tab')
    }
  })

  test('updates reduced-motion and high-contrast DOM and render markers', async ({ page }) => {
    await page.goto('/?seed=25&reducedMotion=0&highContrast=0')

    const shell = page.locator('.game-shell')
    const canvas = page.getByTestId('game-canvas')

    await expect(shell).toHaveAttribute('data-reduced-motion', 'false')
    await expect(shell).toHaveAttribute('data-high-contrast', 'false')
    await expect(canvas).toHaveAttribute('data-render-reduced-motion', 'false')
    await expect(canvas).toHaveAttribute('data-render-high-contrast', 'false')

    await page.getByTestId('option-reduced-motion').check()
    await page.getByTestId('option-high-contrast').check()

    await expect(shell).toHaveAttribute('data-reduced-motion', 'true')
    await expect(shell).toHaveAttribute('data-high-contrast', 'true')
    await expect(canvas).toHaveAttribute('data-reduced-motion', 'true')
    await expect(canvas).toHaveAttribute('data-high-contrast', 'true')
    await expect(canvas).toHaveAttribute('data-render-reduced-motion', 'true')
    await expect(canvas).toHaveAttribute('data-render-high-contrast', 'true')
  })

  for (const viewport of RESPONSIVE_VIEWPORTS) {
    test(`keeps HUD, controls, canvas, and results readable without overlap at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await page.goto('/?seed=25&smokeState=results')

      const canvas = page.getByTestId('game-canvas')
      const hud = page.getByTestId('m25-hud')
      const controls = page.getByTestId('m25-controls')
      const results = page.getByTestId('results')

      await expect(canvas).toBeVisible()
      await expect(hud).toBeVisible()
      await expect(controls).toBeVisible()
      await expect(results).toBeVisible()

      await expectNoOverlap(hud, controls)
      await expectNoOverlap(results, controls)

      const canvasBox = await requiredBox(canvas)
      const hudBox = await requiredBox(hud)
      const controlsBox = await requiredBox(controls)
      const resultsBox = await requiredBox(results)
      const jumpBandTop = canvasBox.y + canvasBox.height * 0.35
      const jumpBandBottom = canvasBox.y + canvasBox.height * 0.86

      for (const [name, box] of [
        ['hud', hudBox],
        ['controls', controlsBox],
        ['results', resultsBox],
      ] as const) {
        expect(box.x, `${name} should fit horizontally`).toBeGreaterThanOrEqual(0)
        expect(box.y, `${name} should fit vertically`).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width, `${name} should fit horizontally`).toBeLessThanOrEqual(viewport.width)
        expect(box.y + box.height, `${name} should fit vertically`).toBeLessThanOrEqual(viewport.height)
        expect(
          overlapsVertically(box, { y: jumpBandTop, height: jumpBandBottom - jumpBandTop }),
          `${name} should avoid the primary canvas jump band`,
        ).toBe(false)
      }
    })
  }
})

async function expectFocusedTestId(page: Page, testId: string): Promise<void> {
  await expect(page.locator(`[data-testid="${testId}"]`)).toBeFocused()
}

async function expectNoOverlap(first: Locator, second: Locator): Promise<void> {
  const firstBox = await requiredBox(first)
  const secondBox = await requiredBox(second)

  expect(rectanglesOverlap(firstBox, secondBox)).toBe(false)
}

async function requiredBox(locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  const box = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    }
  })

  expect(box.width).toBeGreaterThan(0)
  expect(box.height).toBeGreaterThan(0)
  return box
}

function rectanglesOverlap(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number },
): boolean {
  return !(
    first.x + first.width <= second.x ||
    second.x + second.width <= first.x ||
    first.y + first.height <= second.y ||
    second.y + second.height <= first.y
  )
}

function overlapsVertically(box: { y: number; height: number }, band: { y: number; height: number }): boolean {
  return box.y < band.y + band.height && box.y + box.height > band.y
}
