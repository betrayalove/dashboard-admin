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
    await expect(page.getByText(/Страница \d+ из/)).toBeVisible();
  });

  test('сортировка по клику на заголовок колонки меняет порядок', async ({ page }) => {
    await page.getByRole('link', { name: /пользователи/i }).click();
    await expect(page.getByRole('heading', { name: /пользователи/i })).toBeVisible();
    const heading = page.getByRole('columnheader', { name: /имя/i });
    await expect(heading).toHaveAttribute('aria-sort', 'ascending');
    await page.getByRole('button', { name: /имя/i }).click();
    await expect(heading).toHaveAttribute('aria-sort', 'descending');
    await expect(page.getByText(/Страница \d+ из/)).toBeVisible();
  });

  test('выбор строк чекбоксом и «Удалить выбранные» показывают toast', async ({ page }) => {
    await page.getByRole('link', { name: /пользователи/i }).click();
    await expect(page.getByRole('heading', { name: /пользователи/i })).toBeVisible({ timeout: 3000 });
    const firstRowCheckbox = page.getByRole('row').nth(1).getByRole('checkbox');
    const deletedName = (await firstRowCheckbox.getAttribute('aria-label'))!.replace('Выбрать ', '');
    await firstRowCheckbox.check();
    await expect(page.getByRole('button', { name: /удалить выбранные/i })).toBeVisible();
    await page.getByRole('button', { name: /удалить выбранные/i }).click();
    await expect(page.getByRole('region', { name: /уведомления/i })).toContainText(/удалено|записей/i, { timeout: 3000 });
    await page.reload();
    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('cell', { name: deletedName, exact: true })).toHaveCount(0);
  });
});


// Delete the final page and keep the remaining first page reachable.
test('удаление последней страницы исправляет пагинацию', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-input').fill('admin');
  await page.getByTestId('password-input').fill('admin');
  await page.getByTestId('login-submit').click();
  await page.getByRole('link', { name: 'Пользователи', exact: true }).click();
  await page.getByRole('button', { name: 'Вперёд' }).click();
  await expect(page.getByText(/Страница 2 из 2/)).toBeVisible();
  await page.getByRole('checkbox', { name: 'Выбрать все', exact: true }).check();
  await page.getByRole('button', { name: /Удалить выбранные/ }).click();
  await expect(page.getByText(/Страница 1 из 1/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Вперёд' })).toBeDisabled();
  await expect(page.getByRole('row')).toHaveCount(11);
});
