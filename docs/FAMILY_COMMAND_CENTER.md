# Family Command Center

## Product Purpose

The Family Command Center is the operational brain of Nestly. Home remains the warm family overview. The Command Center answers one narrower question:

What is the next thing worth handling?

It intentionally shows less than the combined modules. It aggregates actionable records from existing modules and links back to the original source of truth.

## Route

`/command-center`

Hebrew label: `מרכז המשפחה`

## Data Model

The normalized model lives in `src/types/commandCenter.ts`.

Each item stores only prioritization and display metadata:

- source module
- source entity id
- source URL
- title
- status
- priority
- urgency score
- importance score
- due/completed dates
- assignment
- action labels
- visibility
- generated reason

The full original record remains in its source module.

## Source Modules Integrated

Current first implementation aggregates:

- Tasks
- Shopping
- Finance
- Documents
- Vehicles
- Health organization
- Family records
- Family Events
- Family Knowledge
- Smart Inbox
- Permissions

## Prioritization Rules

The first provider is rule-based and deterministic.

Urgency considers:

- overdue due date
- due today
- due in the next 2/7/30 days
- requires review
- blocked state
- explicit priority
- Smart Inbox review needs

Importance considers:

- source module weight
- explicit priority
- review requirement
- blocked state

Critical is intentionally rare. The UI never shows raw scores to normal users.

## Daily Focus Rules

Daily Focus prefers one item that is:

- actionable
- not completed
- not blocked
- important enough to matter
- not dismissed or snoozed

It avoids passive informational items and source records without useful actions.

## Snooze and Dismiss

Preferences are stored in:

`src/repositories/commandCenterPreferencesRepository.ts`

Storage key:

`nestly-command-center-preferences`

Dismiss and snooze never alter the original source record. Snoozed items can return after the snooze date.

## Privacy and Modes

Command Center preferences are user-scoped through the existing scoped local storage layer. Demo, guest and authenticated scopes stay separated.

Current limitation: security is still primarily client-side/local-storage based until a real backend is connected.

## Performance Strategy

The first implementation aggregates local module data on demand and limits visible sections. Future backend work should move aggregation into indexed queries or server-side selectors.

## AI-Ready Architecture

`src/services/commandCenterRecommendationService.ts` exposes a provider interface. The current implementation is rule-based. Future AI providers may summarize or suggest, but must never silently mutate source records.

## Current Limitations

- Quick completion is implemented only for straightforward tasks.
- Deep-linking opens the source module, not a specific record drawer.
- Waiting-on-others is inferred from available local data, not true multi-user workflow.
- Weekly view is not yet implemented.
- No automated tests were added because the project currently has no test script.

## Backend Requirements

For production-grade Command Center:

- real database
- family-space membership and visibility enforcement
- server-side aggregation
- record-level permissions
- timeline event stream
- notification scheduling
- conflict-safe multi-user updates
