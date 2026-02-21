# CyberSource Hosted Secure Acceptance (Capital Bank) - Node.js Integration

## Environment variables
Set on Cloud Run backend and redeploy after any change:

- `PAYMENT_PROVIDER=capital_bank`
- `CAPITAL_BANK_PROFILE_ID=<bank profile id>`
- `CAPITAL_BANK_ACCESS_KEY=<bank access key>`
- `CAPITAL_BANK_SECRET_KEY=<bank secret key>`
- `CAPITAL_BANK_PAYMENT_ENDPOINT=https://testsecureacceptance.cybersource.com/pay`
- `CAPITAL_BANK_LOCALE=ar`
- `CAPITAL_BANK_CURRENCY=JOD`

## Implemented API flow
1. Client creates pending order transaction via existing checkout flow.
2. Frontend redirects to `GET /api/payments/capital-bank/secure-acceptance/form/:sessionId`.
3. Backend reads amount from `PaymentTransaction` only.
4. Backend signs the 10 required SA fields and renders auto-submit hosted form.
5. Callback endpoints:
   - `POST /api/payments/capital-bank/secure-acceptance/response`
   - `POST /api/payments/capital-bank/secure-acceptance/cancel`
   - `POST /api/payments/capital-bank/secure-acceptance/notify`

## Security controls
- Secret key never logged.
- Amount sourced from DB transaction only.
- Signature verified before any transaction update.
- HTTPS enforced on Capital Bank endpoints.
- Idempotency guard via `metadata.processed_transaction_ids` for notifications.
- Global clickjacking headers remain enabled (`X-Frame-Options`, CSP frame-ancestors).
