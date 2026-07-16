# Closed Beta Readiness

Nestly is visually strong and useful for local demos, but it is not yet ready for
10 real families entering sensitive shared data.

| Area | Status | Notes |
| --- | --- | --- |
| Google authentication | Partial | NextAuth boundary exists; production env/callbacks must be configured and tested. |
| Real database | Missing | Supabase selected, not connected. |
| Family Spaces | Partial | Types/local emulator exist; server-owned spaces are missing. |
| Cloud persistence | Missing | Most modules remain localStorage/IndexedDB. |
| Invitations | Missing | UI should stay disabled until email + backend are real. |
| Permissions | Partial | Capability foundation exists; no server enforcement yet. |
| Row Level Security | Missing | Required before real collaboration. |
| Secure file storage | Missing | Private cloud storage and signed URLs required. |
| Realtime sync | Missing | Do not claim sync yet. |
| Notifications | Partial | Local notifications exist; server notification model missing. |
| Audit log | Missing | Required for sensitive admin actions. |
| Search/Assistant permissions | Partial | Must filter by server permissions before shared beta. |
| Feedback | Partial | Product feedback exists locally; delivery/ops need hardening. |
| Monitoring | Missing | No production observability provider. |
| Tests | Partial | Build/lint/typecheck exist; no collaboration E2E tests. |

## Safe Closed Beta Guidance

Before inviting real families:

1. Connect Supabase.
2. Apply versioned migrations.
3. Enable RLS.
4. Store records by Family Space.
5. Add server-side authorization.
6. Configure Google OAuth production callback.
7. Configure a real email provider.
8. Implement invitation acceptance.
9. Add secure document storage.
10. Add cross-family rejection tests.

Current readiness score: **45/100** for real closed beta.

For founder demos with fictional data: **80/100**.
