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
- Supabase SSR auth scaffold with login callback + middleware

## Not yet wired

- Dependency installation
- Real database reads/writes
- PDF export implementation

## Server-side data notes

- `workspace` / `project detail` / `share page` now go through `projectService`
- If Supabase environment variables are present, repository code will try database reads first
- If env vars are missing or the query returns no data yet, code falls back to local mock data
- For server-side database reads, `SUPABASE_SERVICE_ROLE_KEY` is recommended during this scaffold stage

## AI notes

- `AI 生成项目简介 / 服务范围` buttons are connected
- If `OPENAI_API_KEY` is present, routes use the OpenAI Responses API scaffold
- If `OPENAI_API_KEY` is missing or the request fails, routes fall back to local business-copy generation
- AI calls can be logged into `ai_logs` when Supabase is configured

## Suggested next steps

1. Install dependencies with `npm install`
2. Create a Supabase project
3. Run `supabase-schema-and-rls.sql`
4. Fill `.env.local` with Supabase URL and keys
5. Configure Supabase Auth redirect URL to `/auth/callback`
6. Add `OPENAI_API_KEY` and optionally `OPENAI_MODEL`
7. Replace remaining mock data and polish mutations

## Local debugging

- Runtime health endpoint: `/api/health`
- Local setup guide: [LOCAL_SETUP.md](/g:/QuoteCraft/LOCAL_SETUP.md)
