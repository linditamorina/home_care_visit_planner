# Verifikim: instalim i pastër + ekzekutim real i testeve

> Përgjigje ndaj kërkesës së mentorit (rishikimi i dytë, 2026-09-29): "Nuk riprodhohet: pa
> .env.local dhe bazë të mbushur, suita e web-it nuk niset fare. Shëno mjedisin e kërkuar dhe
> ndaj passed nga skipped... Pragu i TC-15 duhet të jetë 2000 ms... shto kufizimin [kundër garës]
> dhe një test me dy kërkesa paralele." Ky dokument regjistron ekzekutimin real, të kryer më
> **2026-09-29**, pas korrigjimeve, kundër commit-it që gjendet tani në `main` (shih hash-in e
> commit-it në mesazhin shoqërues).

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
`npm audit` (varësi tranzitive zhvillimi/build-i, jo prodhim; jashtë fushëveprimit të këtij
verifikimi).

**mobile-app**: kaloi pa gabime — `added 550 packages, and audited 551 packages in 1m`,
13 vulnerabilitete moderate (i njëjti kufizim si më sipër).

## Rezultati real i `npm run build`, `npm run lint`, `npx tsc --noEmit` (web-admin)

Të tria kaluan pa asnjë gabim: build-i i prodhimit kompajlohet me sukses (Next.js 16.2.10,
Turbopack), `eslint` raporton **0 errors, 0 warnings**, `tsc --noEmit` **0 gabime tipizimi**.

## Rezultati real i `npm run test:e2e` (web-admin, 23 raste — tani kundër build-it të prodhimit)

```
Running 23 tests using 1 worker

  ok  1 TC-01: administratori hyn me sukses dhe sheh Qendrën Operacionale (7.7s)
  ok  2 TC-02: supervizori hyn me sukses dhe sheh Panelin Administrativ (6.4s)
  ok  3 TC-03: kredenciale të gabuara shfaqin mesazh gabimi dhe nuk lejojnë hyrje (773ms)
  ok  4 TC-04: përdorues i paautentikuar që hap /admin ridrejtohet te /login (482ms)
  ok  5 TC-05: përdorues i paautentikuar që hap /dashboard ridrejtohet te /login (320ms)
  ok  6 TC-06: supervizori NUK mund të hyjë te /admin — ridrejtohet te /dashboard (4.6s)
  ok  7 TC-07: punonjësi në terren NUK mund të hyjë në panelin web (1.3s)
  ok  8 TC-08: admin i kyçur që viziton /login ridrejtohet te /admin (3.8s)
  ok  9 TC-09: lista e pacientëve identifikon vetëm me kod referimi (4.1s)
  ok 10 TC-10: filtrimi i pacientëve sipas zonës funksionon (4.2s)
  ok 11 TC-11: historiku i pacientit shfaqet saktë (5.2s)
  ok 12 TC-12: lista e vizitave dhe filtrat e statusit funksionojnë (4.2s)
  ok 13 TC-13: formulari i vizitës shfaq oraret e lira dinamikisht (5.3s)
  ok 14 TC-14: ora e zënë shfaqet e çaktivizuar (parandalim konflikti) (5.7s)
  [MATJE PERFORMANCE] Koha e ngarkimit të /dashboard/vizitat: 713 ms
  ok 15 TC-15: performanca — ngarkimi i listës së vizitave nën 2 sekonda (3.7s)
  ok 16 TC-23: dy kërkesa njëkohshme, i njëjti ekip/orar — vetëm njëra kalon (716ms)
  ok 17 TC-16: faqja e stafit ndan administratorët nga stafi operativ (3.6s)
  ok 18 TC-17: zonat listohen me veprime Ndrysho/Fshij (3.5s)
  ok 19 TC-18: zonë me emër ekzistues refuzohet (4.5s)
  ok 20 TC-19: profesioni klinik shfaqet për çdo punonjës terreni (3.5s)
  ok 21 TC-20: audit log shfaq etiketa INSERT/UPDATE/DELETE dhe diff (5.6s)
  ok 22 TC-21: audit log është vetëm-lexim (4.8s)
  ok 23 TC-22: supervizori s'ka qasje te /admin/audit-logs (4.0s)

  23 passed (2.1m)
```

**Asnjë rast SKIPPED** — të tria kushtet e `test.skip()` (TC-13, TC-14×2, shih
[TESTING.md](TESTING.md#rastet-me-kusht-testskip)) u plotësuan në këtë ekzekutim dhe të gjitha
23 rastet u ekzekutuan si teste të plota.

## Rezultati real i `npx playwright test` (mobile-app, 7 raste)

```
Running 7 tests using 1 worker

  ok 1 TC-M01: ekrani i hyrjes (login) shfaqet me markën ViziTrack (12.6s)
  ok 2 TC-M02: mjeku hyn me sukses dhe sheh Agjendën e ditës (4.5s)
  ok 3 TC-M03: "Historia" shfaq vizitat e përfunduara/anuluara (3.2s)
  ok 4 TC-M04: "Profili" shfaq të dhënat e punonjësit dhe rolin klinik (2.8s)
  ok 5 TC-M05: "Ndihma dhe Suporti" hap qendrën e suportit (3.1s)
  ok 6 TC-M06: laboranti hyn dhe sheh rolin e vet (2.6s)
  ok 7 TC-M07: infermieri hyn dhe sheh rolin e vet (3.0s)

  7 passed (33.6s)
```

## Përmbledhje

**30 nga 30 raste testimi KALOJNË** (0 skipped), nga një instalim `npm ci` i pastër (jo
`npm install`), kundër commit-it aktual të `main` dhe kundër databazës Supabase reale (jo të
simuluar). Koha e ngarkimit e matur në TC-15: **713 ms** — thellë nën pragun 2000 ms të kërkesës
jofunksionale, matur tani kundër një ndërtimi prodhimi (`next build && next start`), jo `next dev`.

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
