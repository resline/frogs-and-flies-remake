import { expect, test } from '@playwright/test'

test.describe('Frogs and Flies 2 M2 Classic Match', () => {
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

    await page.getByTestId('start-game').click()
    await expect(state).toHaveAttribute('data-state', 'gameplay')
  })

  test('exposes Classic Single result markers for a forced results state', async ({ page }) => {
    await page.goto('/?mode=classic-single&seed=123&smokeState=results')

    const results = page.getByTestId('results')

    await expect(page.getByTestId('game-state')).toHaveAttribute('data-mode', 'classic-single')
    await expect(results).toBeVisible()
    await expect(results).toHaveAttribute('data-winner', /^(p1|p2|tie)$/)
    await expect(results).toHaveAttribute('data-p1-score', /.+/)
    await expect(results).toHaveAttribute('data-p2-score', /.+/)
  })
})
