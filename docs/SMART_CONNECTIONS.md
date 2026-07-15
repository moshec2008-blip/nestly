# Nestly Smart Connections

Smart Connections is the central relationship layer for important family
records.

The product rule is:

**Records may be connected only through an explicit confirmed action, a safe
migration, or a clearly labeled suggestion that the user accepts.**

## Product Purpose

Nestly should feel like one connected family system. A receipt should naturally
lead to the expense it created. A document should reveal the vehicle, task or
family member it belongs to. A knowledge item should keep its sources nearby.

This is not a visual graph feature. The practical UI is compact related-item
lists and contextual suggested links.

## Central Model

Core type:

- `src/types/entityRelations.ts`

Fields include:

- source entity type and ID
- target entity type and ID
- relationship type
- direction
- source
- status
- visibility
- confidence
- reason
- unique key
- safe metadata

Statuses:

- `active`
- `suggested`
- `rejected`
- `archived`

Sources:

- `manual`
- `rule_based`
- `AI_suggestion`
- `migration`
- `system`

## Entity Types

Prepared entity types:

- task
- shopping item
- shopping list
- finance transaction
- receipt
- document
- vehicle
- vehicle reminder
- family member
- family event
- note
- family knowledge
- reminder
- smart capture
- smart inbox item
- timeline item
- command center item
- custom record

## Relationship Types

Supported relationship types include:

- related to
- created from
- converted to
- supported by
- linked document
- linked receipt
- linked transaction
- linked task
- linked reminder
- linked vehicle
- linked family member
- linked shopping list
- follow up for
- source of
- duplicate of
- assigned to
- paid by
- reviewed by

Internal enums remain English. User-facing labels are localized through
`src/lib/relations/relationTypes.ts`.

## Registry

Allowed relationship combinations live in:

- `src/lib/relations/relationRegistry.ts`

The registry defines which entity pairs can connect, which relationship types are
valid, and whether the relationship is bidirectional.

Compatibility checks should not be scattered across UI components.

## Validation and Duplicate Prevention

Validation lives in:

- `src/lib/relations/relationValidation.ts`

It prevents:

- linking a record to itself
- unsupported relationship combinations
- duplicate active/suggested links
- cross-family-space relations when metadata exposes a mismatch

Duplicate prevention uses a stable unique key:

`familySpaceId:source:relationshipType:target`

For bidirectional links, the source/target pair is normalized so the app does not
create both `document -> transaction` and `transaction -> document`.

## Repository and Service

Storage/repository:

- `src/repositories/entityRelationsRepository.ts`

Domain service:

- `src/services/entityRelationsService.ts`

The service handles:

- create relation
- suggest relation
- accept/reject suggestion
- archive relation
- get relations for entity
- find connected record previews
- migrate legacy links

UI components must call the service, not localStorage.

## UI Components

Created components:

- `src/components/relations/RelatedItemsPanel.tsx`
- `src/components/relations/SuggestedConnectionsPanel.tsx`

The panels are intentionally compact. They show:

- safe record title
- module label
- relationship label
- open action
- remove-link action

They do not duplicate full sensitive record content.

## Current Integrations

Implemented:

- Receipt scan confirmation creates relationships between receipt/document and
  finance transaction.
- Documents show related records and suggested connections.
- Finance transaction detail sheet shows related records and suggestions.
- Family Knowledge detail view shows related records and suggestions.
- Legacy document/finance references are migrated into central relations without
  deleting old fields.

## AI and Rule-Based Behavior

Current Smart Connections are deterministic/system/migration based.

The architecture supports `AI_suggestion`, but this sprint does not create
provider-backed relationship suggestions. AI suggestions must include evidence
and remain pending until the user accepts them.

## Privacy

Relationships can reveal sensitive context, so previews are minimized.

The relation preview should show only:

- title
- module
- short context
- route
- relationship meaning

It should not store or expose:

- full document text
- full note body
- uploaded files
- raw AI output
- unnecessary financial details

Current app data is still local/device scoped unless cloud persistence is added
for a module.

## Cascade Rules

Removing a relation does not delete either record.

Deleting or archiving source records should not cascade-delete connected records.
Future work should add repository-level orphan cleanup and unavailable-source
labels.

## Migration

Legacy fields are not removed yet.

Current migration reads:

- `linkedFinanceTransactionId` on documents
- `documentReference` on finance transactions

It creates central relations with source `migration` and stable unique keys.

## Performance

The first version resolves previews locally and keeps lists short.

Future database indexes should include:

- familySpaceId + sourceEntityType + sourceEntityId
- familySpaceId + targetEntityType + targetEntityId
- familySpaceId + relationshipType
- uniqueKey
- status
- createdAt

Default traversal depth should stay at 1.

## Current Limitations

- No full manual target-picker flow yet.
- No provider-backed AI relation suggestions yet.
- No source unavailable UI yet.
- No server-side permission enforcement yet.
- No database indexes yet.
- No automated tests added in this sprint.

## Recommended Next Work

The next sprint should complete one manual connection journey:

1. Open a document.
2. Choose "קשר לפריט".
3. Search vehicles/tasks/finance records.
4. Review the connection.
5. Confirm.
6. See the connection from both sides.

That will turn the architecture into a fully user-controlled linking workflow.
