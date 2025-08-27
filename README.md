# Instant Quote

A Next.js application providing instant manufacturing quotes. This guide covers local development, database setup, testing, and deployment.

## Local Development

Requirements:

- Node.js 22 (see `.nvmrc`)
- npm
- PostgreSQL client (`psql`) for applying SQL

Clone and start:

```bash
npm install
cp .env.example .env.local
# fill in values
npm run db:apply
npm run db:seed
npm run dev
```

## Environment Variables

| Variable | Required | Description |
| --- | :---: | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | Supabase public anon key |
| `SUPABASE_URL` | ✓ | Supabase project URL for server usage |
| `SUPABASE_ANON_KEY` | ✓ | Supabase anon key for server usage |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | Supabase service role key used for server and seeding |
| `SUPABASE_DB_URL` | ✓ | Direct Postgres connection string for `db:apply` |
| `STRIPE_SECRET_KEY` |  | Stripe secret key (payments currently stubbed) |
| `STRIPE_WEBHOOK_SECRET` |  | Stripe webhook secret |
| `EMAIL_FROM` |  | Sender email address for notifications |
| `RESEND_API_KEY` |  | Resend API key |
| `PAYPAL_CLIENT_ID` |  | PayPal client ID (payments currently stubbed) |
| `PAYPAL_SECRET` |  | PayPal secret |
| `DEMO_MODE` |  | When set, disables external integrations and seeds demo data |

## Vercel Environments

| Vercel context | Env file | Notes |
| --- | --- | --- |
| Development | `.env.local` | Used for `next dev` and `vercel dev` |
| Preview | `.env.preview` | Automatically applied to preview deployments |
| Production | `.env.production` | Used for production deployments |

Set `DEMO_MODE=true` in any environment to run without external side effects.

## Database

Apply schema and policies to Supabase:

```bash
export SUPABASE_DB_URL="postgresql://user:password@host:5432/postgres"
npm run db:apply
```

Seed reference data (requires Supabase URL, anon key, and service role key):

```bash
export NEXT_PUBLIC_SUPABASE_URL="https://xyz.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="public-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="service-role-key"
npm run db:seed
```

## Testing

```bash
npm run lint      # verify
npm run db:seed   # seed
npm run e2e       # end-to-end tests (TODO)
```

## Deployment

The project targets **Node.js 22**. Vercel respects the `engines` field and `.nvmrc`; no extra config needed. Configure your Vercel project with the same environment variables:

```bash
vercel env pull .env.local
# or add individually
vercel env add NEXT_PUBLIC_SUPABASE_URL production
```

## Known Limitations and TODOs

- STEP/IGES viewer is a placeholder; real CAD visualization is not implemented.
- Payment flows (Stripe/PayPal) are stubs and do not charge real money.
- No automated end-to-end tests; `npm run e2e` is a placeholder.
- Additional verification scripts and broader test coverage are TODOs.
