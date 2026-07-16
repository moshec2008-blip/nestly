# Smart Templates

Status: **foundation implemented, activation UI not connected yet**

Smart Templates help a family reuse common workflows without creating records blindly.

## Implemented

- Template model in `src/types/smartTemplates.ts`.
- Built-in Hebrew templates in `src/lib/smartTemplates/builtInTemplates.ts`.
- Preview service in `src/services/smartTemplates/templateService.ts`.

## Built-in Templates

- Moving home.
- Buying a car.
- Monthly budget preparation.

Each template can include:

- Tasks.
- Checklists.
- Reminders.
- Document requirements.
- Shopping items.
- Family Knowledge prompts.
- Suggested relations.

## Product Rule

Templates create previews and drafts. They must not create records before explicit
confirmation.

## Current Limitations

- No template browser UI is connected yet.
- No custom family template editor exists yet.
- Template activation does not yet write tasks, documents or relations.
- No cloud persistence or sharing exists for family templates.
