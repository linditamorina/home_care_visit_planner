# Verifikim: instalim i pastër + ekzekutim real i testeve

> Përgjigje ndaj kërkesës së mentorit (rishikimi i dytë, 2026-09-29): "Nuk riprodhohet: pa
> .env.local dhe bazë të mbushur, suita e web-it nuk niset fare. Shëno mjedisin e kërkuar dhe
> ndaj passed nga skipped... Pragu i TC-15 duhet të jetë 2000 ms... shto kufizimin [kundër garës]
> dhe një test me dy kërkesa paralele." Ky dokument regjistron ekzekutimin real, të kryer më
> **2026-09-29**, pas korrigjimeve, kundër commit-it që gjendej atëherë në `main`.
>
> **Përditësim (2026-10-01):** mentori vuri në dukje se dega `main` kishte ndërkohë edhe dy
> commit-e të tjera (`268788c`, `fb2237f`) të pa-mbuluara nga ekzekutimi i mësipërm. Ky dokument
> u rigjenerua në tërësi — instalim i pastër i ri, build, lint, tsc, dhe suita e plotë 30/30 —
> kundër commit-it final aktual, `fb2237f35fa11ad3b6646fd8b1baf8f212792e88` (shkurt: `fb2237f`),
> hash i cituar shprehimisht këtu për të shmangur të njëjtën paqartësi.

## Parakushtet (pa to, suita as nuk niset)

1. `.env.local` i konfiguruar në të dy aplikacionet, **duke përfshirë `TEST_USER_PASSWORD`** —
   fjalëkalimin e llogarive sintetike `@demo.com`. Fjalëkalimi nuk është më i koduar në kod (shih
   gjetjen e mëposhtme) dhe nuk commit-ohet te repository.
2. Projekti Supabase i lidhur **aktiv** (jo i pauzuar) dhe i mbushur me `zones`, `patients`,
   `visits`, `teams` sintetike dhe pesë llogaritë `@demo.com`.

Pa këto dy kushte, `npm run test:e2e` / `npx playwright test` dështojnë që në hapin e kyçjes —
verifikuar personalisht më 2026-09-29, kur projekti Supabase ishte i pauzuar (auto-pause pas ~7
ditësh pa aktivitet, plani falas) dhe asnjë test nuk mund të fillonte deri sa u rikthye.

## Procedura e ndjekur

```bash
# web-admin
cd web-admin
rm -rf node_modules .next e2e-results test-results
npm ci                    # instalim i pastër, jo npm install
npm run build              # ndërtim prodhimi (kërkohet nga playwright.config.ts)
npm run lint
npx tsc --noEmit
npm run test:e2e          # 23 teste, auto-niset next build && next start

# mobile-app
cd mobile-app
rm -rf node_modules e2e-results test-results .expo
npm ci                    # instalim i pastër
npm run web -- --port 8082 &   # Metro/Expo web target
npx playwright test        # 7 teste
```

## Rezultati real i `npm ci`

**web-admin**: kaloi pa gabime (lockfile i sinkronizuar) —
`added 391 packages, and audited 392 packages in 1m`, 8 vulnerabilitete të raportuara nga
`npm audit` (1 moderate, 6 high, 1 critical — varësi tranzitive zhvillimi/build-i, jo prodhim;
jashtë fushëveprimit të këtij verifikimi).

**mobile-app**: kaloi pa gabime — `added 550 packages, and audited 551 packages in 1m`,
14 vulnerabilitete (13 moderate, 1 high — i njëjti kufizim si më sipër; numri ndryshon lehtë nga
ekzekutimi i 2026-09-29 pasi `npm audit` kontrollon kundrejt një databaze CVE-sh live, jo kundrejt
vetë lockfile-it, i cili mbetet i pandryshuar).

## Rezultati real i `npm run build`, `npm run lint`, `npx tsc --noEmit` (web-admin)

Të tria kaluan pa asnjë gabim: build-i i prodhimit kompajlohet me sukses (Next.js 16.2.10,
Turbopack), `eslint` raporton **0 errors, 0 warnings**, `tsc --noEmit` **0 gabime tipizimi**.

## Rezultati real i `npm run test:e2e` (web-admin, 23 raste — tani kundër build-it të prodhimit)

```
Running 23 tests using 1 worker

  ok  1 TC-01: administratori hyn me sukses dhe sheh Qendrën Operacionale (6.9s)
  ok  2 TC-02: supervizori hyn me sukses dhe sheh Panelin Administrativ (5.7s)
  ok  3 TC-03: kredenciale të gabuara shfaqin mesazh gabimi dhe nuk lejojnë hyrje (749ms)
  ok  4 TC-04: përdorues i paautentikuar që hap /admin ridrejtohet te /login (411ms)
  ok  5 TC-05: përdorues i paautentikuar që hap /dashboard ridrejtohet te /login (321ms)
  ok  6 TC-06: supervizori NUK mund të hyjë te /admin — ridrejtohet te /dashboard (4.2s)
  ok  7 TC-07: punonjësi në terren NUK mund të hyjë në panelin web (1.3s)
  ok  8 TC-08: admin i kyçur që viziton /login ridrejtohet te /admin (4.1s)
  ok  9 TC-09: lista e pacientëve identifikon vetëm me kod referimi (4.5s)
  ok 10 TC-10: filtrimi i pacientëve sipas zonës funksionon (4.5s)
  ok 11 TC-11: historiku i pacientit shfaqet saktë (5.3s)
  ok 12 TC-12: lista e vizitave dhe filtrat e statusit funksionojnë (4.5s)
  ok 13 TC-13: formulari i vizitës shfaq oraret e lira dinamikisht (5.3s)
  ok 14 TC-14: ora e zënë shfaqet e çaktivizuar (parandalim konflikti) (5.7s)
  [MATJE PERFORMANCE] Koha e ngarkimit të /dashboard/vizitat: 604 ms
  ok 15 TC-15: performanca — ngarkimi i listës së vizitave nën 2 sekonda (3.3s)
  ok 16 TC-23: dy kërkesa njëkohshme, i njëjti ekip/orar — vetëm njëra kalon (629ms)
  ok 17 TC-16: faqja e stafit ndan administratorët nga stafi operativ (4.0s)
  ok 18 TC-17: zonat listohen me veprime Ndrysho/Fshij (3.9s)
  ok 19 TC-18: zonë me emër ekzistues refuzohet (4.1s)
  ok 20 TC-19: profesioni klinik shfaqet për çdo punonjës terreni (3.5s)
  ok 21 TC-20: audit log shfaq etiketa INSERT/UPDATE/DELETE dhe diff (5.2s)
  ok 22 TC-21: audit log është vetëm-lexim (5.0s)
  ok 23 TC-22: supervizori s'ka qasje te /admin/audit-logs (4.4s)

  23 passed (2.6m)
```

**Asnjë rast SKIPPED** — katër kushtet e `test.skip()` (TC-13, TC-14×2, dhe kushti i TC-23, shih
[TESTING.md](TESTING.md#rastet-me-kusht-testskip)) u plotësuan në këtë ekzekutim dhe të gjitha
23 rastet u ekzekutuan si teste të plota.

## Rezultati real i `npx playwright test` (mobile-app, 7 raste)

```
Running 7 tests using 1 worker

  ok 1 TC-M01: ekrani i hyrjes (login) shfaqet me markën ViziTrack (14.7s)
  ok 2 TC-M02: mjeku hyn me sukses dhe sheh Agjendën e ditës (3.5s)
  ok 3 TC-M03: "Historia" shfaq vizitat e përfunduara/anuluara (2.9s)
  ok 4 TC-M04: "Profili" shfaq të dhënat e punonjësit dhe rolin klinik (2.4s)
  ok 5 TC-M05: "Ndihma dhe Suporti" hap qendrën e suportit (3.1s)
  ok 6 TC-M06: laboranti hyn dhe sheh rolin e vet (3.6s)
  ok 7 TC-M07: infermieri hyn dhe sheh rolin e vet (3.0s)

  7 passed (35.6s)
```

## Përmbledhje

**30 nga 30 raste testimi KALOJNË** (0 skipped), nga një instalim `npm ci` i pastër (jo
`npm install`), kundër kodit aplikativ të commit-it `fb2237f35fa11ad3b6646fd8b1baf8f212792e88`
(`fb2237f`) dhe kundër databazës Supabase reale (jo të simuluar). *Ky ishte HEAD i `main` në
momentin e ekzekutimit (2026-10-01, para se ky dokument vetë të commit-ohej); commit-et e
mëvonshme mbi të janë vetëm dokumentacion (shih "Përditësim" më poshtë) dhe nuk e ndryshojnë
kodin e verifikuar këtu — për HEAD-in aktual, shih `git log -1`.* Koha e ngarkimit e
matur në TC-15: **604 ms** — thellë nën pragun 2000 ms të kërkesës jofunksionale, matur kundër një
ndërtimi prodhimi (`next build && next start`), jo `next dev`.

Krahasuar me verifikimin e mëparshëm (2026-09-21, 29 teste, prag i lirshëm 5000ms te kodi, `next
dev`), ky ekzekutim korrigjon tri gjetjet konkrete të mentorit:

1. **Dritarja e garës te krijoVizite** (kapitulli 6.3) — tani e mbyllur nga një
   `EXCLUDE CONSTRAINT` në databazë (`supabase/migrations/20260929120000_visits_no_overlapping_team_bookings.sql`,
   aplikuar realisht te projekti Supabase), verifikuar nga TC-23 (test i ri, dy INSERT
   konkurrentë kundër databazës reale).
2. **Fjalëkalimet e llogarive testuese** — nuk janë më të koduara në `e2e/helpers.ts` /
   `e2e/mobile-screens.spec.ts`; lexohen nga `TEST_USER_PASSWORD` (`.env.local`, jo commit-uar).
   Vetë fjalëkalimet e llogarive `@demo.com` te Supabase Auth **u ndryshuan realisht** më
   2026-09-29 (rotacion i plotë, jo vetëm heqje nga kodi).
3. **Pragu i TC-15 dhe mbishtypja e riprodhueshmërisë** — prag i kodit tani 2000 ms (jo 5000),
   matur kundër build-it të prodhimit; parakushtet e riprodhueshmërisë (§ më sipër) tani të
   dokumentuara shprehimisht, dhe rastet me `test.skip()` të dalluara nga ato "KALOI" (§ më sipër).

Verifikuar drejtpërdrejt (jo vetëm marrë si e mirëqenë): `npm run build`, `npm run lint`,
`npx tsc --noEmit` u ekzekutuan personalisht pas instalimit të pastër, në të dy aplikacionet, dhe
kaluan pa asnjë gabim.

## Përditësim 2026-10-01: verifikim i plotë kundër commit-it final të `main`

Mentori vuri re që verifikimi i mësipërm (2026-09-29) ishte kryer kundër commit-it
`43eb34a35...` (fiksimi i garës së orarit), ndërsa dega `main` kishte ndërkohë edhe dy commit-e
të tjera, të paverifikuara më parë me këtë procedurë:

- `268788c` — zgjedhje dinamike e zonës në modifikimin e pacientit, kode referimi 6-shifrore,
  historik pune i kufizuar sipas ekipit, tekst i ndershëm mbi sinkronizimin jashtë-linje.
- `fb2237f` — heqje kodi të vdekur (~386 rreshta komente në `vizitat/page.tsx`) dhe e një
  fallback-u të gabuar në `HistorikuVizitave.tsx`.

Procedura e plotë (seksionet më sipër) u ekzekutua PËRSËRI, nga zero, kundër HEAD-it aktual të
`main`:

- **Commit i verifikuar:** `fb2237f35fa11ad3b6646fd8b1baf8f212792e88`
- **`npm ci`** (instalim i pastër, jo `npm install`): i suksesshëm në të dy aplikacionet, numri i
  paketave identik me ekzekutimin e mëparshëm (391 web-admin, 550 mobile-app) — lockfile-et nuk
  kanë ndryshuar mes `43eb34a` dhe `fb2237f`.
- **`npm run build`** (web-admin, Next.js 16.2.10/Turbopack): i suksesshëm, të 13 rrugët e
  aplikacionit u kompajluan pa gabime.
- **`npm run lint`**: **0 errors, 0 warnings** (web-admin).
- **`npx tsc --noEmit`**: **0 gabime tipizimi** (web-admin).
- **`npm run test:e2e`** (web-admin, 23 raste): **23/23 KALOJNË**, 0 skipped (shih output-in e
  plotë më sipër, rifreskuar me rezultatet e këtij ekzekutimi — TC-15: 604 ms).
- **`npx playwright test`** (mobile-app, 7 raste): **7/7 KALOJNË** (shih output-in e plotë më
  sipër, rifreskuar).

**Rezultat: 30 nga 30 raste KALOJNË, 0 skipped, kundër `fb2237f`** — konfirmon që të dyja
commit-et e reja nuk kanë thyer asnjë nga kontrollet ekzistuese.
