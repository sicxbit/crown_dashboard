import { expect, test } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'password123';

const uniqueSuffix = Date.now();
const ticketTitle = `Playwright ticket ${uniqueSuffix}`;
const ticketDescription = 'Ticket created via automated E2E flow';
const displayName = `QA Admin ${uniqueSuffix}`;

test.describe('CrownCaregivers admin workflow', () => {
  test('login, update profile, create ticket, toggle dark mode, logout', async ({ page }) => {
    await page.goto('/');
    await page.goto('/admin/login');

    await page.getByLabel(/Email/i).fill(adminEmail);
    await page.getByLabel(/Password/i).fill(adminPassword);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL(/admin/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 15000 });

    await page.goto('/settings');
    await page.getByLabel(/Display name/i).fill(displayName);
    await page.getByRole('button', { name: /save display name/i }).click();
    await expect(page.getByLabel(/Display name/i)).toHaveValue(displayName);

    await page.goto('/admin/tickets');
    await page.getByLabel(/Title/i).fill(ticketTitle);
    await page.getByLabel(/Description/i).fill(ticketDescription);
    await page.getByLabel(/Priority/i).selectOption('high');
    await page.getByRole('button', { name: /create ticket/i }).click();
    await expect(page.getByText(ticketTitle).first()).toBeVisible({ timeout: 15000 });

    await page.goto('/settings');
    await page.getByRole('button', { name: /dark/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.goto('/admin');
    await page.getByRole('button', { name: /logout/i }).click();
    await page.waitForURL(/login/);
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});
