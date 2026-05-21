@AGENTS.md

# Otarosta — Project Rules

## Working directory
This folder (`cemrosta-clean`) is the **only** correct working directory.
- GitHub: https://github.com/azmierulcm/otarosta
- Live: https://otarosta.com (Vercel project: otarosta)
- **Never** reference or pull code from `../cemrosta` — that folder has a Supabase mix-up and is abandoned.

## Tech stack
- **Backend: Firebase** — Firestore, Firebase Auth, Firebase Storage
- **No Supabase** — do not install `@supabase/supabase-js`, do not create Supabase clients, do not reference Supabase env vars
- Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS v4
- Package manager: npm

## Firebase file map
| Purpose | File |
|---------|------|
| Client config | `lib/firebase/config.ts` |
| Admin SDK | `lib/firebase/admin.ts` |
| Auth helpers (server) | `lib/firebase/auth-helpers.ts` — use `verifyIdToken()` and `assertAdmin()` in all API routes |

## Security rules
- All API routes that mutate data **must** call `verifyIdToken()` or `assertAdmin()` from `lib/firebase/auth-helpers.ts`
- Never trust a caller-supplied `userId` string — always verify via the Admin SDK
- CSP: `unsafe-eval` is dev-only (controlled by `isDev` flag in `next.config.ts`) — do not add it back to production
- `ADMIN_EMAILS` (server-only) is the source of truth for admin access — `NEXT_PUBLIC_ADMIN_EMAILS` is a UX hint only
- Cron route is protected by `CRON_SECRET` — never remove that check

## Environment variables
Required in `.env.local` and Vercel:
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
FIREBASE_ADMIN_STORAGE_BUCKET
CRON_SECRET
ADMIN_EMAILS
NEXT_PUBLIC_ADMIN_EMAILS
RESEND_API_KEY
NEXT_PUBLIC_MAPBOX_TOKEN
```

## Before every deploy
1. `npm run build` — must be clean (0 errors)
2. `npm run test` — must be 21/21
3. `git push origin main` — Vercel auto-deploys on push

## Phase workflow
Propose a plan before writing code for each new phase. User approves before implementation starts.
