# Global Search and Command Palette

## Product Purpose

Global Search makes Nestly feel immediate: a family member can find records, open modules, and start common actions without remembering where things live.

The current implementation is a local, privacy-first command palette. It does not send raw queries, document contents, financial details, or family names to external services.

## Current Architecture

- `src/components/command-palette/CommandPalette.tsx` renders the shared overlay.
- `src/services/globalSearch.ts` reads local module data and returns record results.
- `src/services/commandPaletteService.ts` owns the command registry.
- `src/services/searchHistoryService.ts` stores recent searches locally.
- `src/lib/search/searchNormalization.ts` normalizes Hebrew/English search text.
- `src/types/search.ts` defines the future-ready search document model.
- `src/types/commands.ts` defines stable command metadata.

## Entry Points

- Desktop: `Ctrl+K` / `Cmd+K`.
- Desktop header: "חיפוש ופעולות" button.
- Mobile: the "עוד" bottom navigation sheet includes "חיפוש ופעולות".
- Programmatic: dispatch `nestly-open-command-palette`.

## Commands

Implemented command examples:

- Quick note
- Scan receipt
- Open Command Center
- Add task
- Add shopping item
- Upload document
- Add family knowledge
- Open finance
- Open settings

Commands are defined outside the UI so capability checks, auth requirements, and pinned commands can be added later.

## Search Results

The palette uses the existing local search service and groups results by module. Current searchable areas include:

- Timeline
- Family Knowledge
- Smart Captures
- Modules
- Tasks
- Finance
- Health
- Documents
- Vehicles
- Family
- Family Events
- Shopping
- Permissions

## Normalization

The first normalization layer supports:

- Case-insensitive matching
- Hebrew niqqud removal
- Hebrew final-letter normalization
- Punctuation and currency-symbol cleanup
- Multi-token partial matching

This is deterministic and works without AI.

## Ranking

Current command ranking combines:

- Exact or prefix title match
- Keyword match
- Static command priority

Record ranking currently depends on the existing `globalSearch` order and result grouping. A future sprint should move records to the normalized `SearchDocument` model and apply explicit ranking signals.

## Privacy

- Recent searches are stored locally in the browser.
- Raw queries are not sent to telemetry.
- Telemetry only records safe event categories such as palette opened, command executed, and result opened.
- No cross-Family-Space search is implemented yet because there is no production database layer.

## Current Limitations

- Search opens module pages, not exact deep-linked record detail views.
- Receipt scan opens the existing Capture flow; direct receipt-dialog launch is a future enhancement.
- Favorites and pinned commands are not fully implemented yet.
- Permission-aware private record filtering requires a real backend and roles.
- Archived-item filtering is not exposed in the palette yet.
- Create-from-search opens the relevant module and does not prefill forms yet.

## Future Backend Search

When Nestly moves to a real database, search should be backed by:

- Family Space scoped indexes
- Server-enforced permissions
- Private record exclusion before results are returned
- Optional full-text indexes
- Stale-result invalidation
- Backend result pagination

## Future AI Layer

AI can later enhance:

- Natural-language command parsing
- Source-backed answers
- Typo tolerance
- Relationship-aware result context

AI must never invent answers. If no source-backed record exists, the UI should say that no saved information was found.
