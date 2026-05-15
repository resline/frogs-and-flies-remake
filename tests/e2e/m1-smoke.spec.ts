import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const CONTROL_CLICK_OPTIONS = { force: true } as const

async function clickControl(page: Page, testId: string): Promise<void> {
  const control = page.getByTestId(testId)

  await expect(control).toBeVisible()
  await control.click(CONTROL_CLICK_OPTIONS)
}

async function openModeSelect(page: Page): Promise<void> {
  await clickControl(page, 'shell-play')
  await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'mode-select')
}

async function startFromShell(page: Page): Promise<void> {
  await openModeSelect(page)
  await clickControl(page, 'start-game')
}

test.describe('Frogs and Flies 2 M1', () => {
  test.describe.configure({ mode: 'serial' })

  test('keeps Space jump charging separate from tongue fire', async ({ page }) => {
    await page.goto('/?seed=1&smokeElapsedSeconds=6.5')

    const state = page.getByTestId('game-state')
    const score = page.getByTestId('score')

    await expect(state).toHaveAttribute('data-state', 'gameplay')
    await expect(state).toHaveAttribute('data-tongue-result', 'none')
    await expect(score).toHaveAttribute('data-score', '0')

    await page.evaluate(() => {
      const state = document.querySelector<HTMLElement>('[data-testid="game-state"]')
      if (!state) {
        throw new Error('Missing game-state runtime marker')
      }

      const runtimeWindow = window as Window & {
        __m1SpaceTongueObserved?: {
          tonguePhases: string[]
          tongueResults: string[]
        }
        __m1SpaceTongueObserver?: MutationObserver
      }

      runtimeWindow.__m1SpaceTongueObserver?.disconnect()

      const observed = {
        tonguePhases: [] as string[],
        tongueResults: [] as string[],
      }
      const pushCurrentTongue = () => {
        const tonguePhase = state.getAttribute('data-tongue-phase')
        const tongueResult = state.getAttribute('data-tongue-result')

        if (tonguePhase && observed.tonguePhases.at(-1) !== tonguePhase) {
          observed.tonguePhases.push(tonguePhase)
        }
        if (tongueResult && observed.tongueResults.at(-1) !== tongueResult) {
          observed.tongueResults.push(tongueResult)
        }
      }

      pushCurrentTongue()
      const observer = new MutationObserver(pushCurrentTongue)
      observer.observe(state, {
        attributes: true,
        attributeFilter: ['data-tongue-phase', 'data-tongue-result'],
      })

      runtimeWindow.__m1SpaceTongueObserved = observed
      runtimeWindow.__m1SpaceTongueObserver = observer
    })

    await page.keyboard.down('Space')
    await expect(state).toHaveAttribute('data-jump-phase', 'charging')
    await expect(state).toHaveAttribute('data-tongue-result', 'none')
    await expect(score).toHaveAttribute('data-score', '0')

    await page.keyboard.press('KeyT')
    await page.waitForFunction(
      () => {
        const runtimeWindow = window as Window & {
          __m1SpaceTongueObserved?: {
            tonguePhases: string[]
            tongueResults: string[]
          }
        }

        const observed = runtimeWindow.__m1SpaceTongueObserved
        return (
          observed?.tongueResults.includes('miss') &&
          observed.tonguePhases.includes('recovering') &&
          observed.tonguePhases.at(-1) === 'ready'
        )
      },
      undefined,
      { timeout: 5_000 },
    )

    const observed = await page.evaluate(() => {
      const runtimeWindow = window as Window & {
        __m1SpaceTongueObserved?: {
          tonguePhases: string[]
          tongueResults: string[]
        }
        __m1SpaceTongueObserver?: MutationObserver
      }

      runtimeWindow.__m1SpaceTongueObserver?.disconnect()
      return runtimeWindow.__m1SpaceTongueObserved
    })

    if (!observed) {
      throw new Error('Missing observed Space/tongue transitions')
    }

    expect(observed.tonguePhases).toContain('extended')
    expect(observed.tonguePhases).toContain('recovering')
    expect(observed.tonguePhases.at(-1)).toBe('ready')
    expect(observed.tongueResults).toContain('miss')
    await expect(state).toHaveAttribute('data-jump-phase', 'charging')
    await expect(score).toHaveAttribute('data-score', '0')

    await page.keyboard.up('Space')
  })

  test('exposes M1 runtime markers and supports charged jump, tongue, and water feedback', async ({ page }) => {
    await page.goto('/?seed=123')

    const state = page.getByTestId('game-state')
    const canvas = page.locator('canvas')

    await expect(canvas).toBeVisible()
    await expect(state).toHaveAttribute('data-jump-phase', 'idle')
    await expect(state).toHaveAttribute('data-water-phase', 'calm')
    await expect(canvas).toHaveAttribute('data-runtime-markers', 'm2')
    await expect(canvas).toHaveAttribute('data-jump-phase', 'idle')
    await expect(canvas).toHaveAttribute('data-water-phase', 'calm')

    await page.evaluate(() => {
      const state = document.querySelector<HTMLElement>('[data-testid="game-state"]')
      if (!state) {
        throw new Error('Missing game-state runtime marker')
      }

      const runtimeWindow = window as Window & {
        __m1ObservedRuntime?: {
          jumpPhases: string[]
          tonguePhases: string[]
          tongueResults: string[]
          waterPhases: string[]
        }
        __m1RuntimeObserver?: MutationObserver
      }

      runtimeWindow.__m1RuntimeObserver?.disconnect()

      const observed = {
        jumpPhases: [] as string[],
        tonguePhases: [] as string[],
        tongueResults: [] as string[],
        waterPhases: [] as string[],
      }
      const pushCurrentPhases = () => {
        const jumpPhase = state.getAttribute('data-jump-phase')
        const tonguePhase = state.getAttribute('data-tongue-phase')
        const tongueResult = state.getAttribute('data-tongue-result')
        const waterPhase = state.getAttribute('data-water-phase')

        if (jumpPhase && observed.jumpPhases.at(-1) !== jumpPhase) {
          observed.jumpPhases.push(jumpPhase)
        }
        if (tonguePhase && observed.tonguePhases.at(-1) !== tonguePhase) {
          observed.tonguePhases.push(tonguePhase)
        }
        if (tongueResult && observed.tongueResults.at(-1) !== tongueResult) {
          observed.tongueResults.push(tongueResult)
        }
        if (waterPhase && observed.waterPhases.at(-1) !== waterPhase) {
          observed.waterPhases.push(waterPhase)
        }
      }

      pushCurrentPhases()
      const observer = new MutationObserver(pushCurrentPhases)
      observer.observe(state, {
        attributes: true,
        attributeFilter: ['data-jump-phase', 'data-tongue-phase', 'data-tongue-result', 'data-water-phase'],
      })

      runtimeWindow.__m1ObservedRuntime = observed
      runtimeWindow.__m1RuntimeObserver = observer
    })

    await startFromShell(page)
    await expect(state).toHaveAttribute('data-state', 'gameplay')

    await page.keyboard.down('Space')
    await expect(state).toHaveAttribute('data-jump-phase', 'charging')
    await expect
      .poll(async () => Number(await state.getAttribute('data-jump-charge-seconds')), { timeout: 5_000 })
      .toBeGreaterThanOrEqual(0.4)
    await page.keyboard.up('Space')

    await expect(state).toHaveAttribute('data-jump-phase', 'jumping')
    await expect(state).toHaveAttribute('data-jump-airborne', 'true')
    await expect(canvas).toHaveAttribute('data-jump-phase', 'jumping')
    await expect(canvas).toHaveAttribute('data-jump-airborne', 'true')

    await page.keyboard.press('KeyT')
    await page.waitForFunction(
      () => {
        const runtimeWindow = window as Window & {
          __m1ObservedRuntime?: {
            tonguePhases: string[]
            tongueResults: string[]
          }
        }

        const observed = runtimeWindow.__m1ObservedRuntime
        return (
          observed?.tongueResults.some((result) => result === 'catch' || result === 'miss') &&
          observed.tonguePhases.includes('recovering') &&
          observed.tonguePhases.at(-1) === 'ready'
        )
      },
      undefined,
      { timeout: 5_000 },
    )

    await page.waitForFunction(
      () => {
        const runtimeWindow = window as Window & {
          __m1ObservedRuntime?: {
            waterPhases: string[]
          }
        }

        const waterPhases = runtimeWindow.__m1ObservedRuntime?.waterPhases ?? []
        return waterPhases.includes('splash') && waterPhases.includes('recovery')
      },
      undefined,
      { timeout: 5_000 },
    )

    const observed = await page.evaluate(() => {
      const runtimeWindow = window as Window & {
        __m1ObservedRuntime?: {
          jumpPhases: string[]
          tonguePhases: string[]
          tongueResults: string[]
          waterPhases: string[]
        }
        __m1RuntimeObserver?: MutationObserver
      }

      runtimeWindow.__m1RuntimeObserver?.disconnect()
      return runtimeWindow.__m1ObservedRuntime
    })

    if (!observed) {
      throw new Error('Missing observed M1 runtime transitions')
    }

    expect(observed.jumpPhases).toContain('charging')
    expect(observed.jumpPhases).toContain('jumping')
    expect(observed.tonguePhases).toContain('recovering')
    expect(observed.tonguePhases.at(-1)).toBe('ready')
    expect(observed.tongueResults.some((result) => result === 'catch' || result === 'miss')).toBe(true)
    expect(observed.waterPhases).toContain('splash')
    expect(observed.waterPhases).toContain('recovery')
  })
})
