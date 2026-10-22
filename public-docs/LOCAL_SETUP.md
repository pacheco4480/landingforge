# Local Setup

This guide explains how to run LandingForge locally.

## Requirements

- Node.js LTS
- npm
- PostgreSQL
- Git

Optional integrations:

- Supabase Storage
- Resend
- Cloudflare Turnstile
- Sentry

## Install Dependencies

```bash
npm install
```

## Environment Variables

Copy the example file:

```bash
cp .env.example .env.local
```

Fill only the values needed for your local setup.

Never commit `.env.local`.

## Database Setup

Configure:

```txt
DATABASE_URL
DIRECT_URL
```

Then run:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Start Development Server

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run build
```

When applicable:

```bash
npm run test
npx prisma validate
```

## Common Demo URLs

Public demo pages may include:

```txt
/real-estate-local-agency-demo
/real-estate-premium-demo
/clinic-modern-demo
/clinic-luxury-demo
/restaurant-fine-dining-demo
/restaurant-playful-demo
/bakery-playful-demo
/gym-modern-demo
```

Available demos depend on the current seed data. These are local development examples; they are not automatically approved for public portfolio or commercial claims.

The public portfolio catalogue is available at `/portfolio` when the database contains demos that satisfy publication rules.

