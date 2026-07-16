# Authentication

## Status

Current status: **partial**.

Nestly has NextAuth/Auth.js with a Google provider boundary:

- `src/lib/auth.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/components/auth/LoginClient.tsx`
- `src/components/auth/AuthSessionProvider.tsx`
- `src/components/auth/AuthStorageScope.tsx`

Google login works only when the required environment variables are configured.
The app intentionally still allows Guest Mode and must not block visitors at the
first screen.

## Required Environment Variables

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

Aliases accepted by the current app:

```env
AUTH_SECRET=
AUTH_URL=
```

## Current Modes

- Public: no private family content.
- Demo: fictional demo data only.
- Guest: local device data only.
- Authenticated: Google session plus local Family Space foundation.

## Production Requirements

Before closed beta with real families:

- verify Google OAuth callback URLs for local and production
- connect a real database
- create server-side user profiles
- create server-owned Family Spaces
- clear sensitive client cache on logout
- validate session server-side for sensitive routes/actions
- add account/security error recovery
