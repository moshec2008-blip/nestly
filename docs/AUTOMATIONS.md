# Nestly Automations

Status: **foundation implemented, UI not connected yet**

Nestly automations are designed around one product rule:

> Nestly may prepare and suggest. The family reviews and confirms.

## Implemented

- Typed automation model in `src/types/automations.ts`.
- Trigger registry in `src/lib/automations/triggerRegistry.ts`.
- Action registry in `src/lib/automations/actionRegistry.ts`.
- Condition registry in `src/lib/automations/conditionRegistry.ts`.
- Human-readable formatters in `src/lib/automations/automationFormatters.ts`.
- Safety policy and idempotency keys in `src/lib/automations/automationRules.ts`.
- Local scoped repository in `src/repositories/automationRepository.ts`.
- Validation service in `src/services/automations/automationValidationService.ts`.
- Execution service in `src/services/automations/automationExecutionService.ts`.
- History service in `src/services/automations/automationHistoryService.ts`.
- Schedule helper in `src/services/automations/automationScheduleService.ts`.

## Safety Levels

1. `system_maintenance` may run automatically.
2. `safe_reversible` may run automatically only after the automation is explicitly enabled.
3. `confirmation_required` creates a review item before any important record is created.
4. `never_autonomous` is rejected by validation.

## Current Limitations

- No public automation-management screen is connected yet.
- Review queue is stored locally and is not yet displayed as a full Smart Inbox UI.
- No backend execution worker exists.
- No cross-device automation execution exists.
- No autonomous financial, permission, deletion or sharing action is supported.

## Release 1.0 Requirement

Before production, automation execution must run server-side with authorization checks,
family-space status checks, idempotency records in a database, and safe observability.
