# CyberSource REST API (Capital Bank) - Node.js Integration

## Environment variables
Set on Cloud Run backend and redeploy after any change:

- `PAYMENT_PROVIDER=capital_bank_rest`
- `CAPITAL_BANK_MERCHANT_ID=903897720102`
- `CAPITAL_BANK_ACCESS_KEY=<bank access key>`
- `CAPITAL_BANK_SECRET_KEY=<bank secret key from Secret Manager>`
- `CAPITAL_BANK_SECRET_KEY_ENCODING=base64` (optional; defaults to auto-detect base64, fallback utf8. Use `hex` only if bank explicitly provided hex secret)
- `CAPITAL_BANK_PAYMENT_ENDPOINT=https://apitest.cybersource.com` (optional explicit override; defaults to test if omitted)
- During current test phase, keep endpoint on `https://apitest.cybersource.com`. Switch to `https://api.cybersource.com` only after go-live approval.

## Implemented API flow
1. Client creates pending order transaction via existing checkout flow.
2. Frontend opens `/payment/capital-bank/:sessionId` and submits card details to `POST /api/payments/capital-bank/initiate`.
3. Backend reads amount from `PaymentTransaction` only and builds `POST /pts/v2/payments` request.
4. Backend signs each request with HTTP Signature headers (`host`, `date`, `request-target`, `v-c-merchant-id`, `digest`).
5. Backend updates payment status on API response and processes asynchronous `POST /api/payments/capital-bank/notify` callbacks idempotently.

## Security controls
- Secret key never logged.
- Amount sourced from DB transaction only.
- Card data is not stored.
- HTTPS enforced on Capital Bank endpoints.
- Idempotency guard via `metadata.processed_transaction_ids` for notifications.
- Global clickjacking headers remain enabled (`X-Frame-Options`, CSP frame-ancestors).
