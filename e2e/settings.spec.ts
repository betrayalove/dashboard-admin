import { test, expect } from '@playwright/test';

test.describe('Настройки', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('dashboard_token'));
    await page.goto('/login');
    await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('login-input').fill('admin');
    await page.getByTestId('password-input').fill('admin');
    await page.getByTestId('login-submit').click();
    await expect(page.getByRole('heading', { name: /дашборд/i })).toBeVisible({ timeout: 5000 });
  });

  test('форма настроек сохраняется и показывается toast', async ({ page }) => {
    await page.getByRole('link', { name: /настройки/i }).click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole('heading', { name: /настройки/i })).toBeVisible();
    await page.getByLabel(/название дашборда/i).fill('Мой дашборд');
    await page.getByRole('button', { name: /сохранить/i }).click();
    await expect(page.getByRole('region', { name: /уведомления/i }).or(page.locator('[role="status"]'))).toContainText(/сохранены/i, { timeout: 3000 });
  });
});
