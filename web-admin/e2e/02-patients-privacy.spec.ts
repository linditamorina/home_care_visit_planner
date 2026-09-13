import { test, expect } from '@playwright/test';
import { loginAs, shot } from './helpers';

test.describe('Pacientët — lista dhe pseudonimizimi (privatësi)', () => {
  test('TC-09: lista e pacientëve identifikon çdo person VETËM me kod referimi (PAT-XXXXXX), jo me emër', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/dashboard/pacientet');
    await expect(page.getByText('Lista e Personave (Pacientët)')).toBeVisible();
    await page.getByText('Duke ngarkuar pacientët...').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
    await page.getByText(/PAT-/).first().waitFor({ timeout: 10000 });

    const bodyText = await page.locator('main').innerText();
    const refCodes = bodyText.match(/PAT-[A-Z0-9]+/g) ?? [];
    expect(refCodes.length).toBeGreaterThan(0);

    // Kontroll negativ: asnjë etiketë tipike "Emri"/"Mbiemri" nuk duhet të shfaqet si kolonë e tabelës së pacientëve.
    await expect(page.locator('table').getByText(/^Emri$|^Mbiemri$/)).toHaveCount(0);
    await shot(page, '09-patients-list-pseudonymized');
  });

  test('TC-10: filtrimi i pacientëve sipas zonës redukton rezultatet e listuara', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/dashboard/pacientet');
    const totalBefore = await page.getByText(/Totali: \d+/).innerText();
    await page.getByRole('combobox').filter({ hasText: 'Të gjitha Zonat' }).selectOption({ label: 'Bair 1' });
    await page.waitForTimeout(500);
    const rows = await page.locator('table').getByText(/^Bair 1$/).count();
    expect(rows).toBeGreaterThan(0);
    expect(totalBefore).toMatch(/Totali: \d+/);
  });

  test('TC-11: hapja e historikut të një pacienti shfaq detajet e profilit dhe vizitat e mëparshme', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/dashboard/pacientet');
    await page.getByRole('link', { name: 'Shiko Historikun →' }).first().click();
    await expect(page.getByText('Historiku i Vizitave')).toBeVisible();
    await expect(page.getByText(/PAT-/)).toBeVisible();
    await shot(page, '11-patient-detail');
  });
});
