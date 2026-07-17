# Nestly Life OS

Nestly Life OS is the long-term architecture for making the app feel like one calm operating system for family life, rather than separate modules.

## Product principles

- Home remains the central hub.
- Every module should reduce effort, not add administration.
- AI assists existing workflows; it must not be the only way to complete important actions.
- Records should connect through relationships, not duplicated fields.
- Old information should remain searchable without cluttering daily workflows.

## Shared model

Important records should gradually align around a common shape:

- stable id
- Family Space id
- entity type
- title
- description or summary
- owner or responsible family member
- status
- dates
- tags
- visibility
- created and updated timestamps

Existing foundations:

- `src/types/entityRelations.ts`
- `src/lib/relations/relationRegistry.ts`
- `src/services/entityRelationsService.ts`
- `src/components/relations/RelatedItemsPanel.tsx`
- `src/types/timeline.ts`
- `src/services/timelineService.ts`
- `src/services/globalSearch.ts`
- `src/components/command-palette/CommandPalette.tsx`
- `src/lib/personalization.ts`

## Relationship model

Smart Connections is the shared relationship engine.

Examples:

- receipt to finance transaction
- document to finance transaction
- vehicle to document
- task to reminder
- knowledge article to family member
- timeline item to original source

Rules:

- Do not duplicate source data.
- Use relationships to connect records.
- Suggested relationships require user confirmation.
- Archived relationships should remain auditable.

## Global entity context

Every future entity detail page should include:

- record summary
- linked records
- recent activity
- upcoming actions
- relevant reminders
- source documents

The reusable panel for linked records is:

```txt
src/components/relations/RelatedItemsPanel.tsx
```

## Universal activity

Family Timeline is the canonical user-facing activity layer. Modules should write meaningful events to the timeline instead of each module inventing a separate history pattern.

Activity should answer:

- what happened
- who handled it
- when it happened
- where to find the source record

## Command palette and product memory

The command palette is the universal entry point for:

- search
- navigation
- quick actions
- create-from-search
- recent searches
- favorites
- recently opened records

Product memory is stored through personalization preferences and should later sync per authenticated user.

## Filters

Modules should converge on shared filter concepts:

- date
- status
- category
- person
- tags
- favorites

Saved views should use the personalization layer rather than module-specific local keys.

## Security

Life OS must preserve privacy boundaries:

- no cross-family data leakage
- no unauthorized related-record previews
- no private document content in telemetry
- no sensitive data in logs
- AI suggestions must cite source context and never silently modify important records

## Current implementation status

Implemented foundations:

- Smart Connections relationship types and validation.
- Related items panel.
- Global search.
- Command palette.
- Family Timeline.
- Family Legacy view.
- Personalization storage for Home layout, quick actions, favorites, saved views and recent records.

Partial:

- Not every module writes activity into the shared timeline.
- Not every entity has a dedicated detail page.
- Favorites and saved views are not yet wired uniformly across all modules.
- Cloud-backed synchronization is not fully connected for every data type.

## Future evolution

1. Add entity detail pages for vehicle, document, finance transaction, family member and task.
2. Wire related items panels into those detail pages.
3. Standardize create flows.
4. Add module-level "save this view" actions.
5. Sync personalization and relationships to cloud storage.
6. Add permission-aware relationship previews.
