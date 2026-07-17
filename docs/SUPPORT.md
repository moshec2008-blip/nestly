# Nestly Support

Support workflows must help families without exposing private family content.

## Support Principles

- Inspect metadata before content.
- Prefer IDs, statuses and timestamps.
- Never display document bodies, medical content, financial details or private notes.
- Require explicit elevated authorization for destructive actions.
- Log every support action.

## Supported Inspection Areas

The operations foundation prepares support visibility for:

- Family Space counts and technical IDs
- user account counts
- membership and invitation counts
- failed background jobs
- failed AI or upload flows through telemetry
- feature flag state
- storage usage

## Not Yet Implemented

Production support still needs:

- real admin roles
- support impersonation prevention
- audit log viewer
- failed invitation detail view
- job retry controls
- family-space lookup by ID backed by a database
- data export request workflow

## Recommended Support Flow

1. Ask the family for the Family Space ID or account email.
2. Look up metadata only.
3. Identify whether the issue is auth, storage, AI, job queue, sync or UI.
4. Avoid opening private records unless the family explicitly requests it and policy allows it.
5. Record the support action in the audit log.
