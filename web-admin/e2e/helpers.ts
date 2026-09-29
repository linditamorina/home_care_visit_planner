import { Page, Locator, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Kërkohet: TEST_USER_PASSWORD te web-admin/.env.local (jo i koduar në kod — llogaritë
// @demo.com janë sintetike, por skedari është publik te GitHub, prandaj fjalëkalimi
// duhet të mbetet vetëm lokal, jashtë repository-t).
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;
if (!TEST_USER_PASSWORD) {
  throw new Error(
    'TEST_USER_PASSWORD mungon te web-admin/.env.local — kërkohet për t\'u kyçur me llogaritë testuese gjatë ekzekutimit të e2e. Shih README.md.'
  );
}

export const TEST_USERS = {
  admin: { email: 'admin@demo.com', password: TEST_USER_PASSWORD },
  supervisor: { email: 'dita@demo.com', password: TEST_USER_PASSWORD },
  fieldWorkerDoctor: { email: 'hasan@demo.com', password: TEST_USER_PASSWORD },
  fieldWorkerNurse: { email: 'dardan@demo.com', password: TEST_USER_PASSWORD },
  fieldWorkerLab: { email: 'arta@demo.com', password: TEST_USER_PASSWORD },
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
