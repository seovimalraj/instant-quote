# Security

## Input Validation
All API route handlers validate incoming payloads using [zod](https://github.com/colinhacks/zod) before processing.

## Secrets
The Supabase service role key is used only on the server and never exposed to client bundles.

## Runtime Checks
Supabase clients validate required environment variables at startup and throw explicit errors if configuration is missing.

## Storage
File uploads use signed URLs that expire after **60 seconds** and target the private `parts` bucket.

## RBAC
Middleware and server-side checks enforce role-based access control. Only users with `admin` or `staff` roles may access `/admin` routes.

## Row Level Security
Supabase RLS policies restrict data access so owners can only access their own records while `admin`/`staff` have elevated permissions.
