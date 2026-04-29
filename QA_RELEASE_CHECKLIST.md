# QA & Release Checklist

## Pre-merge (PR Gate)
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] API response shape verified for touched routes (`error`, `requestId`, status codes).
- [ ] Any new feature has a fallback/disabled state.
- [ ] No secrets in code, logs, or screenshots.

## Pre-release (Staging)
- [ ] Auth flow: sign-up, sign-in, invalid credentials path.
- [ ] Billing flow: plans load, switch plan, persistence after refresh.
- [ ] Feature flags: disable one gated feature and confirm UI fallback.
- [ ] Health endpoint returns status for DB/API/WhatsApp dependencies.
- [ ] Audit log endpoint (`/api/audit-logs`) returns recent activity after create/update/delete actions.
- [ ] Smoke pass on dashboard, campaigns, contacts, settings.

## Production Readiness
- [ ] CI green on default branch.
- [ ] Rollback plan documented for this release.
- [ ] Backup/restore runbook reviewed and latest backup integrity check is `ok`.
- [ ] Observability checks configured (error logs and request IDs).
- [ ] Rate limits enabled for auth endpoints.
- [ ] Post-release verification complete (15-minute smoke pass).
