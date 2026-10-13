# LEV3L Barbers — Website

The customer website and admin dashboard for **LEV3L Barbers**, a working barbershop. Live at **[lev3lbarbers.com](https://www.lev3lbarbers.com)**.

This is one part of a three-part system I designed and built end to end:

| Part | Stack | Repo |
| --- | --- | --- |
| Website + admin dashboard | React, Vite, styled-components | this repo |
| Mobile app (iOS + Android) | React Native, Expo | [lev3lbarbers-app](https://github.com/lyssandraa/lev3lbarbers-app) |
| REST API | Node.js, Express, Prisma, PostgreSQL | private (production backend) |

## What it does

**For customers**
- Browse services and prices, and book appointments against each barber's real availability
- Online shop and gift cards with **Stripe** checkout
- Digital loyalty card: earn stamps, unlock rewards, referral and birthday bonuses
- "What's On" news posts, gallery, contact info and live open/closed status
- Accounts with email verification, password reset and self-service account deletion

**For staff (admin dashboard)**
- Manage bookings, barbers' working hours, services and shop products (drag-and-drop ordering)
- Run promotions: promo codes, site banners, homepage hero slideshow
- Configure the loyalty programme: stamp rules, reward pool, expiry settings
- Gift card and order management, customer accounts, newsletter composer
- Rich-text editor for legal pages (terms, privacy notice)

## Tech

- **React 19 + Vite**, React Router with lazy-loaded pages
- **styled-components** for theming
- **Stripe Elements** for payments
- **TipTap** rich-text editor, **dnd-kit** drag-and-drop, QR code generation and scanning
- JWT auth against the Express API

## Running locally

```bash
cd LEV3LBARBERS
npm install
npm run dev
```

Create `LEV3LBARBERS/.env` with:

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL of the backend API |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
