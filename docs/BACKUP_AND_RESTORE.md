# Backup and Restore

Status: **basic local backup exists, versioned foundation added**

## Current Reality

Nestly currently has a local JSON backup helper in `src/lib/dataBackup.ts`.
It exports localStorage entries that belong to the app. This is useful for beta
testing, but it is not a production-grade encrypted cloud backup.

## Added Foundation

`src/services/importExport/backupFormatService.ts` introduces a versioned backup
shape with:

- Manifest.
- Schema version.
- Export date.
- Family Space metadata.
- Records by entity type.
- Relationships.
- Settings.
- Templates.
- Collections.
- Automation definitions.
- Timeline metadata.

## Not Implemented Yet

- Encryption.
- Cloud backup storage.
- File archive export.
- Restore conflict resolution UI.
- Cross-space restore rejection on the server.
- Permission-aware server export.

## Release 1.0 Requirement

Before public release, backup and restore must be authorization-checked, scoped to
one Family Space, protected from cross-space restore, and clear about encryption
status.
