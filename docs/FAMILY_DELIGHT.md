# Nestly Family Delight

Nestly delight is not decoration. It is the feeling that the app quietly removed friction, preserved the user's work, and made the next step obvious.

## Product Principles

- Every meaningful tap should answer: what happened, what happens next, and whether anything was saved.
- Calm beats excitement. No points, streaks, rankings, or loud celebration.
- Empty states should explain value and offer one clear next action.
- Destructive actions need confirmation. Reversible actions should prefer undo.
- Finance language stays factual and nonjudgmental.
- Vehicle and health reminders should be clear without sounding alarming.
- All delight interactions must respect reduced motion and accessibility preferences.

## Success Feedback

Success messages should be short, specific, and warm.

Good examples:

- `המשימה נשמרה`
- `המשימה הושלמה`
- `הפריט נוסף לקניות`
- `הקבלה נשמרה וההוצאה נוספה`
- `המסמך סודר בהצלחה`
- `השינויים נשמרו`

Avoid generic copy such as `הפעולה בוצעה בהצלחה` when a specific message is available.

The shared feedback provider now supports:

- toast confirmations
- optional action buttons
- undo actions
- deduplication keys
- longer display duration when an action is available
- safe telemetry for `success_message_shown` and `undo_used`

## Undo

Use undo for safe reversible actions:

- task completed
- shopping item marked purchased
- item moved to archive
- reminder handled
- favorite removed

Do not use undo for irreversible or high-risk actions such as clearing all family data, deleting documents, or removing family members. Those need explicit confirmation.

## Calm States

Use calm states when there is nothing urgent to handle:

- `הכול מסודר כרגע`
- `אין משהו שדורש טיפול עכשיו`
- `אתם מעודכנים להיום`
- `כל המסמכים טופלו`

Calm states should reassure without implying perfection or judging the family.

## Empty States

Every empty state should answer:

1. What is this area?
2. Why is it useful?
3. What should the user do first?

Keep empty states compact. Avoid large illustrations that push the action below the fold.

## Error Recovery

Every error should explain:

- what happened
- whether anything was saved
- what the user can do now

Never erase user input after failure. Do not show raw technical errors to families.

## Tone of Voice

Hebrew should be direct, respectful, calm, and nontechnical.

Prefer:

- `לא הצלחנו לשמור. הפרטים נשארו כאן.`
- `נסו שוב`
- `נשמר במכשיר הזה בלבד`

Avoid guilt, shame, pressure, and exaggerated celebration.

## First Success Moments

Important first-time completions should feel gently reassuring:

- first task created
- first shopping item added
- first receipt confirmed
- first document organized
- first family timeline update

Keep these moments small and useful.

## Accessibility

Delight must include accessibility:

- visible focus
- high contrast support
- reduced motion support
- screen-reader friendly status messages
- large enough touch targets
- no critical information conveyed by color alone

## Telemetry

Track only product-friction events and never sensitive content.

Allowed:

- success message shown
- undo used
- empty-state action used
- retry used
- first-success completed

Never send document contents, medical information, financial details, names, notes, or authentication tokens.

## Current Limitations

- Undo is currently implemented at the shared feedback layer and connected first to shopping purchase flows.
- Some older Hebrew strings still need encoding cleanup before broad microcopy replacement.
- Permanent deletion flows still use confirmation instead of archive plus undo.
- Full draft recovery is not yet implemented across all long forms.

## Next Steps

1. Connect undo to task completion after cleaning older encoded strings.
2. Replace module-specific empty states with `NestlyState`.
3. Add draft preservation to long notes, documents, and family information forms.
4. Add retry-friendly error states to upload and AI review flows.
5. Expand success registry to documents, finance, vehicles, health, timeline, and knowledge.
