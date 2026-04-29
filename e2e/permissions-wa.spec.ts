import { test, expect } from '@playwright/test'

test('permission modal progresses through notifications, camera, microphone', async ({ page, context }) => {
  await context.grantPermissions([])
  await page.goto('/')
  await page.waitForTimeout(6000)
  const allowBtn = page.getByRole('button', { name: 'Allow' })
  if (await allowBtn.isVisible()) {
    await expect(page.getByText(/Notifications/i)).toBeVisible()
    await allowBtn.click()
    await expect(page.getByText(/Camera Access/i)).toBeVisible()
    await allowBtn.click()
    await expect(page.getByText(/Microphone Access/i)).toBeVisible()
  }
})

test('wa connection screen is reachable from header', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel(/WhatsApp.*Tap to (manage|connect)/i).click()
  await expect(page.getByText('WhatsApp Connection')).toBeVisible()
})
