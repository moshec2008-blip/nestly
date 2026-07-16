# Automation Foundation

Nestly automation must be careful, transparent and reversible.

The current sprint prepares the foundation. It does not create autonomous agents
that silently change family data.

## Automation Policy

Automation may:

- detect important records
- summarize what changed
- propose next actions
- prefill forms
- remind the family
- link related records after confirmation

Automation must not:

- delete history without explicit confirmation
- create finance, health or document records silently
- send invitations or emails silently
- mark sensitive tasks complete without user action
- expose private content to telemetry

## Proposed Action Contract

Assistant proposed actions use `AssistantRelatedAction` from
`src/types/assistant.ts`.

Every action includes:

- action type
- label
- optional route
- source record IDs
- proposed values
- `requiresConfirmation`

This keeps the next step explicit and auditable.

## Current Status

Implemented:

- typed proposed actions
- source IDs attached to actions
- user-facing review language
- safe navigation/open-source actions

Not implemented yet:

- action execution pipeline
- undo queue
- server-side audit log
- role-based action permissions
- automation rules editor
- scheduled automation runner

## Recommended Next Step

Build a reviewed action executor for low-risk actions first:

1. open module/source
2. create draft task
3. create draft reminder
4. create draft timeline update

Only after that should Nestly support higher-risk actions like finance creation,
document classification, family invitation or data deletion.
