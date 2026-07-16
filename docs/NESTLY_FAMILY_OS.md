# Nestly Family OS

Nestly Family OS is the product direction for turning the app from a group of
modules into one calm operating system for family life.

The rule is simple:

**Nestly helps the family notice, understand and act. It does not silently take
over.**

## Current Foundation

The Family OS foundation now connects these existing systems:

- Smart Capture: scanned or typed inputs can become reviewed suggestions.
- Family Knowledge: long-term family memory.
- Family Timeline: meaningful history of what happened.
- Command Center: deterministic daily priorities.
- Global Search: find records across modules.
- Smart Connections: linked records and source context.
- Telemetry: anonymous product events without sensitive content.
- Nestly Assistant: source-backed answers and proposed actions.

## Assistant Role

The Assistant is not a generic chatbot. It is a thin orchestration layer over
existing Nestly records.

It can:

- summarize what needs attention today
- summarize recent family activity
- find receipts, documents, vehicle records and other saved records
- answer from Family Knowledge
- show sources for every answer
- propose next actions for user review

It must not:

- invent facts
- answer from unknown data
- silently create, edit, delete or share records
- reveal sensitive data in telemetry
- depend on a paid AI provider to work

## Deterministic First

The current implementation is deterministic-first and works without external AI.

Primary sources:

- `src/services/commandCenterService.ts`
- `src/services/timelineService.ts`
- `src/services/globalSearch.ts`
- `src/services/familyKnowledge.ts`

Assistant files:

- `src/types/assistant.ts`
- `src/services/assistant/nestlyAssistantService.ts`
- `src/components/assistant/NestlyAssistantPage.tsx`
- `src/app/assistant/page.tsx`

## Source Requirement

Every answer must include saved source records when possible.

If no source exists, the Hebrew fallback is:

> לא מצאתי מידע שמור על זה.

This is a product trust rule. The Assistant should be useful, but never pretend
to know something it cannot prove from Nestly data.

## Family OS Maturity

Current status: **foundation implemented, production intelligence partial**.

Nestly can now show the shape of a Family OS, but full production behavior still
requires:

- real database
- cloud storage
- server-enforced permissions
- production auth configuration
- real AI provider with rate limits and cost controls
- family invitations and role enforcement
- audit logs for sensitive actions
