# official-peekaboo-website-
Official Peekaboo indoor playground website source code

## Payment Gateway Readiness (Capital Bank Jordan)

The backend supports a `PAYMENT_PROVIDER` switch with these options:

- `manual` (default): cash / CliQ flow
- `capital_bank`: Capital Bank CyberSource Hosted Secure Acceptance

### Capital Bank environment variables

Set the following in your backend runtime environment:

- `PAYMENT_PROVIDER=capital_bank`
- `CAPITAL_BANK_PROFILE_ID`
- `CAPITAL_BANK_ACCESS_KEY`
- `CAPITAL_BANK_SECRET_KEY`
- `CAPITAL_BANK_PAYMENT_ENDPOINT` (optional; defaults to `https://testsecureacceptance.cybersource.com/pay`)

### Capital Bank flow implemented

1. Frontend calls `POST /api/payments/create-checkout`.
2. Backend computes booking amount on server side and creates a pending transaction.
3. Frontend redirects to `/api/payments/capital-bank/secure-acceptance/form/:sessionId`.
4. Backend signs Hosted Secure Acceptance fields and returns an auto-submit HTML form to CyberSource.
5. Callback endpoints update transactions atomically and redirect via:
   - `POST /api/payments/capital-bank/secure-acceptance/response`
   - `POST /api/payments/capital-bank/secure-acceptance/cancel`
   - `POST /api/payments/capital-bank/secure-acceptance/notify`
