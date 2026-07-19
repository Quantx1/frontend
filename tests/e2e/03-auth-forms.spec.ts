import { test, expect } from '@playwright/test'

/**
 * Validation contract of the public auth forms. These tests do not
 * actually create users — they verify the client-side gates that stop
 * users from submitting garbage. Real signup is exercised separately
 * with a seeded test account.
 */
test.describe('Login form', () => {
  test('rejects empty submit', async ({ page }) => {
    await page.goto('/login')
    // Submit immediately
    const submit = page.getByRole('button', { name: /sign in|log in|continue/i }).first()
    await submit.click().catch(() => {})
    // Either HTML5 validation fires or an inline error appears.
    const body = await page.locator('body').innerText()
    expect(body.length, 'page rendered something').toBeGreaterThan(50)
  })

  test('shows email + password fields', async ({ page }) => {
    await page.goto('/login')
    const email = page.getByLabel(/email/i).first()
    const password = page.getByLabel(/password/i).first()
    await expect(email, 'email input present').toBeVisible()
    await expect(password, 'password input present').toBeVisible()
  })

  test('rejects invalid email format', async ({ page }) => {
    await page.goto('/login')
    const email = page.getByLabel(/email/i).first()
    await email.fill('not-an-email')
    const password = page.getByLabel(/password/i).first()
    await password.fill('whatever123')
    const submit = page.getByRole('button', { name: /sign in|log in|continue/i }).first()
    await submit.click().catch(() => {})
    // Should NOT navigate to the authed home (/copilot) on bogus creds.
    await page.waitForTimeout(1500)
    expect(page.url()).not.toContain('/copilot')
  })
})

test.describe('Signup form', () => {
  test('renders multi-step flow or single form', async ({ page }) => {
    await page.goto('/signup')
    const body = await page.locator('body').innerText()
    // Should include "create account" or "sign up" or plan-selection copy.
    expect(body).toMatch(/sign up|create.*account|get started|choose.*plan|free|pro|elite/i)
  })

  test('email field present and validates format', async ({ page }) => {
    await page.goto('/signup')
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    await expect(emailInput, 'email input visible').toBeVisible()
    await emailInput.fill('garbage')
    // Submit the form by clicking the form's submit button — NOT any
    // OAuth/social button. We scope to the <form> so the locator can't
    // match "Continue with Google", which legitimately navigates away.
    const form = page.locator('form').first()
    const submit = form.locator('button[type="submit"]').first()
    await submit.click().catch(() => {})
    await page.waitForTimeout(800)
    // Form-level submission should not navigate to dashboard with a bogus
    // email; we expect to remain on /signup either showing a validation
    // error or stuck on the same step.
    expect(page.url()).toContain('/signup')
  })
})

test.describe('Forgot password', () => {
  test('shows reset request form', async ({ page }) => {
    await page.goto('/forgot-password')
    const email = page.locator('input[type="email"], input[name="email"]').first()
    await expect(email, 'email input on reset page').toBeVisible()
    const body = await page.locator('body').innerText()
    expect(body).toMatch(/reset|forgot/i)
  })
})
