# QuoteCraft App Skeleton

This repository now includes a first-pass Next.js project skeleton for the mobile-first QuoteCraft app.

## Included

- Next.js App Router setup
- Tailwind configuration
- Login / workspace / project editor / share page routes
- Mock API route placeholders
- Zustand-based editor state scaffold
- React Query provider scaffold
- Basic server/repository/service placeholders
- Supabase environment placeholders

## Not yet wired

- Dependency installation
- Real Supabase auth/session handling
- Real database reads/writes
- Real AI provider integration
- PDF export implementation

## Server-side data notes

- `workspace` / `project detail` / `share page` now go through `projectService`
- If Supabase environment variables are present, repository code will try database reads first
- If env vars are missing or the query returns no data yet, code falls back to local mock data
- For server-side database reads, `SUPABASE_SERVICE_ROLE_KEY` is recommended during this scaffold stage

## Suggested next steps

1. Install dependencies with `npm install`
2. Create a Supabase project
3. Run `supabase-schema-and-rls.sql`
4. Replace mock data with repository + API calls
5. Add auth guard and mutations
