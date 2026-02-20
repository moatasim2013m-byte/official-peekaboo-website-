# official-peekaboo-website-
Official Peekaboo indoor playground website source code

## Payment Gateway Readiness (Capital Bank Jordan)

The backend supports a `PAYMENT_PROVIDER` switch with these options:

- `manual` (default): cash / CliQ flow
- `capital_bank_rest`: Capital Bank CyberSource REST payments

### Capital Bank environment variables

Set the following in your backend runtime environment:

- `PAYMENT_PROVIDER=capital_bank_rest`
- `CAPITAL_BANK_MERCHANT_ID`
- `CAPITAL_BANK_ACCESS_KEY`
- `CAPITAL_BANK_SECRET_KEY`
- `CAPITAL_BANK_PAYMENT_ENDPOINT` (optional; defaults to `https://apitest.cybersource.com`)

### Capital Bank flow implemented

1. Frontend calls `POST /api/payments/create-checkout`.
2. Backend computes booking amount on server side and creates a pending transaction.
3. Frontend calls `POST /api/payments/capital-bank/initiate` with `orderId` (amount is always loaded from DB).
4. Backend signs REST headers and calls `POST /pts/v2/payments` on CyberSource test endpoint.
5. Backend updates transaction atomically and handles callbacks via:
   - `POST /api/payments/capital-bank/return`
   - `POST /api/payments/capital-bank/notify`
