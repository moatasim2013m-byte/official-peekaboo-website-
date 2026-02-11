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
- ✅ Morning/Afternoon booking modes with distinct pricing
- ✅ Policy pages (Terms, Privacy, Refund)
- ✅ Payment card icons and trust badges

### Payment Methods
- ✅ **Card**: Stripe checkout redirect
- ✅ **Cash**: Direct booking → Confirmation page
- ✅ **CliQ**: Direct booking → Confirmation page + Bank info

### Admin/Staff Features
- ✅ Admin dashboard
- ✅ Staff check-in interface
- ✅ QR code scanning

### UI/UX (Feb 2026 Redesign)
- ✅ Wonderland-inspired sky theme with fluffy clouds and floating balloons
- ✅ Cleaner navbar with glass-morphism effect
- ✅ Rounded cards with colorful icon badges
- ✅ Improved hero section with better whitespace
- ✅ Consistent section containers with soft pastel backgrounds
- ✅ Mobile-responsive design with RTL support
- ✅ PublicPageShell component for consistent informational page layouts
- ✅ Themed informational pages (About, FAQ, Contact, Rules, Pricing)

---

## Technical Stack
- **Frontend**: React.js + Tailwind + Shadcn/UI
- **Backend**: Node.js/Express (FastAPI wrapper)
- **Database**: MongoDB
- **Payments**: Stripe
- **Email**: Resend

---

## Design System (Updated Feb 2026)
- Primary Red: #FF4757
- Yellow: #FFD93D
- Blue: #45AAF2
- Green: #26DE81
- Orange: #FF9F43
- Pink: #FF6B9D
- Sky Background: #87CEEB → #FFF8E7 gradient
- Headings: Baloo Bhaijaan 2
- Body: Cairo
- Language: Arabic (RTL)
- Border Radius: 24px-40px (rounded, playful)

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
- P1: Add "ذو الهمم" (People of Determination) service item
- P2: Groups booking page
- P2: Home Party page
- P3: Resolve ESLint dependency warnings properly
