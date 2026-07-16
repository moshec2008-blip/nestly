# Secure Storage

## Status

Current status: **missing for production**.

Nestly can store local metadata and local attachments for demos, but this is not
secure multi-device document storage.

## Planned Backend

Use Supabase Storage with a private bucket.

Requirements:

- private bucket
- Family Space path scoping
- unpredictable object IDs
- signed short-lived URLs
- MIME validation
- file-size validation
- server-side access checks
- cleanup after deletion
- orphan-file detection

## Rules

- Do not store sensitive documents in `/public`.
- Do not expose permanent public file URLs.
- Do not put document contents into telemetry.
- Do not let Search or Assistant expose private document metadata without
  permission.

## Environment

```env
SUPABASE_STORAGE_BUCKET=nestly-private
```
