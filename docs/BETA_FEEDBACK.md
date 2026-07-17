# Nestly Beta Feedback

The beta feedback flow is designed to be easy for families and safe for private data.

## Feedback Types

Users can classify feedback as:

- Bug
- Suggestion
- Confusing
- Love it

Each feedback item can be associated with an app area, such as Home, Finance, Shopping or Documents.

## Privacy Model

Nestly does not silently send private content.

The feedback helper:

- saves only safe metadata locally
- opens the user's email client for review before sending
- includes app version, page, browser and screen size
- avoids storing the feedback text in telemetry

## Delivery

The recipient email is controlled by:

```env
NEXT_PUBLIC_FEEDBACK_EMAIL=moshe.c2008@gmail.com
```

If the variable is missing, the app falls back to the default beta feedback address configured in Settings.

## Current Limitations

- Feedback is not yet sent through a server API.
- No backend ticketing system exists yet.
- Feedback records are local-only until cloud persistence is added.

This is intentional for beta: it keeps the first implementation simple and privacy-preserving.
