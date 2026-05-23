# Album rating app — Letterboxd for albums

## Stack
Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Supabase (Postgres + Auth), Vercel

## Rules — always follow these
- Read PRD.md before starting any new feature
- Check .agent/spec.md before writing any code if it exists
- All DB writes must go through Supabase RLS — never bypass
- Reviews max 2,000 chars, always sanitise input
- Auth via Supabase Auth only — no custom auth logic
- Use @/utils/supabase/server for server components
- Use @/utils/supabase/client for client components
- Never import server.ts in a client component

## File structure
src/app/          → Next.js App Router pages
src/components/   → shared UI components
src/components/ui → shadcn components (don't edit these)
src/lib/          → utilities, MusicBrainz API helpers
src/utils/        → Supabase clients, other utils
.agent/           → agent specs and feedback, do not delete

## Key PRD constraints
- Half-star ratings only (0.5 to 5.0)
- One rating per user per album
- Reviews are optional but tied to a rating
- Profiles are public by default
- Music data from MusicBrainz API, not Spotify