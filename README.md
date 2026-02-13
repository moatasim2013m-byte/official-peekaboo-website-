# official-peekaboo-website-
Official Peekaboo indoor playground website source code

## Payment Gateway Readiness (Capital Bank Jordan)

The backend now supports pluggable payment providers with a `PAYMENT_PROVIDER` switch:

- `manual` (default): cash / CliQ flow
- `stripe`: hosted Stripe checkout (requires `STRIPE_SECRET_KEY`)
- `capital_bank`: Capital Bank hosted-checkout preparation (Jordan)

### Capital Bank environment variables

Set the following in your backend runtime environment:

- `PAYMENT_PROVIDER=capital_bank`
- `CAPITAL_BANK_MERCHANT_ID`
- `CAPITAL_BANK_TERMINAL_ID`
- `CAPITAL_BANK_API_KEY`
- `CAPITAL_BANK_HOSTED_CHECKOUT_URL`
- `CAPITAL_BANK_CALLBACK_SECRET` (optional but recommended for callback signature verification)

### Capital Bank flow implemented

1. Frontend calls `POST /api/payments/create-checkout`.
2. Backend computes booking amount on server side and creates a pending transaction.
3. Backend returns a hosted checkout URL for Capital Bank with signed parameters.
4. Bank callback can be handled by `POST /api/payments/capital-bank/callback` to finalize payment state (`paid` / `failed`).
5. Frontend can poll `GET /api/payments/status/:sessionId` for status updates.

### Important bank-specific mapping step

Capital Bank gateways can differ by field names/signature format. You may need to adjust:

- query/body field names in `backend/node-app/routes/payments.js`
- signature seed format
- callback payload verification rules

This structure is now ready for your bank sandbox/production credentials and final field mapping.
