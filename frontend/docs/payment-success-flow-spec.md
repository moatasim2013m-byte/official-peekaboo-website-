# Payment Success Frontend State Machine (Arabic / RTL)

This page documents the client flow for `/payment/success` after returning from the card gateway.

## Source of truth
- The backend endpoint `POST /api/payments/finalize/:sessionId` is the only authority for whether a booking/subscription was actually created.
- Frontend must never mark booking success without a `200` finalize response.

## State machine

| State | Meaning | Entry trigger | Exit trigger | UX copy |
|---|---|---|---|---|
| `loading` | Authentication/session bootstrapping | Page opened, auth still loading | Auth ready | "جاري تجهيز التحقق من حالة العملية..." |
| `processing` | Finalization in progress on backend | Auto finalize attempt starts | 200 success OR retry/failure state | "جاري تأكيد الحجز مع الخادم..." |
| `success` | Backend finalized and returned booking/subscription result | `POST /api/payments/finalize/:id` returns 200 | Redirect to `/booking-confirmation` | N/A (immediate redirect) |
| `retry_ready` | Backend says processing/pending (`202/409`) after auto retries | Auto retries exhausted with 202/409 | User clicks retry OR leaves page | "الدفع ناجح، وما زال الحجز قيد الإنهاء. أعد المحاولة بعد ثوانٍ." |
| `failure` | Finalization failed (422/4xx/5xx except pending statuses) | finalize returns fatal error | User retries manually | "حدث خطأ أثناء المطابقة النهائية مع الخادم." |

## Retry policy
- Auto retry: 6 attempts, 1200ms interval, for backend pending statuses (`202`, `409`) only.
- Manual retry: single attempt on button click to avoid client-side request storms when users tap repeatedly.
- Duplicate return hits and refresh/back are safe because backend finalization is idempotent and guarded by its own lock/result cache.

## Local storage behavior
- `localStorage` is best-effort only for confirmation page refresh continuity.
- All local storage reads/writes are wrapped with `try/catch` to support Safari private mode and blocked storage environments.
- If storage is unavailable or stale, frontend still relies on backend finalization response and never fabricates a success state.

## UX goals covered
- Arabic-first, RTL status and error messaging.
- Clear distinction between pending processing vs terminal failure.
- User gets actionable retry path without losing order ID context.
