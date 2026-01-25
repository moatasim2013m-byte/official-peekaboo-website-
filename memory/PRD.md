# Peekaboo - Indoor Playground Web App PRD

## Project Overview
**Name:** Peekaboo  
**Type:** Indoor Playground Booking System  
**Created:** January 2026  

## Original Problem Statement
Web app for parents to:
1. Buy hourly tickets for specific time slots
2. Book birthday parties with themes
3. Buy subscriptions for savings

Admins fully manage bookings, content, and operations.

## User Personas

### Parent (Customer)
- Books hourly play sessions for children
- Plans birthday parties
- Purchases subscription packages
- Tracks loyalty points
- Views booking history and active sessions

### Admin
- Manages slots and capacity
- Manages pricing (hourly, themes, subscriptions)
- Manages 10 birthday themes
- Views and manages all bookings
- Adjusts loyalty points
- Manages homepage gallery

## Core Requirements (Locked)

### Authentication
- Email + password login
- Password reset via email (Resend)
- Persistent login sessions
- No phone OTP, no social login

### Hourly Tickets
- **Entry intervals:** Every 10 minutes (not hourly)
- **Session duration:** 60 minutes
- **Operating hours:** 10:00 AM - 12:00 AM midnight (last entry 11:50 PM)
- **Timezone:** Asia/Amman
- **Capacity:** Max 70 kids at any moment (across overlapping sessions)
- Booking cutoff: 30 minutes before slot start
- QR code for check-in
- Countdown starts when QR is scanned
- 5-minute in-app warning

### Birthday Parties
- **Duration:** 2 hours
- **Start times:** Every 2 hours (13:00, 15:00, 17:00, 19:00, 21:00, 23:00)
- **Operating window:** 1:00 PM - 12:00 AM midnight
- 10 standard themes (admin managed)
- Custom theme request form (no automatic pricing)
- Stripe Checkout payment
- **NO loyalty points** for birthday bookings

### Subscriptions
- Visit-based (3 packages)
- **Expiry:** 30 days from FIRST CHECK-IN (not purchase date)
- If never checked in, subscription remains pending
- Usage tied to child profile
- **NO loyalty points** for subscriptions

### Loyalty
- Fixed 10 points per paid order
- **ONLY for hourly tickets** (not birthday or subscriptions)
- Idempotent by payment_id
- Admin can manually adjust
- No rewards shop in MVP

## Tech Stack
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **Backend:** Node.js/Express (via Python wrapper for uvicorn compatibility)
- **Database:** MongoDB
- **Payments:** Stripe Checkout (test mode)
- **Emails:** Resend

## What's Been Implemented ✅

### Backend (Node.js/Express)
- [x] Auth routes (register, login, forgot-password, reset-password)
- [x] Unified TimeSlot model with slot_type (hourly/birthday)
- [x] Hourly booking with QR generation
- [x] Birthday booking with themes + custom requests
- [x] Subscription plans and purchases
- [x] Loyalty points (10 per order, idempotent)
- [x] Admin panel APIs
- [x] Stripe Checkout integration
- [x] Gallery management
- [x] Profile/children management

### Frontend (React)
- [x] Homepage with hero, features, gallery
- [x] Auth pages (login, register, forgot/reset password)
- [x] Tickets page with calendar and slot selection
- [x] Birthday page with themes and custom request tab
- [x] Subscriptions page with 3 packages
- [x] Parent profile with kids, bookings, sessions, loyalty
- [x] Reception scanner page
- [x] Admin panel (dashboard, bookings, themes, plans, gallery, settings)
- [x] Payment success/cancel pages

### Database Seed
- [x] Admin user (admin@peekaboo.com / admin123)
- [x] 10 birthday themes
- [x] 3 subscription plans
- [x] Default settings
- [x] Gallery media

## Prioritized Backlog

### P0 - Not Implemented (Out of Scope)
- WhatsApp messaging
- SMS OTP
- Automated refunds
- Loyalty rewards shop
- Multi-branch logic
- Mobile apps
- Analytics dashboards

### P1 - Future Enhancements
- Live payment mode (switch Stripe keys)
- Real email domain for Resend
- Multiple children per booking
- Birthday party deposit payments
- Custom theme pricing automation

### P2 - Nice to Have
- Email notifications for session ending
- Birthday reminders
- Referral program
- Gift cards

## API Endpoints

### Public
- GET /api/ - Health check
- GET /api/themes - Get all themes
- GET /api/subscriptions/plans - Get all plans
- GET /api/gallery - Get gallery media
- GET /api/slots/available - Get available slots

### Auth Required
- POST /api/auth/register, /login, /forgot-password, /reset-password
- GET /api/auth/me
- GET/POST /api/profile, /api/profile/children
- POST /api/bookings/hourly, /birthday, /birthday/custom
- GET /api/bookings/hourly, /birthday, /hourly/active
- POST /api/bookings/hourly/checkin
- POST /api/subscriptions/purchase, /consume
- GET /api/subscriptions/my
- GET /api/loyalty
- POST /api/payments/create-checkout
- GET /api/payments/status/:sessionId

### Admin Only
- GET /api/admin/dashboard, /users, /bookings/*, /subscriptions, /slots
- POST /api/admin/plans, /api/themes
- PUT /api/admin/settings, /plans/:id
- POST /api/loyalty/adjust

## Credentials
- **Admin:** admin@peekaboo.com / admin123
- **Stripe:** Test mode (sk_test_emergent)
- **Resend:** Via Emergent universal key

## Next Action Items
1. Test complete booking flow with Stripe
2. Add email verification for new registrations
3. Implement slot capacity management UI in admin
4. Add booking cancellation feature
5. Set up real email domain for production
