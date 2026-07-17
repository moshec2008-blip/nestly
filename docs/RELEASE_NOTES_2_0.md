# Nestly 2.0 Release Candidate Notes

Nestly 2.0 RC is a quality-focused release.

The goal is not to add more visible modules, but to make the product feel cohesive, reliable and honest enough for a wider beta audience.

## Product Quality

- The Home page remains the visual benchmark.
- Module-level experiences should follow the same calm spacing, rounded cards, soft shadows and Hebrew-first hierarchy.
- Empty, loading and error states now have a clearer direction.
- Product copy should distinguish local mode, demo mode, AI mock mode and future cloud capabilities.

## Trust

Nestly must not imply:

- cross-device sync before a database is connected
- secure family sharing before server authorization exists
- cloud document storage before storage is connected
- live AI before provider keys and privacy controls are configured

## Operations

Internal operations are now prepared behind:

```env
NESTLY_INTERNAL_OPERATIONS_ENABLED=true
```

This exposes:

- `/operations`
- `/api/ops/health`

The dashboard is internal-only and shows operational metadata, not private family content.

## Beta Guidance

Nestly is suitable for:

- founder testing
- local demos
- careful closed-beta testing with clear expectations

Nestly is not yet suitable for public production with real sensitive cloud data until backend persistence, server authorization, storage and monitoring are completed.

## Release Gate

Before public release:

- connect database and storage
- add server-enforced Family Space authorization
- add automated tests for critical journeys
- complete Hebrew/English copy audit
- configure production auth
- configure production email
- add production monitoring
