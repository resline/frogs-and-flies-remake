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

const CONTROL_CLICK_OPTIONS = { force: true } as const

const TAB_SEQUENCE = [
  'shell-campaign',
  'shell-play',
  'shell-settings',
  'shell-high-scores',
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
    test.setTimeout(60_000)

    await page.goto('/?seed=25&durationSeconds=3&theEndSeconds=0.1')

    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible()

    await expect
      .poll(
        async () => {
          const loadedAssets = (await canvas.getAttribute('data-assets-loaded')) ?? ''
          return REQUIRED_M25_ASSETS.every((asset) => loadedAssets.includes(asset))
        },
        { timeout: 45_000 },
      )
      .toBe(true)

    await startFromShell(page)
    await expect(canvas).toHaveAttribute('data-assets-loaded', /home-pond-background\.png/)
  })

  test('starts Classic Single on left/right lilies and exposes Local Versus human players', async ({ page }) => {
    await page.goto('/?seed=25&mode=classic-single')

    const state = page.getByTestId('game-state')

    await expect(state).toHaveAttribute('data-mode', 'classic-single')
    await expect(state).toHaveAttribute('data-p1-home-lily', 'left')
    await expect(state).toHaveAttribute('data-p1-facing', 'right')
    await expect(state).toHaveAttribute('data-p2-home-lily', 'right')
    await expect(state).toHaveAttribute('data-p2-facing', 'left')
    await expect(page.getByTestId('p1-control-source')).toHaveAttribute('data-control-source', 'human')
    await expect(page.getByTestId('p2-control-source')).toHaveAttribute('data-control-source', 'cpu-opponent')

    await openModeSelect(page)
    await page.getByTestId('mode-local-versus').click()

    await expect(state).toHaveAttribute('data-mode', 'local-versus')
    await expect(page.getByTestId('p1-control-source')).toHaveAttribute('data-control-source', 'human')
    await expect(page.getByTestId('p2-control-source')).toHaveAttribute('data-control-source', 'human')
    await expect(page.getByTestId('mode-local-versus')).toHaveAttribute('aria-pressed', 'true')
  })

  test('exposes keyboard-accessible controls and option state markers', async ({ page }) => {
    await page.goto('/?seed=25&difficulty=classic-standard&reducedMotion=0&highContrast=0&mute=0&volume=0.75')

    await expect(page.getByTestId('game-canvas')).toHaveAccessibleName('Frogs and Flies classic match canvas')
    await openModeSelect(page)
    await expect(page.getByTestId('mode-classic-single')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('mode-local-versus')).toHaveAttribute('aria-pressed', 'false')

    await page.getByTestId('shell-mode-main-menu').click()
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByTestId('difficulty-classic-standard')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('option-mute')).toHaveAttribute('aria-checked', 'false')
    await expect(page.getByTestId('option-volume')).toHaveAttribute('aria-valuenow', '0.75')

    await page.getByTestId('settings-main-menu').click()
    await page.keyboard.press('Tab')
    for (const testId of TAB_SEQUENCE) {
      await expectFocusedTestId(page, testId)
      await page.keyboard.press('Tab')
    }
  })

  test('updates audio unlock, mute, and volume state markers without audible assertions', async ({ page }) => {
    await page.goto('/?seed=25&mute=0&volume=0.75')

    const shell = page.locator('.game-shell')

    await expect(shell).toHaveAttribute('data-audio-muted', 'false')
    await expect(shell).toHaveAttribute('data-audio-volume', '0.75')

    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByTestId('option-mute').check()
    await expect(page.getByTestId('option-mute')).toHaveAttribute('aria-checked', 'true')
    await expect(shell).toHaveAttribute('data-audio-muted', 'true')

    await page.getByTestId('option-volume').fill('0.35')
    await expect(shell).toHaveAttribute('data-audio-volume', '0.35')

    await page.getByTestId('audio-unlock').click()
    await expect(page.getByTestId('audio-unlock')).toHaveAttribute('data-audio-available', /^(true|false)$/)
  })

  test('updates reduced-motion and high-contrast DOM and render markers', async ({ page }) => {
    await page.goto('/?seed=25&reducedMotion=0&highContrast=0')

    const shell = page.locator('.game-shell')
    const canvas = page.getByTestId('game-canvas')

    await expect(shell).toHaveAttribute('data-reduced-motion', 'false')
    await expect(shell).toHaveAttribute('data-high-contrast', 'false')
    await expect(canvas).toHaveAttribute('data-render-reduced-motion', 'false')
    await expect(canvas).toHaveAttribute('data-render-high-contrast', 'false')

    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByTestId('option-reduced-motion').check()
    await page.getByTestId('option-high-contrast').check()

    await expect(shell).toHaveAttribute('data-reduced-motion', 'true')
    await expect(shell).toHaveAttribute('data-high-contrast', 'true')
    await expect(shell).toHaveClass(/is-reduced-motion/)
    await expect(shell).toHaveClass(/is-high-contrast/)
    await expect(canvas).toHaveAttribute('data-reduced-motion', 'true')
    await expect(canvas).toHaveAttribute('data-high-contrast', 'true')
    await expect(canvas).toHaveAttribute('data-render-reduced-motion', 'true')
    await expect(canvas).toHaveAttribute('data-render-high-contrast', 'true')
  })

  test('shows day, dusk, night, THE END, and results markers for seeded round states', async ({ page }) => {
    await page.goto('/?seed=25&durationSeconds=6&smokeElapsedSeconds=0')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-time-of-day', 'day')

    await page.goto('/?seed=25&durationSeconds=6&smokeElapsedSeconds=3.1')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-time-of-day', 'dusk')

    await page.goto('/?seed=25&durationSeconds=6&smokeElapsedSeconds=5.2')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-time-of-day', 'night')

    await page.goto('/?seed=25&durationSeconds=6&smokeState=the-end')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'the-end')
    expect(await readTheEndSnapshot(page)).toEqual({
      state: 'the-end',
      text: 'THE END',
      display: 'block',
    })

    await page.goto('/?seed=25&durationSeconds=6&smokeState=results')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results')
    await expect(page.getByTestId('results')).toBeVisible()
    await expect(page.getByTestId('results')).toHaveAttribute('data-winner', /^(p1|p2|tie)$/)
  })

  test('replay restarts with the same seed, options, and deterministic results', async ({ page }) => {
    await page.goto(
      '/?seed=25&mode=classic-single&difficulty=classic-expert&durationSeconds=3&theEndSeconds=0.1&simulationSpeed=20&mute=1&volume=0.35',
    )

    await startFromShell(page)
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 4_000 })
    const firstResults = await readResultSnapshot(page)

    await observeGameStates(page)
    await page.getByTestId('replay-game').click()

    await expect.poll(() => observedGameStates(page), { timeout: 4_000 }).toContain('gameplay')
    await expect(page.getByTestId('round-seed')).toHaveAttribute('data-seed', '25')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-difficulty', 'classic-expert')
    await expect(page.locator('.game-shell')).toHaveAttribute('data-audio-muted', 'true')
    await expect(page.locator('.game-shell')).toHaveAttribute('data-audio-volume', '0.35')

    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 8_000 })
    expect(await readResultSnapshot(page)).toEqual(firstResults)
  })

  for (const viewport of RESPONSIVE_VIEWPORTS) {
    test(`keeps HUD, canvas, and results readable within the viewport at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await page.goto('/?seed=25&smokeState=results')

      const canvas = page.getByTestId('game-canvas')
      const hud = page.getByTestId('m25-hud')
      const results = page.getByTestId('results')
      const replay = page.getByTestId('replay-game')

      await expect(canvas).toBeVisible()
      await expect(hud).toBeVisible()
      await expect(results).toBeVisible()
      await expect(replay).toBeVisible()

      const canvasBox = await requiredBox(canvas)
      const hudBox = await requiredBox(hud)
      const resultsBox = await requiredBox(results)
      const replayBox = await requiredBox(replay)

      for (const [name, box] of [
        ['canvas', canvasBox],
        ['hud', hudBox],
        ['results', resultsBox],
        ['replay', replayBox],
      ] as const) {
        expect(box.x, `${name} should fit horizontally`).toBeGreaterThanOrEqual(0)
        expect(box.y, `${name} should fit vertically`).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width, `${name} should fit horizontally`).toBeLessThanOrEqual(viewport.width)
        expect(box.y + box.height, `${name} should fit vertically`).toBeLessThanOrEqual(viewport.height)
      }
    })
  }
})

async function clickControl(page: Page, testId: string): Promise<void> {
  const control = page.getByTestId(testId)

  await expect(control).toBeVisible()
  await control.click(CONTROL_CLICK_OPTIONS)
}

async function openModeSelect(page: Page): Promise<void> {
  await clickControl(page, 'shell-play')
  await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'mode-select')
}

async function startFromShell(page: Page): Promise<void> {
  await openModeSelect(page)
  await clickControl(page, 'start-game')
}

async function expectFocusedTestId(page: Page, testId: string): Promise<void> {
  await expect(page.locator(`[data-testid="${testId}"]`)).toBeFocused()
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

async function readTheEndSnapshot(page: Page): Promise<{ state: string | null; text: string; display: string }> {
  return page.evaluate(() => {
    const state = document.querySelector<HTMLElement>('[data-testid="game-state"]')
    const theEnd = document.querySelector<HTMLElement>('[data-testid="the-end"]')

    return {
      state: state?.getAttribute('data-state') ?? null,
      text: theEnd?.textContent ?? '',
      display: theEnd?.style.display ?? '',
    }
  })
}

async function readResultSnapshot(page: Page): Promise<Record<string, string | null>> {
  const results = page.getByTestId('results')
  const p1Score = page.getByTestId('p1-score')
  const p2Score = page.getByTestId('p2-score')

  return {
    winner: await results.getAttribute('data-winner'),
    resultP1Score: await results.getAttribute('data-p1-score'),
    resultP2Score: await results.getAttribute('data-p2-score'),
    hudP1Score: await p1Score.getAttribute('data-score'),
    hudP2Score: await p2Score.getAttribute('data-score'),
    p1Caught: await p1Score.getAttribute('data-caught'),
    p2Caught: await p2Score.getAttribute('data-caught'),
    p1Attempts: await p1Score.getAttribute('data-attempts'),
    p2Attempts: await p2Score.getAttribute('data-attempts'),
  }
}

async function observeGameStates(page: Page): Promise<void> {
  await page.evaluate(() => {
    const runtimeWindow = window as typeof window & {
      __m25ObservedGameStates?: string[]
      __m25GameStateObserver?: MutationObserver
    }
    const state = document.querySelector<HTMLElement>('[data-testid="game-state"]')

    runtimeWindow.__m25GameStateObserver?.disconnect()
    runtimeWindow.__m25ObservedGameStates = state?.getAttribute('data-state')
      ? [state.getAttribute('data-state') as string]
      : []

    if (!state) {
      return
    }

    runtimeWindow.__m25GameStateObserver = new MutationObserver(() => {
      const nextState = state.getAttribute('data-state')
      if (nextState) {
        runtimeWindow.__m25ObservedGameStates?.push(nextState)
      }
    })
    runtimeWindow.__m25GameStateObserver.observe(state, { attributes: true, attributeFilter: ['data-state'] })
  })
}

async function observedGameStates(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const runtimeWindow = window as typeof window & {
      __m25ObservedGameStates?: string[]
    }

    return runtimeWindow.__m25ObservedGameStates ?? []
  })
}
