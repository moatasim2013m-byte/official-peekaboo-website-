import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'https://peekaboojor.com').replace(/\/$/, '');
const STAFF_EMAIL = __ENV.STAFF_EMAIL;
const STAFF_PASSWORD = __ENV.STAFF_PASSWORD;
const CHECKIN_WRITE = String(__ENV.CHECKIN_WRITE || 'false').toLowerCase() === 'true';
const TIMEOUT = __ENV.TIMEOUT || '30s';

export const options = {
  scenarios: {
    checkin_capacity: {
      executor: 'ramping-vus',
      startVUs: Number(__ENV.START_VUS || 1),
      stages: [
        { duration: __ENV.STAGE_1_DURATION || '2m', target: Number(__ENV.STAGE_1_TARGET || 20) },
        { duration: __ENV.STAGE_2_DURATION || '6m', target: Number(__ENV.STAGE_2_TARGET || 20) },
        { duration: __ENV.STAGE_3_DURATION || '2m', target: Number(__ENV.STAGE_3_TARGET || 0) },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1200', 'p(99)<2500'],
    checkin_flow_success_rate: ['rate>0.98'],
  },
};

const flowSuccessRate = new Rate('checkin_flow_success_rate');
const loginDuration = new Trend('checkin_login_duration', true);
const pendingDuration = new Trend('checkin_pending_duration', true);
const checkinDuration = new Trend('checkin_write_duration', true);
const checkinsAttempted = new Counter('checkin_write_attempted');
const checkinsSucceeded = new Counter('checkin_write_succeeded');

export function setup() {
  if (!STAFF_EMAIL || !STAFF_PASSWORD) {
    throw new Error('Missing STAFF_EMAIL or STAFF_PASSWORD env vars');
  }

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: STAFF_EMAIL, password: STAFF_PASSWORD }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: TIMEOUT,
      tags: { endpoint: 'auth_login' },
    }
  );

  loginDuration.add(loginRes.timings.duration);

  const loginOk = check(loginRes, {
    'setup login status 200': (r) => r.status === 200,
    'setup login has token': (r) => {
      try {
        return !!r.json('token');
      } catch (_) {
        return false;
      }
    },
  });

  if (!loginOk) {
    throw new Error(`Setup login failed. status=${loginRes.status} body=${loginRes.body}`);
  }

  return { token: loginRes.json('token') };
}

export default function (data) {
  const authHeaders = {
    Authorization: `Bearer ${data.token}`,
    Accept: 'application/json',
  };

  const pendingRes = http.get(`${BASE_URL}/api/staff/pending-checkins`, {
    headers: authHeaders,
    timeout: TIMEOUT,
    tags: { endpoint: 'staff_pending_checkins' },
  });

  pendingDuration.add(pendingRes.timings.duration);

  const pendingOk = check(pendingRes, {
    'pending-checkins status 200': (r) => r.status === 200,
    'pending-checkins has bookings array': (r) => {
      try {
        const bookings = r.json('bookings');
        return Array.isArray(bookings);
      } catch (_) {
        return false;
      }
    },
  });

  let flowOk = pendingOk;

  if (pendingOk && CHECKIN_WRITE) {
    const bookings = pendingRes.json('bookings') || [];

    if (bookings.length > 0 && bookings[0].booking_code) {
      checkinsAttempted.add(1);

      const writeRes = http.post(
        `${BASE_URL}/api/staff/checkin`,
        JSON.stringify({ booking_code: bookings[0].booking_code }),
        {
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          timeout: TIMEOUT,
          tags: { endpoint: 'staff_checkin' },
        }
      );

      checkinDuration.add(writeRes.timings.duration);

      const writeOk = check(writeRes, {
        'checkin write status 200|400|404': (r) => [200, 400, 404].includes(r.status),
      });

      if (writeRes.status === 200) {
        checkinsSucceeded.add(1);
      }

      flowOk = flowOk && writeOk;
    }
  }

  flowSuccessRate.add(flowOk);
  sleep(Number(__ENV.SLEEP_SECONDS || 0.5));
}
