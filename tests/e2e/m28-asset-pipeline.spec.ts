import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { PNG } from 'pngjs'

const LEVEL_11 = 'home-pond-1-1-first-hunt'
const LEVEL_12 = 'home-pond-1-2-quick-tongue'
const LEVEL_13 = 'home-pond-1-3-nightfall-feast'

const REPRESENTATIVE_IMAGE_PATHS = [
  '/assets/m28/m28-home-pond-background-v1.png',
  '/assets/m28/m28-frog-p1-idle-v1.png',
  '/assets/m28/m28-fly-wing-a-v1.png',
  '/assets/m28/m28-prologue-dawn-v1.png',
  '/assets/m28/m28-ui-star-filled-v1.png',
] as const

const REPRESENTATIVE_AUDIO_PATHS = ['/audio/sfx/jump.mp3', '/audio/music/home-pond-loop.mp3'] as const
const GAMEPLAY_ASSET_FALLBACK_TIMEOUT_MS = 10_000

const RESPONSIVE_VIEWPORTS = [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const

test.describe('M2.8 runtime asset pipeline', () => {
  test.use({ serviceWorkers: 'block' })

  test('serves representative M2.8 images and audio with browser-compatible MIME types', async ({ request }) => {
    for (const path of REPRESENTATIVE_IMAGE_PATHS) {
      const response = await request.get(path)

      expect(response.status(), path).toBe(200)
      expect(response.headers()['content-type'], path).toContain('image/')
    }

    for (const path of REPRESENTATIVE_AUDIO_PATHS) {
      const response = await request.get(path)

      expect(response.status(), path).toBe(200)
      expect(response.headers()['content-type'], path).toMatch(/audio|mpeg|octet-stream/)
    }
  })

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

    await expect(page.getByTestId('game-canvas')).toHaveAttribute('data-assets-pack', /.+/, {
      timeout: GAMEPLAY_ASSET_FALLBACK_TIMEOUT_MS,
    })
    expect(blockedM28Background).toBe(true)
    await expect(page.getByTestId('game-canvas')).toHaveAttribute('data-assets-pack', /legacy|procedural/, {
      timeout: GAMEPLAY_ASSET_FALLBACK_TIMEOUT_MS,
    })
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

  for (const viewport of RESPONSIVE_VIEWPORTS) {
    test(`keeps M2.8 controls and images inside the ${viewport.width}x${viewport.height} viewport`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/?seed=2805&durationSeconds=0.25&theEndSeconds=0.1&simulationSpeed=120')

      await expectVisualScreenFits(page, viewport, `${viewport.width}x${viewport.height} main menu`)

      await page.getByTestId('shell-campaign').click({ force: true })
      await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'campaign')
      await expectVisualScreenFits(page, viewport, `${viewport.width}x${viewport.height} campaign`, [
        `campaign-level-status-icon-${LEVEL_11}`,
        `campaign-level-stars-${LEVEL_11}`,
      ])

      await page.getByTestId('campaign-start-prologue').click({ force: true })
      await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'prologue')
      await expect(page.getByTestId('prologue-illustration')).toHaveAttribute('src', /m28-prologue-dawn-v1\.png$/)
      await expectVisualScreenFits(page, viewport, `${viewport.width}x${viewport.height} prologue dawn`, [
        'prologue-illustration',
      ])

      await page.getByTestId('prologue-next').click({ force: true })
      await page.getByTestId('prologue-next').click({ force: true })
      await expect(page.getByTestId('prologue-illustration')).toHaveAttribute('src', /m28-prologue-dusk-v1\.png$/)
      await expectVisualScreenFits(page, viewport, `${viewport.width}x${viewport.height} prologue dusk`, [
        'prologue-illustration',
      ])

      await page.goto('/?seed=2806&durationSeconds=10&theEndSeconds=0.1')
      await page.getByTestId('shell-play').click({ force: true })
      await page.getByTestId('mode-classic-single').click({ force: true })
      await page.getByTestId('start-game').click({ force: true })
      await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'gameplay')
      await expectVisualScreenFits(page, viewport, `${viewport.width}x${viewport.height} gameplay`)
      await expectCanvasNonblank(page)

      await page.goto(
        '/?seed=2807&durationSeconds=0.25&theEndSeconds=0.1&simulationSpeed=120&campaignSmokeScore=900&campaignSmokeCatches=9',
      )
      await page.getByTestId('shell-campaign').click({ force: true })
      await page.getByTestId(`campaign-level-action-${LEVEL_11}`).click({ force: true })
      await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
      await expectVisualScreenFits(page, viewport, `${viewport.width}x${viewport.height} campaign results`, [
        'campaign-result-stars',
      ])
    })
  }

  test('keeps gameplay stable when audio is unlocked and a local audio asset request fails', async ({ page }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })
    page.on('pageerror', (error) => pageErrors.push(error.message))

    await page.route('**/audio/sfx/jump.mp3', (route) => route.abort())
    await page.goto('/?seed=2808&durationSeconds=0.25&theEndSeconds=0.1&simulationSpeed=120')

    await page.getByTestId('shell-settings').click()
    const unlock = page.getByTestId('audio-unlock')
    await expect(unlock).toHaveAttribute('data-audio-unlocked', 'false')
    await unlock.click()
    await expect(unlock).toHaveAttribute('data-audio-available', /^(true|false)$/)
    await expect(unlock).toHaveAttribute('data-audio-unlocked', /^(true|false)$/)

    await page.getByTestId('settings-main-menu').click()
    await page.getByTestId('shell-play').click()
    await page.getByTestId('mode-classic-single').click()
    await page.getByTestId('start-game').click()

    await expect(page.getByTestId('game-state')).toHaveAttribute('data-mode', 'classic-single')
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', /^(gameplay|results)$/)
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
    expect(consoleErrors, 'console errors').toEqual([])
    expect(pageErrors, 'page errors').toEqual([])
  })
})

test.describe('M2.8 PWA offline asset availability', () => {
  test.use({ serviceWorkers: 'allow' })

  test('keeps campaign icons and prologue art available after an offline reload', async ({ page, browserName }) => {
    test.setTimeout(60_000)
    test.skip(browserName === 'webkit', 'documented WebKit offline service-worker reload issue')

    await page.goto('/?seed=2809&durationSeconds=10&theEndSeconds=0.1')
    await expect(page.getByTestId('m26-shell')).toHaveAttribute(
      'data-pwa-registration',
      /^(registered|unsupported|failed)$/,
    )

    const registrationState = await page.getByTestId('m26-shell').getAttribute('data-pwa-registration')
    test.skip(registrationState !== 'registered', `service worker registration ${registrationState ?? 'missing'}`)

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-pwa-runtime-cache-ready', 'true', {
      timeout: 15_000,
    })

    await page.context().setOffline(true)
    await page.reload()

    await expect(page.getByTestId('m26-shell')).toBeVisible()
    await page.getByTestId('shell-campaign').click()
    await expect(page.getByTestId('campaign-home-pond')).toBeVisible()
    await expectNonZeroBox(page.getByTestId(`campaign-level-status-icon-${LEVEL_11}`), 'offline campaign status icon')
    await expectNonZeroBox(page.getByTestId(`campaign-level-stars-${LEVEL_11}`), 'offline campaign stars')

    await page.getByTestId('campaign-start-prologue').click()
    const illustration = page.getByTestId('prologue-illustration')

    await expect(illustration).toBeVisible()
    await expect(illustration).toHaveAttribute('src', /\/assets\/m28\/m28-prologue-dawn-v1\.png$/)
    await expectNonZeroBox(illustration, 'offline prologue illustration')
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

async function expectVisualScreenFits(
  page: Page,
  viewport: { width: number; height: number },
  screenName: string,
  requiredTestIds: readonly string[] = [],
): Promise<void> {
  await waitForVisibleImages(page)
  await expect(page.getByTestId('m26-shell')).toBeVisible()
  expect((await page.screenshot()).length, `${screenName} screenshot bytes`).toBeGreaterThan(0)

  for (const testId of requiredTestIds) {
    await expectNonZeroBox(page.getByTestId(testId), `${screenName} ${testId}`)
  }

  const boxes = await page
    .locator('button:visible, input:visible, select:visible, img:visible')
    .evaluateAll((elements) =>
      elements.map((element, index) => {
        const rect = element.getBoundingClientRect()
        const testId = element.getAttribute('data-testid')
        const text = element.textContent?.trim()
        const image = element instanceof HTMLImageElement ? element : undefined
        const button = element instanceof HTMLButtonElement ? element : undefined
        const textRects = button
          ? (() => {
              const range = document.createRange()
              range.selectNodeContents(button)
              const rects = [...range.getClientRects()].map((rect) => ({
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              }))
              range.detach()
              return rects
            })()
          : []

        return {
          name: testId || text || element.getAttribute('class') || `${index + 1}`,
          tagName: element.tagName.toLowerCase(),
          box: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
          image: image
            ? {
                complete: image.complete,
                naturalWidth: image.naturalWidth,
                naturalHeight: image.naturalHeight,
                src: image.currentSrc || image.src,
              }
            : undefined,
          textRects,
        }
      }),
    )

  expect(boxes.length, `${screenName} visible controls/images`).toBeGreaterThan(0)

  for (const { name, box, image, textRects } of boxes) {
    expect(box.width, `${screenName} ${name} width`).toBeGreaterThan(0)
    expect(box.height, `${screenName} ${name} height`).toBeGreaterThan(0)
    expectBoxFitsViewport(`${screenName} ${name}`, box, viewport)
    if (image) {
      expect(image.complete, `${screenName} ${name} image complete ${image.src}`).toBe(true)
      expect(image.naturalWidth, `${screenName} ${name} natural width`).toBeGreaterThan(0)
      expect(image.naturalHeight, `${screenName} ${name} natural height`).toBeGreaterThan(0)
    }
    for (const textRect of textRects) {
      expectBoxFitsBox(`${screenName} ${name} button text`, textRect, box)
    }
  }

  for (let left = 0; left < boxes.length; left += 1) {
    for (let right = left + 1; right < boxes.length; right += 1) {
      expect(
        boxesOverlap(boxes[left].box, boxes[right].box),
        `${screenName} ${boxes[left].name} overlaps ${boxes[right].name}`,
      ).toBe(false)
    }
  }
}

async function waitForVisibleImages(page: Page): Promise<void> {
  await page.locator('img:visible').evaluateAll(async (images) => {
    await Promise.all(images.map((image) => (image as HTMLImageElement).decode?.().catch(() => undefined)))
  })
}

type Box = { x: number; y: number; width: number; height: number }

function expectBoxFitsViewport(name: string, box: Box, viewport: { width: number; height: number }): void {
  const tolerance = 1

  expect(box.x, `${name} should fit horizontally`).toBeGreaterThanOrEqual(-tolerance)
  expect(box.y, `${name} should fit vertically`).toBeGreaterThanOrEqual(-tolerance)
  expect(box.x + box.width, `${name} should fit horizontally`).toBeLessThanOrEqual(viewport.width + tolerance)
  expect(box.y + box.height, `${name} should fit vertically`).toBeLessThanOrEqual(viewport.height + tolerance)
}

function expectBoxFitsBox(name: string, inner: Box, outer: Box): void {
  const tolerance = 2

  expect(inner.x, `${name} should fit inside button horizontally`).toBeGreaterThanOrEqual(outer.x - tolerance)
  expect(inner.y, `${name} should fit inside button vertically`).toBeGreaterThanOrEqual(outer.y - tolerance)
  expect(inner.x + inner.width, `${name} should fit inside button horizontally`).toBeLessThanOrEqual(
    outer.x + outer.width + tolerance,
  )
  expect(inner.y + inner.height, `${name} should fit inside button vertically`).toBeLessThanOrEqual(
    outer.y + outer.height + tolerance,
  )
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
