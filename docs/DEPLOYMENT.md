# Nestly Deployment

This document defines the minimum deployment readiness checklist for Nestly.

## Required Environment Variables

Core:

```env
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

AI (Gemini is the primary provider — setting GEMINI_API_KEY enables live analysis):

```env
GEMINI_API_KEY=
NESTLY_AI_ACCESS_CODE=
# Optional secondary provider for document classification only
ANTHROPIC_API_KEY=
```

Feedback:

```env
NEXT_PUBLIC_FEEDBACK_EMAIL=
```

Internal operations:

```env
NESTLY_INTERNAL_OPERATIONS_ENABLED=false
```

Feature flags use:

```env
NEXT_PUBLIC_NESTLY_FEATURE_<FLAG_NAME>=true|false
```

## Pre-Deployment Checks

Run:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd audit --audit-level=high
```

## Rollback Procedure

1. Identify the failing deployment.
2. Check health route and logs.
3. Disable risky feature flags if possible.
4. Roll back to the previous stable deployment.
5. Verify login, Home, Tasks, Shopping, Finance and Documents.
6. Document the incident and root cause.

## Outage Procedures

Database outage:

- disable cloud write paths
- show clear degraded-state messaging
- prevent destructive operations

Storage outage:

- pause uploads
- keep local metadata intact
- retry after recovery

AI outage:

- fall back to manual review
- never block core family workflows

Authentication outage:

- keep guest/local mode available where safe
- avoid exposing private cloud data
