# ViziTrack — Web Admin

Administrative and supervisor web panel for the home care visit planning system, built with
Next.js (App Router) and Supabase. See [`../README.md`](../README.md) for the project overview
and [`../docs/`](../docs/) for architecture, API and testing documentation.

## Roles

The panel serves two of the system's three roles (the third, field worker, uses the mobile app only):

| Role | Access |
|---|---|
| `admin` | Full panel: dashboard, patients, visits, staff, zones, audit log (`/admin`) |
| `supervisor` | Reduced panel: dashboard, patients, visits, teams — no staff/zone management or audit log (`/dashboard`) |
| `field_worker` | **Blocked** from the web panel entirely (signed out automatically on login attempt) — must use `mobile-app` |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` in this directory (never commit it — it's already git-ignored):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>   # server-side only; used for staff creation & seeding
TEST_USER_PASSWORD=<password for the seeded @demo.com accounts>   # only needed to run e2e/
```

Get the Supabase values from your project's **Settings → API**. The `anon` key is safe to expose
client-side by design; the `service_role` key must **never** be exposed to the browser — it is
only read inside Next.js Server Actions. `TEST_USER_PASSWORD` is the shared password of the
synthetic `@demo.com` test accounts used by the E2E suite (`e2e/helpers.ts`) — it is read from
the environment rather than committed to the repository.

### 3. Seed synthetic demo data (optional)

```bash
npx ts-node scripts/seed.ts
```

Populates `zones`, `patients` and `visits` with fully synthetic data (via `@faker-js/faker`) — no
real names, diagnoses, or identifying information. Requires an existing `zones` row and at least
one seeded staff account (see the script for the placeholder UUIDs to replace with your own).

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm run test:e2e
```

Runs the 23-case Playwright E2E suite against a production build (`next build && next start`,
auto-started — see `playwright.config.ts`). **Prerequisites, without which the suite does not
start at all:**

- `.env.local` configured as above, including `TEST_USER_PASSWORD`.
- The Supabase project's `zones`, `patients`, `visits` and `teams` tables populated (via
  `npx ts-node scripts/seed.ts` or equivalent) and the five `@demo.com` auth accounts created
  with `TEST_USER_PASSWORD` as their password.

Four cases (`TC-13`, `TC-14` x2, `TC-23`) conditionally `test.skip()` if the synthetic/seeded
data doesn't happen to contain a matching scenario (e.g. no team operating on the
randomly-picked date) — see
[`../docs/TESTING.md`](../docs/TESTING.md) for exactly which cases and conditions, and which
outcome (passed vs. skipped) each run actually produced. See that same file for the full test
plan, results and analysis.

## Project structure

```
src/app/login/            Authentication (Server Action: loginAction)
src/app/dashboard/        Supervisor + admin shared panel (patients, visits, teams)
src/app/admin/            Admin-only panel (staff, zones, audit log)
src/middleware.ts         Server-side session + role verification (RBAC)
src/utils/timezone.ts     Timezone-safe date/time helpers (Europe/Belgrade)
src/utils/supabase/       Supabase client factories (browser + server)
scripts/seed.ts           Synthetic demo data generator
e2e/                      Playwright E2E test suite
```

## Learn more

This project uses Next.js 16 (App Router) with Turbopack. See
[Next.js Documentation](https://nextjs.org/docs).
