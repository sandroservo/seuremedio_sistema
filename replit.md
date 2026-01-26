# Seu Remédio Delivery

A multi-pharmacy medication delivery platform built with Next.js and Prisma.

## Overview

This is a multi-tenant pharmacy delivery platform where multiple pharmacies can operate with their own catalog, admin team, and delivery personnel. Customers can browse medications from different pharmacies, place orders, and track deliveries in real-time.

## Multi-Pharmacy Architecture

- **Super Admin**: Manages all pharmacies, can create/edit/delete pharmacies
- **Pharmacy Admin**: Manages their pharmacy's catalog, orders, and staff
- **Pharmacy Delivery**: Handles deliveries for their assigned pharmacy
- **Client**: Can browse all active pharmacies and place orders

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

- `CLIENT` - Regular customers who can browse and order from any pharmacy
- `ADMIN` - Pharmacy administrators who manage their pharmacy's medications and orders
- `DELIVERY` - Delivery personnel who handle order delivery for their pharmacy
- `SUPER_ADMIN` - Platform managers who oversee all pharmacies

## Pharmacy Model

Each pharmacy has:
- `name` - Display name
- `slug` - URL-friendly identifier
- `description` - About the pharmacy
- `logo` - Brand image
- `address` - Physical location
- `phone` - Contact number
- `email` - Contact email
- `active` - Whether visible to customers

### API Endpoints

- `GET /api/pharmacies` - List all pharmacies
- `POST /api/pharmacies` - Create new pharmacy (Super Admin)
- `PUT /api/pharmacies/[id]` - Update pharmacy (Super Admin)
- `DELETE /api/pharmacies/[id]` - Delete pharmacy (Super Admin)
- `GET /api/pharmacies/[id]/users` - List pharmacy staff
- `POST /api/pharmacies/[id]/users` - Add user to pharmacy

## Payment Integration (Asaas)

The platform integrates with Asaas payment gateway for processing PIX and Boleto payments.

### Payment Flow

1. Customer selects payment method (PIX, Credit Card, or Cash on Delivery)
2. Order is created with status `PENDING` and `paymentStatus = PENDING`
3. Payment confirmation:
   - **Online payments (PIX, Credit Card)**: Asaas webhook updates `paymentStatus` to `CONFIRMED` automatically
   - **Cash payments**: Payment is confirmed by delivery personnel at time of delivery
4. Admin approves orders:
   - For online payments: requires `paymentStatus = CONFIRMED`
   - For cash payments: can approve without prior payment confirmation
5. Order follows state machine: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED

### Cash Payment Flow

For orders with cash payment method:
1. Order appears in admin dashboard with amber "Pagamento em dinheiro" banner
2. Admin approves order for delivery (no payment confirmation needed)
3. Order is assigned to delivery personnel and status changes to SHIPPED
4. Delivery person receives cash from customer
5. Delivery person clicks "Receber Dinheiro e Finalizar" button in their dashboard
6. System updates `paymentStatus` to `CONFIRMED` and order status to `DELIVERED`

### Key Payment Files

- `lib/asaas.ts` - Asaas API integration functions
- `app/api/payments/route.ts` - Payment creation API
- `app/api/webhooks/asaas/route.ts` - Webhook to receive payment confirmations
- `app/api/orders/[id]/route.ts` - Order status updates with payment validation
- `app/api/orders/[id]/confirm-payment/route.ts` - Endpoint for delivery personnel to confirm cash payments

### Webhook URL

Configure in Asaas dashboard: `https://[your-domain]/api/webhooks/asaas`

### Settings

Configure Asaas API key in Admin Dashboard → Settings:
- `asaas_api_key` - Your Asaas API key
- `asaas_environment` - `sandbox` or `production`

## Real-Time Map Tracking

The platform features real-time delivery tracking with animated map visualization.

### Features

- **Animated Markers**: Delivery person marker moves smoothly on the map
- **5-Second Updates**: Location refreshes automatically every 5 seconds
- **Distance & Time Display**: Shows remaining distance (km/m) and estimated time
- **Follow Mode**: Toggle to follow the delivery person on the map
- **Last Update Indicator**: Shows when the location was last updated
- **Manual Refresh**: Click to manually refresh the location

### How It Works

1. Delivery person's app sends GPS coordinates via `watchPosition`
2. Coordinates are sent to `/api/deliveries/[id]/location` (PUT)
3. Customer's tracking page polls `/api/deliveries/[id]/location` (GET) every 5 seconds
4. Map animates the marker transition smoothly between positions

### Key Files

- `components/delivery-map.tsx` - Map component with animated markers and distance calculation
- `app/client/rastreamento/[id]/page.tsx` - Customer tracking page
- `app/api/deliveries/[id]/location/route.ts` - API for location updates
- `components/delivery-dashboard.tsx` - Delivery person dashboard with GPS tracking

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
