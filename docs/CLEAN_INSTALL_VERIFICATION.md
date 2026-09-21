# Verifikim: instalim i pastër + ekzekutim real i testeve

> Përgjigje ndaj kërkesës së mentorit: "ekzekutoji testet nga një instalim i pastër dhe ruaje
> rezultatin real." Ky dokument regjistron ekzekutimin real, të kryer më **2026-09-21**, kundër
> commit-it që gjendet tani në `main` (shih hash-in e commit-it në mesazhin shoqërues).

## Procedura e ndjekur

```bash
# web-admin
cd web-admin
rm -rf node_modules .next e2e-results test-results
npm ci                    # instalim i pastër, jo npm install
npm run test:e2e          # 22 teste, auto-niset next dev

# mobile-app
cd mobile-app
rm -rf node_modules e2e-results test-results .expo
npm ci                    # instalim i pastër
npm run web &              # Metro/Expo web target, porti 8082
npx playwright test        # 7 teste
```

## Rezultati real i `npm ci` (web-admin)

Instalimi i pastër **kaloi pa gabime** (lockfile-i i sinkronizuar):

```
added 391 packages, and audited 392 packages in 1m
148 packages are looking for funding
8 vulnerabilities (1 moderate, 6 high, 1 critical)
```

*(Shënim: vulnerabilitetet e raportuara nga `npm audit` janë në varësi tranzitive
zhvillimi/build-i — p.sh. Next.js/Tailwind toolchain — jo në varësi prodhimi të reja të shtuara
nga ky punim; nuk u adresuan në këtë verifikim pasi nuk ndryshojnë rezultatin e testeve.)*

## Rezultati real i `npm run test:e2e` (web-admin, 22 raste)

```
Running 22 tests using 1 worker

  ok  1 TC-01: administratori hyn me sukses dhe sheh Qendrën Operacionale (9.7s)
  ok  2 TC-02: supervizori hyn me sukses dhe sheh Panelin Administrativ (8.8s)
  ok  3 TC-03: kredenciale të gabuara shfaqin mesazh gabimi dhe nuk lejojnë hyrje (1.3s)
  ok  4 TC-04: përdorues i paautentikuar që hap /admin ridrejtohet te /login (733ms)
  ok  5 TC-05: përdorues i paautentikuar që hap /dashboard ridrejtohet te /login (583ms)
  ok  6 TC-06: supervizori NUK mund të hyjë te /admin — ridrejtohet te /dashboard (6.3s)
  ok  7 TC-07: punonjësi në terren NUK mund të hyjë në panelin web (1.8s)
  ok  8 TC-08: admin i kyçur që viziton /login ridrejtohet te /admin (4.9s)
  ok  9 TC-09: lista e pacientëve identifikon vetëm me kod referimi (6.6s)
  ok 10 TC-10: filtrimi i pacientëve sipas zonës funksionon (5.0s)
  ok 11 TC-11: historiku i pacientit shfaqet saktë (7.5s)
  ok 12 TC-12: lista e vizitave dhe filtrat e statusit funksionojnë (7.0s)
  ok 13 TC-13: formulari i vizitës shfaq oraret e lira dinamikisht (6.8s)
  ok 14 TC-14: ora e zënë shfaqet e çaktivizuar (parandalim konflikti) (6.2s)
  [MATJE PERFORMANCE] Koha e ngarkimit të /dashboard/vizitat: 1071 ms
  ok 15 TC-15: performanca e ngarkimit të /dashboard/vizitat (4.4s)
  ok 16 TC-16: faqja e stafit ndan administratorët nga stafi operativ (6.0s)
  ok 17 TC-17: zonat listohen me veprime Ndrysho/Fshij (5.7s)
  ok 18 TC-18: zonë me emër ekzistues refuzohet (4.8s)
  ok 19 TC-19: profesioni klinik shfaqet për çdo punonjës terreni (5.2s)
  ok 20 TC-20: audit log shfaq etiketa INSERT/UPDATE/DELETE dhe diff (11.0s)
  ok 21 TC-21: audit log është vetëm-lexim (8.3s)
  ok 22 TC-22: supervizori s'ka qasje te /admin/audit-logs (5.1s)

  22 passed (2.7m)
```

## Rezultati real i `npx playwright test` (mobile-app, 7 raste)

```
Running 7 tests using 1 worker

  ok 1 TC-M01: ekrani i hyrjes (login) shfaqet me markën ViziTrack (10.9s)
  ok 2 TC-M02: mjeku hyn me sukses dhe sheh Agjendën e ditës (2.8s)
  ok 3 TC-M03: "Historia" shfaq vizitat e përfunduara/anuluara (2.3s)
  ok 4 TC-M04: "Profili" shfaq të dhënat e punonjësit dhe rolin klinik (2.2s)
  ok 5 TC-M05: "Ndihma dhe Suporti" hap qendrën e suportit (2.6s)
  ok 6 TC-M06: laboranti hyn dhe sheh rolin e vet (2.1s)
  ok 7 TC-M07: infermieri hyn dhe sheh rolin e vet (2.1s)

  7 passed (26.6s)
```

## Përmbledhje

**29 nga 29 raste testimi KALOJNË**, nga një instalim `npm ci` i pastër (jo `npm install`), kundër
commit-it aktual të `main`. Koha e ngarkimit e matur në TC-15 këtë herë: **1071 ms** (nën pragun
2000 ms të kërkesës jofunksionale) — më e ulët se ekzekutimet e mëparshme, pasi serveri ishte
plotësisht "i ngrohtë" nga ekzekutimet paraprake të suitës.

Verifikuar drejtpërdrejt (jo vetëm marrë si e mirëqenë nga vëzhgimi i mentorit):
- `npm run build` (web-admin) **kalon** pas instalimit të pastër (Next.js 16.2.10, Turbopack,
  "Compiled successfully").
- `npx tsc --noEmit` në **të dy** aplikacionet **kalon pa gabime**.

Gjatë këtij verifikimi u zbuluan dhe u korrigjuan dy probleme shtesë, të shkaktuara nga vetë
skedarët e testeve (jo nga aplikacioni):
- `mobile-app`: `tsconfig.json` global-i nuk përfshinte tipet e Node.js, kështu që
  `e2e/mobile-screens.spec.ts` (i cili përdor `fs`/`path`/`__dirname`) e prishte kontrollin
  TypeScript të gjithë projektit. U shtua `mobile-app/e2e/tsconfig.json` i dedikuar (me tipet e
  Node) dhe u përjashtua `e2e/` nga `tsconfig.json` kryesor, në mënyrë që skedarët e testeve të
  mos përzihen me hapësirën e tipeve të vetë aplikacionit React Native.
- `web-admin`: `e2e/03-visits-scheduling.spec.ts` kalonte një vlerë potencialisht `null` te
  `selectOption()`, e cila pret `string | undefined`. U shtua një kontroll eksplicit
  `value != null` përpara përdorimit.
