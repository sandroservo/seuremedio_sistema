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
