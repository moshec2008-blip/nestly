# EPIC 13 - Closed Beta Hardening Report

Date: 2026-07-17

## Scope

This pass focused on release-quality hardening for a small closed beta:

- safer loading, error and not-found states
- clearer global search feedback
- local backup and restore isolation
- lint, typecheck, build and dependency audit validation
- documentation of remaining beta risks

The Home page was not redesigned.

## Files Changed

| File | Change |
| --- | --- |
| `.gitignore` | Added `.claude/` so local assistant scratch files are not committed or deployed. |
| `src/app/loading.tsx` | Replaced the dark loading screen with a light Nestly-style skeleton state. |
| `src/app/error.tsx` | Improved the global error state with readable Hebrew copy and a clear retry action. |
| `src/app/not-found.tsx` | Improved 404 state with clear recovery path back home. |
| `src/components/command-palette/CommandPalette.tsx` | Added query highlighting and module tags to improve search scanability. |
| `src/components/finance/TransactionsTable.tsx` | Removed unused date formatter left from the transaction timeline refactor. |
| `src/lib/dataBackup.ts` | Hardened export/import so backups are limited to the active storage scope and restores do not write unknown account-scoped keys. |

## Bugs Fixed

- Global fallback pages no longer use the dark visual treatment by default.
- Global fallback pages now use readable Hebrew copy instead of visually inconsistent state styling.
- Global search now highlights the matching query inside titles/descriptions.
- Backup export no longer collects every Nestly key from the browser.
- Backup restore maps recognized scoped module data into the active family scope instead of blindly restoring another scope.
- Unknown account-scoped keys from old backups are skipped during restore.
- Removed an ESLint warning from `TransactionsTable.tsx`.

## UX Improvements

- Loading state now feels like part of the product instead of a separate dark page.
- Error and 404 states now explain what happened and what the user can do next.
- Search results are easier to scan because the matching term is visually marked.
- Search result module tags make it clearer where a result will open.

## Security / Privacy Improvements

- Family backup export is now scoped to the active family/user scope.
- Restore no longer writes unknown `nestly:*:*` account-space keys.
- This reduces the risk of exporting or restoring another family's local data on a shared browser profile.

## Performance Notes

- No large runtime refactor was introduced.
- Search highlighting is a tiny local render helper and does not add dependencies.
- Build remains static for app pages except API/auth routes.

## Accessibility Notes

- Error and loading screens keep high-contrast text on light surfaces.
- Recovery actions are real buttons/links with clear labels.
- Command palette keeps keyboard navigation and adds visual clarity without changing focus behavior.

## Validation

| Command | Result |
| --- | --- |
| `npm.cmd run typecheck` | Passed |
| `npm.cmd run lint` | Passed |
| `npm.cmd run build` | Passed |
| `npm.cmd audit --audit-level=high` | Passed for high severity; reports moderate advisories only |

## Dependency Audit

`npm audit --audit-level=high` exits successfully, but reports moderate advisories:

- `postcss` via `next`
- `uuid` via `next-auth`

The suggested automatic fix requires `npm audit fix --force` and would install breaking versions. Do not force-fix during beta hardening without a planned dependency upgrade sprint.

## Remaining Known Issues

1. No automated test runner is configured in `package.json`.
2. Real database persistence is still not connected for most modules.
3. Family sharing and permissions are still not server-enforced.
4. Google auth depends on production environment variables and callback configuration.
5. Cloud document storage is still missing.
6. Dark mode still needs a full screen-by-screen contrast audit before it should be promoted.
7. English/Yiddish localization is not complete across all hardcoded strings.
8. Production monitoring and external error reporting are not connected.
9. Some large client components still need performance profiling.
10. Dependency moderate advisories should be handled in a planned upgrade sprint.

## Closed Beta Readiness Assessment

Current readiness for a careful closed beta with clear local-storage expectations:

**58 / 100**

The app is stronger for demos and controlled family testing, but not yet ready for sensitive multi-family cloud collaboration.

## Recommended Next Action

Configure the first real automated test layer:

1. Add Playwright or another E2E runner.
2. Cover the core closed-beta journeys:
   - open app as guest
   - create task
   - add shopping item
   - add finance transaction
   - upload/mock-analyze document
   - search globally
   - backup active scope
3. Run these checks in CI before deployment.

