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

## Demo access

Authentication is currently disabled so the demo opens directly for product
review. The app uses a local demo Family Space in the browser.

Before storing real sensitive family information, restore authentication and a
server-backed data layer.

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
