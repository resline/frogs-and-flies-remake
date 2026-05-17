import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const LEVEL_11 = 'home-pond-1-1-first-hunt'
const LEVEL_12 = 'home-pond-1-2-quick-tongue'
const LEVEL_13 = 'home-pond-1-3-nightfall-feast'

test.describe('M2.9 encounter profile runtime markers', () => {
  test('launches campaign levels with their encounter profile markers', async ({ page }) => {
    await page.goto(
      '/?seed=2901&durationSeconds=0.25&theEndSeconds=0.1&simulationSpeed=120&campaignSmokeScore=1400&campaignSmokeCatches=14',
    )

    await page.getByTestId('shell-campaign').click()
    await page.getByTestId(`campaign-level-action-${LEVEL_11}`).click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-active-campaign-level', LEVEL_11)
    await expect(page.getByTestId('m26-shell')).toHaveAttribute(
      'data-campaign-encounter-profile',
      'home-pond-baseline-gentle',
    )

    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
    await page.getByTestId('campaign-next-level').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-active-campaign-level', LEVEL_12)
    await expect(page.getByTestId('m26-shell')).toHaveAttribute(
      'data-campaign-encounter-profile',
      'home-pond-quick-tongue',
    )

    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
    await page.getByTestId('campaign-next-level').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-active-campaign-level', LEVEL_13)
    await expect(page.getByTestId('m26-shell')).toHaveAttribute(
      'data-campaign-encounter-profile',
      'home-pond-nightfall-pressure',
    )
  })

  test('classic single and local versus have no campaign encounter marker', async ({ page }) => {
    await page.goto('/?seed=2902&durationSeconds=10&theEndSeconds=0.1')

    await page.getByTestId('shell-play').click()
    await page.getByTestId('mode-classic-single').click()
    await page.getByTestId('start-game').click()
    await expect(page.getByTestId('m26-shell')).not.toHaveAttribute('data-campaign-encounter-profile')

    await page.goto('/?seed=2903&mode=local-versus&durationSeconds=10&theEndSeconds=0.1')

    await page.getByTestId('shell-play').click()
    await page.getByTestId('mode-local-versus').click()
    await page.getByTestId('start-game').click()
    await expect(page.getByTestId('m26-shell')).not.toHaveAttribute('data-campaign-encounter-profile')
  })

  test('mode shortcuts clear active campaign encounter markers', async ({ page }) => {
    const shortcutCases = [
      { code: 'Digit2', expectedMode: 'local-versus', seed: 2904 },
      { code: 'Digit1', expectedMode: 'classic-single', seed: 2905 },
    ] as const

    for (const shortcut of shortcutCases) {
      await page.goto(`/?seed=${shortcut.seed}&durationSeconds=10&theEndSeconds=0.1`)
      await launchLevelFromCampaign(page, LEVEL_11)

      const shell = page.getByTestId('m26-shell')
      await expect(shell).toHaveAttribute('data-active-campaign-level', LEVEL_11)
      await expect(shell).toHaveAttribute('data-campaign-encounter-profile', 'home-pond-baseline-gentle')

      await page.keyboard.press(shortcut.code)

      await expect(page.getByTestId('game-state')).toHaveAttribute('data-mode', shortcut.expectedMode)
      await expect(shell).not.toHaveAttribute('data-active-campaign-level')
      await expect(shell).not.toHaveAttribute('data-campaign-encounter-profile')
    }
  })
})

async function launchLevelFromCampaign(page: Page, levelId: string): Promise<void> {
  await page.getByTestId('shell-campaign').click()
  await page.getByTestId(`campaign-level-action-${levelId}`).click()
}
