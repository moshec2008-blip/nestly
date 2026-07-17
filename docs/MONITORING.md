# Nestly Monitoring

Nestly needs operational monitoring that measures reliability without collecting sensitive family content.

## Current Local Signals

The current app can report:

- app errors
- AI request failures
- document AI failures
- background job queued/running/succeeded/failed states
- feature usage
- workflow abandonment
- local product health score
- local storage size estimate

Main files:

- `src/services/telemetry.ts`
- `src/lib/productInsights.ts`
- `src/lib/jobs/localJobQueue.ts`
- `src/lib/operations/health.ts`
- `src/components/operations/OperationsDashboard.tsx`

## Production Metrics Needed

- uptime
- response time
- API error rate
- crash-free sessions
- failed job rate
- queue length
- AI latency
- upload latency
- email delivery failures
- sync failures
- deployment health

## Alerting Recommendations

Create alerts for:

- API error rate above threshold
- auth callback failures
- AI provider outage
- upload failure spike
- background queue stuck
- database unavailable
- storage unavailable
- deployment rollback required

## Privacy Rules

Logs and metrics must never include:

- personal names
- emails unless explicitly needed for account lookup and protected
- document content
- medical or financial values
- uploaded file names
- receipt line items
- search queries
- AI prompt or response content
