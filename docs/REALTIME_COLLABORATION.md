# Realtime Collaboration

## Status

Current status: **not implemented**.

Realtime should be added only after server authorization and Family Space scoped
queries exist.

## Candidate Flows

High-value realtime flows:

- tasks
- shopping
- membership changes
- meaningful Timeline activity
- invitations

Do not subscribe to every table by default.

## Rules

- subscribe only to the active Family Space
- cleanup on unmount
- handle reconnects
- deduplicate events
- do not filter broad private streams only in the browser
- stop subscriptions immediately after logout, membership revocation or Family
  Space switch

## Conflict Handling

Every collaborative record should carry:

- `updatedAt`
- version or revision number
- actor metadata where appropriate

At minimum, stale updates should show a clear reload/latest-version message
instead of silently overwriting important edits.
