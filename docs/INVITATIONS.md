# Family Invitations

## Status

Current status: **missing for production, intentionally disabled in UI**.

The app must not show "invitation sent" unless a real email provider accepted
delivery.

## Planned Model

Prepared type:

- `CloudInvitation` in `src/lib/cloud/schema.ts`

Fields:

- `id`
- `familySpaceId`
- `email`
- `role`
- `invitedByUserId`
- `tokenHash`
- `status`
- `expiresAt`
- `acceptedByUserId`
- `acceptedAt`
- timestamps

Never store raw invitation tokens.

## Email Provider

Provider abstraction:

- `src/lib/email/emailProvider.ts`

Current provider:

- `MockEmailProvider`
- disabled in production
- may expose a safe local preview URL in development only

Production requires Resend, Postmark or another real provider.

## Required Flow

1. Authorized user enters email.
2. Server verifies `members.invite`.
3. Server creates secure random token.
4. Server stores token hash.
5. Email provider confirms accepted delivery.
6. Recipient opens link and signs in.
7. Server validates token, expiry, email and Family Space.
8. Membership is created.
9. Invitation is marked accepted.
10. Timeline and audit log record meaningful events.

## Security Cases To Test

- expired token
- reused token
- revoked token
- email mismatch
- token guessing
- duplicate active membership
- role escalation
- only-owner safety
