import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { PNG } from 'pngjs'

test.use({ serviceWorkers: 'block' })

const LEVEL_11 = 'home-pond-1-1-first-hunt'
const LEVEL_12 = 'home-pond-1-2-quick-tongue'
const LEVEL_13 = 'home-pond-1-3-nightfall-feast'

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

  test('renders M2.8 campaign level icons and prologue illustrations without replacing text', async ({ page }) => {
    await page.goto('/?seed=2803&durationSeconds=10&theEndSeconds=0.1')

    await page.getByTestId('shell-campaign').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'campaign')

    for (const levelId of [LEVEL_11, LEVEL_12, LEVEL_13]) {
      await expectNonZeroBox(page.getByTestId(`campaign-level-status-icon-${levelId}`), `${levelId} status icon`)
      await expectNonZeroBox(page.getByTestId(`campaign-level-stars-${levelId}`), `${levelId} stars`)
    }
    await expect(page.getByTestId(`campaign-level-${LEVEL_12}`)).toContainText('Locked')

    await page.getByTestId('campaign-start-prologue').click()
    const illustration = page.getByTestId('prologue-illustration')
    const prologueText = page.getByTestId('prologue-text')

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'prologue')
    await expect(illustration).toHaveAttribute('src', /m28-prologue-dawn-v1\.png$/)
    await expect(illustration).toHaveAttribute('data-prologue-image-tone', 'dawn')
    await expectNonZeroBox(illustration, 'dawn prologue illustration')
    await expect(prologueText).toBeVisible()

    await page.getByTestId('prologue-next').click()
    await expect(illustration).toHaveAttribute('src', /m28-prologue-day-v1\.png$/)
    await expect(illustration).toHaveAttribute('data-prologue-image-tone', 'day')
    await expect(prologueText).toBeVisible()

    await page.getByTestId('prologue-next').click()
    await expect(illustration).toHaveAttribute('src', /m28-prologue-dusk-v1\.png$/)
    await expect(illustration).toHaveAttribute('data-prologue-image-tone', 'dusk')
    await expect(prologueText).toBeVisible()
  })

  test('renders M2.8 result stars and cleared campaign status after a smoke pass', async ({ page }) => {
    await page.goto(
      '/?seed=2804&durationSeconds=0.25&theEndSeconds=0.1&simulationSpeed=120&campaignSmokeScore=900&campaignSmokeCatches=9',
    )

    await page.getByTestId('shell-campaign').click()
    await page.getByTestId(`campaign-level-action-${LEVEL_11}`).click()
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })

    await expect(page.getByTestId('campaign-result-status')).toContainText(/passed|unlocked/i)
    await expectNonZeroBox(page.getByTestId('campaign-result-stars'), 'campaign result stars')

    await page.getByTestId('campaign-results-return').click()
    await expect(page.getByTestId(`campaign-level-${LEVEL_11}`)).toHaveAttribute('data-passed', 'true')
    await expectNonZeroBox(page.getByTestId(`campaign-level-status-icon-${LEVEL_11}`), 'cleared status icon')
    await expectNonZeroBox(page.getByTestId(`campaign-level-stars-${LEVEL_11}`), 'cleared level stars')
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

async function expectNonZeroBox(locator: ReturnType<Page['getByTestId']>, label: string): Promise<void> {
  await expect(locator, label).toBeVisible()
  const box = await locator.boundingBox()

  expect(box, `${label} bounding box`).not.toBeNull()
  expect(box?.width ?? 0, `${label} width`).toBeGreaterThan(0)
  expect(box?.height ?? 0, `${label} height`).toBeGreaterThan(0)
}
