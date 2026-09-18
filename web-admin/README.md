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
```

Get these from your Supabase project's **Settings → API**. The `anon` key is safe to expose
client-side by design; the `service_role` key must **never** be exposed to the browser — it is
only read inside Next.js Server Actions.

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

Runs the 22-case Playwright E2E suite against a local dev server (auto-started). See
[`../docs/TESTING.md`](../docs/TESTING.md) for the full test plan, results and analysis.

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
