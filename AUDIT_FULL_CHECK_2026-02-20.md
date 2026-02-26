# Website Audit - 2026-02-20

## Scope and methodology
- Checked backend runtime behavior and security headers by running the API server and issuing HTTP probes.
- Ran concurrent load testing against `/healthz` using the included performance script.
- Performed static review of frontend/backend configuration for API-origin usage, protections, and modern UX readiness.
- Attempted dependency vulnerability checks and frontend install/build validation.

## Executive summary
- **Protection level:** Good baseline (Helmet, rate limiting, Mongo sanitize, auth limiter, request IDs), but **not fully protected yet** due to missing production env hardening and one risky fallback (`JWT_SECRET` default in logs warns it's used when missing).
- **Design modernity:** UI stack is modern (React 19 + Radix + Tailwind ecosystem), but no automated visual QA evidence was possible because frontend dependency install is blocked by registry policy in this environment.
- **Errors:** Backend boots and serves health endpoints, but docs/tests mismatch exists (`/api/healthz` returns 404 while `/healthz` works).
- **Speed:** Health endpoint performance is strong in local test (100% success under concurrency, ~615 req/s, low TTFB on localhost).

## What passed
1. **Backend starts and listens** even when DB env vars are missing.
2. **Security headers present** in responses (HSTS, X-Frame-Options, X-Content-Type-Options, etc.).
3. **Load test result** on `http://127.0.0.1:8080/healthz`:
   - Requests: 2000
   - Concurrency: 200
   - Success rate: 100%
   - Throughput: ~615 req/s
   - Latency: p50 ~0.209s, p95 ~0.454s, p99 ~0.612s
4. **Fast local TTFB**:
   - `/healthz` total ~2.9ms
   - `/` total ~3.6ms
5. **Frontend API-origin approach mostly aligned** with same-origin rule (`/api`) and optional env override.

## Issues and gaps found

### 1) Not fully production-safe yet (critical)
- Backend logs indicate required vars are missing in this environment (`MONGO_URL`, `JWT_SECRET`).
- App warns that a default JWT secret is used in development fallback behavior.
- Risk: if env management slips in production, token security is weakened.

### 2) Health-check path inconsistency (high)
- `/api/healthz` returns 404.
- `/healthz` returns 200.
- Impact: broken monitoring/playbooks if teams follow `/api/healthz` expectation.

### 3) Security audit tooling blocked in this environment (medium)
- `npm audit`/`npm outdated` failed with npm registry `403 Forbidden`.
- Impact: cannot confirm latest CVE status from live advisory feeds here.

### 4) Frontend verification blocked in this environment (medium)
- `npm install` in `frontend/` failed with npm registry `403 Forbidden`.
- Impact: cannot conclusively re-run frontend build/tests for "no errors" claim from this session.

### 5) CSP hardening opportunity (medium)
- Helmet is enabled, but `contentSecurityPolicy` is disabled in backend configuration.
- Impact: reduced mitigation for XSS/script injection compared to strict CSP deployment.

## Action plan to become "fully protected"

### Immediate (this week)
1. Enforce non-empty `JWT_SECRET`/`MONGO_URL` at startup for production (`process.exit(1)` in production when missing).
2. Add alias endpoint `/api/healthz` (or update all docs/scripts to `/healthz`) and keep one canonical health path.
3. Add CI security scanning that runs outside the restricted npm mirror (Snyk/GitHub Dependabot/npm audit in CI runner with access).
4. Turn on strict CSP via Helmet, with explicit allowlists for required scripts/assets.
5. Confirm cookies/tokens policy (HttpOnly/SameSite/secure where applicable) and short token TTL + refresh rotation.

### Near-term (2-4 weeks)
1. Add WAF/CDN protections (Cloudflare/AWS WAF): bot filtering, geo/IP rules, DDoS mitigation.
2. Add structured security logging + alerting (failed logins, spikes, suspicious payloads).
3. Add automated backup + restore test drills for MongoDB.
4. Add API contract tests + smoke tests in CI (auth, booking, payment critical paths).

## Speed optimization ideas
1. Add CDN caching for static frontend assets and immutable cache headers.
2. Enable Brotli/gzip compression for API/static responses.
3. Add image optimization pipeline (WebP/AVIF variants, lazy loading, responsive sizes).
4. Track Core Web Vitals (LCP/INP/CLS) with real-user monitoring.
5. Preload key fonts and use `font-display: swap`.
6. Use route-level code splitting for heavier admin/staff pages.

## Customer retention ideas (to keep customers coming back)

### Product engagement
1. **Points + tiered loyalty** (bronze/silver/gold) with visible progress bar.
2. **Visit streak rewards** (weekly/monthly challenge badges for families).
3. **Birthday automation** (personalized offers + reminder campaigns).
4. **Referral engine** ("Invite a friend" with dual-sided reward).
5. **Membership perks calendar** (members-only events/hours).

### CRM and lifecycle
1. Win-back journeys for inactive users (7/30/60 day segments).
2. Post-visit NPS survey + instant coupon if feedback submitted.
3. Personalized recommendations based on child age and prior bookings.
4. WhatsApp re-engagement flow (consent-based): reminders, offers, upcoming events.

### UX and trust
1. One-tap rebooking from previous booking history.
2. Transparent pricing + package comparison cards.
3. Live slot urgency indicators (real-time availability).
4. Showcase social proof: recent reviews/photos with moderation.
5. Arabic-first microcopy polish and consistency across all checkout steps.

## Suggested KPIs to track weekly
- Repeat booking rate (30/60/90 days)
- Retention by cohort
- CAC vs LTV by channel
- Checkout conversion rate
- Cart/booking abandonment rate
- Referral conversion rate
- NPS and review volume

## Commands run
- `npm install` (frontend) → failed due npm 403 policy
- `node index.js` (backend)
- `curl -s -D - http://localhost:8080/api/healthz`
- `curl -s -D - http://localhost:8080/healthz`
- `python3 tests/performance/load_test_healthz.py --url http://127.0.0.1:8080/healthz --concurrency 200 --requests 2000`
- `curl -o /dev/null -s -w 'healthz_dns:%{time_namelookup} connect:%{time_connect} ttfb:%{time_starttransfer} total:%{time_total}\n' http://127.0.0.1:8080/healthz`
- `curl -o /dev/null -s -w 'root_dns:%{time_namelookup} connect:%{time_connect} ttfb:%{time_starttransfer} total:%{time_total}\n' http://127.0.0.1:8080/`
- `npm audit --omit=dev --json` (backend) → failed due npm 403 policy
- `npm outdated --json` (backend) → failed due npm 403 policy
