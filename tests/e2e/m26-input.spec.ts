import { expect, test } from '@playwright/test'

const SAVE_STORAGE_KEY = 'frogs-and-flies.save.v2'

test.describe('M2.6 input foundation', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.setTimeout(60_000)
    await page.goto('/?seed=426&durationSeconds=10&theEndSeconds=0.1')
  })

  test('uses keyboard defaults for shell start and pause', async ({ page }) => {
    await page.keyboard.press('Enter')

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'gameplay')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'gameplay')
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-active-input-device', 'keyboard')

    await page.keyboard.press('KeyP')

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', 'pause')
    await expect(page.getByTestId('game-state')).toHaveAttribute('data-state', 'pause')
  })

  test('exposes pointer, touch, and gamepad input markers', async ({ page }) => {
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-gamepad-connected', /^(true|false)$/)
    await expect(page.getByTestId('touch-zones')).toHaveAttribute('data-touch-zones-ready', 'true')

    await page.getByTestId('game-canvas').click({ position: { x: 500, y: 300 } })
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-active-input-device', 'pointer')

    const canvas = page.getByTestId('game-canvas')
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    await canvas.dispatchEvent('pointerdown', {
      clientX: Math.round((box?.x ?? 0) + 80),
      clientY: Math.round((box?.y ?? 0) + 80),
      pointerId: 42,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      buttons: 1,
    })
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-active-input-device', 'touch')
  })

  test('rejects keyboard remap conflicts', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByTestId('remap-p1.moveLeft').click()
    await page.keyboard.press('KeyD')

    await expect(page.getByTestId('input-remap-status')).toHaveAttribute('data-remap-state', 'conflict')
    await expect(page.getByTestId('input-remap-status')).toContainText('conflicts with p1.moveRight')
  })

  test('persists remapped defaults after reload and can reset them', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByTestId('remap-p1.moveLeft').click()
    await page.keyboard.press('KeyZ')
    await expect(page.getByTestId('input-remap-status')).toHaveAttribute('data-remap-state', 'saved')
    expect(await readKeyboardBinding(page, 'p1.moveLeft')).toEqual(['KeyZ'])

    await page.reload()

    expect(await readKeyboardBinding(page, 'p1.moveLeft')).toEqual(['KeyZ'])
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByTestId('input-reset-defaults').click()

    await expect(page.getByTestId('input-remap-status')).toHaveAttribute('data-remap-state', 'reset')
    expect(await readKeyboardBinding(page, 'p1.moveLeft')).toEqual(['ArrowLeft', 'KeyA'])
  })
})

async function readKeyboardBinding(page: import('@playwright/test').Page, action: string): Promise<string[]> {
  return page.evaluate(
    ({ key, actionId }) => {
      const raw = localStorage.getItem(key)
      if (!raw) {
        return []
      }
      const save = JSON.parse(raw)
      const selectedProfileId = save.settings?.inputProfileId ?? 'default'
      const profile = save.inputProfiles?.find((candidate: { id: string }) => candidate.id === selectedProfileId)
      return (profile?.bindings ?? [])
        .filter((binding: { action?: string; device?: string }) => binding.action === actionId && binding.device === 'keyboard')
        .map((binding: { code?: string }) => binding.code)
        .sort()
    },
    { key: SAVE_STORAGE_KEY, actionId: action },
  )
}
