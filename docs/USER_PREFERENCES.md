# User Preferences

Nestly currently has three preference layers:

- Display and accessibility settings.
- Local data and privacy settings.
- Personalization settings.

## Personalization preferences

Stored key:

```txt
nestly-personalization-preferences
```

Shape:

- `homeSections`: visible and ordered Home sections.
- `quickActions`: pinned Home quick actions.
- `favorites`: user-marked records.
- `savedViews`: stored filter/view definitions.
- `defaults`: future defaults for common modules.
- `recentRecords`: recently opened records.

## Persistence model

The current app is local-first. Preferences persist after refresh in the same browser profile.

For authenticated cloud mode, preferences should be split into:

- User preferences: language, theme, density, pinned actions, personal favorites.
- Family Space preferences: shared dashboard defaults and family-level defaults.

## Privacy

Personalization should never store sensitive document contents, medical details or financial line-item content in telemetry.

Favorites and recent records should store only identifiers, titles, route and timestamps.

## Integration guidance

New modules should use:

- `readPersonalizationPreferences`
- `writePersonalizationPreferences`
- `addFavorite`
- `removeFavorite`
- `saveView`
- `trackRecentlyOpenedRecord`

Do not create module-specific preference keys unless the setting is truly private to one module.
