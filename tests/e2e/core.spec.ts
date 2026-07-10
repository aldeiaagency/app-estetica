import { expect, test } from '@playwright/test'

test('public home renders without fatal browser errors', async ({ page }) => {
  const fatalErrors: string[] = []
  page.on('pageerror', error => fatalErrors.push(error.message))

  const response = await page.goto('/')
  expect(response?.ok()).toBeTruthy()
  await expect(page.locator('body')).toBeVisible()
  await expect(page).toHaveTitle(/.+/)
  expect(fatalErrors).toEqual([])
})

test('dashboard requires an authenticated business session', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=/)
})

test('advanced product modules are disabled by default', async ({ page }) => {
  await page.goto('/productos')
  await expect(page).toHaveURL(/\?feature=unavailable/)
})

test('liveness and readiness endpoints expose machine-readable state', async ({ request }) => {
  const live = await request.get('/api/health/live')
  expect(live.status()).toBe(200)
  expect((await live.json()).status).toBe('ok')

  const ready = await request.get('/api/health/ready')
  expect(ready.status()).toBe(200)
  const body = await ready.json()
  expect(body.status).toBe('ready')
  expect(body.checks.database.ok).toBe(true)
})

test('API responses include baseline hardening headers', async ({ request }) => {
  const response = await request.get('/api/health/live')
  expect(response.headers()['x-content-type-options']).toBe('nosniff')
})
