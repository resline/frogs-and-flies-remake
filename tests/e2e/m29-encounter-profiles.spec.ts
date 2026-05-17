import { expect, test } from '@playwright/test'

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
})
