import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { PNG } from 'pngjs'

const RESPONSIVE_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 800, height: 600 },
  { width: 1024, height: 768 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
] as const

test.describe('M2.6 product shell flow', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.setTimeout(60_000)
    await page.goto('/?seed=26&durationSeconds=1&theEndSeconds=0.1&simulationSpeed=20')
  })

  test('boots into the shell and exposes main menu actions as native buttons', async ({ page }) => {
    const shell = page.getByTestId('m26-shell')

    await expect(shell).toBeVisible()
    await expect(shell).toHaveAttribute('data-shell-screen', /^(splash|main-menu)$/)
    await expect(shell).toHaveAttribute('data-selected-mode', 'classic-single')
    await expect(shell).toHaveAttribute('data-save-status', /^(loaded|defaulted|invalid|unsupported-version|storage-unavailable|saved)$/)
    await expect(shell).toHaveAttribute('data-storage-available', /^(true|false)$/)

    await expect(page.getByRole('button', { name: 'Campaign' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'High Scores' })).toBeVisible()
  })

  test('offers Classic Single and Local Versus only in mode select', async ({ page }) => {
    await page.getByRole('button', { name: 'Play', exact: true }).click()

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'mode-select')
    await expect(page.getByRole('button', { name: 'Classic Single' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Local Versus' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Campaign|Online|Tournament|Practice/ })).toHaveCount(0)
  })

  test('exposes product settings controls', async ({ page }) => {
    await page.getByTestId('shell-settings').click()

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'settings')
    await expect(page.getByTestId('difficulty-classic-assist')).toBeVisible()
    await expect(page.getByTestId('difficulty-classic-standard')).toBeVisible()
    await expect(page.getByTestId('difficulty-classic-expert')).toBeVisible()
    await expect(page.getByTestId('option-show-timer')).toBeVisible()
    await expect(page.getByTestId('option-reduced-motion')).toBeVisible()
    await expect(page.getByTestId('option-high-contrast')).toBeVisible()
    await expect(page.getByTestId('option-mute')).toBeVisible()
    await expect(page.getByTestId('option-volume')).toBeVisible()
    await expect(page.getByTestId('input-profile-select')).toBeVisible()
  })

  test('starts gameplay, pauses, and exposes pause actions', async ({ page }) => {
    await page.goto('/?seed=26&durationSeconds=10&theEndSeconds=0.1')
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await page.getByRole('button', { name: 'Classic Single' }).click()
    await page.getByRole('button', { name: 'Start' }).click()

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'gameplay')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'gameplay')
    await expect(page.getByTestId('game-canvas')).toBeVisible()

    await page.getByRole('button', { name: 'Pause' }).click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'pause')
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Restart' })).toBeVisible()
    await expect(page.getByTestId('pause-settings')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Main Menu' })).toBeVisible()
  })

  test('starts gameplay through shell tracking from keyboard Enter', async ({ page }) => {
    await page.goto('/?seed=126&durationSeconds=10&theEndSeconds=0.1')

    await page.keyboard.press('Enter')

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'gameplay')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'gameplay')
    expect(await readSavedRoundTracking(page)).toMatchObject({
      roundsStarted: 1,
      startedRoundCount: 1,
    })
  })

  test('starts gameplay through shell tracking from canvas pointer input', async ({ page }) => {
    await page.goto('/?seed=127&durationSeconds=10&theEndSeconds=0.1')

    await page.getByTestId('game-canvas').click({ position: { x: 400, y: 300 } })

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'gameplay')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'gameplay')
    expect(await readSavedRoundTracking(page)).toMatchObject({
      roundsStarted: 1,
      startedRoundCount: 1,
    })
  })

  test('shows complete local results actions and high-score status', async ({ page }) => {
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await page.getByRole('button', { name: 'Classic Single' }).click()
    await page.getByRole('button', { name: 'Start' }).click()

    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'results')
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-round-recorded', 'true')

    const results = page.getByTestId('results')
    await expect(results).toBeVisible()
    await expect(page.getByTestId('results-winner')).toContainText(/Winner:/)
    await expect(page.getByTestId('results-p1-score')).toContainText(/P1:/)
    await expect(page.getByTestId('results-p2-score')).toContainText(/P2|CPU:/)
    await expect(page.getByTestId('results-p1-stats')).toContainText(/caught .* attempts .* accuracy .* combo/i)
    await expect(page.getByTestId('results-high-score-status')).toContainText(/local high score/i)
    await expect(page.getByRole('button', { name: 'Replay' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Change Mode' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Main Menu' })).toBeVisible()
  })

  test('uses local-only wording for high scores', async ({ page }) => {
    await page.getByRole('button', { name: 'High Scores' }).click()

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'high-scores')
    await expect(page.getByTestId('high-scores-panel')).toContainText(/local/i)
    await expect(page.getByTestId('high-scores-panel')).not.toContainText(/online|global|account|cloud/i)
  })

  for (const viewport of RESPONSIVE_VIEWPORTS) {
    test(`keeps shell screens and native controls within the ${viewport.width}x${viewport.height} viewport`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/?seed=2617&durationSeconds=10&theEndSeconds=0.1')
      await expectShellScreenFits(page, viewport, `${viewport.width}x${viewport.height} main menu`)

      await page.getByTestId('shell-settings').click({ force: true })
      await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'settings')
      await expectShellScreenFits(page, viewport, `${viewport.width}x${viewport.height} settings`)

      await page.goto('/?seed=2618&durationSeconds=10&theEndSeconds=0.1')
      await page.getByTestId('shell-play').click({ force: true })
      await page.getByTestId('mode-classic-single').click({ force: true })
      await page.getByTestId('start-game').click({ force: true })
      await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'gameplay')
      await expectShellScreenFits(page, viewport, `${viewport.width}x${viewport.height} gameplay`)
      await expectCanvasNonblank(page)

      await page.getByTestId('pause-game').click({ force: true })
      await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'pause')
      await expectShellScreenFits(page, viewport, `${viewport.width}x${viewport.height} pause`)

      await page.goto('/?seed=2619&smokeState=results')
      await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'results')
      await expectShellScreenFits(page, viewport, `${viewport.width}x${viewport.height} results`)

      await page.goto('/?seed=2620&durationSeconds=10&theEndSeconds=0.1')
      await page.getByTestId('shell-high-scores').click({ force: true })
      await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'high-scores')
      await expectShellScreenFits(page, viewport, `${viewport.width}x${viewport.height} high scores`)
    })
  }
})

async function readSavedRoundTracking(page: import('@playwright/test').Page): Promise<{
  roundsStarted?: number
  startedRoundCount?: number
}> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('frogs-and-flies.save.v2')
    if (!raw) {
      return {}
    }
    const save = JSON.parse(raw)
    return {
      roundsStarted: save.stats?.roundsStarted,
      startedRoundCount: save.startedRoundIds?.length,
    }
  })
}

async function expectShellScreenFits(
  page: Page,
  viewport: { width: number; height: number },
  screenName: string,
): Promise<void> {
  const boxes = await page.locator('button:visible, input:visible, select:visible').evaluateAll((elements) => {
    return elements.map((element, index) => {
      const rect = element.getBoundingClientRect()
      const testId = element.getAttribute('data-testid')
      const text = element.textContent?.trim()

      return {
        name: testId || text || `${index + 1}`,
        box: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
      }
    })
  })

  expect(boxes.length, `${screenName} visible native controls`).toBeGreaterThan(0)

  for (const { name, box } of boxes) {
    expect(box.width, `${screenName} ${name} width`).toBeGreaterThan(0)
    expect(box.height, `${screenName} ${name} height`).toBeGreaterThan(0)
    expectBoxFitsViewport(name, box, viewport)
  }

  for (let left = 0; left < boxes.length; left += 1) {
    for (let right = left + 1; right < boxes.length; right += 1) {
      expect(boxesOverlap(boxes[left].box, boxes[right].box), `${boxes[left].name} overlaps ${boxes[right].name}`).toBe(false)
    }
  }
}

type Box = { x: number; y: number; width: number; height: number }

function expectBoxFitsViewport(name: string, box: Box, viewport: { width: number; height: number }): void {
  const tolerance = 1

  expect(box.x, `${name} should fit horizontally`).toBeGreaterThanOrEqual(-tolerance)
  expect(box.y, `${name} should fit vertically`).toBeGreaterThanOrEqual(-tolerance)
  expect(box.x + box.width, `${name} should fit horizontally`).toBeLessThanOrEqual(viewport.width + tolerance)
  expect(box.y + box.height, `${name} should fit vertically`).toBeLessThanOrEqual(viewport.height + tolerance)
}

function boxesOverlap(a: Box, b: Box): boolean {
  const tolerance = 1

  return (
    a.x < b.x + b.width - tolerance &&
    a.x + a.width > b.x + tolerance &&
    a.y < b.y + b.height - tolerance &&
    a.y + a.height > b.y + tolerance
  )
}

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
