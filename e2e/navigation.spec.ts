import { test, expect } from '@playwright/test'

test('floating nav routes to contacts', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Open navigation').click()
  await page.getByRole('button', { name: 'Contacts' }).click()
  await expect(page.getByText('Contacts')).toBeVisible()
})

test('header profile quick access routes to settings', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Open profile and settings').click()
  await expect(page.getByText(/Settings/i)).toBeVisible()
})
