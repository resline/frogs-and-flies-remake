import { expect, test } from '@playwright/test'

type LongTaskWindow = Window & {
  __m26LongTasks?: number[]
  __m26LongTaskSupported?: boolean
}

test.describe('M2.6 performance smoke', () => {
  test('boots shell quickly and handles a short deterministic round without extreme main-thread stalls', async ({ page }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })
    page.on('pageerror', (error) => pageErrors.push(error.message))

    const bootStartedAt = Date.now()
    await page.goto('/?seed=2621&durationSeconds=2&theEndSeconds=0.1&simulationSpeed=20', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('m26-shell')).toBeVisible({ timeout: 3_000 })
    expect(Date.now() - bootStartedAt, 'shell boot time ms').toBeLessThanOrEqual(3_000)

    await installLongTaskObserver(page)

    await page.getByTestId('shell-play').click()
    await page.getByTestId('mode-classic-single').click()
    await page.getByTestId('start-game').click()
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 8_000 })

    const longTaskDurations = await readLongTaskDurations(page)
    if (longTaskDurations) {
      const longestTask = Math.max(0, ...longTaskDurations)
      expect(longestTask, 'longest interaction long task ms').toBeLessThanOrEqual(2_000)
    }

    expect(consoleErrors, 'console errors').toEqual([])
    expect(pageErrors, 'page errors').toEqual([])
  })

  test('opens campaign and prologue from bundled local data without heavy stalls', async ({ page }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })
    page.on('pageerror', (error) => pageErrors.push(error.message))

    await page.goto('/?seed=2721&durationSeconds=2&theEndSeconds=0.1&simulationSpeed=20', {
      waitUntil: 'domcontentloaded',
    })
    await expect(page.getByTestId('m26-shell')).toBeVisible({ timeout: 3_000 })

    await installLongTaskObserver(page)
    const openedAt = Date.now()
    await page.getByTestId('shell-campaign').click()
    await expect(page.getByTestId('campaign-home-pond')).toBeVisible()
    await page.getByTestId('campaign-start-prologue').click()
    await expect(page.getByTestId('campaign-prologue')).toBeVisible()
    expect(Date.now() - openedAt, 'campaign/prologue interaction time ms').toBeLessThanOrEqual(3_000)

    const longTaskDurations = await readLongTaskDurations(page)
    if (longTaskDurations) {
      const longestTask = Math.max(0, ...longTaskDurations)
      expect(longestTask, 'longest campaign interaction long task ms').toBeLessThanOrEqual(1_000)
    }

    expect(consoleErrors, 'console errors').toEqual([])
    expect(pageErrors, 'page errors').toEqual([])
  })
})

async function installLongTaskObserver(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    const target = window as LongTaskWindow
    target.__m26LongTasks = []
    target.__m26LongTaskSupported = PerformanceObserver.supportedEntryTypes?.includes('longtask') ?? false
    if (!target.__m26LongTaskSupported) {
      return
    }

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        target.__m26LongTasks?.push(entry.duration)
      }
    })
    observer.observe({ type: 'longtask', buffered: true })
  })
}

async function readLongTaskDurations(page: import('@playwright/test').Page): Promise<number[] | undefined> {
  return page.evaluate(() => {
    const target = window as LongTaskWindow
    return target.__m26LongTaskSupported ? target.__m26LongTasks ?? [] : undefined
  })
}
