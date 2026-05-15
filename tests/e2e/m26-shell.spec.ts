import { expect, test } from '@playwright/test'

test.describe('M2.6 product shell flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?seed=26&durationSeconds=1&theEndSeconds=0.1&simulationSpeed=20')
  })

  test('boots into the shell and exposes main menu actions as native buttons', async ({ page }) => {
    const shell = page.getByTestId('m26-shell')

    await expect(shell).toBeVisible()
    await expect(shell).toHaveAttribute('data-shell-screen', /^(splash|main-menu)$/)
    await expect(shell).toHaveAttribute('data-selected-mode', 'classic-single')
    await expect(shell).toHaveAttribute('data-save-status', /^(loaded|defaulted|invalid|unsupported-version|storage-unavailable|saved)$/)
    await expect(shell).toHaveAttribute('data-storage-available', /^(true|false)$/)

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
    await page.getByRole('button', { name: 'Settings' }).click()

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
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Main Menu' })).toBeVisible()
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
})
