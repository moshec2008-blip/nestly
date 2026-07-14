# Nestly Product Backlog

This backlog tracks concrete product gaps discovered during module-by-module usability and trust review. It focuses on beta readiness, honest capability boundaries, and family workflows.

## CRITICAL

### 1. Authentication and cloud data are not production-complete
- Module: Authentication / Data
- Problem: Google login and local/cloud repository scaffolding exist, but the app is still primarily local-first and not backed by a real production database for all modules.
- User impact: Families may expect cross-device sync, sharing, and durable storage when those capabilities are not fully real.
- Recommended solution: Connect a real database, create server-owned Family Spaces, and migrate each module from localStorage/IndexedDB to scoped cloud persistence.
- Priority: Critical
- Estimated complexity: XL

### 2. Family sharing and permissions are not server-enforced
- Module: Permissions
- Problem: Roles and invitation UI are present, but permission enforcement is not backed by a server authority.
- User impact: Users may misunderstand permissions as real security.
- Recommended solution: Add backend role checks, invite tokens, email delivery, and route/data authorization.
- Priority: Critical
- Estimated complexity: L

### 3. Sensitive documents still require real secure storage
- Module: Documents
- Problem: Smart document workflows exist, but secure encrypted cloud document storage is not production-ready.
- User impact: Families cannot safely rely on Nestly as a long-term sensitive document vault yet.
- Recommended solution: Add cloud object storage, signed upload/download URLs, encryption policy, file scanning, and retention rules.
- Priority: Critical
- Estimated complexity: XL

## HIGH

### 4. Complete shopping-to-receipt-to-finance journey
- Module: Shopping / AI / Finance / Documents
- Problem: Receipt scan flow exists, but needs stronger end-to-end QA, duplicate handling, undo, and clearer document linkage.
- User impact: A core family journey can feel magical, but only if it is reliable and easy to recover from mistakes.
- Recommended solution: Add a receipt review history, duplicate receipt detection, undo after confirmation, and document attachment visibility in Finance.
- Priority: High
- Estimated complexity: M

### 5. Task collaboration is still local/demo-oriented
- Module: Tasks
- Problem: Responsible person is visible, but there is no real multi-user assignment, notification, or “assigned by me” source.
- User impact: Tasks may feel collaborative visually, but are not yet shared family coordination.
- Recommended solution: Add user/member identities, assignee filters, task creator metadata, and cloud sync.
- Priority: High
- Estimated complexity: L

### 6. Add undo for destructive actions
- Module: Global
- Problem: Many destructive actions now require confirmation, but undo is still missing.
- User impact: Users can recover less easily from accidental deletes or bulk clears.
- Recommended solution: Add a global undo toast pattern for delete/clear actions where data can be restored locally.
- Priority: High
- Estimated complexity: M

### 7. Standardize all dialogs and bottom sheets
- Module: Global UI
- Problem: Dialogs use several styles and interaction patterns.
- User impact: The app feels less predictable in complex flows.
- Recommended solution: Create `DialogShell` and `BottomSheet` shared components and migrate high-use dialogs first.
- Priority: High
- Estimated complexity: M

### 8. Family Events needs deeper workflow QA
- Module: Family Events
- Problem: The module is visually improved, but event add/edit/reminder/detail flows need full mobile walkthrough and simplification.
- User impact: Family celebrations are emotionally important; friction here is highly visible.
- Recommended solution: Reduce secondary metadata, move details to drawer/sheet, and validate Hebrew/Gregorian reminder edge cases.
- Priority: High
- Estimated complexity: M

### 9. Documents needs clearer review queues
- Module: Documents
- Problem: Requires-attention, recent, categories, and all-documents structure exists partially but should be made more obvious.
- User impact: Users need to know what needs review now.
- Recommended solution: Promote review queue, show expiry/reminder only when meaningful, and add clearer empty states per section.
- Priority: High
- Estimated complexity: M

### 10. Mobile QA should become repeatable
- Module: Global
- Problem: Mobile review is mostly manual and not automated.
- User impact: Regressions like clipped amounts or overlapping navigation can return.
- Recommended solution: Add Playwright viewport checks for 375, 390, 412, and 430px across major routes.
- Priority: High
- Estimated complexity: M

## MEDIUM

### 11. Replace remaining handcrafted buttons with shared Button
- Module: Global UI
- Problem: Many modules still use inline button class names.
- User impact: Visual and interaction inconsistencies remain.
- Recommended solution: Gradually migrate buttons to `Button`, starting with Finance, Documents, Family Events, and Permissions.
- Priority: Medium
- Estimated complexity: M

### 12. Replace remaining handcrafted empty states with EmptyState
- Module: Global UI
- Problem: Some modules still have local empty-state markup.
- User impact: Tone and spacing vary by module.
- Recommended solution: Use `EmptyState` for all empty module sections and add action slots where safe.
- Priority: Medium
- Estimated complexity: S

### 13. Add shared form components across modules
- Module: Global UI
- Problem: Forms still vary in label/helper/validation treatment.
- User impact: Users must relearn patterns between modules.
- Recommended solution: Expand `FormField` and add `TextInput`, `SelectInput`, and `TextareaInput`.
- Priority: Medium
- Estimated complexity: M

### 14. Improve health module into a clearer family health organizer
- Module: Health
- Problem: Current flow is still reminder/list oriented.
- User impact: It helps record health tasks but does not yet fully reduce medical mental load.
- Recommended solution: Add clearer sections for important now, upcoming appointments, follow-ups, and related documents.
- Priority: Medium
- Estimated complexity: M

### 15. Improve vehicles into vehicle summaries first
- Module: Vehicles
- Problem: The module still leans toward reminders rather than vehicle-centered summaries.
- User impact: Families may not immediately see what each car needs next.
- Recommended solution: Add vehicle summary rows/cards with next action, status, and related document links.
- Priority: Medium
- Estimated complexity: M

### 16. Add real error states for AI and uploads
- Module: AI / Documents
- Problem: AI flows have status handling, but retry and recovery should be more consistent.
- User impact: Failed scans/uploads can feel confusing.
- Recommended solution: Standardize `LoadingState` and `ErrorState` components with retry actions.
- Priority: Medium
- Estimated complexity: M

## FUTURE

### 17. Real Family Space management
- Module: Identity / Family
- Problem: Future multiple family spaces are architecturally planned but not fully implemented.
- User impact: Families with extended households or shared caregiving cannot model real ownership yet.
- Recommended solution: Add family space switcher, invitations, roles, and member management backed by database.
- Priority: Future
- Estimated complexity: XL

### 18. Notification delivery
- Module: Tasks / Finance / Events / Vehicles / Health
- Problem: Reminders are mostly local/product-level, not real push/email notifications.
- User impact: Important reminders may not reach the family outside the app.
- Recommended solution: Add push/email provider, notification preferences, digest rules, and quiet hours.
- Priority: Future
- Estimated complexity: L

### 19. AI assistant suggestions across modules
- Module: AI / Home / Documents / Finance
- Problem: AI foundation exists, but proactive assistance should wait until data and trust foundations are stronger.
- User impact: Premature AI suggestions can feel noisy or unreliable.
- Recommended solution: Add one suggestion surface at a time, beginning with document-to-action recommendations.
- Priority: Future
- Estimated complexity: L

### 20. Full design-system package
- Module: Global UI
- Problem: Shared UI components now exist but are not yet exhaustive.
- User impact: Future development may reintroduce inconsistency.
- Recommended solution: Build a documented internal design system with examples, usage rules, and migration checklist.
- Priority: Future
- Estimated complexity: M
