import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { PNG } from 'pngjs'

const CONTROL_CLICK_OPTIONS = { force: true } as const

async function clickControl(page: Page, testId: string): Promise<void> {
  const control = page.getByTestId(testId)

  await expect(control).toBeVisible()
  await control.click(CONTROL_CLICK_OPTIONS)
}

test.describe('Frogs and Flies 2 M0', () => {
  test.describe.configure({ mode: 'serial' })

  test('loads the PixiJS canvas and exposes start state markers', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('canvas')).toBeVisible()
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'start')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-time-of-day', 'day')
    await expect(page.getByTestId('round-timer')).toHaveAttribute('data-target-seconds', '180')
    await expect(page.getByTestId('round-seed')).toBeVisible()
    await expect(page.getByTestId('start-game')).toBeVisible()
    await expect(page.getByTestId('pause-game')).toBeVisible()
    await expect(page.getByTestId('resume-game')).toBeVisible()
    await expect(page.getByTestId('replay-game')).toBeVisible()
  })

  test('renders nonblank canvas content that fits the desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/?seed=123')

    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()

    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(1280)
    expect(box!.y + box!.height).toBeLessThanOrEqual(720)

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
  })

  test('loads generated gameplay assets into the PixiJS runtime', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/?seed=123')

    const canvas = page.locator('canvas')
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
    const assetLoadExpectation = { timeout: 30_000 }

    await expect(canvas).toHaveAttribute('data-assets-loaded', /pond-arena\.png/, assetLoadExpectation)
    await expect(canvas).toHaveAttribute('data-assets-loaded', /frog\.png/, assetLoadExpectation)
    await expect(canvas).toHaveAttribute('data-assets-loaded', /fly\.png/, assetLoadExpectation)
    await expect(canvas).toHaveAttribute('data-assets-loaded', /power\.png/, assetLoadExpectation)
  })

  test('starts, pauses, resumes, and replays a round from DOM controls', async ({ page }) => {
    await page.goto('/?seed=123')

    await clickControl(page, 'start-game')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'gameplay')

    await clickControl(page, 'pause-game')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'pause')

    await clickControl(page, 'resume-game')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'gameplay')

    await clickControl(page, 'pause-game')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'pause')

    await clickControl(page, 'replay-game')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'gameplay')
  })

  test('accepts keyboard and pointer input while gameplay is active', async ({ page }) => {
    await page.goto('/?seed=123')

    await page.keyboard.press('Enter')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'gameplay')

    await page.keyboard.press('KeyP')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'pause')

    await page.keyboard.press('KeyP')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'gameplay')

    await page.locator('canvas').click({ position: { x: 400, y: 300 } })
    await expect(page.getByTestId('score')).toBeVisible()
  })

  test('can force an ended smoke state and replay', async ({ page }) => {
    await page.goto('/?smokeState=results&seed=123')

    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results')
    await expect(page.getByTestId('results')).toBeVisible()
    await expect(page.getByTestId('results')).toHaveAttribute('data-winner', 'tie')

    await clickControl(page, 'replay-game')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'gameplay')
  })

  test('accepts deterministic 180 second day, dusk, night, and THE END simulation states', async ({ page }) => {
    test.setTimeout(60_000)

    const cases = [
      { elapsed: 0, phase: 'gameplay', timeOfDay: 'day' },
      { elapsed: 90, phase: 'gameplay', timeOfDay: 'dusk' },
      { elapsed: 150, phase: 'gameplay', timeOfDay: 'night' },
      { elapsed: 180, phase: 'the-end', timeOfDay: 'the-end' },
    ] as const

    for (const state of cases) {
      await page.goto(`/?seed=123&smokeElapsedSeconds=${state.elapsed}`)
      await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', state.phase)
      await expect(page.getByTestId('game-state')).toHaveAttribute('data-time-of-day', state.timeOfDay)
    }
  })

  test('plays through THE END and reaches results without a forced results state', async ({ page }) => {
    await page.goto('/?seed=123&durationSeconds=2&theEndSeconds=10&simulationSpeed=20')

    await clickControl(page, 'start-game')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'the-end', { timeout: 10_000 })
    await expect(page.getByText('THE END')).toBeVisible()
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 8_000 })
    await expect(page.getByTestId('results')).toBeVisible()
    await expect(page.getByTestId('results')).toHaveAttribute('data-winner', 'tie')
  })
})
