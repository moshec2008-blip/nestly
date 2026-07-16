# Nestly Production Readiness

This document is an honest production-quality checklist for Nestly as it exists now.

Status labels:

- Complete: implemented and verified locally.
- Partial: implemented with important limitations.
- Missing: not implemented yet.
- Not required yet: intentionally deferred for the current product phase.

## Current Readiness Summary

Nestly is suitable for continued local demos, founder testing, and careful family pilot testing where users understand that most data is stored locally on the device/browser.

It is not yet ready for public production use because it does not have a real cloud database, server-enforced family permissions, cloud file storage, account deletion, or production monitoring.

## Authentication

| Item | Status | Notes |
| --- | --- | --- |
| Guest/basic mode | Complete | Users can enter without login and use local storage. |
| Google login setup | Partial | Auth.js/NextAuth routes exist, but production depends on Google env vars and callback configuration. |
| Route blocking | Not required yet | App intentionally remains accessible in basic mode. |
| Logout | Partial | Available where authenticated UI is present. |
| Session persistence | Partial | JWT session via NextAuth when auth is configured. |
| Account deletion | Missing | Requires backend and provider strategy. |

## Authorization and Family Spaces

| Item | Status | Notes |
| --- | --- | --- |
| Family Space concept | Partial | Local family space is created for authenticated users. |
| Owner-only family reset | Partial | UI/client-side owner check exists for connected accounts. Must be server-enforced later. |
| Family sharing | Missing | UI concepts exist, but no real invitations or shared database. |
| Roles and permissions | Partial | Permission UI exists; not production security without backend enforcement. |
| Cross-family isolation | Partial | Storage keys are scoped locally, but this is not server-grade security. |

## Data Storage

| Item | Status | Notes |
| --- | --- | --- |
| Local persistence | Complete | Most modules use localStorage-scoped persistence. |
| IndexedDB attachments | Partial | Files are stored locally, not in secure cloud storage. |
| Real database | Missing | Required before cross-device sync and real sharing. |
| Backup/export | Partial | Manual local export/import exists. Needs versioned migration and stronger restore reporting. |
| Cloud sync | Missing | Do not claim cloud sync in product copy. |

## File and Document Storage

| Item | Status | Notes |
| --- | --- | --- |
| Local document metadata | Complete | Documents can be saved locally. |
| Local attachment storage | Partial | IndexedDB support exists, subject to browser limits. |
| Cloud file storage | Missing | Required for multi-device and authenticated production use. |
| Secure document sharing | Missing | Requires backend authorization and cloud storage. |
| File-size validation | Partial | Some limits exist; needs product-wide consistency. |

## AI

| Item | Status | Notes |
| --- | --- | --- |
| Provider abstraction | Complete | AI provider layer supports mock/disabled/live direction. |
| Mock AI mode | Complete | Safe for demos and local testing. |
| Real AI provider | Partial | Requires server env vars and cost controls. |
| User review before save | Complete | AI results should be reviewed before records are created. |
| Sensitive content handling | Partial | Server-side routes avoid client secrets; production privacy policy still required. |
| AI rate limiting | Partial | In-memory per-process limiter exists, not distributed. |

## Security

| Item | Status | Notes |
| --- | --- | --- |
| No committed secrets | Complete | No real API secrets found in repository scan. |
| Security headers | Complete | Basic security headers configured in Next.js. CSP is intentionally deferred to avoid breaking auth/assets until tested. |
| Server-side API validation | Partial | AI routes validate size/access, but full schema validation is still needed. |
| Server-enforced permissions | Missing | Required before production family sharing. |
| Production monitoring | Missing | Needs external observability provider or backend logging. |
| Telemetry privacy guardrails | Complete | Local telemetry now strips sensitive property keys such as names, amounts, queries, file names, tokens, IDs and raw error messages. |
| Dependency audit | Partial | `npm audit --audit-level=high` reports moderate advisories through `next`/`next-auth`; forced fixes are breaking and should be handled in a planned dependency-upgrade sprint. |

## Accessibility and Preferences

| Item | Status | Notes |
| --- | --- | --- |
| High Contrast | Partial | Preference exists and is applied globally, but needs full screen-by-screen audit. |
| Reduced Motion | Partial | Preference exists; all new interactions must respect it. |
| Compact/Simple modes | Partial | Preferences exist; consistency still needs audit. |
| Keyboard/focus audit | Partial | Major controls have focus, but full route QA still needed. |
| RTL Hebrew | Partial | Primary UI is Hebrew-first; some older encoded strings still need cleanup. |
| English mode | Partial | English support exists but is not fully complete across all hardcoded strings. |

## Testing and CI

| Item | Status | Notes |
| --- | --- | --- |
| Lint | Complete | `npm run lint` passes locally. |
| Typecheck | Complete | `npm run typecheck` should run in CI. |
| Build | Complete | `npm run build` passes locally. |
| Unit tests | Missing | No test runner configured yet. |
| E2E tests | Missing | Needed for beta-critical journeys. |
| GitHub Actions | Complete | Basic quality workflow runs install, lint, typecheck and build. |

## Performance

| Item | Status | Notes |
| --- | --- | --- |
| Build performance | Complete | Production build succeeds. |
| Runtime performance audit | Partial | Large client components remain in Finance, Documents, Settings, Shopping and Family. |
| List pagination | Partial | Some lists limit initial display; long Timeline/Documents/Search need continued review. |
| Bundle audit | Missing | Run bundle analysis before public beta. |

## Product Truth

| Claim Area | Status | Required Wording |
| --- | --- | --- |
| Storage | Partial | Use “saved on this device” unless cloud is actually configured. |
| AI | Partial | Clearly distinguish mock/basic AI from live analysis. |
| Sharing | Missing | Do not claim secure sharing until backend permissions exist. |
| Sync | Missing | Do not claim cross-device sync until database/cloud sync exists. |
| Privacy | Partial | Explain local-only behavior in normal Hebrew, not legal jargon. |

## Beta Readiness

| Stage | Readiness | Notes |
| --- | --- | --- |
| Founder/local testing | Ready | Good fit for ongoing iteration. |
| Investor demo | Ready with caveats | Be explicit about local-only data and mock/partial AI. |
| 10-family closed pilot | Partial | Possible only with clear expectations, backup guidance and no sensitive-cloud claims. |
| Public beta | Not ready | Requires backend, production auth, monitoring, tests and legal/privacy materials. |
| Production | Not ready | Requires database, server authorization, storage, observability and support workflows. |

## Top Production Blockers

1. Real database and repository-backed persistence.
2. Server-enforced Family Space authorization.
3. Cloud file storage with secure access controls.
4. Production Google OAuth configuration and callback verification.
5. Test coverage for critical journeys.
6. Error recovery for failed saves/uploads/AI requests.
7. Full product-truth pass across Hebrew and English copy.
8. Monitoring/observability.
9. Planned dependency upgrade for moderate `next`/`next-auth` audit advisories.
10. Privacy/legal copy for beta families.
11. Migration/versioning strategy for local data.

## Recommended Epic 10

Build the real persistence foundation:

1. Choose database and storage provider.
2. Create server-side Family Space repositories.
3. Move Tasks and Shopping first as pilot modules.
4. Enforce owner/member authorization server-side.
5. Add migration from local guest data to authenticated family space.
6. Add minimal E2E tests for guest and authenticated persistence.
