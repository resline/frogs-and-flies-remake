import { expect, test } from '@playwright/test'

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
})
