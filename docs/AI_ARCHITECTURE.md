# Nestly AI Architecture

Nestly AI follows one product rule:

**AI suggests. The user confirms.**

AI analysis must never silently create, modify, delete, pay, upload, share or
archive important family data. Every output is a structured suggestion for a
review screen.

## Overview

The new foundation is provider-agnostic:

- UI components call services or API routes.
- Services call `getAIProvider()`.
- Providers implement one shared `AIProvider` interface.
- Real provider calls run server-side only.
- Structured output is validated before product code sees it.

Core files:

- `src/lib/ai/types.ts`
- `src/lib/ai/config.ts`
- `src/lib/ai/capabilities.ts`
- `src/lib/ai/providers/ai-provider.interface.ts`
- `src/lib/ai/providers/mock-provider.ts`
- `src/lib/ai/providers/gemini-provider.ts`
- `src/lib/ai/validation/ai-response.validation.ts`
- `src/lib/ai/normalization/*`
- `src/services/*AnalysisService.ts`
- `src/app/api/ai/analyze-*`

## Environment Variables

```env
AI_ENABLED=false
AI_PROVIDER=mock
GEMINI_API_KEY=
```

Supported providers today:

- `mock`: local structured demo data, no external call.
- `disabled`: AI endpoints return a friendly disabled message.
- `gemini`: prepared server-side adapter boundary. It requires
  `GEMINI_API_KEY`; the current implementation safely falls back through the
  mock-shaped contract until a Gemini SDK is installed and mapped.
- `future`: reserved for another provider.

Do not use `NEXT_PUBLIC_` for provider secrets.

## API Routes

All new routes return suggestions only:

- `POST /api/ai/analyze-document`
- `POST /api/ai/analyze-receipt`
- `POST /api/ai/analyze-bill`
- `POST /api/ai/analyze-medical-document`

Each route:

- validates payload size and file metadata
- checks user-mode capability
- calls a server-side service
- validates the structured result
- returns a safe Hebrew error message on failure
- does not log raw document content
- does not persist data

## User Modes

Central capability checks live in `src/lib/ai/capabilities.ts`.

- Demo: mock AI only.
- Basic/anonymous: sensitive AI scanning is blocked.
- Authenticated: real AI may be enabled when configured.

## Supported Input

Normalized file input supports:

- JPG
- PNG
- WebP
- PDF

The model includes:

- `fileName`
- `mimeType`
- `size`
- `sourceType`
- `familySpaceId`
- `userId`
- `locale`
- `language`
- `base64` or `secureFileRef`

## Result Contracts

The foundation supports:

- generic document analysis
- receipt analysis
- bill analysis
- medical document organization

All results include:

- `requestId`
- provider and mode
- confidence and confidence level
- field confidence
- warnings
- missing fields
- suggested actions
- `requiresUserReview: true`

## Mock Mode

The mock provider returns realistic examples for:

- supermarket receipt
- water bill
- medical referral
- appointment-style document
- partial or low-confidence result
- error simulation

It is safe for development because it does not send data to any external
provider.

## Gemini Enablement

To enable Gemini later:

1. Install the official Gemini SDK.
2. Keep imports server-side only in `gemini-provider.ts`.
3. Send the relevant prompt from `src/lib/ai/prompts`.
4. Request strict JSON output.
5. Parse via `structured-output.parser.ts`.
6. Validate via `ai-response.validation.ts`.
7. Return only the typed result to services.

Required Vercel variables:

```env
AI_ENABLED=true
AI_PROVIDER=gemini
GEMINI_API_KEY=...
```

## First Demo Flow

Finance now has a receipt scan preview:

1. Upload a receipt.
2. Mock AI analyzes it through `/api/ai/analyze-receipt`.
3. A review dialog opens.
4. The user can edit fields.
5. Only after confirmation, an expense is added through the existing finance
   transaction flow.

## Privacy

Current limitations:

- No production secure file storage yet.
- No backend database yet.
- No retention controls yet.
- No provider disclosure screen yet.
- No full audit persistence yet.

Prepared models:

- audit record
- correction record
- family-space and user ids on analysis input
- safe error model

## Next AI Sprint

Recommended next work:

1. Add persistent audit/correction storage scoped to Family Space.
2. Add a real secure upload store.
3. Install and connect Gemini with strict JSON schema mapping.
4. Add tests for normalization, validation and provider fallback.
5. Expand receipt confirmation into a polished bottom sheet for mobile.
6. Add bill-to-reminder review flow.
7. Add medical document consent screen and retention settings.

## Contextual AI Everywhere Layer

The broader contextual suggestion layer is documented in
`docs/AI_EVERYWHERE.md`.

Current implementation adds a provider-agnostic suggestion model and reusable
review components for small workflow assistance:

- `src/types/aiSuggestions.ts`
- `src/repositories/aiSuggestionRepository.ts`
- `src/services/ai/aiOrchestrator.ts`
- `src/services/ai/contextualSuggestionService.ts`
- `src/components/ai/AISuggestionCard.tsx`

Text suggestions currently use deterministic local rules unless a live provider
is explicitly configured later. This distinction is intentional: Nestly should
not claim provider-backed AI when it is using local assistance.

Integrated modules today:

- Tasks: field suggestions from task text.
- Shopping: split a typed shopping note into reviewed list items.
- Family Knowledge: title, category and tag suggestions.

Every integration keeps the same rule:

**suggestion first, user review second, existing module save flow last.**
