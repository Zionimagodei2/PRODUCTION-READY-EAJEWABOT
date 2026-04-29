# EAJE WhatsBot Evolution Roadmap

## Product Vision
Build EAJE WhatsBot from an early-stage prototype into a reliable, secure, scalable, and polished WhatsApp automation platform that teams can trust in production.

## North-Star Outcomes (Next 6 Months)
1. **Reliability:** 99.9% uptime for core messaging and scheduling APIs.
2. **Performance:** P95 page load under 2.5s on mid-tier mobile devices.
3. **Quality:** Zero P1 regressions released to production.
4. **Trust:** Security baseline (auth hardening, audit logs, rate limits, backup/restore).
5. **Usability:** End-to-end onboarding and feature discoverability for first-time users.

## Evolution Phases

### Phase 1 — Stabilize Foundation (Weeks 1–3)
- Bug triage and cleanup of all known lint/type/build blockers.
- Add missing error boundaries and resilient empty/error/loading states.
- Standardize API response contracts and error payload shapes.
- Add health checks for DB, scheduler, WhatsApp service dependencies.
- Introduce baseline observability (structured logs + request IDs).

**Definition of Done**
- CI green on lint, typecheck, build.
- No open known crashers in dashboard/campaign/contact flows.
- Production smoke tests pass.

### Phase 2 — Quality Engine (Weeks 3–6)
- Add automated test pyramid:
  - Unit tests for stores/hooks/utils.
  - Integration tests for API routes.
  - E2E critical paths (onboarding, send message, campaign create, export).
- Add QA checklist and release checklist with rollback plan.
- Add seed fixtures for deterministic test data.

**Definition of Done**
- Minimum coverage targets enforced in CI.
- E2E suite runs on every merge to main.

### Phase 3 — Security + Multi-Tenant Readiness (Weeks 6–9)
- Harden auth/session boundaries and permission checks.
- Add request rate limiting and abuse protection.
- Add audit trail for critical actions (campaigns, templates, exports).
- Data backup & restore runbook.

**Definition of Done**
- Security checklist complete.
- No unscoped data leakage across tenant boundaries.

### Phase 4 — Product Maturation (Weeks 9–14)
- Refine IA/navigation and advanced search.
- Improve campaign analytics depth and drilldowns.
- Introduce workflow automation templates and reusable playbooks.
- Add in-app guidance and progressive onboarding.

**Definition of Done**
- Reduced time-to-first-value for new users.
- Increased retention on weekly active users.

### Phase 5 — Scale + Optimization (Weeks 14–20)
- Background job robustness (retry, dedupe, dead-letter queue).
- Caching strategy for expensive queries.
- API and DB performance tuning using profiling data.
- Mobile UX polish and PWA reliability enhancements.

**Definition of Done**
- P95 latency and error budgets met.
- Incident rate and MTTR trend downward.

## Current Phase Status (Updated)
- Phase 1 (Stabilize Foundation): **In Progress**
  - Completed: standardized API response helpers, global error boundary, health endpoint improvements.
  - Remaining: structured observability dashboard + full production smoke matrix sign-off.
- Phase 2 (Quality Engine): **In Progress**
  - Completed: CI workflow for lint/build and explicit QA/release checklist.
  - Newly completed: additional utility test coverage for cache behavior (`simple-cache`) to support optimization regressions.
  - Remaining: automated unit/integration/E2E suites with enforced coverage thresholds.
- Phase 3 (Security + Multi-Tenant Readiness): **In Progress**
  - Completed: auth endpoint rate limiting, owner auth flow baseline, anti-ban policy persistence + behavior telemetry endpoint.
  - Remaining: full permission boundaries.
  - Newly completed: audit trail API logging for contacts/campaigns/settings/export and backup/restore runbook.
- Phase 4 (Product Maturation): **In Progress**
  - Completed: onboarding/sign-in/sign-up/welcome screens, premium plan management UI, anti-ban behavior intelligence UI.
  - Newly completed: production contact import pipeline (`/api/contacts/import`) with dedupe/skip accounting and audit logging, plus real WhatsApp group participant import flow in UI.
  - Newly completed: persistent repeated-number filtering across Number Generator and Group Extractor via settings-backed phone index/history.
  - Newly completed: stronger extraction path using real WhatsApp group participant retrieval with paced/stealth extraction cadence.
  - Newly completed: cross-feature concurrent operation guards for send/extract/lead-gen to allow parallel productivity while protecting runtime from overload.
  - Newly completed: improved iOS install guidance in PWA install flow for Safari Add-to-Home-Screen path.
  - Newly completed: contacts bulk group-assignment modal now uses persisted settings-backed groups and real contact tag updates (replacing static mock group list behavior).
  - Remaining: deeper IA/search improvements and guided in-app onboarding journeys.
- Phase 5 (Scale + Optimization): **In Progress**
  - Newly completed: settings-backed background queue primitives with retries, dedupe keys, backoff scheduling, dead-letter retention, and queue processing endpoint.
  - Newly completed: campaign creation now enqueues dispatch work for asynchronous processing.
  - Newly completed: lightweight API caching for recent lead searches with cache invalidation on new writes.
  - Remaining: profile-led DB/API optimization.
  - Newly completed: baseline retention-limited audit storage and operational recovery documentation.

## Engineering Operating System

### Weekly Cadence
- **Mon:** roadmap grooming + architecture decisions.
- **Tue–Thu:** implementation sprints.
- **Fri:** QA hardening, metrics review, release candidate.

### Release Discipline
- Trunk-based development with short-lived feature branches.
- Feature flags for risky functionality.
- Canary rollout + rollback scripts for every release.

### Quality Gates (Mandatory)
- Lint + typecheck + build must pass.
- Tests for changed behavior.
- Accessibility sanity checks for new UI.
- Performance check for heavy screens.

## Priority Backlog (Start Immediately)
1. Centralize API error handler + typed response helpers.
2. Add global error boundary and route-level fallback UIs.
3. Add E2E tests for onboarding, message send, campaign creation.
4. Add audit logging for settings, export, campaign operations.
5. Add feature flags for beta/experimental tools.
6. Add telemetry dashboard (errors, latency, engagement).

## Success Metrics Dashboard
- Uptime, API error rate, P95 latency.
- Crash-free sessions.
- Regression escape rate.
- Time-to-first-message sent.
- Weekly active users and retention.

## Immediate Next Sprint Plan (7 days)
- Day 1: triage + issue labeling (P0/P1/P2).
- Day 2–3: stabilize API routes and error boundaries.
- Day 4–5: E2E tests for top 3 user journeys.
- Day 6: bug bash and perf pass.
- Day 7: release candidate + post-release review.

## Current Point (Live)
- We are currently in **Phase 3 → Phase 4 transition**:
  - Security controls are active (rate limiting + anti-ban behavior detection).
  - Product maturity work is active (UX surfaced intelligence, operator controls, and production contact import execution).
  - Next high-priority execution: permissions hardening + E2E journey coverage + remaining IA/onboarding optimization.

---
This roadmap is intentionally iterative: each phase feeds the next through measured outcomes, not assumptions.
