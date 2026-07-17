# Nestly Personalization

Nestly personalization lets a family adjust the product without changing the core design system.

## What is implemented

- Home dashboard section visibility.
- Home dashboard section ordering.
- Pinned Home quick actions.
- Unified favorites storage.
- Saved views storage foundation.
- Recent record tracking foundation.

Preferences are stored through the shared storage helper and use the `nestly-personalization-preferences` key.

## Main files

- `src/types/personalization.ts`
- `src/lib/personalization.ts`
- `src/hooks/usePersonalization.ts`
- `src/components/settings/SettingsManager.tsx`
- `src/app/page.tsx`
- `src/components/home/HomeQuickActions.tsx`

## Behavior

Home personalization applies immediately because settings writes dispatch a browser event consumed by `usePersonalization`.

The current implementation is local-first. When cloud persistence is added, this preference object should be saved per Family Space and per signed-in user, depending on the preference type.

## Current limitations

- Favorites are actively wired for Family Knowledge. Other modules can adopt the same helper.
- Saved views have storage and settings visibility, but not every module exposes a "save current view" action yet.
- Role-based personalization remains future-facing until real permissions and cloud identity are fully connected.

## Future direction

- Sync preferences across devices for authenticated users.
- Add per-user and per-family preference scopes.
- Let modules save filters as reusable views.
- Use recent records and favorites in global search.
