import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const bootUrl = '/?seed=2608&durationSeconds=30&theEndSeconds=0.1'
const quickResultsUrl = '/?seed=2609&durationSeconds=1&theEndSeconds=0.1&simulationSpeed=20'

test.describe('M2.6 accessibility verification', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.setTimeout(60_000)
    await page.goto(bootUrl)
    await expect(page.getByTestId('m26-shell')).toBeVisible()
  })

  test('has no serious or critical axe violations across product shell screens', async ({ page }) => {
    await assertAxeHasNoSeriousOrCriticalViolations(page, 'main menu')

    await page.getByTestId('shell-settings').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'settings')
    await assertAxeHasNoSeriousOrCriticalViolations(page, 'settings')

    await page.getByTestId('settings-main-menu').click()
    await page.getByTestId('shell-play').click()
    await page.getByRole('button', { name: 'Classic Single' }).click()
    await page.getByRole('button', { name: 'Start' }).click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'gameplay')
    await assertAxeHasNoSeriousOrCriticalViolations(page, 'gameplay shell')

    await page.getByTestId('pause-game').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'pause')
    await assertAxeHasNoSeriousOrCriticalViolations(page, 'pause')

    await page.goto(quickResultsUrl)
    await page.getByTestId('shell-play').click()
    await page.getByRole('button', { name: 'Classic Single' }).click()
    await page.getByRole('button', { name: 'Start' }).click()
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'results')
    await assertAxeHasNoSeriousOrCriticalViolations(page, 'results')

    await page.goto(bootUrl)
    await expect(page.getByTestId('m26-shell')).toBeVisible()
    await page.getByTestId('shell-high-scores').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'high-scores')
    await assertAxeHasNoSeriousOrCriticalViolations(page, 'high scores')
  })

  test('visible native controls have accessible names on shell screens', async ({ page }) => {
    await assertVisibleControlsHaveNames(page, 'main menu')

    await page.getByTestId('shell-settings').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'settings')
    await assertVisibleControlsHaveNames(page, 'settings')

    await page.getByTestId('settings-main-menu').click()
    await page.getByTestId('shell-play').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'mode-select')
    await assertVisibleControlsHaveNames(page, 'mode select')

    await page.getByRole('button', { name: 'Classic Single' }).click()
    await page.getByRole('button', { name: 'Start' }).click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'gameplay')
    await assertVisibleControlsHaveNames(page, 'gameplay')

    await page.getByTestId('pause-game').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'pause')
    await assertVisibleControlsHaveNames(page, 'pause')
  })

  test('campaign and prologue have no serious or critical axe violations', async ({ page }) => {
    await page.getByTestId('shell-campaign').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'campaign')
    await assertAxeHasNoSeriousOrCriticalViolations(page, 'campaign')

    await page.getByTestId('campaign-start-prologue').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'prologue')
    await assertAxeHasNoSeriousOrCriticalViolations(page, 'prologue')
  })

  test('campaign and prologue visible controls have accessible names', async ({ page }) => {
    await page.getByTestId('shell-campaign').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'campaign')
    await assertVisibleControlsHaveNames(page, 'campaign')

    await page.getByTestId('campaign-start-prologue').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'prologue')
    await assertVisibleControlsHaveNames(page, 'prologue')
  })

  test('focus order reaches primary shell actions predictably', async ({ page }) => {
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('shell-campaign')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('shell-play')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('shell-settings')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('shell-high-scores')).toBeFocused()

    await page.getByTestId('shell-settings').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'settings')
    await page.getByTestId('difficulty-classic-assist').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('difficulty-classic-standard')).toBeFocused()
  })

  test('campaign prologue controls are keyboard reachable in visible order', async ({ page }) => {
    await page.getByTestId('shell-campaign').click()
    await page.getByTestId('campaign-start-prologue').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'prologue')

    await page.getByTestId('campaign-prologue').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('prologue-next')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('prologue-skip')).toBeFocused()

    await page.getByTestId('prologue-next').click()
    await page.getByTestId('campaign-prologue').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('prologue-back')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('prologue-next')).toBeFocused()

    await page.getByTestId('prologue-next').click()
    await page.getByTestId('campaign-prologue').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('prologue-back')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('prologue-skip')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('prologue-start-level')).toBeFocused()
  })

  test('campaign and prologue screens expose reduced motion and high contrast markers', async ({ page }) => {
    await page.getByTestId('shell-settings').click()
    await page.getByTestId('option-reduced-motion').click()
    await page.getByTestId('option-high-contrast').click()
    await page.getByTestId('settings-main-menu').click()

    await page.getByTestId('shell-campaign').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'campaign')
    await expect(page.getByTestId('campaign-home-pond')).toHaveAttribute('data-reduced-motion', 'true')
    await expect(page.getByTestId('campaign-home-pond')).toHaveAttribute('data-high-contrast', 'true')

    await page.getByTestId('campaign-start-prologue').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'prologue')
    await expect(page.getByTestId('campaign-prologue')).toHaveAttribute('data-reduced-motion', 'true')
    await expect(page.getByTestId('campaign-prologue')).toHaveAttribute('data-high-contrast', 'true')
  })

  test('keeps canvas accessibility limits explicit while exposing native controls', async ({ page }) => {
    await page.getByTestId('shell-play').click()
    await page.getByRole('button', { name: 'Classic Single' }).click()
    await page.getByRole('button', { name: 'Start' }).click()

    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible()
    await expect(canvas).toHaveAttribute('aria-label', 'Frogs and Flies classic match canvas')
    await expect(page.getByTestId('pause-game')).toBeVisible()
  })
})

async function assertAxeHasNoSeriousOrCriticalViolations(page: Page, screenName: string): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze()
  const seriousOrCritical = results.violations.filter((violation) => {
    return violation.impact === 'serious' || violation.impact === 'critical'
  })

  expect(seriousOrCritical, `${screenName} serious/critical axe violations`).toEqual([])
}

async function assertVisibleControlsHaveNames(page: Page, screenName: string): Promise<void> {
  const controls = page.locator('button:visible, input:visible, select:visible')
  const count = await controls.count()

  expect(count, `${screenName} visible native control count`).toBeGreaterThan(0)

  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index)
    const label = await control.evaluate((element) => {
      if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
        const explicitLabel = element.getAttribute('aria-label') ?? ''
        const nativeLabel = Array.from(element.labels ?? [])
          .map((labelElement) => labelElement.textContent ?? '')
          .join(' ')
        return `${explicitLabel} ${nativeLabel}`.trim()
      }

      return `${element.getAttribute('aria-label') ?? ''} ${element.textContent ?? ''}`.trim()
    })

    expect(label, `${screenName} control ${index + 1} accessible-name source`).not.toBe('')
  }
}
