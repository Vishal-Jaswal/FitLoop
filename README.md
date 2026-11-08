# FitLoop

FitLoop is a mobile-first fitness platform foundation for a private beta. The first milestone sets up the responsive application shell, account flows, and a private user profile. Fitness tracking features will be added in later milestones.

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

Open <http://localhost:3000>. When running locally in development without Supabase credentials, sign in with username `test` and password `test` to view the dashboard demo. This temporary session is held in a local cookie; neither the login nor any account data is written to the database. Configure Supabase to use real account registration and sign-in; doing so disables the demo login.

## Supabase setup

See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for environment setup and applying the initial profile migration.

## Useful checks

```bash
npm run lint
npm run typecheck
npm run build
```
