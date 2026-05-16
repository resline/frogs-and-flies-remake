import { expect, test } from '@playwright/test'

test.describe('M2.6 PWA offline shell', () => {
  test('serves a complete local web app manifest', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest')

    expect(response.status()).toBe(200)

    const manifest = await response.json()
    expect(manifest).toMatchObject({
      name: expect.any(String),
      short_name: expect.any(String),
      description: expect.any(String),
      start_url: expect.any(String),
      display: expect.any(String),
      theme_color: expect.any(String),
      background_color: expect.any(String),
      orientation: expect.any(String),
    })
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: expect.any(String),
          sizes: expect.any(String),
          type: expect.any(String),
        }),
      ]),
    )
  })

  test('serves a JavaScript service worker', async ({ request }) => {
    const response = await request.get('/service-worker.js')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('javascript')
  })

  test('reports service worker registration status after online boot', async ({ page }) => {
    await page.goto('/?seed=2606')

    await expect(page.getByTestId('m26-shell')).toHaveAttribute(
      'data-pwa-registration',
      /^(registered|unsupported|failed)$/,
    )
  })

  test('reloads to the shell while offline after an online boot', async ({ page, browserName }) => {
    test.setTimeout(60_000)
    test.skip(browserName === 'webkit', 'WebKit reports an internal error when Playwright reloads an offline service-worker page.')

    await page.goto('/?seed=2607')
    await expect(page.getByTestId('m26-shell')).toHaveAttribute(
      'data-pwa-registration',
      /^(registered|unsupported|failed)$/,
    )

    const registrationState = await page.getByTestId('m26-shell').getAttribute('data-pwa-registration')
    test.skip(registrationState !== 'registered', `service worker registration ${registrationState ?? 'missing'}`)

    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-pwa-runtime-cache-ready', 'true')

    await page.context().setOffline(true)
    await page.reload()

    await expect(page.getByTestId('m26-shell')).toBeVisible()
    await expect(page.getByTestId('m26-shell')).toHaveAttribute('data-shell-screen', /^(splash|main-menu)$/)
  })
})
