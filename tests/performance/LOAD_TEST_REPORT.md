# Load Test Report (1,000 concurrent visitors)

Date: 2026-02-14

## Scope
- Target service: `backend/node-app/index.js`
- Endpoint tested: `GET /healthz`
- Runtime mode: local Node.js process, no MongoDB connection configured (`MONGO_URL` missing)

## Method
1. Started backend with:
   - `node backend/node-app/index.js`
2. Ran an instantaneous burst test:
   - 1,000 concurrent requests in a single wave to `http://127.0.0.1:8080/healthz`
3. Ran a sustained concurrency test:
   - 10,000 total requests with concurrency set to 1,000
4. Used Python stdlib client (`urllib` + `ThreadPoolExecutor`) via:
   - `tests/performance/load_test_healthz.py`

## Results

### Burst (1,000 at once)
- Requests: 1,000
- Success: 1,000
- Failed: 0
- Total wall time: 1.093 s
- Throughput: 914.61 req/s
- Latency:
  - avg: 52.26 ms
  - p50: 50.40 ms
  - p95: 93.83 ms
  - p99: 120.65 ms
  - max: 167.32 ms

### Sustained (10,000 requests, concurrency 1,000)
- Requests: 10,000
- Success: 10,000
- Failed: 0
- Total wall time: 9.402 s
- Throughput: 1,063.56 req/s
- Latency:
  - avg: 75.51 ms
  - p50: 61.60 ms
  - p95: 184.11 ms
  - p99: 260.59 ms
  - max: 515.05 ms

## Conclusion
For the tested endpoint (`/healthz`), this environment handled 1,000 concurrent visitors with a 100% success rate during both burst and sustained runs.

## Caveats
- This validates a lightweight health endpoint, not full user journeys (auth, bookings, payments, DB-heavy paths).
- Database was not connected during this run; real-world performance may differ when MongoDB-backed routes are exercised.
- Application logs showed high warning volume from sanitization middleware during heavy GET traffic; this can add overhead under load.

## Repro
```bash
python tests/performance/load_test_healthz.py --url http://127.0.0.1:8080/healthz --concurrency 1000 --requests 1000
python tests/performance/load_test_healthz.py --url http://127.0.0.1:8080/healthz --concurrency 1000 --requests 10000
```
