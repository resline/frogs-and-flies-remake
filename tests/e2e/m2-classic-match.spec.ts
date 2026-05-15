import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const MATCH_MODE_CONTROLS = {
  classicSingle: 'mode-classic-single',
  localVersus: 'mode-local-versus',
} as const

async function expectSelectedModeControl(page: Page, testId: string): Promise<void> {
  const selected = await page.getByTestId(testId).evaluate((element) => {
    if (element instanceof HTMLInputElement) {
      return element.checked
    }

    return (
      element.getAttribute('aria-pressed') === 'true' ||
      element.getAttribute('aria-checked') === 'true' ||
      element.getAttribute('data-selected') === 'true' ||
      element.getAttribute('data-current') === 'true'
    )
  })

  expect(selected).toBe(true)
}

async function openModeSelect(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'mode-select')
}

async function startFromShell(page: Page): Promise<void> {
  await openModeSelect(page)
  await page.getByTestId('start-game').click()
}

test.describe('Frogs and Flies 2 M2 Classic Match', () => {
  test('render exposes M2 canvas layer and effect markers', async ({ page }) => {
    await page.goto('/?mode=classic-single&seed=123')

    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible()
    await expect(canvas).toHaveAttribute('data-runtime-markers', 'm2')
    await expect(canvas).toHaveAttribute('data-render-layers', 'background gameplay effects ui')

    await startFromShell(page)
    await page.keyboard.press('KeyT')

    await expect(canvas).toHaveAttribute('data-last-effect', /^(catch|miss|splash|score)$/)
  })

  test('exposes the Classic Single HUD contract and starts gameplay', async ({ page }) => {
    await page.goto('/?mode=classic-single&seed=123')

    const state = page.getByTestId('game-state')
    const timer = page.getByTestId('round-timer')
    const p1Score = page.getByTestId('p1-score')
    const p2Score = page.getByTestId('p2-score')

    await expect(state).toHaveAttribute('data-mode', 'classic-single')
    await expect(state).toHaveAttribute('data-time-of-day', /.+/)

    await expect(timer).toHaveAttribute('data-target-seconds', '180')
    await expect(timer).toHaveAttribute('data-remaining-seconds', /.+/)

    for (const score of [p1Score, p2Score]) {
      await expect(score).toBeVisible()
      await expect(score).toHaveAttribute('data-score', /.+/)
      await expect(score).toHaveAttribute('data-caught', /.+/)
      await expect(score).toHaveAttribute('data-attempts', /.+/)
      await expect(score).toHaveAttribute('data-accuracy', /.+/)
    }

    await expect(page.getByTestId('p1-control-source')).toHaveAttribute('data-control-source', 'human')
    await expect(page.getByTestId('p2-control-source')).toHaveAttribute('data-control-source', 'cpu-opponent')

    await startFromShell(page)
    await expect(state).toHaveAttribute('data-state', 'gameplay')
  })

  test('exposes the Local Versus HUD contract and keeps both human players active', async ({ page }) => {
    await page.goto('/?mode=local-versus&seed=123')

    const state = page.getByTestId('game-state')
    const localVersusControl = page.getByTestId(MATCH_MODE_CONTROLS.localVersus)
    const classicSingleControl = page.getByTestId(MATCH_MODE_CONTROLS.classicSingle)

    await expect(state).toHaveAttribute('data-mode', 'local-versus')
    await expect(page.getByTestId('p1-control-source')).toHaveAttribute('data-control-source', 'human')
    await expect(page.getByTestId('p2-control-source')).toHaveAttribute('data-control-source', 'human')

    await openModeSelect(page)
    await expect(localVersusControl).toBeVisible()
    await expect(classicSingleControl).toBeVisible()
    await expectSelectedModeControl(page, MATCH_MODE_CONTROLS.localVersus)

    await page.getByTestId('start-game').click()
    await expect(state).toHaveAttribute('data-state', 'gameplay')

    await page.keyboard.down('KeyD')
    await page.keyboard.press('KeyT')
    await page.keyboard.down('KeyL')
    await page.keyboard.press('KeyO')
    await page.keyboard.up('KeyD')
    await page.keyboard.up('KeyL')

    await expect(page.getByTestId('p1-score')).toBeVisible()
    await expect(page.getByTestId('p2-score')).toBeVisible()
    await expect(page.getByTestId('p1-control-source')).toHaveAttribute('data-control-source', 'human')
    await expect(page.getByTestId('p2-control-source')).toHaveAttribute('data-control-source', 'human')
    await expect(state).toHaveAttribute('data-state', 'gameplay')
  })

  test('selects Local Versus and Classic Single from pre-start mode controls', async ({ page }) => {
    await page.goto('/?seed=123')

    const state = page.getByTestId('game-state')
    const localVersusControl = page.getByTestId(MATCH_MODE_CONTROLS.localVersus)
    const classicSingleControl = page.getByTestId(MATCH_MODE_CONTROLS.classicSingle)
    const p1ControlSource = page.getByTestId('p1-control-source')
    const p2ControlSource = page.getByTestId('p2-control-source')

    await expect(state).toHaveAttribute('data-state', 'start')
    await openModeSelect(page)
    await expect(localVersusControl).toBeVisible()
    await expect(classicSingleControl).toBeVisible()

    await localVersusControl.click()
    await expect(state).toHaveAttribute('data-mode', 'local-versus')
    await expect(p1ControlSource).toHaveAttribute('data-control-source', 'human')
    await expect(p2ControlSource).toHaveAttribute('data-control-source', 'human')
    await expectSelectedModeControl(page, MATCH_MODE_CONTROLS.localVersus)

    await classicSingleControl.click()
    await expect(state).toHaveAttribute('data-mode', 'classic-single')
    await expect(p1ControlSource).toHaveAttribute('data-control-source', 'human')
    await expect(p2ControlSource).toHaveAttribute('data-control-source', 'cpu-opponent')
    await expectSelectedModeControl(page, MATCH_MODE_CONTROLS.classicSingle)
  })

  test('exposes Classic Single result markers for a forced results state', async ({ page }) => {
    await page.goto('/?mode=classic-single&seed=123&smokeState=results')

    const results = page.getByTestId('results')

    await expect(page.getByTestId('game-state')).toHaveAttribute('data-mode', 'classic-single')
    await expect(results).toBeVisible()
    await expect(results).toHaveAttribute('data-winner', /^(p1|p2|tie)$/)
    await expect(results).toHaveAttribute('data-p1-score', /.+/)
    await expect(results).toHaveAttribute('data-p2-score', /.+/)
    await expect(page.getByTestId('results-winner')).toBeVisible()
    await expect(page.getByTestId('results-winner')).toContainText(/Winner: (P1|P2|Tie)/)
    await expect(page.getByTestId('results-p1-score')).toBeVisible()
    await expect(page.getByTestId('results-p1-score')).toContainText(/P1: \d+/)
    await expect(page.getByTestId('results-p2-score')).toBeVisible()
    await expect(page.getByTestId('results-p2-score')).toContainText(/P2: \d+/)
    await expect(page.getByTestId('results-p1-stats')).toBeVisible()
    await expect(page.getByTestId('results-p1-stats')).toContainText(/caught \d+, attempts \d+, accuracy \d+\.\d%, combo \d+/)
    await expect(page.getByTestId('results-p2-stats')).toBeVisible()
    await expect(page.getByTestId('results-p2-stats')).toContainText(/caught \d+, attempts \d+, accuracy \d+\.\d%, combo \d+/)
  })

  test('reaches visible results with winner and final player scores when simulationSpeed accelerates a long round', async ({
    page,
  }) => {
    await page.goto('/?seed=123&durationSeconds=20&theEndSeconds=0.1&simulationSpeed=20')

    await startFromShell(page)

    const results = page.getByTestId('results')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 8_000 })
    await expect(results).toBeVisible()
    await expect(results).toHaveAttribute('data-winner', /^(p1|p2|tie)$/)
    await expect(results).toHaveAttribute('data-p1-score', /.+/)
    await expect(results).toHaveAttribute('data-p2-score', /.+/)
    await expect(page.getByTestId('results-winner')).toContainText(/Winner: (P1|P2|Tie)/)
    await expect(page.getByTestId('results-p1-score')).toContainText(/P1: \d+/)
    await expect(page.getByTestId('results-p2-score')).toContainText(/P2: \d+/)
    await expect(page.getByTestId('results-p1-stats')).toContainText(/caught \d+, attempts \d+, accuracy \d+\.\d%, combo \d+/)
    await expect(page.getByTestId('results-p2-stats')).toContainText(/caught \d+, attempts \d+, accuracy \d+\.\d%, combo \d+/)
    await expect(page.getByTestId('p1-score')).toBeVisible()
    await expect(page.getByTestId('p2-score')).toBeVisible()
    await expect(page.getByTestId('p1-score')).toHaveAttribute('data-score', /.+/)
    await expect(page.getByTestId('p2-score')).toHaveAttribute('data-score', /.+/)
  })

  test('selects Local Versus from results and preserves round params', async ({ page }) => {
    await page.goto('/?mode=classic-single&seed=123&durationSeconds=20&theEndSeconds=0.1&simulationSpeed=20&smokeState=results')

    const state = page.getByTestId('game-state')
    const timer = page.getByTestId('round-timer')

    await expect(state).toHaveAttribute('data-state', 'results')

    await page.getByRole('button', { name: 'Change Mode' }).click()
    await page.getByTestId(MATCH_MODE_CONTROLS.localVersus).click()

    await expect(state).toHaveAttribute('data-state', 'start')
    await expect(state).toHaveAttribute('data-mode', 'local-versus')
    await expect(page.getByTestId('round-seed')).toHaveAttribute('data-seed', '123')
    await expect(timer).toHaveAttribute('data-target-seconds', '20')
    await expect(timer).toHaveAttribute('data-remaining-seconds', '20')
    await expect(page.getByTestId('p1-control-source')).toHaveAttribute('data-control-source', 'human')
    await expect(page.getByTestId('p2-control-source')).toHaveAttribute('data-control-source', 'human')
    await expectSelectedModeControl(page, MATCH_MODE_CONTROLS.localVersus)

    await page.getByTestId('start-game').click()
    await expect(state).toHaveAttribute('data-state', 'results', { timeout: 8_000 })
  })
})
