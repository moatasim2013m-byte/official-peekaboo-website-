# k6 check-in capacity test (10 minutes)

This script load-tests the real staff check-in flow through `/api` endpoints:

1. Login once as staff/admin (`POST /api/auth/login`)
2. Poll pending check-ins (`GET /api/staff/pending-checkins`)
3. Optional write mode (`POST /api/staff/checkin`) using the first returned `booking_code`

Script path: `tests/performance/k6_staff_checkin_flow.js`

## 1) Install k6

- macOS: `brew install k6`
- Debian/Ubuntu: follow the official k6 apt repo instructions
- Docker (no local install): `docker run --rm -i grafana/k6 run - < tests/performance/k6_staff_checkin_flow.js`

## 2) Safe read-only run (recommended first)

```bash
STAFF_EMAIL='staff@example.com' \
STAFF_PASSWORD='***' \
BASE_URL='https://peekaboojor.com' \
k6 run tests/performance/k6_staff_checkin_flow.js
```

Default profile is already 10 minutes (`2m ramp-up + 6m steady + 2m ramp-down`).

## 3) Write run (real check-ins)

```bash
STAFF_EMAIL='staff@example.com' \
STAFF_PASSWORD='***' \
BASE_URL='https://peekaboojor.com' \
CHECKIN_WRITE='true' \
k6 run tests/performance/k6_staff_checkin_flow.js
```

> Warning: `CHECKIN_WRITE=true` changes booking status (`confirmed` -> `checked_in`).

## 4) Throughput to “customers per 10 minutes”

For write runs, use:

- `checkin_write_succeeded` metric from k6 summary/output
- customers in 10 mins = successful check-ins during the 10-minute test window

If your run duration is not exactly 10 minutes:

- customers_per_10m = `successful_checkins / duration_minutes * 10`

## 5) Useful tuning env vars

- `START_VUS` (default `1`)
- `STAGE_1_TARGET` (default `20`)
- `STAGE_2_TARGET` (default `20`)
- `STAGE_3_TARGET` (default `0`)
- `STAGE_1_DURATION` (default `2m`)
- `STAGE_2_DURATION` (default `6m`)
- `STAGE_3_DURATION` (default `2m`)
- `SLEEP_SECONDS` (default `0.5`)
- `TIMEOUT` (default `30s`)

Example heavier run:

```bash
STAFF_EMAIL='staff@example.com' \
STAFF_PASSWORD='***' \
BASE_URL='https://peekaboojor.com' \
CHECKIN_WRITE='true' \
STAGE_1_TARGET='40' \
STAGE_2_TARGET='80' \
SLEEP_SECONDS='0.2' \
k6 run tests/performance/k6_staff_checkin_flow.js
```
