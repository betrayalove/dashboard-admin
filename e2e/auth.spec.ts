import { test, expect } from '@playwright/test';

const clearAuthStorage = (page: { addInitScript: (fn: () => void) => Promise<void> }) =>
  page.addInitScript(() => {
    localStorage.removeItem('dashboard_token');
  });

test.describe('Авторизация', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthStorage(page);
  });

  test('неавторизованный пользователь при переходе на / редиректится на /login', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('при неверных логине и пароле на форме показывается ошибка', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('login-input').fill('wrong');
    await page.getByTestId('password-input').fill('wrong');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('при успешном логине происходит редирект на дашборд', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('login-input').fill('admin');
    await page.getByTestId('password-input').fill('admin');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/(\?|$)/);
    await expect(page.getByRole('heading', { name: /дашборд/i })).toBeVisible({ timeout: 5000 });
  });
});
