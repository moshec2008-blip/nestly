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

## Release foundations

Nestly is currently being prepared as a Version 2.0 release candidate. Recent
work focuses on trust, product consistency, operational readiness, privacy-safe
telemetry, support workflows and clear product truth.

These are foundations, not a claim that every future workflow is production
ready.

Read:

- `docs/AUTOMATIONS.md`
- `docs/SMART_TEMPLATES.md`
- `docs/SMART_COLLECTIONS.md`
- `docs/IMPORT_EXPORT.md`
- `docs/BACKUP_AND_RESTORE.md`
- `docs/RELEASE_1_0_CHECKLIST.md`
- `docs/EPIC_12_RELEASE_FOUNDATION_REPORT.md`
- `docs/RELEASE_NOTES_2_0.md`
- `docs/OPERATIONS.md`
- `docs/MONITORING.md`
- `docs/SUPPORT.md`
- `docs/SCALING.md`
- `docs/DEPLOYMENT.md`

## Internal operations

Internal operations are disabled by default.

To enable the local operations dashboard:

```bash
NESTLY_INTERNAL_OPERATIONS_ENABLED=true
```

Routes:

- `/operations`
- `/api/ops/health`

These routes are for internal diagnostics only and must not expose private
family content.

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
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

## Current production truth

Nestly is suitable for local demos, founder testing and careful closed beta with
clear expectations. It is not yet ready for public production with sensitive
cloud data until a real database, server-side authorization, secure storage,
production monitoring and automated tests are completed.
