# Beta Operations

This document is for the product owner.

Current status: **operational plan, not fully implemented**.

## Before Inviting Families

- verify Google OAuth in production
- verify Supabase migrations
- verify RLS policies
- verify email invitation delivery
- verify private document access
- verify logout clears sensitive cache
- verify Search and Assistant cannot leak unauthorized records

## Routine Operations Needed

The product owner should eventually be able to:

- invite beta families
- pause invitations
- revoke access
- inspect failed invitations
- disable AI
- disable a feature flag
- view safe error logs
- export/delete a beta Family Space with authorization
- roll back a deployment

These should not require editing application code.

## Current Feature Flags

Feature flags live in `src/lib/featureFlags.ts`.

Environment examples:

```env
NEXT_PUBLIC_NESTLY_CLOSED_BETA_ENABLED=false
NEXT_PUBLIC_NESTLY_FEATURE_FAMILY_INVITATIONS=false
NEXT_PUBLIC_NESTLY_FEATURE_CLOUD_PERSISTENCE=false
NEXT_PUBLIC_NESTLY_FEATURE_REALTIME_TASKS=false
NEXT_PUBLIC_NESTLY_FEATURE_REALTIME_SHOPPING=false
```

## Rollback Plan

Until real backend operations exist:

1. revert the deployment in Vercel/GitHub
2. disable risky feature flags
3. disable AI with `AI_ENABLED=false`
4. pause invitations at the email provider
5. communicate clearly to testers

Do not ask testers to enter sensitive data until the production backend is
verified.
