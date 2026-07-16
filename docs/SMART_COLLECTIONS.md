# Smart Collections

Status: **foundation implemented, UI not connected yet**

Smart Collections are saved views of related family records. They should query and
pin existing records rather than duplicate data.

## Implemented

- Collection model in `src/types/smartCollections.ts`.
- Local scoped repository in `src/repositories/smartCollectionRepository.ts`.

## Intended Examples

- The family car.
- The home.
- School year.
- Family documents.
- Monthly budget.

## Product Rule

Collections should show relationships and context. They must not create duplicate
copies of records.

## Current Limitations

- No collection screen is connected yet.
- No rule-query engine is connected yet.
- No automatic collection suggestions are displayed yet.
