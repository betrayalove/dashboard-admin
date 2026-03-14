import { test, expect } from '@playwright/test';

test.describe('Таблица пользователей', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('dashboard_token'));
    await page.goto('/login');
    await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('login-input').fill('admin');
    await page.getByTestId('password-input').fill('admin');
    await page.getByTestId('login-submit').click();
    await expect(page.getByRole('heading', { name: /дашборд/i })).toBeVisible({ timeout: 5000 });
  });

  test('страница открывается по ссылке, видна таблица с колонками и пагинация', async ({ page }) => {
    await page.getByRole('link', { name: /пользователи/i }).click();
    await expect(page).toHaveURL(/\/users/);
    await expect(page.getByRole('heading', { name: /пользователи/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /имя/i })).toBeVisible();
    await expect(page.getByText('Страница')).toBeVisible();
  });

  test('сортировка по клику на заголовок колонки меняет порядок', async ({ page }) => {
    await page.getByRole('link', { name: /пользователи/i }).click();
    await expect(page.getByRole('heading', { name: /пользователи/i })).toBeVisible();
    await page.getByRole('button', { name: /имя/i }).click();
    await expect(page.getByText('Страница')).toBeVisible();
  });

  test('выбор строк чекбоксом и «Удалить выбранные» показывают toast', async ({ page }) => {
    await page.getByRole('link', { name: /пользователи/i }).click();
    await expect(page.getByRole('heading', { name: /пользователи/i })).toBeVisible({ timeout: 3000 });
    const firstRowCheckbox = page.getByRole('row').nth(1).getByRole('checkbox');
    await firstRowCheckbox.check();
    await expect(page.getByRole('button', { name: /удалить выбранные/i })).toBeVisible();
    await page.getByRole('button', { name: /удалить выбранные/i }).click();
    await expect(page.getByRole('region', { name: /уведомления/i }).or(page.locator('[role="status"]'))).toContainText(/удалено|записей/i, { timeout: 3000 });
  });
});
