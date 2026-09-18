# API Documentation

> ViziTrack has no custom REST/GraphQL backend. Both clients (`web-admin`, `mobile-app`) talk
> directly to **Supabase** — its auto-generated PostgREST interface (table CRUD), Auth, Storage
> and Realtime services — plus a small set of **Next.js Server Actions** in `web-admin` for
> operations that need a privileged (`service_role`) key or server-side validation. This document
> is the full inventory of that surface, compiled by reading the current source code
> (verified 2026-09-18).

## Contents
- [1. Next.js Server Actions](#1-nextjs-server-actions)
- [2. Direct Supabase table access, by table](#2-direct-supabase-table-access-by-table)
- [3. Supabase Auth usage](#3-supabase-auth-usage)
- [4. Supabase Storage usage](#4-supabase-storage-usage)
- [5. Supabase Realtime usage](#5-supabase-realtime-usage)
- [Known limitations](#known-limitations)

---

## 1. Next.js Server Actions

Five files contain `'use server'` actions, all in `web-admin/src/app/**`.

### `login/actions.ts`

**`loginAction(formData)`** — fields: `email`, `password`
Signs in via `auth.signInWithPassword`, reads the user's `role` from `users`, redirects by role.
Field workers and unrecognized roles are signed back out (web portal is management-only).
Returns `{ error }` or `{ success: true, redirectUrl }`.

### `dashboard/actions.ts`

**`logoutAction()`** — no params. `auth.signOut()` → `revalidatePath('/', 'layout')` → `redirect('/login')`.

### `dashboard/vizitat/actions.ts`

| Function | Params | Behavior | Returns |
|---|---|---|---|
| `merrOraretEZena(team_id, date)` | positional | Fetches a team's non-cancelled, non-`Laborator` visits for the given calendar date (business timezone, via `utils/timezone.ts`), returns booked `HH:mm` slots | `string[]` |
| `eshteVizitaEPare(patient_id)` | positional | Whether the patient has any prior non-cancelled visit | `boolean` |
| `krijoVizite(formData)` | `patient_id`, `assigned_team_id`, `visit_date`, `visit_time`, `priority`, `care_category`, `is_patient_notified` | Converts local date/time to UTC; duration = 60 min (first visit) or 45 min; **checks for schedule conflicts** (same team, overlapping interval, non-cancelled, non-lab) before inserting | `{ error }` or `{ success: true }` |
| `ndryshoVizite(formData)` | `visit_id`, `status`, `priority`, `is_patient_notified` | Updates a visit | `{ error }` or `{ success: true }` |
| `anuloVizite(visit_id)` | positional | Sets `status = 'cancelled'` | `{ error }` or `{ success: true }` |

All use the server (anon-key, cookie-session) client.

### `admin/stafi/actions.ts`

Uses a **service_role** admin client (created inline, not the shared server client — the only
place in the codebase this happens).

| Function | Params (FormData) | Behavior |
|---|---|---|
| `shtoStafTeRi(formData)` | `full_name`, `email`, `role`, `password`, `profession`, `team_id` | Creates an Auth user (`auth.admin.createUser`, pre-confirmed) then a `users` row; falls back to `update` on a unique-constraint conflict (`23505`) |
| `ndryshoStaf(formData)` | `id`, `full_name`, `email`, `role`, `password?`, `profession`, `team_id` | Updates Auth email/password (`auth.admin.updateUserById`) and the `users` profile |
| `shtoEkip(formData)` | `name`, `shift_type` | Case-insensitive duplicate-name check, then inserts a team |

### `admin/zonat/actions.ts`

**`shtoZoneTeRe(formData)`** — field: `name`. Inserts a zone (anon-key server client); unique
violation → "zone already exists". **Note:** zone *update*/*delete* are **not** server actions —
`ZoneActions.tsx` calls the anon-key client directly from the browser (inconsistent with the
create path — see [Known limitations](#known-limitations)).

---

## 2. Direct Supabase table access, by table

Everything below is PostgREST access via the `anon` key (client- or server-side), not a server
action. Authorization beyond `middleware.ts`'s route-level RBAC is expected to be enforced by
**Row-Level Security policies configured in the live Supabase project** — no `.sql` file in this
repo defines them.

| Table | Read by | Written by | Notes |
|---|---|---|---|
| `users` | login, middleware, both layouts, dashboards, staff page, audit-logs (actor join), visit detail (assignee join), patient history, mobile Agenda/Profile/VisitDetail | `admin/stafi/actions.ts` (insert/update, service_role) | **No delete** anywhere; no `auth.admin.deleteUser` either |
| `patients` | patient list/detail, visit picker, dashboard zone chart, admin KPI count, mobile visit cards (read-only) | `ShtoPacientModal.tsx` (insert), `NdryshoPacientModal.tsx` (update) | Identified only by `reference_code` (`PAT-XXXXXX`); **no delete** |
| `visits` | visit list/detail, dashboard/admin KPIs, team board, patient history, mobile Agenda/AuditTrail/VisitDetail | `vizitat/actions.ts` (insert/update), `VisitDetailScreen.tsx` (update status/timestamps; insert for lab-task delegation) | **No delete anywhere** — cancellation is `status='cancelled'`, never a row removal |
| `zones` | zone table, patient-creation dropdown, various display joins | `admin/zonat/actions.ts` (insert), `ZoneActions.tsx` (update/delete, **client-side, not a server action**) | |
| `teams` | team roster, visit-team picker (filtered weekday/weekend), staff-assignment dropdown, mobile cross-role check | `admin/stafi/actions.ts` (`shtoEkip`, insert, service_role) | **No update or delete** anywhere |
| `field_notes` | visit detail (web + patient history), mobile VisitDetail | `VisitDetailScreen.tsx` (insert/update — role-specific clinical fields; lab rejection/resubmission appends versioned text) | **No delete** |
| `notifications` | Supervisor/Admin notification bells, mobile Agenda notification center | supervisor/admin bells (update `is_read`, delete single/bulk), mobile Agenda (same), `ProfileScreen.tsx` (insert — password-reset request to admin), `VisitDetailScreen.tsx` (insert — lab task/result/status notifications) | Insert shape: `{ target_role, target_user_id?, visit_id, patient_code, title, message, is_read: false }` |
| `audit_logs` | `admin/audit-logs/page.tsx` only (select, ordered `timestamp desc`, limit 500) | **nobody** — see [Known limitations](#known-limitations) | Diff-rendered from `previous_data`/`new_data` (jsonb) |

---

## 3. Supabase Auth usage

| Call | Where |
|---|---|
| `signInWithPassword` | `login/actions.ts` (web), `LoginScreen.tsx` (mobile) |
| `signOut` | `login/actions.ts`, `dashboard/actions.ts`, `middleware.ts` (forces out disallowed roles), `ProfileScreen.tsx` (mobile) |
| `getUser()` | `middleware.ts` (every request), both web layouts, mobile `AgendaScreen.tsx`/`VisitDetailScreen.tsx` |
| `getSession()` / `onAuthStateChange()` | `mobile-app/src/contexts/AuthContext.tsx` — drives the Login-vs-App navigator branch |
| `admin.createUser` / `admin.updateUserById` | `admin/stafi/actions.ts` (service_role only) |

No `admin.deleteUser` or `admin.listUsers` call exists anywhere.

## 4. Supabase Storage usage

**Bucket: `lab-results`** — used only from `mobile-app/src/screens/visit/VisitDetailScreen.tsx`
(`uploadFileToSupabase`), reachable only by the `laborant` role, blocked while offline.

- **Filename convention**: `${visitId}_${Date.now()}_${cleanFileName}` (flat bucket, no
  subfolders; `cleanFileName` strips everything outside `[a-zA-Z0-9.]`).
- Public URL is fetched immediately after upload and stored as a **comma-joined string** in
  `field_notes.lab_document_url` (supports multiple documents; new URLs are appended on
  resubmission after a doctor's rejection).
- Consumed (read-only, no Storage API calls) by `web-admin`'s `VisitDetailModal.tsx`, which
  parses the comma-joined URLs into download links.

## 5. Supabase Realtime usage

All six subscriptions follow `.channel(name).on('postgres_changes', {...}).subscribe()` with
`removeChannel()` cleanup on unmount:

| Channel | Table / filter | File | Triggers |
|---|---|---|---|
| `live-visits` | `visits`, unfiltered | `dashboard/vizitat/page.tsx` | Full visit-list reload |
| `stafi-live-updates` | `visits`, unfiltered | `dashboard/stafi/page.tsx` | Live team-tracking board reload |
| `supervisor-notifications` | `notifications`, `target_role=eq.supervisor` | `SupervisorNotifications.tsx` | Notification list/badge refresh |
| `admin-notifications` | `notifications`, `target_role=eq.admin` | `AdminNotifications.tsx` | Notification list/badge refresh |
| `public-notifications` | `notifications`, `target_role=eq.{userProfession}` | mobile `AgendaScreen.tsx` | Field worker notification refresh |
| `realtime-visit-{visitId}` | `visits`, **UPDATE only**, `id=eq.{visitId}` | mobile `VisitDetailScreen.tsx` | Live status sync; auto-closes modals on completion/cancellation |

No realtime subscription exists on `field_notes`, `patients`, `teams`, `users`, or `zones`.

---

## Known limitations

1. **`audit_logs` has no application-level writer.** It is read-only from both apps, so its
   population mechanism (almost certainly a Postgres trigger, given the `previous_data`/
   `new_data` jsonb diff shape) lives entirely outside this repository. It should be verified
   directly against the live Supabase project — there is nothing in version control to audit.
2. **The mobile offline queue looks incomplete.** `VisitDetailScreen.tsx` pushes actions to an
   `@offline_queue` AsyncStorage key when offline, but no code anywhere in `mobile-app` reads or
   replays that queue when connectivity returns. Don't rely on "offline sync" as a verified
   working feature without further testing.
3. **Zone update/delete bypass the server-action pattern** used for zone creation —
   `ZoneActions.tsx` calls the anon-key client directly from the browser.
4. **RLS policies are not version-controlled.** No `.sql` migration files exist in this repo;
   all table-level authorization assumptions above are inferred from application behavior, not
   verified against policy definitions.
