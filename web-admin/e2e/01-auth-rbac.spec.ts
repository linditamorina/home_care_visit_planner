import { test, expect } from '@playwright/test';
import { loginAs, shot, TEST_USERS } from './helpers';

test.describe('Autentikimi dhe RBAC (Role-Based Access Control)', () => {
  test('TC-01: administratori hyn me sukses dhe sheh Qendrën Operacionale', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText('Qendra Operacionale')).toBeVisible();
    await shot(page, '01-admin-dashboard');
  });

  test('TC-02: supervizori hyn me sukses dhe sheh Panelin Administrativ (jo Qendrën Operacionale)', async ({ page }) => {
    await loginAs(page, 'supervisor');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText('Paneli Administrativ')).toBeVisible();
    await shot(page, '02-supervisor-dashboard');
  });

  test('TC-03: kredenciale të gabuara shfaqin mesazh gabimi dhe nuk lejojnë hyrje', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('admin@sistemi.com').fill('admin@demo.com');
    await page.getByPlaceholder('••••••••').fill('fjalekalim-i-gabuar');
    await page.getByRole('button', { name: 'Hyr në llogari' }).click();
    await expect(page.getByText(/Kredencialet janë të gabuara/)).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-04: përdorues i paautentikuar që hap /admin ridrejtohet te /login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-05: përdorues i paautentikuar që hap /dashboard ridrejtohet te /login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-06: supervizori NUK mund të hyjë te /admin — ridrejtohet automatikisht te /dashboard (rregullim RBAC)', async ({ page }) => {
    await loginAs(page, 'supervisor');
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText('Paneli Administrativ')).toBeVisible();
    await shot(page, '06-rbac-supervisor-blocked-from-admin');
  });

  test('TC-07: punonjësi në terren (field_worker) NUK mund të hyjë në panelin web — akses i mohuar', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('admin@sistemi.com').fill(TEST_USERS.fieldWorkerDoctor.email);
    await page.getByPlaceholder('••••••••').fill(TEST_USERS.fieldWorkerDoctor.password);
    await page.getByRole('button', { name: 'Hyr në llogari' }).click();
    await expect(page.getByText(/Akses i Mohuar/)).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-08: admin i kyçur që viziton /login ridrejtohet automatikisht te /admin (smart routing)', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/login');
    await expect(page).toHaveURL(/\/admin$/);
  });
});
