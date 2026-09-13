import { Page, Locator, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export const TEST_USERS = {
  admin: { email: 'admin@demo.com', password: '123456' },
  supervisor: { email: 'dita@demo.com', password: '123456' },
  fieldWorkerDoctor: { email: 'hasan@demo.com', password: '123456' },
  fieldWorkerNurse: { email: 'dardan@demo.com', password: '123456' },
  fieldWorkerLab: { email: 'arta@demo.com', password: '123456' },
};

export const SHOTS_DIR = path.join(__dirname, '..', 'e2e-results', 'screenshots');
fs.mkdirSync(SHOTS_DIR, { recursive: true });

export async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SHOTS_DIR, `${name}.png`), fullPage: false });
}

export async function loginAs(page: Page, role: keyof typeof TEST_USERS) {
  const { email, password } = TEST_USERS[role];
  await page.goto('/login');
  await page.getByPlaceholder('admin@sistemi.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: 'Hyr në llogari' }).click();
  await expect(page.getByText('E suksesshme!')).toBeVisible({ timeout: 5000 });
  await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 });
}

// selectOption({label}) needs an exact string in Playwright; this picks the first
// <option> whose visible text matches a pattern and selects it by value instead.
export async function selectOptionMatching(select: Locator, pattern: RegExp) {
  const value = await select.evaluate((el: HTMLSelectElement, src: string) => {
    const re = new RegExp(src);
    const opt = Array.from(el.options).find(o => re.test(o.textContent || ''));
    return opt ? opt.value : null;
  }, pattern.source);
  if (!value) throw new Error(`No <option> matched ${pattern}`);
  await select.selectOption(value);
}
