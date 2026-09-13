import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SHOTS_DIR = path.join(__dirname, '..', 'e2e-results', 'screenshots');
fs.mkdirSync(SHOTS_DIR, { recursive: true });

async function shot(page: import('@playwright/test').Page, name: string) {
  await page.getByText('Duke u ngarkuar...').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SHOTS_DIR, `${name}.png`) });
}

async function loginAsFieldWorker(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/');
  await page.getByPlaceholder('shembull@vizitrack.com').waitFor({ timeout: 20000 });
  await page.getByPlaceholder('shembull@vizitrack.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByText('Hyr në Sistem', { exact: true }).click();
  await page.getByText('Agjenda', { exact: true }).waitFor({ timeout: 15000 });
}

test.describe('ViziTrack Mobile — rrjedha e punonjësit në terren (Expo web target)', () => {
  test('TC-M01: ekrani i hyrjes (login) shfaqet me markën ViziTrack', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('shembull@vizitrack.com').waitFor({ timeout: 20000 });
    await expect(page.getByText('Sistemi i Menaxhimit në Terren')).toBeVisible();
    await shot(page, 'm01-login');
  });

  test('TC-M02: mjeku hyn me sukses dhe sheh Agjendën e ditës', async ({ page }) => {
    await loginAsFieldWorker(page, 'hasan@demo.com', '123456');
    await expect(page.getByText('Detyrat e Sotme')).toBeVisible();
    await shot(page, 'm02-agenda-mjek');
  });

  test('TC-M03: "Historia" shfaq vizitat e përfunduara/anuluara të ekipit', async ({ page }) => {
    await loginAsFieldWorker(page, 'hasan@demo.com', '123456');
    await page.getByText('Historia', { exact: true }).click();
    await expect(page.getByText('Historiku i Punës')).toBeVisible();
    await page.getByText('PËRFUNDUAR').first().waitFor({ timeout: 10000 });
    await shot(page, 'm03-history-mjek');
  });

  test('TC-M04: "Profili" shfaq të dhënat e punonjësit dhe rolin klinik', async ({ page }) => {
    await loginAsFieldWorker(page, 'hasan@demo.com', '123456');
    await page.getByText('Profili', { exact: true }).click();
    await expect(page.getByText('Profili Im')).toBeVisible();
    await expect(page.getByText('Mjek', { exact: true }).first()).toBeVisible();
    await shot(page, 'm04-profile-mjek');
  });

  test('TC-M05: "Ndihma dhe Suporti" hap qendrën e suportit me manual përdorimi dhe kontakt IT', async ({ page }) => {
    await loginAsFieldWorker(page, 'hasan@demo.com', '123456');
    await page.getByText('Profili', { exact: true }).click();
    await page.getByText('Ndihma dhe Suporti', { exact: true }).click();
    await expect(page.getByText('Qendra e Suportit')).toBeVisible();
    await expect(page.getByText('Manuali i Përdorimit')).toBeVisible();
    await page.waitForTimeout(500);
    await shot(page, 'm05-help-support');
  });

  test('TC-M06: laboranti hyn dhe sheh Agjendën e vet (rol i ndryshëm nga mjeku)', async ({ page }) => {
    await loginAsFieldWorker(page, 'arta@demo.com', '123456');
    await expect(page.getByText('Agjenda:')).toBeVisible();
    await expect(page.getByText('Laborant', { exact: true })).toBeVisible();
    await shot(page, 'm06-agenda-laborant');
  });

  test('TC-M07: infermieri hyn dhe sheh Agjendën e vet', async ({ page }) => {
    await loginAsFieldWorker(page, 'dardan@demo.com', '123456');
    await expect(page.getByText('Agjenda:')).toBeVisible();
    await expect(page.getByText('Infermier', { exact: true })).toBeVisible();
    await shot(page, 'm07-agenda-infermier');
  });
});
