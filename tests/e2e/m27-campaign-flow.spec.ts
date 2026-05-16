import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const LEVEL_11 = 'home-pond-1-1-first-hunt'
const LEVEL_12 = 'home-pond-1-2-quick-tongue'
const LEVEL_13 = 'home-pond-1-3-nightfall-feast'
const SAVE_KEY = 'frogs-and-flies.save.v2'

test.describe('M2.7 campaign shell flow', () => {
  test('opens Campaign and shows exactly the Home Pond prologue levels', async ({ page }) => {
    await page.goto('/?seed=2701')

    await expect(page.getByTestId('shell-campaign')).toBeVisible()
    await page.getByTestId('shell-campaign').click()

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'campaign')
    await expect(page.getByTestId('campaign-home-pond')).toContainText('Home Pond')
    await expect(page.getByTestId('campaign-level-home-pond-1-1-first-hunt')).toHaveAttribute('data-unlocked', 'true')
    await expect(page.getByTestId('campaign-level-home-pond-1-2-quick-tongue')).toHaveAttribute('data-unlocked', 'false')
    await expect(page.getByTestId('campaign-level-home-pond-1-3-nightfall-feast')).toHaveAttribute('data-unlocked', 'false')
  })

  test('advances and skips prologue with native controls', async ({ page }) => {
    await page.goto('/?seed=2702')

    await page.getByTestId('shell-campaign').click()
    await page.getByTestId('campaign-start-prologue').click()

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'prologue')
    await expect(page.getByTestId('prologue-next')).toBeVisible()

    await page.getByTestId('prologue-next').click()
    await expect(page.getByTestId('prologue-back')).toBeVisible()

    await page.getByTestId('prologue-skip').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'campaign')
  })

  test('starts 1-1 from final prologue panel as Classic Single gameplay', async ({ page }) => {
    await page.goto('/?seed=2703&durationSeconds=10&theEndSeconds=0.1&simulationSpeed=1')

    await page.getByTestId('shell-campaign').click()
    await page.getByTestId('campaign-start-prologue').click()
    await page.getByTestId('prologue-next').click()
    await page.getByTestId('prologue-next').click()
    await page.getByTestId('prologue-start-level').click()

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'gameplay')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-mode', 'classic-single')
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-active-campaign-level', LEVEL_11)
  })

  test('records a failed campaign attempt without unlocking the next level', async ({ page }) => {
    await page.goto('/?seed=2704&durationSeconds=0.25&theEndSeconds=0.1&simulationSpeed=120')

    await launchLevelFromCampaign(page, LEVEL_11)

    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
    await expect(page.getByTestId('campaign-result-status')).toContainText(/try again|failed/i)
    expect(await readCampaignProgress(page)).toMatchObject({
      level11Attempts: 1,
      level11Passed: false,
      level12Unlocked: false,
    })
    await expect(page.getByTestId('campaign-replay-level')).toBeVisible()
  })

  test('passing 1-1 unlocks 1-2 and persists across reload', async ({ page }) => {
    await page.goto(
      '/?seed=2705&durationSeconds=0.25&theEndSeconds=0.1&simulationSpeed=120&campaignSmokeScore=900&campaignSmokeCatches=9',
    )

    await launchLevelFromCampaign(page, LEVEL_11)

    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
    await expect(page.getByTestId('campaign-result-status')).toContainText(/1-1 passed|1-2 unlocked/i)
    expect(await readCampaignProgress(page)).toMatchObject({
      level11Passed: true,
      level11Stars: 3,
      level12Unlocked: true,
    })

    await page.reload()
    await page.getByTestId('shell-campaign').click()

    await expect(page.getByTestId(`campaign-level-${LEVEL_12}`)).toHaveAttribute('data-unlocked', 'true')
  })

  test('next level actions unlock 1-3 and complete Home Pond', async ({ page }) => {
    await page.goto(
      '/?seed=2706&durationSeconds=0.25&theEndSeconds=0.1&simulationSpeed=120&campaignSmokeScore=1400&campaignSmokeCatches=14',
    )

    await launchLevelFromCampaign(page, LEVEL_11)
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
    await page.getByTestId('campaign-next-level').click()

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-active-campaign-level', LEVEL_12)
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
    await expect(page.getByTestId('campaign-result-status')).toContainText(/1-2 passed|1-3 unlocked/i)
    await page.getByTestId('campaign-next-level').click()

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-active-campaign-level', LEVEL_13)
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
    await expect(page.getByTestId('campaign-result-status')).toContainText(/home pond complete/i)
    expect(await readCampaignProgress(page)).toMatchObject({
      level11Passed: true,
      level12Passed: true,
      level13Passed: true,
      campaignComplete: true,
    })

    await page.getByTestId('campaign-results-return').click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'campaign')
    await expect(page.getByTestId(`campaign-level-${LEVEL_13}`)).toHaveAttribute('data-passed', 'true')
  })
})

async function launchLevelFromCampaign(page: Page, levelId: string): Promise<void> {
  await page.getByTestId('shell-campaign').click()
  await expect(page.getByTestId(`campaign-level-${levelId}`)).toHaveAttribute('data-unlocked', 'true')
  await page.getByTestId(`campaign-level-action-${levelId}`).click()
  await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-active-campaign-level', levelId)
}

async function readCampaignProgress(page: Page): Promise<{
  level11Attempts: number
  level11Passed: boolean
  level11Stars: number
  level12Unlocked: boolean
  level12Passed: boolean
  level13Passed: boolean
  campaignComplete: boolean
}> {
  return page.evaluate(
    ({ key, level11, level12, level13 }) => {
      const raw = localStorage.getItem(key)
      if (!raw) {
        throw new Error('missing save data')
      }
      const save = JSON.parse(raw)
      const levels = save.campaign?.levels ?? {}
      return {
        level11Attempts: levels[level11]?.objectiveStats?.attempts ?? 0,
        level11Passed: levels[level11]?.passed === true,
        level11Stars: levels[level11]?.stars ?? 0,
        level12Unlocked: levels[level12]?.unlocked === true,
        level12Passed: levels[level12]?.passed === true,
        level13Passed: levels[level13]?.passed === true,
        campaignComplete: [level11, level12, level13].every((levelId) => levels[levelId]?.passed === true),
      }
    },
    { key: SAVE_KEY, level11: LEVEL_11, level12: LEVEL_12, level13: LEVEL_13 },
  )
}
