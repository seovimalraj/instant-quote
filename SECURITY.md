# Security Checklist

- [x] Row Level Security policies remain intact for all tables.
- [x] Signed upload URLs expire in 60 seconds (under the 5 minute limit).
- [x] API inputs are validated with Zod before processing.
- [x] Machine management endpoints are restricted to admin users only.
