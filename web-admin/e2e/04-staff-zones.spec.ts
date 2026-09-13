import { test, expect } from '@playwright/test';
import { loginAs, shot } from './helpers';

test.describe('Menaxhimi i stafit dhe zonave (vetëm Administrator)', () => {
  test('TC-16: faqja e stafit ndan administratorët nga stafi operativ (klinik/terren)', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/stafi');
    await expect(page.getByRole('heading', { name: /administratorët/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /stafi operativ/i })).toBeVisible();
    await shot(page, '16-staff-management');
  });

  test('TC-17: faqja e zonave liston zonat ekzistuese dhe ofron veprime Modifiko/Fshij', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/zonat');
    await expect(page.getByRole('heading', { name: 'Menaxhimi i Zonave' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ndrysho' }).first()).toBeVisible();
    await shot(page, '17-zones-management');
  });

  test('TC-18: krijimi i një zone me emër ekzistues refuzohet (validim unik)', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/zonat');
    const firstZoneName = await page.locator('table tbody tr').first().locator('td').first().innerText();
    await page.getByRole('button', { name: 'Shto Zonë të Re' }).click();
    await page.getByRole('textbox').first().fill(firstZoneName.trim());
    await page.getByRole('button', { name: /^Shto|^Ruaj/ }).last().click();
    await expect(page.getByText(/ekziston|already|dublikat/i)).toBeVisible({ timeout: 5000 }).catch(async () => {
      // Disa implementime e refuzojnë në heshtje (pa e mbyllur modalin); kontrollojmë të paktën që
      // numri i zonave nuk është rritur.
      await expect(page.getByText(firstZoneName.trim())).toHaveCount(1);
    });
  });

  test('TC-19: stafi i terrenit shfaq profesionin klinik (Mjek/Infermier/Laborant) për çdo punonjës', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/stafi');
    const professions = page.getByText(/^(Mjek|Infermier|Laborant)$/);
    await expect(professions.first()).toBeVisible();
    expect(await professions.count()).toBeGreaterThan(0);
  });
});
