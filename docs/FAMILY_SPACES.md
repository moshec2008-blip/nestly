# Family Spaces

## Backend Decision

Selected backend for production planning: **Supabase**.

Why it fits Nestly:

- PostgreSQL for relational family records
- Row Level Security for server-enforced Family Space isolation
- private Storage buckets for documents
- Auth integration with Google OAuth
- migrations and local development tooling
- realtime subscriptions for scoped collaboration flows

Alternatives considered:

- Firebase: strong realtime story, weaker relational permission modeling for this
  product.
- Custom backend: flexible, but slower and riskier for closed beta.
- Continue localStorage: not acceptable for real collaboration or security.

## Current Code Status

Current implementation is a **local cloud emulator**, not real cloud sync:

- `src/lib/cloud/schema.ts`
- `src/lib/cloud/repository.ts`
- `src/lib/cloud/localCloudRepository.ts`
- `src/lib/cloud/authorization.ts`

The emulator is useful for UI development but must not be described as
production collaboration.

## Production Model

Family Space fields prepared in code:

- `id`
- `name`
- `slug`
- `ownerUserId`
- `status`
- `defaultLocale`
- `defaultCurrency`
- `timezone`
- `plan`
- `settings`
- `onboardingCompletedAt`
- timestamps

Shared records must belong to exactly one Family Space.

## Required Supabase Environment

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=nestly-private
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## Current Limitations

- No real Supabase client is installed or configured yet.
- No production database migrations have been applied.
- Authenticated records are still mostly localStorage-scoped.
- Multi-device sync is not real yet.
