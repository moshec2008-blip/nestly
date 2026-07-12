# Nestly

Nestly is a Hebrew-first family management platform built around a private
Family Space. The sample workspace `משפחת כהן שור` is demo data only and should
not be used as the real authenticated user's family space.

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

## Authentication

Nestly uses NextAuth with Google OAuth. Create a local `.env.local` based on
`.env.example`:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

In production, set the same variables in Vercel and use the production domain
for `NEXTAUTH_URL`, for example `https://your-domain.com`.

This project currently uses `next-auth` v4, so the required secret variable is
`NEXTAUTH_SECRET`. `AUTH_SECRET` / `AUTH_URL` are Auth.js v5 names and are not
the primary variables for this version. Never expose `GOOGLE_CLIENT_SECRET` in
client-side code.

Open:

- http://localhost:3000
- http://localhost:3000/finance
- http://localhost:3000/tasks

## Build

```bash
npm.cmd run build
```
