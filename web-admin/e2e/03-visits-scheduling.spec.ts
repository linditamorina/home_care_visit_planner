import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { loginAs, shot, selectOptionMatching } from './helpers';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

test.describe('Planifikimi i vizitave dhe zbulimi i konflikteve (KF-02, KF-03)', () => {
  test('TC-12: lista e vizitave ngarkohet me filtra statusi funksionalë', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/dashboard/vizitat');
    await expect(page.getByRole('heading', { name: 'Planifikimi i Vizitave' })).toBeVisible();
    await shot(page, '12-visits-list');

    await page.getByRole('button', { name: /^Emergjente/ }).click();
    await page.waitForTimeout(400);
    await expect(page.getByText(/EMERGJENTE/i).first()).toBeVisible();
  });

  test('TC-13: hapja e formularit "Krijo Vizitë të Re" shfaq oraret e lira për ekipin/datën e zgjedhur', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/dashboard/vizitat');
    await page.getByRole('button', { name: 'Krijo Vizitë të Re' }).click();

    const patientSelect1 = page.locator('select').nth(1);
    await expect(patientSelect1.locator('option')).not.toHaveCount(1, { timeout: 10000 });
    await selectOptionMatching(patientSelect1, /PAT-/);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    const dateStr = futureDate.toISOString().slice(0, 10);
    await page.locator('input[type="date"]').fill(dateStr);
    await page.waitForTimeout(500);

    // Zgjedh ekipin e parë të mundshëm për këtë datë (varet nga dita e javës: weekday/weekend).
    const teamSelect = page.locator('select').nth(2);
    const options = await teamSelect.locator('option').allTextContents();
    const validOption = options.find(o => !o.includes('Zgjidh Ekipin'));
    test.skip(!validOption, 'Asnjë ekip nuk operon në këtë datë (rast i papritur i gjeneratës së datave).');
    await teamSelect.selectOption({ label: validOption! });
    await page.waitForTimeout(500);

    await shot(page, '13-create-visit-free-slots');
    // Duhet të shfaqen butona orari (p.sh. "08:00", "09:00", ...).
    await expect(page.getByRole('button', { name: /^\d{2}:00$/ }).first()).toBeVisible();
  });

  test('TC-14: oraret e zëna për ekipin/datën aktuale NUK ofrohen si opsion i lirë (parandalim konflikti)', async ({ page }) => {
    // Gjejmë një vizitë ekzistuese (jo e anuluar) për të nxjerrë një kombinim ekip+datë+orë tashmë të rezervuar.
    const { data: existing, error } = await supabase
      .from('visits')
      .select('assigned_team_id, scheduled_start')
      .not('assigned_team_id', 'is', null)
      .not('status', 'eq', 'cancelled')
      .limit(1)
      .single();
    test.skip(!!error || !existing, 'Nuk u gjet asnjë vizitë ekzistuese për të testuar konfliktin.');

    const bookedDate = new Date(existing!.scheduled_start);
    const bookedHour = `${String(bookedDate.getHours()).padStart(2, '0')}:00`;
    const dateStr = bookedDate.toISOString().slice(0, 10);

    await loginAs(page, 'admin');
    await page.goto('/dashboard/vizitat');
    await page.getByRole('button', { name: 'Krijo Vizitë të Re' }).click();
    const patientSelect2 = page.locator('select').nth(1);
    await expect(patientSelect2.locator('option')).not.toHaveCount(1, { timeout: 10000 });
    await selectOptionMatching(patientSelect2, /PAT-/);
    await page.locator('input[type="date"]').fill(dateStr);
    await page.waitForTimeout(500);

    const teamSelect = page.locator('select').nth(2);
    const teamOptions = await teamSelect.locator('option').all();
    let matchedTeam = false;
    for (const opt of teamOptions) {
      const value = await opt.getAttribute('value');
      if (value != null && value === existing!.assigned_team_id) {
        await teamSelect.selectOption({ value });
        matchedTeam = true;
        break;
      }
    }
    test.skip(!matchedTeam, 'Ekipi i vizitës ekzistuese nuk ishte i zgjedhshëm për këtë datë në UI.');
    await page.waitForTimeout(500);

    // UI-ja e mban gjithmonë butonin e dukshëm, por e çaktivizon (disabled + vijëzim) kur ora
    // është e zënë — pra kontrolli korrekt është gjendja "disabled", jo mungesa e butonit.
    const bookedSlotButton = page.getByRole('button', { name: bookedHour, exact: true });
    await expect(bookedSlotButton).toBeDisabled();
  });

  test('TC-15: performanca — ngarkimi i listës së vizitave nën 2 sekonda (KJF-Performanca)', async ({ page }) => {
    await loginAs(page, 'admin');
    const start = Date.now();
    await page.goto('/dashboard/vizitat');
    await page.getByRole('heading', { name: 'Planifikimi i Vizitave' }).waitFor();
    await page.waitForSelector('table, [role="table"]', { timeout: 5000 }).catch(() => {});
    const elapsedMs = Date.now() - start;
    console.log(`[MATJE PERFORMANCE] Koha e ngarkimit të /dashboard/vizitat: ${elapsedMs} ms`);
    // Prag i vetëm, i barabartë me kërkesën jofunksionale (kapitulli 3.5): < 2000 ms.
    // I matshëm në mënyrë të qëndrueshme vetëm kundër build-it të prodhimit (npm run build
    // && npm run start, shih playwright.config.ts) — next dev ka kompajlim "just-in-time"
    // të Turbopack-ut që e kalon këtë prag në ekzekutimin e parë "të ftohtë".
    expect(elapsedMs).toBeLessThan(2000);
  });

  test('TC-23: dy kërkesa njëkohshme për të njëjtin ekip/orar — vetëm njëra duhet të kalojë (mbrojtje kundër garës)', async () => {
    // Simulon dy administratorë që dërgojnë krijoVizite njëkohësisht për të njëjtin ekip
    // dhe orar: dy INSERT konkurrentë, direkt kundër databazës (jo përmes UI-së), për të
    // ekzekutuar në mënyrë deterministike skenarin e "dritares së garës" (shih kufizimin
    // no_overlapping_team_visits te supabase/migrations/…_visits_no_overlapping_team_bookings.sql
    // dhe trajtimin e gabimit 23P01 te krijoVizite).
    const { data: team } = await supabase.from('teams').select('id').limit(1).single();
    const { data: patient } = await supabase.from('patients').select('id').limit(1).single();
    test.skip(!team || !patient, 'Nuk u gjet asnjë ekip/pacient ekzistues për të ndërtuar rastin e testit.');

    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 300);
    const dateStr = farFuture.toISOString().slice(0, 10);
    const scheduled_start = `${dateStr}T09:00:00+02:00`;
    const scheduled_end = `${dateStr}T10:00:00+02:00`;

    const attemptInsert = () => supabase
      .from('visits')
      .insert([{
        patient_id: patient!.id,
        assigned_team_id: team!.id,
        scheduled_start,
        scheduled_end,
        priority: 'normale',
        care_category: 'Kujdes për të Moshuar',
        status: 'scheduled',
        is_patient_notified: false,
      }])
      .select('id');

    // Të dy kërkesat nisen pa pritur njëra-tjetrën — garantohet konkurrenca reale.
    const [r1, r2] = await Promise.all([attemptInsert(), attemptInsert()]);
    const results = [r1, r2];
    const succeeded = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);

    // Pastrim: fshijmë çdo vizitë testimi që u fut me sukses, që të mos ndotet dataseti.
    for (const r of succeeded) {
      if (r.data && r.data[0]) {
        await supabase.from('visits').delete().eq('id', r.data[0].id);
      }
    }

    expect(succeeded.length, 'saktësisht një nga dy kërkesat konkurrente duhet të kalojë').toBe(1);
    expect(failed.length, 'saktësisht një nga dy kërkesat konkurrente duhet të refuzohet').toBe(1);
    expect(failed[0]?.error?.code).toBe('23P01'); // exclusion_violation
  });
});
