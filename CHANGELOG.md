# Changelog

## Unreleased

### Cleaned

- Duplication and redundancy audit: removed 20 confirmed-orphan files (legacy home components, smart-capture launcher superseded by the universal inbox, unused AI prompt files and services, dead API versioning helper), removed dead controls (hidden finance attach button, inert permissions invite form, orphan smart-capture event listener), replaced permanently-disabled integration buttons with status badges, and gave every navigation destination a unique icon (new: book, flag, chat, clipboard, search, shield).

### Added

- First automated test suite (vitest, 22 tests) covering the riskiest local-data paths: family-space isolation invariant, legacy-key migration, backup/restore round-trip, demo-mode isolation, and AI provider selection. Tests run in CI.

- Live AI document analysis via Google Gemini: all five AI routes (receipt, bill, medical document, general document, document classification) now call the real Gemini API when `GEMINI_API_KEY` is set, with graceful mock fallback when it is not. Demo mode always stays on the free local mock. User mode is now derived from actual app state (demo/guest/signed-in) instead of hardcoded values, and non-medical scanning is available without sign-in (protected by the family AI access code and rate limiting).

### Fixed

- Six storage keys (vehicle profiles, driver licenses, fines, knowledge revisions, legacy collections and archive) were stored device-globally instead of per family space, causing cross-space data leakage, demo-mode contamination and omission from backups. They are now scoped, existing global data is migrated once into the active space, and restoring older backups maps them into the active space.

## 2.0 RC - Product Excellence Preparation

This release candidate focuses on product maturity, trust and operational readiness.

### Added

- Internal operations foundation behind `NESTLY_INTERNAL_OPERATIONS_ENABLED`.
- Operational health endpoint at `/api/ops/health`.
- Product insights and beta feedback foundation.
- Platform integration catalog and local background job foundation.
- Release candidate documentation.

### Improved

- Safer backup/restore behavior for scoped local data.
- More consistent loading, error and not-found states.
- Command palette result highlighting.
- Settings feedback flow with privacy-safe metadata.
- Feature flag metadata for beta/internal/production readiness.

### Verified

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
- `npm.cmd audit --audit-level=high`

### Known Limitations

- Real production database is not connected yet.
- Cloud storage is not connected yet.
- Real family sharing is still not production-ready.
- Email provider is not server-side production-ready.
- Automated tests are still missing.
- Moderate dependency advisories remain through `next` and `next-auth`; forced audit fixes are breaking and should be handled in a dependency-upgrade sprint.

## 1.0 Foundation

Nestly gained the foundations for Family OS workflows: Smart Capture, Family Knowledge, Timeline, Command Center, contextual AI, Smart Connections, Global Search, Delight, Production Quality, platform readiness and release quality documentation.
