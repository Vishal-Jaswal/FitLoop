# FitLoop

FitLoop is a mobile-first workout tracker for a private beta. Milestone 1 provides account flows and private profiles. Milestone 2 adds an exercise catalogue, reusable routines, active workout logging, session history, and strength progression.

## Requirements

- Node.js 24 LTS (Node.js 20.9 or newer is required by the current Next.js version)
- npm 11 or a compatible npm release
- A Supabase project for live signup, login, and profile storage

## Start the app

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. When running locally in development without Supabase credentials, sign in with username `test` and password `test`. Demo routines and workouts are saved in browser storage on this device; the demo session uses a temporary cookie and never writes demo user IDs or workout data to Supabase. Adding Supabase credentials disables the demo login and uses real account data.

The workout area includes searchable and filterable exercises, routine management, kg/lb workout logging, rest timers, completed workout history, previous performance, and working-weight records. Apply the workout migration before using these features with a hosted Supabase account; see the setup guide.

## Supabase setup

See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for environment setup and database migrations.

## Useful checks

```bash
npm run lint
npm run typecheck
npm run build
```
