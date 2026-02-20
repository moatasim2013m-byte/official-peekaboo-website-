# official-peekaboo-website-
Official Peekaboo indoor playground website source code

## Payment Gateway Readiness (Capital Bank Jordan)

The backend supports a `PAYMENT_PROVIDER` switch with these options:

- `manual` (default): cash / CliQ flow
- `capital_bank`: Capital Bank Secure Acceptance hosted checkout

### Capital Bank environment variables

Set the following in your backend runtime environment:

- `PAYMENT_PROVIDER=capital_bank`
- `CAPITAL_BANK_ACCESS_KEY`
- `CAPITAL_BANK_PROFILE_ID`
- `CAPITAL_BANK_SECRET_KEY`
- `CAPITAL_BANK_PAYMENT_ENDPOINT` (optional; defaults to `https://testsecureacceptance.cybersource.com/pay`)

### Capital Bank flow implemented

1. Frontend calls `POST /api/payments/create-checkout`.
2. Backend computes booking amount on server side and creates a pending transaction.
3. Backend returns a hosted checkout URL for Capital Bank with signed parameters.
4. Backend processes Secure Acceptance responses via:
   - `POST /api/payments/capital-bank/secure-acceptance/response`
   - `POST /api/payments/capital-bank/secure-acceptance/cancel`
   - `POST /api/payments/capital-bank/secure-acceptance/notify`
5. Frontend can poll `GET /api/payments/status/:sessionId` for status updates.
