# Import and Export

Status: **foundation implemented, UI partially existing**

Nestly import/export must be review-first. No imported file should create records
without validation, preview and confirmation.

## Implemented

- Import/export model in `src/types/importExport.ts`.
- File validation and CSV injection protection in
  `src/services/importExport/importValidationService.ts`.
- Versioned backup builder and validator in
  `src/services/importExport/backupFormatService.ts`.
- Existing simple JSON backup still exists in `src/lib/dataBackup.ts`.

## Import Security Rules

- Treat imported text as untrusted.
- Reject unsupported file types.
- Enforce a beta file-size limit.
- Sanitize spreadsheet formula prefixes in CSV cells.
- Detect duplicates inside preview records.
- Do not auto-merge important records.

## Current Limitations

- CSV/JSON field mapping UI is not connected yet.
- Import jobs are modeled but not persisted through a complete workflow yet.
- Contact and calendar import are not implemented.
- Backup files are not encrypted yet.
- Document file archives are not included.

## Production Requirement

Server-side import must validate authorization, family-space ownership, schema
version, relationships, record count and payload depth before writing anything.
