# CyberSource Secure Acceptance (Capital Bank) - Node.js Integration

## Stack in this repository
- Backend: **Node.js + Express** (`backend/node-app`)
- Frontend: React (CRACO) (`frontend/`)

## Environment variables
Set these on the backend service:

- `PAYMENT_PROVIDER=capital_bank`
- `CAPITAL_BANK_ACCESS_KEY` (or `CYBERSOURCE_ACCESS_KEY`)
- `CAPITAL_BANK_PROFILE_ID` (or `CYBERSOURCE_PROFILE_ID`)
- `CAPITAL_BANK_SECRET_KEY` (or `CYBERSOURCE_SECRET_KEY`)
- Optional:
  - `CAPITAL_BANK_TRANSACTION_TYPE` (default: `sale`)
  - `CAPITAL_BANK_LOCALE` (default: `ar`)
  - `CAPITAL_BANK_PAYMENT_ENDPOINT` (default test endpoint)

## Implemented flow
1. Client calls `POST /api/payments/create-checkout`.
2. Server calculates trusted amount and signs CyberSource fields with HMAC-SHA256.
3. Server stores signed payload in `PaymentTransaction.metadata.cybersource` and returns:
   - `/api/payments/capital-bank/secure-acceptance/form/:sessionId`
4. Browser loads that server-side page; the page auto-submits a hidden HTTPS `POST` form to CyberSource `/pay`.
5. CyberSource posts back to:
   - Browser return: `POST /api/payments/capital-bank/secure-acceptance/response`
   - Backup notification: `POST /api/payments/capital-bank/secure-acceptance/notify`
6. Server validates response signature from `signed_field_names` only; invalid signatures are rejected.

## Signed request fields
The server signs these fields:

`access_key, profile_id, transaction_uuid, signed_date_time, signed_field_names, reference_number, transaction_type, amount, currency, locale`

## Security controls
- Secret key is server-side only.
- Signature validation uses a timing-safe compare.
- Only fields listed in `signed_field_names` are trusted.
- Checkout handoff page has clickjacking headers:
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy: frame-ancestors 'none'`
