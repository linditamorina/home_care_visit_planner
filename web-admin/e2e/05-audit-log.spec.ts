import { test, expect } from '@playwright/test';
import { loginAs, shot } from './helpers';

test.describe('Regjistri i auditimit (audit_logs)', () => {
  test('TC-20: regjistri i auditimit shfaq veprime me etiketa INSERT/UPDATE/DELETE dhe krahasim fushë-për-fushë', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/audit-logs');
    await expect(page.getByText('Regjistri i Auditimit')).toBeVisible();
    const badges = page.getByText(/^(SHTIM|PËRDITËSIM|FSHIRJE|INSERT|UPDATE|DELETE)$/i);
    expect(await badges.count()).toBeGreaterThan(0);
    await shot(page, '20-audit-log');
  });

  test('TC-21: regjistri i auditimit është vetëm-lexim — asnjë kontroll modifikimi/fshirjeje nuk ekziston në UI', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/audit-logs');
    await expect(page.getByRole('button', { name: /Fshij|Modifiko|Edito/i })).toHaveCount(0);
  });

  test('TC-22: supervizori NUK ka qasje te regjistri i auditimit (rrugë ekskluzive për admin)', async ({ page }) => {
    await loginAs(page, 'supervisor');
    await page.goto('/admin/audit-logs');
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
