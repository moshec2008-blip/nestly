# Nestly

Nestly is a Hebrew-first family management platform built around a private
Family Space. The sample workspace `משפחת ישראלי` is fully fictional demo data
and should not be used as the real authenticated user's family space.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Hebrew RTL by default
- English language support in progress

## Development

Use `npm.cmd` on Windows PowerShell:

```bash
npm.cmd run dev
```

## Identity and demo access

Nestly supports three product modes:

- Demo Mode: fictional demo data in a separate browser storage scope.
- Guest Mode: local device data only, without cloud sync.
- Authenticated Mode: Google session plus a private Family Space foundation.

Google OAuth is enabled when these environment variables exist:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

`AUTH_SECRET` and `AUTH_URL` are also accepted as aliases. If Google variables
are missing, `/login` shows a setup message and users can continue in Guest
Mode.

Important: the current cloud foundation includes identity, Family Space,
membership and repository contracts, plus a local repository emulator for
development. A real database is still required before storing real sensitive
family information or promising multi-device persistence.

## Collaboration and closed beta status

Production collaboration is planned around Supabase:

- PostgreSQL
- Row Level Security
- private Storage
- server-side authorization
- scoped realtime subscriptions

The current app does **not** yet provide real cloud collaboration. Invitations,
secure document sharing, realtime sync and server-enforced permissions remain
behind feature flags or documentation until the backend is connected.

Read:

- `docs/FAMILY_SPACES.md`
- `docs/PERMISSIONS.md`
- `docs/INVITATIONS.md`
- `docs/CLOSED_BETA_READINESS.md`

## Nestly AI foundation

The AI layer is provider-agnostic and server-side first. The current safe
default is mock mode, so no paid provider is called unless environment variables
are configured later.

Required AI variables:

```bash
AI_ENABLED=false
AI_PROVIDER=mock
GEMINI_API_KEY=
```

Architecture notes live in:

- `docs/AI_ARCHITECTURE.md`

Open:

- http://localhost:3000
- http://localhost:3000/finance
- http://localhost:3000/tasks

## Build

```bash
npm.cmd run build
```
