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

Open <http://localhost:3000>. Without Supabase credentials, the dashboard preview works, while account operations show that Supabase setup is required.

## Supabase setup

See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for environment setup and applying the initial profile migration.

## Useful checks

```bash
npm run lint
npm run typecheck
npm run build
```
