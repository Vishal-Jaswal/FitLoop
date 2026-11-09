# Supabase setup

The application uses Supabase Auth with cookie-based sessions for Next.js server rendering. The browser and server clients live in `src/infrastructure/database/supabase/`; profile queries go through the repository and service layers.

## Configure the app

For local UI testing before connecting Supabase, run `npm run dev` without Supabase credentials and sign in with username `test` and password `test`. The demo login is available only in development with Supabase unconfigured. It uses a short-lived local cookie and does not create a database user or store the password. Adding Supabase credentials disables this demo path. Never use these demo credentials for a deployed app.

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. In the Supabase project’s Connect or API settings, copy the project URL and publishable key into the matching `NEXT_PUBLIC_` variables. The publishable key is intended for client apps; never put a secret or service-role key in a `NEXT_PUBLIC_` variable.
4. Set the Supabase Auth site URL to `http://localhost:3000` for local development and add `http://localhost:3000/auth/callback` to the allowed redirect URLs. Add the deployed app URL later when one exists.
5. Restart the development server after changing environment variables.

Email/password signup may require email confirmation depending on the Supabase Auth settings. The app displays a confirmation notice and exchanges the callback code for a cookie-backed session.

## Apply migrations

The migrations create the private `public.profiles` table and the workout catalogue, routines, sessions, sets, indexes, and ownership policies. The workout migration adds new tables and leaves the profile policy unchanged. No migration has been applied to a hosted project as part of this implementation.

### Supabase Dashboard

For a first setup, review and apply the migrations in timestamp order:

1. [`20261108014210_profile_foundation.sql`](../supabase/migrations/20261108014210_profile_foundation.sql)
2. [`20261108073527_workout_tracking.sql`](../supabase/migrations/20261108073527_workout_tracking.sql)

Use the project’s SQL Editor only after confirming it is the intended project and reviewing both files.

### Supabase CLI

The repository includes the Supabase CLI as a pinned development dependency. Link the local project to the intended Supabase project, then push migrations:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --remote
```

The CLI may ask for the database password during linking. Enter it only in the CLI prompt; do not place it in `.env.local`, source control, or chat. Check the target project and migration plan before confirming a remote schema change. CLI v3 defaults to local commands; `--remote` explicitly targets the linked hosted project.

## Profile access rules

- RLS is enabled on `public.profiles`.
- `SELECT` only returns the signed-in user’s row.
- `INSERT` requires the new row ID to equal `auth.uid()`.
- `UPDATE` requires the existing and resulting row ID to equal `auth.uid()`.
- The authenticated role cannot alter the row ID or timestamps through column-level grants.
- The app does not grant direct profile deletion. Deleting the associated Auth user removes the profile through the foreign key cascade.
- Anonymous users receive no table privileges.

Review and test these policies again whenever profile access or ownership rules change.

## Workout data access

- The exercise catalogue is seeded from the workout migration and is readable by authenticated users.
- Every user-owned routine and session is restricted to its `owner_id = auth.uid()`.
- Routine exercises, workout exercises, and sets are restricted through their owning routine or session.
- Anonymous users receive no workout table privileges. No service-role key is used by the application.
- The local `test` / `test` demo path uses device-local browser storage and never inserts demo records into the database.
- The database functions used to start a routine-based session, reorder routine exercises, and finish a workout are `SECURITY INVOKER`; they run under the caller’s authenticated permissions and RLS policies.

For local Supabase integration and RLS testing, run the Supabase CLI against a local Docker-backed stack. Do not point `db push --remote` at a hosted project unless you have reviewed the migration plan and selected the intended project.
