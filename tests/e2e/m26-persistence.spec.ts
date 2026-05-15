import { expect, test } from '@playwright/test'

const SAVE_KEY = 'frogs-and-flies.save.v1'

test.describe('M2.6 local persistence', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.setTimeout(60_000)
    await page.goto('/')
    await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY)
  })

  test('persists settings changes across reloads', async ({ page }) => {
    await page.goto('/?seed=31')
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByTestId('difficulty-classic-expert').click()
    await page.getByTestId('option-show-timer').uncheck()
    await page.getByTestId('option-reduced-motion').check()
    await page.getByTestId('option-high-contrast').check()
    await page.getByTestId('option-mute').check()
    await page.getByTestId('option-volume').fill('0.35')

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-save-status', 'saved')

    await page.reload()
    await page.getByRole('button', { name: 'Settings' }).click()

    await expect(page.getByTestId('difficulty-classic-expert')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('option-show-timer')).not.toBeChecked()
    await expect(page.getByTestId('option-reduced-motion')).toBeChecked()
    await expect(page.getByTestId('option-high-contrast')).toBeChecked()
    await expect(page.getByTestId('option-mute')).toBeChecked()
    await expect(page.getByTestId('option-volume')).toHaveAttribute('aria-valuenow', '0.35')
  })

  test('applies URL settings for one load without rewriting saved settings', async ({ page }) => {
    await page.evaluate(
      ({ key }) => {
        localStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            settings: {
              difficulty: 'classic-expert',
              showTimer: false,
              reducedMotion: true,
              highContrast: true,
              mute: true,
              masterVolume: 0.25,
              sfxVolume: 1,
              musicVolume: 0.8,
              monoAudio: false,
              inputProfileId: 'default',
            },
            highScores: { classicSingle: [], localVersus: [] },
            stats: {
              roundsStarted: 0,
              roundsCompleted: 0,
              totalCatches: 0,
              totalAttempts: 0,
              totalSplashes: 0,
              bestCombo: 0,
              totalPlaySeconds: 0,
            },
            inputProfiles: [{ id: 'default', name: 'Default', bindings: [] }],
            completedRoundIds: [],
            startedRoundIds: [],
          }),
        )
      },
      { key: SAVE_KEY },
    )

    await page.goto('/?difficulty=classic-assist&showTimer=1&reducedMotion=0&highContrast=0&mute=0&volume=0.75')

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-difficulty', 'classic-assist')
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-show-timer', 'true')
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-high-contrast', 'false')
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-audio-muted', 'false')
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-audio-volume', '0.75')

    await page.goto('/?seed=32')

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-difficulty', 'classic-expert')
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-show-timer', 'false')
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-high-contrast', 'true')
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-audio-muted', 'true')
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-audio-volume', '0.25')
  })

  test('records a completed short round once and keeps the local high score after reload', async ({ page }) => {
    await completeShortRound(page, 33)
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-round-recorded', 'true')

    const savedAfterRound = await readSavedStats(page)
    expect(savedAfterRound.roundsCompleted).toBe(1)

    await page.reload()
    await page.getByRole('button', { name: 'High Scores' }).click()

    await expect(page.getByTestId('high-scores-panel')).toContainText(/Classic Single/i)
    await expect(page.getByTestId('high-scores-panel')).toContainText(/Seed 33/i)
  })

  test('treats same-seed rounds across reloads as distinct saved rounds', async ({ page }) => {
    await completeShortRoundFromKeyboard(page, 36)
    const firstSave = await readSavedRoundTracking(page)

    await completeShortRoundFromKeyboard(page, 36)
    const secondSave = await readSavedRoundTracking(page)

    expect(firstSave).toMatchObject({
      roundsStarted: 1,
      roundsCompleted: 1,
      startedRoundCount: 1,
      completedRoundCount: 1,
    })
    expect(secondSave).toMatchObject({
      roundsStarted: 2,
      roundsCompleted: 2,
      startedRoundCount: 2,
      completedRoundCount: 2,
    })
    expect(new Set(secondSave.startedRoundIds).size).toBe(2)
    expect(new Set(secondSave.completedRoundIds).size).toBe(2)
  })

  test('replay and change mode do not duplicate completed-round stats', async ({ page }) => {
    await completeShortRound(page, 34, 2, 2)
    const firstStats = await readSavedStats(page)

    await page.getByRole('button', { name: 'Change Mode' }).click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'mode-select')
    expect(await readSavedStats(page)).toEqual(firstStats)

    await page.goto('/?seed=34&durationSeconds=1&theEndSeconds=0.1&simulationSpeed=20')
    await completeShortRound(page, 34, 2, 2)
    const secondStats = await readSavedStats(page)
    expect(secondStats.roundsStarted).toBe(firstStats.roundsStarted + 1)
    expect(secondStats.roundsCompleted).toBe(firstStats.roundsCompleted + 1)

    await page.getByRole('button', { name: 'Replay' }).click()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'gameplay')
    const replayStats = await readSavedStats(page)
    expect(replayStats.roundsStarted).toBe(secondStats.roundsStarted + 1)
    expect(replayStats.roundsCompleted).toBe(secondStats.roundsCompleted)
    expect(replayStats.totalPlaySeconds).toBe(secondStats.totalPlaySeconds)
  })

  test('boots with defaults and unavailable-storage marker when localStorage is disabled', async ({ page }) => {
    await page.addInitScript(() => {
      const unavailable = () => {
        throw new Error('localStorage disabled for test')
      }
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get: unavailable,
      })
    })

    await page.goto('/?seed=35')

    await expect(page.getByTestId('m26-shell')).toBeVisible()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-storage-available', 'false')
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-save-status', 'storage-unavailable')
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-difficulty', 'classic-standard')
  })
})

async function completeShortRound(
  page: import('@playwright/test').Page,
  seed: number,
  durationSeconds = 1,
  simulationSpeed = 20,
): Promise<void> {
  await page.goto(`/?seed=${seed}&durationSeconds=${durationSeconds}&theEndSeconds=0.1&simulationSpeed=${simulationSpeed}`)
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await page.getByRole('button', { name: 'Classic Single' }).click()
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
}

async function readSavedStats(page: import('@playwright/test').Page): Promise<{
  roundsStarted: number
  roundsCompleted: number
  totalCatches: number
  totalAttempts: number
  totalSplashes: number
  bestCombo: number
  totalPlaySeconds: number
}> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key)
    if (!raw) {
      throw new Error('missing save data')
    }
    return JSON.parse(raw).stats
  }, SAVE_KEY)
}

async function completeShortRoundFromKeyboard(page: import('@playwright/test').Page, seed: number): Promise<void> {
  await page.goto(`/?seed=${seed}&durationSeconds=0.25&theEndSeconds=0.1&simulationSpeed=120`)
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'results', { timeout: 5_000 })
}

async function readSavedRoundTracking(page: import('@playwright/test').Page): Promise<{
  roundsStarted: number
  roundsCompleted: number
  startedRoundCount: number
  completedRoundCount: number
  startedRoundIds: string[]
  completedRoundIds: string[]
}> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key)
    if (!raw) {
      throw new Error('missing save data')
    }
    const save = JSON.parse(raw)
    return {
      roundsStarted: save.stats.roundsStarted,
      roundsCompleted: save.stats.roundsCompleted,
      startedRoundCount: save.startedRoundIds.length,
      completedRoundCount: save.completedRoundIds.length,
      startedRoundIds: save.startedRoundIds,
      completedRoundIds: save.completedRoundIds,
    }
  }, SAVE_KEY)
}
