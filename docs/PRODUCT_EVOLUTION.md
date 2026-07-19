# Nestly Product Evolution

Epic 15 prepares Nestly to learn from real family use before adding more large features.

## Weekly Review Questions

Review these questions during closed beta:

- Which modules are opened most?
- Which modules are ignored?
- Which workflows are completed?
- Which workflows are abandoned?
- Which screens are slow?
- Which errors repeat?
- What feedback appears more than once?
- Which features need clearer discovery?

## Signals To Watch

High-value positive signals:

- repeated task completion
- shopping list completion
- receipt confirmation
- document review completion
- frequent command/search use
- positive feedback

Risk signals:

- repeated app errors
- abandoned workflows
- slow screens
- feedback marked "confusing"
- low usage of key modules

## Recommended Beta Cadence

1. Review the internal insights dashboard weekly.
2. Group feedback by area and severity.
3. Fix repeated friction before adding new features.
4. Prefer journey completion over new module expansion.
5. Keep private family content out of analytics.

## Next Backend Step

The next production step is a secure cloud event sink that stores only privacy-safe event metadata per family space.

## Planned: Contextual Item Notes (post-cloud)

Decision (2026-07-19): Nestly will NOT build a free-form family chat.
Families already live in WhatsApp; a competing inbox adds mental load
instead of reducing it.

What we build instead, once cloud sync exists:

- **Item notes** — a short comment thread attached to a specific task,
  shopping item, document, appointment or expense ("bought it already",
  "the appointment moved to 16:00"). The conversation lives where the
  thing lives, which is the one job WhatsApp cannot do.
- **Family note of the day** — a single calm line on Home ("Dad is back
  late today"). Not a feed, no replies required.
- Audience follows context (a note on Dana's appointment reaches
  whoever cares for Dana). No separate "personal vs general" chat
  concept.

Hard dependency: cloud persistence + sync (notes written on one device
must reach the rest of the family). Do not start before that layer is
live.

Interim bridge available today without a server: "Share to WhatsApp"
actions on items — use the existing habit instead of fighting it.
