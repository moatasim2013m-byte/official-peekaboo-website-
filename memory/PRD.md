# Peekaboo Kids Indoor Playground - PRD

## Project Overview
**Domain**: peekaboojor.com  
**Brand**: Peekaboo  
**Language**: Arabic (RTL-first)  
**Target**: Parents of children aged 1-8 years in Jordan

## Core Features

### Customer-Facing Pages
1. **Homepage** - Hero, services overview, gallery
2. **Hourly Play Booking** (`/tickets`) - Date, time slot, child selection, payment
3. **Birthday Party Booking** (`/birthday`) - Date, theme, guest count, payment
4. **Subscriptions** (`/subscriptions`) - Plan cards (5/10/15 visits), purchase
5. **Profile** (`/profile`) - Children, bookings history, loyalty points
6. **Auth** (`/login`, `/register`) - User authentication

### Payment Methods
- **Card**: Stripe checkout redirect
- **Cash**: Direct booking → Confirmation page → Pay at reception
- **CliQ**: Direct booking → Confirmation page → Bank transfer info (Peekaboo1, Housing Bank)

### Admin/Staff Pages
- Admin dashboard for managing slots, themes, bookings
- Staff check-in interface

## Technical Stack
- **Frontend**: React.js + Tailwind CSS + Shadcn/UI
- **Backend**: Node.js/Express (via FastAPI wrapper)
- **Database**: MongoDB
- **Payments**: Stripe
- **Email**: Resend

## Design System (FROZEN)
- **Primary Yellow**: #F1C40F
- **Secondary Pink**: #FF6B9D
- **Sky Background**: #E8F6FF
- **Headings**: Baloo Bhaijaan 2
- **Body**: Cairo
- **Cards**: Rounded 24-32px, soft blue shadows

## Completed Work (Feb 2026)
- ✅ Full visual overhaul matching mywonderland.co.nz quality
- ✅ Payment method-dependent flow (Cash/CliQ no Stripe redirect)
- ✅ Booking confirmation page with CliQ transfer details
- ✅ Arabic email templates with payment status
- ✅ Loyalty program UI in profile
- ✅ Subscription days rule badges
- ✅ Section containers with visual rhythm
- ✅ Hero image fallback with object-contain

## Deployment Status
- **Environment**: Ready for Google Cloud Run
- **Domain**: peekaboojor.com (via Google Domains/Squarespace)
- **Blockers Fixed**: JWT security, DB query optimization

## Backlog (P2+)
- Points Redemption Flow (QR code generation)
- Groups booking page (functional)
- Home Party page (functional)
