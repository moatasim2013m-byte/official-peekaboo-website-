# CyberSource REST (Capital Bank) - Node.js Integration

## Environment variables
Set on Cloud Run backend and redeploy after any change:

- `PAYMENT_PROVIDER=capital_bank_rest`
- `CAPITAL_BANK_MERCHANT_ID=903897720102`
- `CAPITAL_BANK_ACCESS_KEY=<bank access key>`
- `CAPITAL_BANK_SECRET_KEY=<bank secret key>`
- `CAPITAL_BANK_PAYMENT_ENDPOINT=https://apitest.cybersource.com`
- `CYBERSOURCE_ENV=test`
- `CAPITAL_BANK_LOCALE=ar`
- `CAPITAL_BANK_CURRENCY=JOD`

> REST integration does **not** use `profile`.

## Implemented API flow
1. Client creates pending order transaction via existing checkout flow.
2. Client calls `POST /api/payments/capital-bank/initiate` with `orderId` and card payload/token.
3. Backend reads amount from `PaymentTransaction` only.
4. Backend signs REST request headers (`v-c-merchant-id`, `Date`, `Host`, `Digest`, `Signature`) and calls:
   - `POST https://apitest.cybersource.com/pts/v2/payments`
5. Backend validates response, performs atomic idempotent update, and returns decision/result.
6. Callback endpoints:
   - `POST /api/payments/capital-bank/return`
   - `POST /api/payments/capital-bank/notify`

## Security controls
- Secret key never logged.
- Amount sourced from DB transaction only.
- HTTPS enforced on Capital Bank endpoints.
- CSRF token required on initiation endpoint.
- Idempotency guard via `metadata.processed_transaction_ids`.
- Global clickjacking headers remain enabled (`X-Frame-Options`, CSP frame-ancestors).
