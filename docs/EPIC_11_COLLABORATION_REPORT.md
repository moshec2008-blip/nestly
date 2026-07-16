# Epic 11 Collaboration Report

## 1. Executive Summary

Epic 11 cannot be completed as true collaboration without a real backend,
database, storage and email provider. This pass avoids fake sharing and instead
adds the production foundation needed for closed beta planning:

- Supabase selected as backend direction.
- Family Space, membership, invitation and visibility models expanded.
- Capability-based authorization helpers added.
- Feature flags centralized.
- Email provider abstraction added with safe development mock.
- Permissions UI no longer pretends local toggles are production security.
- Closed beta documentation created.

## 2. Backend Selected

Selected: **Supabase**.

Reason: PostgreSQL, RLS, private Storage, Auth integration, migrations and
scoped realtime are a good fit for Nestly's Family Space model.

## 3. Authentication Implementation

Status: partial.

Existing files:

- `src/lib/auth.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/components/auth/LoginClient.tsx`

Google login depends on environment variables and callback setup.

## 4. Family Space Architecture

Updated:

- `src/lib/cloud/schema.ts`
- `src/lib/cloud/localCloudRepository.ts`
- `src/lib/cloud/repository.ts`

Models now include richer Family Space, user, membership, invitation and record
visibility fields.

## 5. Membership and Roles

Roles now prepared:

- owner
- admin
- member
- viewer

## 6. Server Authorization

Status: foundation only.

Added:

- `can(membership, capability, context)`
- `assertCapability(membership, capability, context)`

File:

- `src/lib/cloud/authorization.ts`

Server routes still need to enforce this with a real database.

## 7. Row-Level Security

Status: draft only.

Added:

- `docs/supabase/001_family_spaces.sql`

RLS is enabled in the draft, but final policies must be reviewed with the real
Supabase auth/user mapping before production.

## 8. Invitation Flow

Status: model and docs only.

Added:

- `CloudInvitation`
- `docs/INVITATIONS.md`

No production invitation sending is implemented yet.

## 9. Email Provider Status

Status: abstraction only.

Added:

- `src/lib/email/emailProvider.ts`

The mock provider fails closed in production and may return a safe preview URL in
development.

## 10. Secure Storage

Status: missing.

Documented in:

- `docs/SECURE_STORAGE.md`

Supabase private Storage is the planned direction.

## 11. Shared Tasks Behavior

Status: local only.

Tasks still use local storage. Shared assignment can be modeled but is not
multi-device or server-secured yet.

## 12. Shared Shopping Behavior

Status: local only.

Shopping remains a strong local UX, but realtime collaboration is not active.

## 13. Finance Visibility

Status: not production-secured.

Finance must be filtered server-side before closed beta. Do not expose finance
amounts through Timeline, Search or Assistant without permission checks.

## 14. Private/Shared Records

Status: model prepared.

Added `RecordVisibility`:

- private
- family
- selected_members

Backend filtering is still required.

## 15. Real-Time Behavior

Status: missing.

Documented in:

- `docs/REALTIME_COLLABORATION.md`

## 16. Conflict Handling

Status: planned.

The model includes timestamps, but no version conflict UI/server enforcement is
implemented yet.

## 17. Notifications

Status: partial/local.

Server notification model is still required.

## 18. Guest Migration

Status: local foundation.

Guest migration contract now preserves future visibility/owner metadata.

## 19. Multi-Family-Space Readiness

Status: future-ready types only.

Feature flag exists:

- `multipleFamilySpaces`

## 20. Security Improvements

Implemented:

- capability helpers
- richer roles/statuses
- invitation token-hash model
- feature flags for incomplete collaboration
- production-failing mock email provider
- permissions UI warning/disabled editing when cloud persistence is off

## 21. Tests Added

No automated tests were added in this pass. The project has no configured test
script.

## 22. Database Migrations

Added draft migration:

- `docs/supabase/001_family_spaces.sql`

It is documentation/draft until Supabase is connected.

## 23. Documentation

Added:

- `docs/AUTHENTICATION.md`
- `docs/FAMILY_SPACES.md`
- `docs/PERMISSIONS.md`
- `docs/INVITATIONS.md`
- `docs/SECURE_STORAGE.md`
- `docs/REALTIME_COLLABORATION.md`
- `docs/CLOSED_BETA_READINESS.md`
- `docs/BETA_OPERATIONS.md`
- `docs/EPIC_11_COLLABORATION_REPORT.md`

Updated:

- `README.md`
- `docs/PRODUCTION_READINESS.md`
- `.env.example`

## 24. Home Changes

None.

## 25. Remaining Critical Risks

1. No real database connected.
2. No server-enforced permissions.
3. No RLS policies active.
4. No secure cloud document storage.
5. No real invitation/email flow.
6. Search/Assistant permission filtering is not server-enforced.

## 26. Remaining High Risks

1. Google OAuth production env/callbacks need verification.
2. Realtime sync is not implemented.
3. No audit log table connected.
4. No collaboration E2E tests.
5. No production observability.

## 27. Build Result

Passed: `npm.cmd run build`.

## 28. Lint Result

Passed: `npm.cmd run lint`.

## 29. Test Result

No `npm.cmd test` script is configured.

## 30. Git Result

Pending until this report is committed and pushed.

## 31. Deployment Result

Do not claim deployment verification unless Vercel/backend status is actually
checked.

## 32. Closed-Beta Readiness Score

Current score for real families entering sensitive data: **45/100**.

Founder demo with fictional/local data: **80/100**.

## 33. Exact Steps Before First Real Family

1. Install/configure Supabase client/server utilities.
2. Apply reviewed migrations.
3. Implement RLS policies and tests.
4. Move core module persistence to server repositories.
5. Configure Google OAuth production callback.
6. Configure real email provider.
7. Implement invitation acceptance.
8. Implement secure document storage.
9. Add server-side Search/Assistant permission filtering.
10. Add E2E tests for cross-space denial.

## 34. Recommended Epic 12

**Supabase Connection and Server Authorization Sprint**:

- real Supabase client setup
- migrations
- RLS policies
- server repositories for Family Spaces and memberships
- first server-backed Tasks/Shopping flow
- cross-family rejection tests
