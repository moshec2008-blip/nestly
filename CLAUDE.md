# Nestly — Development Context

Nestly is a **Family Operating System** — not another family management app. The
goal is to reduce the family's mental load. Every feature must answer: *"Does
this reduce mental effort for the family?"* If not, it doesn't belong.

## Product principles

- Calm, trusted family assistant. Not an ERP, not a spreadsheet.
- **AI assists, never replaces decisions.** The user always reviews and
  confirms before anything is saved (expenses, reminders, documents).
- Extremely fast interactions — scan-to-confirmation in seconds.
- Mobile first. Desktop secondary. Minimal taps.
- Design: rounded corners, soft shadows, warm background, subtle borders,
  minimal color (color communicates meaning). Avoid clutter, oversized heroes,
  duplicated actions.

## AI roadmap (the heart of the product)

1. **Finance AI** — scan a bill → detect supplier, amount, due date, billing
   period → suggest: add expense, create reminder, archive document, update
   budget. User confirms.
2. **Shopping AI** — scan a receipt → extract total, store, date → confirmation
   dialog (approve / edit / split / mark reimbursement).
3. **Medical AI** — scan referrals/Form 17/results → group into a "Medical
   Journey": case, checklist, appointments, reminders, timeline.

Server-side AI lives in `src/app/api/ai/*`. The live provider is **Google
Gemini** (direct REST, no SDK dependency — `src/lib/ai/providers/gemini-provider.ts`,
default model `gemini-3.5-flash`, override via `GEMINI_MODEL`). Setting
`GEMINI_API_KEY` alone enables live analysis. Client never holds API keys.
Demo mode always uses the local mock (enforced server-side in
`getAIProviderForInput`). When no `GEMINI_API_KEY` is configured the whole AI
layer degrades to the mock. `ANTHROPIC_API_KEY` is an optional secondary path
for document classification only.

## Data & modes

- All data is per-Family-Space, isolated per scope (`src/utils/storage.ts`).
- **Guest mode** — explore without signing in; data stays on device.
- **Demo mode** — fictional "משפחת ישראלי" data only (`src/lib/demoMode.ts`);
  demo must never leak into authenticated users' spaces and never calls paid AI.
- Authentication (Google primary) is currently disabled on purpose; it returns
  when sharing/sync/AI need it. Auth is requested only when needed, not upfront.
- Backup/restore for all local data lives in Settings (`src/lib/dataBackup.ts`).

## i18n

- Hebrew (default, RTL) and English now; Yiddish later.
- UI strings belong in `src/i18n/dictionaries.ts` translation keys — avoid new
  hardcoded visible strings (legacy hardcoded Hebrew is being migrated).
- Dates/currencies/numbers must be locale-aware.

## Conventions

- Next.js App Router + TypeScript + Tailwind 4. `npm run build` must pass.
- Persistence via `usePersistentArrayState` + scoped localStorage keys
  (`src/lib/storageKeys.ts`). Pass an item validator where possible.
- Never store real family data in seeds — sample data is the fictional
  "משפחת ישראלי" only.
