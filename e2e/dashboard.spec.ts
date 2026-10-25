import { test, expect } from '@playwright/test';

test.describe('Дашборд', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('dashboard_token'));
    await page.goto('/login');
    await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('login-input').fill('admin');
    await page.getByTestId('password-input').fill('admin');
    await page.getByTestId('login-submit').click();
    await expect(page.getByRole('heading', { name: /дашборд/i })).toBeVisible({ timeout: 5000 });
  });

  test('отображаются виджеты с метриками и графики', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Пользователи', { exact: true })).toBeVisible();
    await expect(page.getByText('Заказы', { exact: true })).toBeVisible();
    await expect(page.locator('.recharts-surface').first()).toBeVisible({ timeout: 5000 });
  });
});
