# MTO Compass

A cross-platform (iOS / Android / Web) programme workspace for Medical Training Officers, built with **Expo Router + React Native (TypeScript)**, **gluestack-ui v5**, **UniWind**, and a **NestJS (TypeScript)** API backed by **MongoDB**.

## Architecture

```
ops-hub/
├── src/
│   ├── app/                 Expo Router routes
│   │   ├── welcome, sign-in, sign-up, join, forgot-password
│   │   ├── (trainee)/       Home, Rotation, Log, Growth, Me
│   │   ├── (hr)/            Overview, Trainees, Reviews, Reports, Settings
│   │   └── platform/        Overview, Companies
│   ├── components/          shared UI (shells, fields, sheets, states)
│   └── lib/                 auth (JWT), API client, workspace state, types
├── components/ui/           gluestack-ui v5 primitives (Button, Input, …)
├── global.css               UniWind theme tokens (light/dark)
└── server/                  NestJS API: auth, users, MTO, platform, audit, health
```

Roles: `trainee`, `hr` (company admin), `platform_admin` (operator). All data is scoped by the authenticated tenant from the request context — never from request bodies.

## Running locally

**Ports used by QA:** web `3100`, API `3101`, MongoDB `27017`. Other projects may already occupy 3000/3001, so the QA setup deliberately uses free ports.

1. **MongoDB** on `mongodb://localhost:27017/opshub`.
2. **API** (port 3101):
   ```powershell
   cd server
   $env:PORT = '3101'
   npm run start:dev
   ```
3. **Web app** (port 3100):
   ```powershell
   $env:EXPO_PUBLIC_API_URL = 'http://localhost:3101'
   npx expo start --web --port 3100
   ```

The API seeds three workspaces on startup: demo company (`hr@opshub.local`), platform (`platform@opshub.local`) and any registered companies.

### Seeded accounts

| Role | Email | Password |
|---|---|---|
| HR (demo company) | `hr@opshub.local` | `hr123456` |
| Trainee | `nusrat@opshub.local` | `trainee123` |
| Trainee | `tanvir@opshub.local` | `trainee123` |
| Trainee | `mim@opshub.local` | `trainee123` |
| Platform admin | `platform@opshub.local` | `platform123` |

Demo invite code: `MTO-DEMO-2026`.

## Features

- **Auth** — bcrypt-hashed passwords, JWT in localStorage (web) / SecureStore (native), guarded API, role-based routing, company registration with invite code, trainee join.
- **Trainee** — dashboard, rotations with objective checkboxes, daily logs with tags, personal tasks, learning goals, mentor notes, notifications, CSV export of own logs.
- **HR** — programme overview/analytics, trainee directory with search, reminders, review creation and approval workflow, reports with CSV export, programme settings and invite-code sharing.
- **Platform** — estate overview, company list with counts, suspend/activate lifecycle, audit trail.
- **Dark mode** — follows device setting via UniWind themes.

## End-to-end QA (Playwright + real Chromium)

Install once:

```powershell
npm install -D @playwright/test
npx playwright install chromium
```

With the API on 3101 and web on 3100:

```powershell
node tests/run-qa.cjs
```

The runner launches a **visible (headed) Chromium**, executes every suite in `tests/e2e/`, and writes:

- `tests/reports/qa-results.json` — every assertion with PASS/FAIL/BLOCKED
- `tests/reports/qa-report.md` — human-readable report
- `tests/reports/feature-inventory.json` — discovered routes, buttons, links, inputs
- `tests/reports/screenshots/` — evidence (including responsive states)
- `tests/reports/traces/` — Playwright traces per role

Override endpoints with `QA_BASE_URL` and `QA_API_URL` if you use different ports.

## API health

`GET /api/health` and `GET /api/ready` are public and report process/database readiness.
