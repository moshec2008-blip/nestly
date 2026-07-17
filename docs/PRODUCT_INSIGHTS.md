# Nestly Product Insights

Epic 15 adds a lightweight, privacy-first product insights layer for closed beta learning.

## What Is Tracked

Nestly tracks anonymous operational events that help understand product health:

- screen and module usage
- task, shopping, receipt, document and smart-capture completions
- assistant and search usage
- workflow abandonment
- performance metrics
- app, AI, upload and analysis failures
- feedback metadata

## What Is Never Tracked

The insights layer must not store:

- document contents
- medical information
- financial values
- family names
- notes or messages
- uploaded files
- search text
- AI responses
- authentication tokens

Feedback submitted through Settings stores only metadata locally: type, area, page, app version, browser, screen size, contact-present flag and text length.

## Main Files

- `src/services/telemetry.ts` - anonymous event collection and local retention
- `src/lib/productInsights.ts` - beta feedback, health score and friction analysis
- `src/components/telemetry/TelemetryDashboard.tsx` - internal beta insights dashboard
- `src/app/telemetry/page.tsx` - internal dashboard route
- `src/components/settings/SettingsManager.tsx` - feedback entry point

## Product Health Score

The local product health score is calculated from:

- app errors
- high-friction signals
- completed core actions
- beta feedback type balance

It is intentionally directional, not a business KPI.

## Future Integrations

When a backend exists, this architecture can connect to privacy-safe analytics storage.
Until then, all insight data remains local to the browser.
