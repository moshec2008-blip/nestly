# Nestly Operations

Epic 16 introduces an internal operations foundation for running Nestly as a SaaS product.

## Internal Operations Route

The internal dashboard is available only when this server environment variable is enabled:

```env
NESTLY_INTERNAL_OPERATIONS_ENABLED=true
```

Route:

```txt
/operations
```

Health API:

```txt
/api/ops/health
```

When the flag is not enabled, both routes return a non-public response and should not be visible to normal users.

## What The Dashboard Shows

- deployment version
- runtime environment
- API availability
- database readiness
- storage readiness
- Google authentication configuration
- AI provider configuration
- email provider configuration
- background job state
- local storage usage
- feature flag state
- local cloud-foundation counts

## Privacy Boundary

The operations dashboard must not expose:

- document contents
- family notes
- financial values
- medical data
- uploaded files
- search text
- AI responses
- private messages

It may show safe metadata such as counts, statuses, technical IDs, queue states and configuration readiness.

## Current Reality

The current implementation is a local operational foundation. It is useful for beta diagnostics, but it is not yet a production admin console.

Production requires:

- real administrator authentication
- role-based admin authorization
- server-side audit logs
- durable job queue
- database-backed metrics
- alerting
- support workflows with strict privacy controls
