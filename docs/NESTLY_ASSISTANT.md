# Nestly Assistant

The Nestly Assistant is a source-backed family assistant. It is designed to make
existing Nestly information easier to understand and act on.

It is not a generic chatbot.

## Product Rules

1. Answers must be grounded in saved Nestly records.
2. If no saved information exists, say that clearly.
3. Proposed actions require user review.
4. No destructive or sensitive action runs automatically.
5. Telemetry never stores raw questions, answers, names, amounts or document
   contents.
6. The Assistant must work without a paid AI provider.

## Current Intents

| Intent | Status | Sources |
| --- | --- | --- |
| Daily brief | Implemented | Command Center |
| Weekly brief | Implemented | Family Timeline |
| Find record | Implemented | Global Search |
| Find receipt | Implemented | Global Search |
| Vehicle status | Implemented | Global Search |
| Family knowledge | Implemented | Family Knowledge, Global Search fallback |
| Recent activity | Implemented via weekly brief | Family Timeline |
| Unsupported | Safe fallback | No saved source message |

## Answer Model

The shared typed answer model lives in `src/types/assistant.ts`.

Each answer includes:

- `intent`
- `answer`
- `summaryBullets`
- `sourceRecords`
- `relatedActions`
- `confidence`
- `generatedBy`
- `warnings`
- `missingInformation`
- `requiresUserReview`

## Implementation

Main deterministic service:

- `src/services/assistant/nestlyAssistantService.ts`

UI route:

- `/assistant`
- `src/components/assistant/NestlyAssistantPage.tsx`

Navigation entry points:

- sidebar
- mobile "more" menu
- module/search metadata

## Current Limitations

- No external AI reasoning is used yet.
- The Assistant does not execute actions.
- Sources link to module pages, not always to exact record deep links.
- It depends on local/browser storage until a real backend exists.
- It cannot answer across devices without cloud persistence.

## Future AI Provider Integration

When connecting an AI provider, keep the deterministic retrieval layer first:

1. classify intent
2. retrieve permitted source records
3. pass only minimal, relevant context to the provider
4. validate structured output
5. display sources and proposed actions
6. require confirmation before saving anything
