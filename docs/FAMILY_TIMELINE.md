# Family Timeline

## Purpose

The Family Timeline is the calm chronological history of meaningful activity inside a Nestly Family Space. It answers: what happened, who handled it, and where can we find the original record?

It is not a social feed and not a technical audit log. It intentionally avoids minor actions such as searching, filtering, quantity changes, drafts, and every checkbox click.

## Data Model

Timeline records use `TimelineItem` from `src/types/timeline.ts`.

Important fields:

- `eventKey`: stable idempotency key used to prevent duplicate entries.
- `eventType`: stable English event identifier.
- `sourceModule`, `sourceEntityType`, `sourceEntityId`, `sourceUrl`: link back to the original record.
- `importance`: `normal`, `important`, or `critical`.
- `visibility`: `family` or `private`.
- `origin`: `automatic`, `manual`, `imported`, or `AI_suggestion`.
- `metadata`: safe display metadata only.

## Meaningful Event Rules

Central rules live in `src/lib/timeline/timelineRules.ts`.

Only events that another family member may care about later should be recorded. Current meaningful events include task completion, receipt confirmation, finance records, document review, vehicle service, knowledge creation, and manual family updates.

## Repository

`src/repositories/timelineRepository.ts` owns Timeline persistence. UI components do not write raw localStorage structures.

Current persistence uses the existing user-scoped localStorage architecture through `storageKeys.timeline`. The repository already supports:

- search
- module filters
- actor filters
- date ranges
- importance filter
- hidden and archived state
- page-size pagination
- event-key duplicate prevention

## Service

`src/services/timelineService.ts` is the public API:

- `createTimelineItem`
- `recordMeaningfulActivity`
- `createCustomTimelineItem`
- `getTimelineItems`
- `getRecentTimelineItems`
- `getTimelineItemsByModule`
- `getTimelineItemsByMember`
- `getTimelineItemsByDateRange`
- `hideTimelineItem`
- `restoreTimelineItem`
- `archiveTimelineItem`
- `removeManualTimelineItem`

## Connected Modules

Initial live integrations:

- Tasks: completed and reopened tasks.
- Finance: manually added income and expenses.
- Receipt Scan: one receipt-confirmed event after user confirmation.
- Family Knowledge: created and updated knowledge items.
- Command Center: completing a task from the family command center.

## Idempotency

Automatic entries pass a stable `eventKey`, for example:

- `task_completed:{taskId}:{date}`
- `receipt_confirmed:{transactionId}`
- `knowledge_created:{knowledgeId}`

The repository upserts by `eventKey`, so repeated calls do not create duplicate Timeline rows.

## Privacy and Data Minimization

Timeline records store concise titles, summaries, source references and safe metadata. They must not duplicate full document text, raw AI prompts, uploaded file content, sensitive private notes, or unnecessary financial/medical details.

Current `private` visibility is model-level only. It is not server-enforced until Nestly has a real backend and permission checks.

## Demo, Guest and Authenticated Scopes

Timeline uses the existing scoped storage layer:

- Demo scope can use demo-local entries.
- Guest scope stays local to the device.
- Authenticated scope is isolated by user/family-space key.

No cloud persistence exists yet.

## Future Backend Requirements

Before production-grade family sharing, Timeline needs:

- database table or collection scoped by `familySpaceId`
- server-side authorization
- selected-member visibility
- background reconciliation for failed Timeline writes
- source-record existence checks
- cursor pagination from the database
- migration/backfill policy

## Current Limitations

- Existing historical data is not backfilled automatically.
- Source links open module pages, not individual detail views, because several modules do not yet expose record-level routes.
- Private visibility is not secure across shared local browser profiles.
- Timeline entries are localStorage-only until backend persistence is added.
