# ViziTrack — Mobile App

Field worker mobile application for the home care visit planning system, built with
Expo/React Native. See [`../README.md`](../README.md) for the project overview and
[`../docs/`](../docs/) for architecture, API and testing documentation.

## Role

Serves **field workers only** (`role = 'field_worker'` in the `users` table), further
differentiated by clinical profession (`Mjek`/doctor, `Infermier`/nurse, `Laborant`/lab
technician) which controls which digital field-notes form fields are shown. Admin and
supervisor accounts are signed out automatically if they attempt to log in here.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` in this directory (never commit it):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
```

Same Supabase project as `web-admin` — get these from **Settings → API**.

### 3. Run the app

```bash
npm run android   # Android emulator/device
npm run ios       # iOS simulator/device (macOS only)
npm run web       # Browser preview (react-native-web) — used for automated E2E tests
```

## Testing

```bash
npx playwright test
```

Runs the 7-case Playwright E2E suite against the Expo web target (`npm run web` must be running
separately, or update `playwright.config.ts`'s `baseURL`/`webServer`). See
[`../docs/TESTING.md`](../docs/TESTING.md) for the full test plan and results.

## Project structure

```
src/screens/auth/         Login
src/screens/main/         Agenda (calendar), Personal visit history, Profile
src/screens/visit/        Visit detail — check-in/out, role-based digital field notes, offline cache
src/navigation/           Auth-gated stack + bottom tab navigator
src/contexts/             Auth context (Supabase session)
src/lib/                  Supabase client
e2e/                      Playwright E2E test suite (web target)
```

## Learn more

Built with [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).
