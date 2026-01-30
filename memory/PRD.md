# Peekaboo Indoor Playground - Product Requirements Document

## Overview
A launch-ready web app for an indoor playground named "Peekaboo" in Jordan. The app allows parents to buy hourly tickets, book birthday parties, and purchase subscriptions. Admins and staff manage operations through dedicated panels.

## User Roles
- **Parent (Customer):** Books play sessions, parties, and subscriptions
- **Admin:** Full control over pricing, themes, subscriptions, and business rules
- **Staff:** Reception operations and check-in management

## Tech Stack
- **Frontend:** React with Tailwind CSS, Shadcn/UI components
- **Backend:** Node.js/Express (managed by Python wrapper)
- **Database:** MongoDB
- **Payments:** Stripe
- **Emails:** Resend

## Core Features (MVP)
1. **Hourly Tickets:** Parents select duration and time slot, QR code for check-in
2. **Birthday Parties:** Theme selection with admin-managed options, custom requests
3. **Subscriptions:** Visit-based packages with 30-day validity
4. **Loyalty Program:** Points awarded for purchases
5. **Admin Panel:** Full CRUD for themes, plans, pricing, gallery
6. **Staff Panel:** Reception with QR scanning for check-in

## Localization
- **Primary Language:** Arabic (RTL)
- **Direction:** Right-to-Left throughout the application

---

## Completed Work

### January 30, 2026 - UI/UX Polish (RTL Arabic)
**STATUS: COMPLETED**

Applied RTL Arabic localization and design tokens to all customer-facing pages:

**Files Changed:**
- `/app/frontend/src/pages/HomePage.js` - Full Arabic translation, RTL layout
- `/app/frontend/src/pages/TicketsPage.js` - RTL direction added
- `/app/frontend/src/pages/BirthdayPage.js` - Full Arabic translation, RTL layout
- `/app/frontend/src/pages/ProfilePage.js` - Full Arabic translation, RTL layout
- `/app/frontend/src/components/Navbar.js` - Arabic navigation, RTL direction
- `/app/frontend/src/components/Footer.js` - Arabic content, RTL layout, logo integration

**Key Changes:**
- All English text converted to Arabic
- RTL (`dir="rtl"`) applied to all page containers
- Icon positioning adjusted for RTL (ChevronRight rotated 180°)
- Navbar dropdown alignment changed from `align="end"` to `align="start"`
- Footer uses logo image instead of emoji

### Previous Completions
- Backend stability fixes
- Admin CRUD for Birthday Themes and Subscription Plans
- Image upload system (multer + sharp)
- Concurrent booking safety (atomic MongoDB checks)
- Separate staff/admin login page (`/staff/login`)
- Design token system in `index.css`
- Subscriptions and Reception page UI polish

---

## Upcoming Tasks (P1)

### Multi-Child Booking ✅ COMPLETED
Allow parents to book tickets for multiple children in a single transaction.
- **Files:** `/app/frontend/src/pages/TicketsPage.js`, `/app/backend/node-app/routes/bookings.js`, `/app/backend/node-app/routes/payments.js`
- **Implementation:**
  - Checkbox-based multi-select for children
  - Atomic capacity check for all children
  - Price multiplied by child count
  - Each child gets separate booking record with QR code

### Profile Page - Active Session Countdown
Display live countdown timer for children's play sessions.
- **File:** `/app/frontend/src/pages/ProfilePage.js`
- **Scope:** UI timer component with real-time updates

---

## Future Tasks (P2)

1. **Complete Global Arabic Localization** - Remaining admin panel text
2. **Add Language Toggle** - UI switch for Arabic/English
3. **Create Staff Test Checklist** - 8-step verification guide

---

## Test Credentials
- **Admin:** `admin@peekaboo.com` / `admin123` (via `/staff/login`)
- **Staff:** `staff@peekaboo.com` / `staff123` (via `/staff/login`)
- **Parent:** Register new user via signup page

---

## Architecture Notes
- Admin panel intentionally kept in bilingual English/Arabic for staff usability
- Design tokens defined in `/app/frontend/src/index.css`
- Image uploads stored in `/app/backend/node-app/uploads/`
- Atomic MongoDB updates prevent race conditions in booking
