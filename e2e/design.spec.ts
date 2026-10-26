import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const evidenceDirectory = resolve('design-audit');

async function inspectPage(page: Page) {
  return page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const rgb = (value: string): number[] => value.startsWith('#')
      ? value.slice(1).match(/.{2}/g)!.map(channel => parseInt(channel, 16))
      : (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const luminance = (color: string) => rgb(color).map(channel => {
      const normalized = channel / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const contrast = (foreground: string, background: string) => {
      const light = luminance(foreground);
      const dark = luminance(background);
      return (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
    };
    const token = (name: string) => root.getPropertyValue(`--color-${name}`).trim();
    const body = getComputedStyle(document.body);
    const submit = document.querySelector<HTMLButtonElement>('button[type="submit"]');
    const action = submit ? getComputedStyle(submit) : null;
    const alert = document.querySelector('[role="alert"]');
    const error = alert ? getComputedStyle(alert) : null;
    const table = document.querySelector('table');
    const tableScroller = table?.parentElement;
    const cards = Array.from(document.querySelectorAll('main *')).filter(element => getComputedStyle(element).borderRadius === '12px');
    return {
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      background: body.backgroundColor,
      foreground: body.color,
      surface: token('surface'),
      mutedSurface: token('surface-muted'),
      border: token('border'),
      links: token('link'),
      fontSize: body.fontSize,
      lineHeight: body.lineHeight,
      theme: document.documentElement.dataset.theme,
      cards: cards.length,
      contrasts: {
        body: contrast(body.color, body.backgroundColor),
        surfaceText: contrast(token('text'), token('surface')),
        secondaryText: contrast(token('text-secondary'), token('surface')),
        link: contrast(token('link'), token('surface')),
        ...(action ? { action: contrast(action.color, action.backgroundColor) } : {}),
        ...(error ? { error: contrast(error.color, error.backgroundColor) } : {}),
      },
      action: action ? { background: action.backgroundColor, color: action.color, radius: action.borderRadius, height: submit!.getBoundingClientRect().height } : null,
      table: tableScroller ? {
        scrollable: getComputedStyle(tableScroller).overflowX,
        viewportWidth: tableScroller.clientWidth,
        contentWidth: tableScroller.scrollWidth,
      } : null,
    };
  });
}

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 390]) {
    test(`дизайн ${theme} ${width}: контраст, формы, таблица и отсутствие переполнения`, async ({ page }) => {
      test.setTimeout(90000);
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript(savedTheme => {
        localStorage.setItem('dashboard_settings', JSON.stringify({ dashboardName: 'Дашборд', defaultPeriod: 'week', theme: savedTheme }));
      }, theme);
      mkdirSync(evidenceDirectory, { recursive: true });
      const reports = [];
      const capture = async (name: string) => {
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        const fonts = await page.evaluate(async () => {
          const sample = 'Дашборд Dashboard 123';
          const weights = [400, 500, 600, 700];
          const loaded = await Promise.all(weights.map(async weight => {
            const faces = await document.fonts.load(`${weight} 16px "Inter"`, sample);
            return { weight, count: faces.length, loaded: faces.every(face => face.status === 'loaded' && face.family.replace(/["']/g, '') === 'Inter') };
          }));
          await document.fonts.ready;
          return {
            loaded,
            checked: weights.every(weight => document.fonts.check(`${weight} 16px "Inter"`, sample)),
            resources: performance.getEntriesByType('resource').map(entry => entry.name).filter(url => /\.woff2?(?:[?#]|$)/.test(url)),
            origin: location.origin,
          };
        });
        expect(fonts.checked).toBe(true);
        for (const face of fonts.loaded) {
          expect(face.count, `Inter ${face.weight} must load actual font faces`).toBeGreaterThan(0);
          expect(face.loaded).toBe(true);
        }
        expect(fonts.resources.length).toBeGreaterThan(0);
        for (const resource of fonts.resources) expect(new URL(resource).origin).toBe(fonts.origin);
        const report = { ...await inspectPage(page), fonts };
        expect(report.documentWidth, `${name}: document must fit the viewport`).toBeLessThanOrEqual(width);
        expect(report.background).toBe(theme === 'dark' ? 'rgb(2, 6, 23)' : 'rgb(248, 250, 252)');
        expect(report.surface).toBe(theme === 'dark' ? '#0f172a' : '#ffffff');
        expect(report.border).toBe(theme === 'dark' ? '#334155' : '#e2e8f0');
        expect(report.links).toBe(theme === 'dark' ? '#60a5fa' : '#2563eb');
        expect(report.fontSize).toBe('16px');
        expect(report.lineHeight).toBe('25.6px');
        expect(report.cards).toBeGreaterThan(0);
        for (const [element, ratio] of Object.entries(report.contrasts)) expect(ratio, `${name}: ${element} contrast`).toBeGreaterThanOrEqual(4.5);
        if (report.action) {
          expect(report.action.background).toBe('rgb(37, 99, 235)');
          expect(report.action.color).toBe('rgb(255, 255, 255)');
          expect(report.action.radius).toBe('8px');
          expect(report.action.height).toBeGreaterThanOrEqual(44);
        }
        const screenshot = resolve(evidenceDirectory, `${theme}-${width}-${name}.png`);
        await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });
        reports.push({ page: name, screenshot, ...report });
      };
      await page.goto('/login');
      await expect(page.getByRole('heading', { name: 'Вход', exact: true })).toBeVisible();
      await page.getByLabel('Логин', { exact: true }).focus();
      await expect(page.getByLabel('Логин', { exact: true })).toHaveCSS('outline-style', 'solid');
      await capture('login');
      await page.getByTestId('login-input').fill('wrong');
      await page.getByTestId('password-input').fill('wrong');
      await page.getByTestId('login-submit').click();
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByTestId('login-submit')).toBeEnabled();
      await capture('login-error');
      await page.getByTestId('login-input').fill('admin');
      await page.getByTestId('password-input').fill('admin');
      await page.getByTestId('login-submit').click();
      await expect(page.getByRole('main').getByText('Заказы', { exact: true })).toBeVisible();
      await expect(page.locator('.recharts-surface')).toHaveCount(2);
      await capture('dashboard');
      await page.getByRole('link', { name: 'Пользователи', exact: true }).click();
      await expect(page.getByRole('table')).toBeVisible();
      await capture('users');
      if (width === 390) {
        const table = reports[reports.length - 1].table!;
        expect(table.scrollable).toBe('auto');
        expect(table.contentWidth).toBeGreaterThan(table.viewportWidth);
      }
      await page.getByRole('link', { name: 'Настройки', exact: true }).click();
      await expect(page.getByLabel('Тема', { exact: true })).toBeVisible();
      await capture('settings');
      writeFileSync(resolve(evidenceDirectory, `${theme}-${width}-computed.json`), JSON.stringify(reports, null, 2));
    });
  }
}
