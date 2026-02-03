# Peekaboo - Deployment Ready PRD

## Project Status: ✅ DEPLOYMENT READY
**Domain**: peekaboojor.com  
**Target**: Google Cloud Run  
**Date**: February 2026

---

## Completed Features

### Customer Features
- ✅ Homepage with hero, services, gallery
- ✅ Hourly play booking (date/time/child selection)
- ✅ Birthday party booking (themes, guest count)
- ✅ Subscriptions purchase (3 tiers)
- ✅ Profile with children, bookings, loyalty points
- ✅ User registration/login

### Payment Methods
- ✅ **Card**: Stripe checkout redirect
- ✅ **Cash**: Direct booking → Confirmation page
- ✅ **CliQ**: Direct booking → Confirmation page + Bank info

### Admin/Staff Features
- ✅ Admin dashboard
- ✅ Staff check-in interface
- ✅ QR code scanning

---

## Technical Stack
- **Frontend**: React.js + Tailwind + Shadcn/UI
- **Backend**: Node.js/Express (FastAPI wrapper)
- **Database**: MongoDB
- **Payments**: Stripe
- **Email**: Resend

---

## Design System (FROZEN)
- Primary: #F1C40F (Yellow)
- Secondary: #FF6B9D (Pink)
- Background: #E8F6FF (Sky)
- Headings: Baloo Bhaijaan 2
- Body: Cairo
- Language: Arabic (RTL)

---

## Environment Variables Required

### Frontend
```
REACT_APP_BACKEND_URL=https://peekaboojor.com
```

### Backend
```
MONGO_URL=mongodb+srv://...
DB_NAME=peekaboo
JWT_SECRET=<secure-random-string>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
SENDER_EMAIL=noreply@peekaboojor.com
```

---

## Deployment Steps
1. Build frontend: `cd /app/frontend && yarn build`
2. Containerize with Dockerfile
3. Deploy to Google Cloud Run
4. Configure environment variables
5. Point DNS (peekaboojor.com) to Cloud Run
6. Enable HTTPS (automatic with Cloud Run)
7. Configure Stripe webhook endpoint
8. Final smoke test

---

## Backlog (Post-Launch)
- P1: Points Redemption Flow (QR code generation)
- P2: Groups booking page
- P2: Home Party page
- P3: Design iteration/polish
