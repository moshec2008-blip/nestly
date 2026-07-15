# Nestly AI Everywhere

Nestly AI is designed as contextual assistance inside family workflows, not as a
global chatbot.

The product rule is:

**AI suggests. The user reviews. The user confirms. Only then does Nestly save.**

## Product Principles

- AI is optional and every core workflow remains usable without it.
- AI suggestions are clearly labeled as suggestions.
- AI uncertainty is visible through confidence levels, warnings and missing
  fields.
- AI never silently changes finance, documents, permissions, family members or
  sensitive records.
- AI never deletes, merges or archives data automatically.
- Missing information must remain missing. The system must not invent values.

## Architecture

The current implementation keeps UI components provider-agnostic:

1. UI calls a domain service.
2. Domain service calls the AI orchestration layer.
3. The orchestrator creates a normalized `AISuggestion`.
4. Suggestions are stored locally through the AI suggestion repository.
5. The user reviews each suggestion in `AISuggestionCard`.
6. Accept/reject is recorded in a safe audit trail.
7. Existing module services perform the actual data changes only after user
   confirmation.

Core files:

- `src/services/ai/aiOrchestrator.ts`
- `src/services/ai/contextualSuggestionService.ts`
- `src/repositories/aiSuggestionRepository.ts`
- `src/types/aiSuggestions.ts`
- `src/components/ai/AISuggestionCard.tsx`
- `src/components/ai/AISuggestionBadge.tsx`
- `src/components/ai/AIWarningList.tsx`
- `src/components/ai/AIProcessingState.tsx`
- `src/components/ai/AIFallbackState.tsx`

## Provider Status

The app still uses the existing provider abstraction documented in
`docs/AI_ARCHITECTURE.md`.

For contextual text suggestions added in this sprint, the active implementation
is local deterministic rules. It is intentionally labeled by the orchestrator as
`local-rules` when a real provider is not active.

No UI component calls Gemini, OpenAI, Anthropic or any provider directly.

## Shared Suggestion Model

`AISuggestion` supports:

- source module and source entity
- suggestion type
- title and explanation
- proposed values
- confidence and field confidence
- warnings and missing fields
- provider label
- lifecycle status
- resulting entity IDs
- safe metadata

Supported statuses:

- `pending`
- `accepted`
- `edited`
- `rejected`
- `expired`
- `superseded`

Supported suggestion types include extracted fields, suggested titles,
categories, tags, due dates, reminders, shopping items, knowledge items,
duplicate warnings, related records and summaries.

## Review Before Save

The reusable `AISuggestionCard` makes the confirmation boundary explicit.

It can:

- show proposed values
- show confidence
- show warnings
- accept a suggestion
- reject a suggestion
- call back into the host module to apply values

Applying a suggestion fills a form or adds reviewed records. It does not bypass
the host module's existing save flow unless the action is explicitly framed as
adding reviewed items, such as splitting a shopping text into list items.

## Module Integrations

Implemented contextual integrations:

- Tasks: suggest title, category, priority and due date from task text.
- Shopping: split a typed shopping note into multiple reviewed list items.
- Family Knowledge: suggest title, category and tags from typed information.
- Receipt scanning: existing receipt review remains separate and still requires
  confirmation before creating a finance expense.

Prepared but not fully implemented:

- Duplicate detection across records.
- Related record suggestions.
- Ask Nestly source-backed answers.
- Proactive suggestions beyond local form actions.
- Provider-backed note and document intelligence.

## Settings

AI settings now include real controls for:

- Smart suggestions
- Text analysis

These preferences are stored in app settings and are checked before contextual
text suggestions run.

Document analysis is still governed by the existing AI service status and route
capability checks. It should get a dedicated production-ready consent and
retention flow before being exposed as a broad user toggle.

## Privacy

The contextual rules added here run locally in the browser and do not send note,
task or shopping text to an external provider.

The AI audit trail stores safe metadata only:

- request ID
- feature
- provider label
- status
- created time
- suggestion ID
- confidence level
- resulting entity IDs
- safe error code if needed

It does not store raw private input or document contents.

## Cost Controls

The current sprint avoids automatic provider calls.

Future provider-backed features should keep:

- explicit user trigger
- request timeout
- file-size limits
- schema validation
- duplicate request prevention
- provider-disabled fallback
- per-feature capability checks

## Mock, Rule-Based and Real Provider Distinction

- `local-rules`: deterministic browser-side suggestions.
- `mock`: structured demo AI responses through the existing provider interface.
- `disabled`: AI endpoints return safe disabled/fallback states.
- `gemini`: server-side adapter boundary prepared for production provider setup.

UI copy should avoid claiming real AI analysis when only local rules or mock data
were used.

## Current Limitations

- No production cloud database.
- No secure document storage.
- No real provider is enabled by default.
- No full source citation panel yet.
- No duplicate suppression engine yet.
- No automated stale suggestion invalidation beyond lifecycle status support.
- No tests were added in this sprint.

## Recommended Epic 6 Preparation

The next AI sprint should focus on one complete end-to-end journey:

1. Receipt or bill scan.
2. Structured extraction.
3. Review screen.
4. Confirmed finance/document/task creation.
5. Safe audit trail.
6. Source links between created records.

That will give Nestly the most visible family value without creating a broad,
fragile AI surface.
