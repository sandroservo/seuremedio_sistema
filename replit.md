# Seu Remédio Delivery

A medication delivery application built with Next.js and Prisma.

## Overview

This is a pharmacy delivery platform that allows customers to browse medications, place orders, and track deliveries. It includes user authentication, order management, and delivery tracking features.

## Project Architecture

- **Frontend**: Next.js 16 with React 19, Tailwind CSS, and Radix UI components
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Prisma adapter

## Key Files

- `app/` - Next.js app router pages and API routes
- `components/` - Reusable React components
- `lib/` - Utility functions (prisma.ts, auth.ts, api.ts)
- `prisma/schema.prisma` - Database schema
- `hooks/` - Custom React hooks

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `NEXTAUTH_SECRET` - Secret for NextAuth.js session encryption
- `NEXTAUTH_URL` - Base URL for NextAuth.js callbacks

## Development

The development server runs on port 5000:

```bash
npm run dev -- -p 5000 -H 0.0.0.0
```

## Database Commands

- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed the database
- `npm run db:studio` - Open Prisma Studio

## User Roles

- `CLIENT` - Regular customers who can browse and order
- `ADMIN` - Administrators who manage medications and orders
- `DELIVERY` - Delivery personnel who handle order delivery

## Payment Integration (Asaas)

The platform integrates with Asaas payment gateway for processing PIX and Boleto payments.

### Payment Flow

1. Customer selects payment method (PIX, Boleto, or Cash on Delivery)
2. Order is created with status `PENDING` and `paymentStatus = PENDING`
3. For online payments, Asaas webhook updates `paymentStatus` to `CONFIRMED` when payment is received
4. Admin can only approve orders (change to `CONFIRMED`) when:
   - `paymentStatus = CONFIRMED` for online payments, OR
   - No `paymentId` exists (cash on delivery)
5. Order follows state machine: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED

### Key Payment Files

- `lib/asaas.ts` - Asaas API integration functions
- `app/api/payments/route.ts` - Payment creation API
- `app/api/webhooks/asaas/route.ts` - Webhook to receive payment confirmations
- `app/api/orders/[id]/route.ts` - Order status updates with payment validation

### Webhook URL

Configure in Asaas dashboard: `https://[your-domain]/api/webhooks/asaas`

### Settings

Configure Asaas API key in Admin Dashboard → Settings:
- `asaas_api_key` - Your Asaas API key
- `asaas_environment` - `sandbox` or `production`

## Banner Management

Admins can manage the promotional slideshow banners displayed on the client dashboard.

### Banner Model

Each banner has:
- `title` - Main title text
- `subtitle` - Secondary text
- `discount` - Discount value or special offer (e.g., "20" for 20% or "Grátis")
- `bgColor` - Tailwind gradient class (e.g., "from-amber-50 to-orange-50")
- `borderColor` - Tailwind border class (e.g., "border-amber-100")
- `image` - URL to banner image
- `active` - Whether the banner is visible
- `order` - Display order (lower numbers appear first)

### Admin Interface

Access via Admin Dashboard → Banners tab to:
- Create new banners
- Edit existing banners
- Toggle active/inactive status
- Reorder banners
- Delete banners

### API Endpoints

- `GET /api/banners` - Returns active banners (or all for admin with `?all=true`)
- `POST /api/banners` - Create new banner (admin only)
- `PUT /api/banners/[id]` - Update banner (admin only)
- `DELETE /api/banners/[id]` - Delete banner (admin only)
