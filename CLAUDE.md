# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (runs setup-env.js first)
npm run build        # Build for production (setup-env + prisma generate + next build)
npm run lint         # Run ESLint
npm run test         # Run Vitest in watch mode
npm run test:run     # Run tests once
npm run test:coverage
npm run db:push      # Push Prisma schema changes to DB (no migration file)
npm run db:migrate   # Run pending migrations
```

Run a single test file:
```bash
npx vitest run lib/__tests__/client.test.ts
```

## Architecture

**Stack:** Next.js 16 App Router · TypeScript · Prisma + PostgreSQL · React Query · TailwindCSS · Zod · JWT auth

### Request lifecycle

1. `middleware.ts` — runs on every request: CORS → request size check → rate limiting → JWT auth verification (skipped for `/api/auth/*`)
2. `app/api/*/route.ts` — API route handlers query Prisma and return JSON
3. `lib/api/client.ts` — client-side API wrapper that injects `Authorization: Bearer {token}` from `localStorage` and throws `ApiError` on non-2xx
4. Custom hooks (`lib/hooks/`) call the API client and wrap results with React Query

### Authentication

- JWT-based (no NextAuth sessions). Tokens signed with `JWT_SECRET`, 7-day expiry.
- Edge middleware uses `jose` for JWT verification (not `jsonwebtoken`, which is Node-only).
- `lib/auth/jwt.ts` contains signing/verifying helpers and standardized error responses.
- Client stores token in `localStorage`. On 401 the API client redirects to `/auth/signin`.

### Database

Prisma schema at `prisma/schema.prisma`. Key models:

| Model | Purpose |
|-------|---------|
| `User` | Account with `hashedPassword` (bcrypt), `loginAttempts`, `lockedUntil` |
| `Envelope` | Zero-based budget envelope — `type` is `monthly`/`yearly`, has `plannedAmount` / `currentAmount` |
| `Transaction` | Income or expense linked to an envelope and category |
| `RecurringPayment` | Scheduled transfers between envelopes |
| `InvestmentAsset` | Crypto/stock holdings (`CRYPTO`, `STOCK`, `PPK`) |
| `UserConfig` | Per-user settings (defaultSalary, bonusDistribution) |

All user data cascades delete. `Transaction` is indexed on `(userId, date)`.

Prisma client is a **singleton** in `lib/utils/prisma.ts` — never instantiate `PrismaClient` elsewhere.

### Environment setup

`scripts/setup-env.js` runs before `dev` and `build`. It:
- Detects git branch and selects `DATABASE_URL_DEV` or `DATABASE_URL_MAIN`
- Validates required vars with Zod
- Generates/updates `.env.local` only when changed (preserves Next.js cache)

Required env vars: `DATABASE_URL`, `JWT_SECRET`, `NEXTAUTH_SECRET`.
Optional: `FINNHUB_API_KEY`, `CRYPTOCOMPARE_API_KEY`, `NEXT_PUBLIC_SENTRY_DSN`.

Copy `.env.example` to `.env.local` and fill in values before first run.

### Data fetching pattern

Components → custom hook (`lib/hooks/`) → `api` client (`lib/api/client.ts`) → API route → Prisma

React Query config (in `lib/providers/QueryProvider.tsx`): stale time 1 min, cache 5 min, 1 retry, no refetch on window focus.

Dashboard refresh after mutations is triggered via a custom DOM event:
```ts
window.dispatchEvent(new Event('dashboardRefresh'))
```

### Rate limiting

In-memory rate limiter in `lib/middleware/rateLimit.ts`:
- Global: 100 req/min per IP
- Auth endpoints: 5 req/15 min per IP

### App language

UI and error messages are in **Polish**. Keep new user-facing strings in Polish.
