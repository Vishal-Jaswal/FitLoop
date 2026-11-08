# FitLoop — Initial Technical Audit

**Audit date:** 2026-11-07  
**Scope:** Read-only technical assessment of the FitLoop checkout and Snouzy/workout-cool.  
**Status:** Audit only; no production services or databases were connected.

## 1. Executive recommendation

**Build FitLoop independently on a clean starter, using Workout.cool as a reference and selectively reusing code only after checking each item’s license and origin.**

The local FitLoop checkout was empty at audit time: it contained Git metadata but no commits or application files. There was no existing application structure to preserve.

Workout.cool is a capable workout-planning product, but adopting it wholesale would bring substantial features and services beyond FitLoop’s initial release: its own authentication setup, payments and subscriptions, analytics, advertising, mobile purchase integration, multilingual content, and extensive workout-specific modules. Its PostgreSQL database is a useful reference, but its authentication and data-access choices would need meaningful changes to fit the proposed Supabase stack.

For a private beta of up to 1,000 users, a small, clearly separated application is easier to understand and maintain. Start with workout tracking and the account/data foundations; add nutrition, measurements, and recovery as separate modules. Keep user-specific data behind well-defined access rules so the UI and data provider can change without entangling every feature.

## 2. Current FitLoop repository structure

At audit time, the checkout contained only `.git` metadata. The `main` branch had no commits, and no remote was configured. There were no source files, package manifests, application configuration files, or project documentation to inventory.

## 3. Workout.cool architecture and scope

Workout.cool is a Next.js App Router application using React and TypeScript. Its README describes a Feature-Sliced Design organization:

- `app/` — routes, layouts, and API endpoints
- `processes/` — multi-feature user flows
- `widgets/` — composed interface areas such as headers and sidebars
- `features/` — capabilities such as authentication and workout management
- `entities/` — domain concepts such as users, exercises, and programs
- `shared/` — reusable UI, utilities, configuration, and types

The checked-out source tree also includes areas for workout building and sessions, exercise and program browsing, statistics, authentication, user profiles, leaderboards, admin, premium access, ads, email, analytics, localization, and mobile download or purchase integration.

The main Prisma schema uses PostgreSQL. Its models cover users and Better Auth session/account records; exercises and their attributes; workout sessions and exercises; programs, sessions, and enrollment; feedback; favorites; and subscription and license-related data. The schema and application code are tailored to Workout.cool’s own product and authentication choices.

### Supabase compatibility

Supabase also uses PostgreSQL, so the relational concepts and some schema design can inform FitLoop. This is not a drop-in backend switch, however:

- Workout.cool uses Prisma and Better Auth-oriented user/session tables. FitLoop’s proposed stack uses Supabase Auth, whose user and session model differs.
- Replacing direct Prisma database access affects application data-access code.
- If FitLoop exposes tables through Supabase’s Data API, Row Level Security (RLS) policies must be designed for every user-owned data table.
- Auth, authorization, and data access should be intentionally mapped rather than treating database compatibility as equivalent to application compatibility.

Supabase documents that authenticated tokens work with RLS to scope row access, and recommends `@supabase/ssr` for cookie-based sessions in SSR frameworks such as Next.js. See [Supabase Auth](https://supabase.com/docs/guides/auth), [server package guidance](https://supabase.com/docs/guides/auth/choosing-a-server-package), and [SSR auth](https://supabase.com/docs/guides/auth/server-side).

## 4. Reusable components and functionality

Use Workout.cool as a design and behavior reference for:

- Exercise browsing and filtering by muscle group, equipment, and exercise type.
- Workout routine construction, exercise ordering, and session logging.
- Rest timers, workout-session controls, and progress summaries.
- Responsive UI patterns such as cards, dialogs, toasts, and bottom sheets.
- Exercise and workout domain concepts that can inform FitLoop’s own data model.

Consider copying an individual component only after checking its license context, dependencies, embedded media, and assumptions about the original data model. Prefer reimplementing a small interaction if adapting the source would pull in substantial unrelated code.

## 5. Architecture options

| Option | Advantages | Tradeoffs | Fit for beta |
|---|---|---|---|
| **Fork Workout.cool and customise it** | Existing workout builder, exercise library, sessions, and progress features; Next.js, React, TypeScript, and Tailwind are already in use. | Large inherited surface area; Prisma and Better Auth are not the proposed Supabase setup; removing unrelated billing, ads, analytics, and mobile integrations would take effort. Deep changes can complicate upstream merges. | Weakest fit unless the beta is almost entirely a Workout.cool rebrand. |
| **Reuse selected components and build independently** | Keeps FitLoop’s product and data boundaries while allowing targeted reuse of useful workout interactions or patterns. | Copied code needs license and provenance review; components may assume original services, data structures, or dependencies. | Good if a specific feature is valuable enough to justify review and adaptation. |
| **Build from a clean starter** | Small, purpose-built codebase; straightforward Supabase integration; easier to keep modules and provider boundaries explicit. | Workout-specific features must be built, and the team must make early UX and domain decisions. | **Recommended** for FitLoop’s broader product vision. |

## 6. Licensing, assets, dependencies, and security

### License and assets

The Workout.cool repository includes an MIT license. MIT generally permits commercial use, modification, and distribution of covered software, subject to retaining the required copyright and license notice. See the [repository license](https://github.com/Snouzy/workout-cool/blob/main/LICENSE).

The repository license does not establish rights to every third-party dependency, exercise record, video, thumbnail, image, logo, sponsor mark, font, or other asset. The README describes importing exercise records containing video and thumbnail URLs, but does not by itself prove that those media or the full dataset may be used commercially. The README also describes exercise-video licensing costs. Verify rights and attribution requirements before using any such content. See the [exercise import instructions](https://github.com/Snouzy/workout-cool#exercise-database-import) and [README](https://github.com/Snouzy/workout-cool/blob/main/README.md).

Review licenses for dependencies and any copied code individually; the project’s MIT license should not be treated as licensing independent third-party assets or services.

### External services and cost exposure

The project’s environment template documents configuration for Google OAuth, SMTP, OpenPanel analytics, Stripe, and RevenueCat. The app also includes advertising-related integrations. These services may have free tiers, usage limits, or paid usage; pricing and terms can change. Do not assume a dependency or service is free simply because its package or source code is public.

For a private beta, omit payments, ads, analytics, and mobile purchase integrations unless the product has a concrete need for them. Add external vendors deliberately, after checking current pricing, data handling terms, and operational requirements.

### Security considerations

Workout, nutrition, measurement, and sleep/recovery records are personal user data. Before inviting beta users:

- Define authorization and ownership rules for every record.
- If using Supabase’s client-facing Data API, enable and test RLS policies so users can access only the rows permitted to them.
- Validate inputs at server boundaries and avoid returning sensitive fields unnecessarily.
- Keep privileged credentials server-side and out of browser bundles.
- Review authentication, account recovery, logging, backups, and deletion behavior.

No actual secrets were inspected or disclosed in this audit.

## 7. Recommended technology stack

- **Web/PWA:** Next.js, React, TypeScript, and Tailwind CSS.
- **Database and authentication:** Supabase PostgreSQL and Supabase Auth for the initial release.
- **Validation:** A typed validation library such as Zod at form and request boundaries.
- **Data access:** FitLoop-owned services or repositories that contain provider-specific database calls. UI components should not call Supabase directly.
- **UI:** A small FitLoop component system with the dark interface and orange accents, designed for mobile-first responsive use.

A provider boundary limits how much application code changes if the database provider changes. It cannot make migrations automatic: SQL features, authorization rules, and authentication behavior differ among providers.

## 8. Proposed FitLoop folder structure

```text
src/
  app/                       # Next.js routes, layouts, and route handlers
  components/
    ui/                      # Reusable buttons, inputs, dialogs, charts
    layout/                  # Navigation and page shells
  features/
    auth/
    workouts/
    nutrition/
    measurements/
    recovery/
    dashboard/
  domain/
    workout/
    nutrition/
    measurement/
    recovery/
    user/
  services/                  # Use cases and feature-level operations
  infrastructure/
    database/
      supabase/              # Supabase clients and provider implementation
    auth/
    storage/
  shared/
    config/
    validation/
    dates/
    units/
    errors/
  styles/
    globals.css
    tokens.css
```

This keeps routes in `app`, user-facing capabilities in `features`, core product concepts in `domain`, and provider-specific code in `infrastructure`. Add layers only when actual product needs justify them.

## 9. First three implementation milestones

1. **Product and data foundations** — Agree on the beta’s exact first use cases, privacy expectations, units, and minimum user data. Define the initial domain model and authorization rules before implementation. Confirm rights for exercise data and imagery.
2. **Responsive shell and account flow** — Create the clean Next.js app with FitLoop’s visual system, responsive navigation, account creation/sign-in, and basic profile settings. Keep Supabase-specific calls behind the infrastructure boundary.
3. **Workout logging beta slice** — Implement exercise selection, routine creation, workout sessions, and progress history end to end. Confirm users can access only their own records, then use this slice to guide nutrition, measurement, and recovery features.

## References

- [Workout.cool repository](https://github.com/Snouzy/workout-cool)
- [Workout.cool README and architecture](https://github.com/Snouzy/workout-cool/blob/main/README.md)
- [Workout.cool MIT license](https://github.com/Snouzy/workout-cool/blob/main/LICENSE)
- [Supabase Auth and RLS](https://supabase.com/docs/guides/auth)
- [Supabase server package guidance](https://supabase.com/docs/guides/auth/choosing-a-server-package)
- [Supabase SSR auth](https://supabase.com/docs/guides/auth/server-side)
