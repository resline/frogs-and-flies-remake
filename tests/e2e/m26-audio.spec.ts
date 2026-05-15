import { expect, test } from '@playwright/test'

const SAVE_KEY = 'frogs-and-flies.save.v1'

test.describe('M2.6 audio pipeline markers', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.setTimeout(60_000)
    await page.goto('/')
    await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY)
  })

  test('changing volumes updates markers and persists after reload', async ({ page }) => {
    await page.goto('/?seed=51')
    await page.getByRole('button', { name: 'Settings' }).click()

    await page.getByTestId('option-volume').fill('0.4')
    await page.getByTestId('option-sfx-volume').fill('0.3')
    await page.getByTestId('option-music-volume').fill('0.2')

    const shell = page.getByTestId('m26-shell')
    await expect(shell).toHaveAttribute('data-audio-master-volume', '0.40')
    await expect(shell).toHaveAttribute('data-audio-sfx-volume', '0.30')
    await expect(shell).toHaveAttribute('data-audio-music-volume', '0.20')
    await expect(shell).toHaveAttribute('data-save-status', 'saved')

    await page.reload()
    await page.getByRole('button', { name: 'Settings' }).click()

    await expect(page.getByTestId('option-volume')).toHaveAttribute('aria-valuenow', '0.4')
    await expect(page.getByTestId('option-sfx-volume')).toHaveAttribute('aria-valuenow', '0.3')
    await expect(page.getByTestId('option-music-volume')).toHaveAttribute('aria-valuenow', '0.2')
  })

  test('mono toggle persists', async ({ page }) => {
    await page.goto('/?seed=52')
    await page.getByRole('button', { name: 'Settings' }).click()

    await page.getByTestId('option-mono-audio').check()

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-audio-mono', 'true')

    await page.reload()
    await page.getByRole('button', { name: 'Settings' }).click()

    await expect(page.getByTestId('option-mono-audio')).toBeChecked()
    expect(await readSavedAudioSettings(page)).toMatchObject({ monoAudio: true })
  })

  test('missing optional audio files do not block gameplay', async ({ page }) => {
    await page.goto('/?seed=53&durationSeconds=0.25&theEndSeconds=0.1&simulationSpeed=120')

    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await page.getByRole('button', { name: 'Classic Single' }).click()
    await page.getByRole('button', { name: 'Start' }).click()

    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'results')
  })

  test('unlock button reports available or unavailable state', async ({ page }) => {
    await page.goto('/?seed=54')
    await page.getByRole('button', { name: 'Settings' }).click()

    const unlock = page.getByTestId('audio-unlock')
    await expect(unlock).toHaveAttribute('data-audio-available', /^(true|false)$/)
    await expect(unlock).toHaveAttribute('data-audio-unlocked', 'false')

    await unlock.click()

    await expect(unlock).toHaveAttribute('data-audio-available', /^(true|false)$/)
    await expect(unlock).toHaveAttribute('data-audio-unlocked', /^(true|false)$/)
  })
})

async function readSavedAudioSettings(page: import('@playwright/test').Page): Promise<{
  masterVolume?: number
  sfxVolume?: number
  musicVolume?: number
  monoAudio?: boolean
}> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key)
    if (!raw) {
      throw new Error('missing save data')
    }
    return JSON.parse(raw).settings
  }, SAVE_KEY)
}
