# Security Checklist

The following items are verified as part of regular security reviews:

- [x] Row Level Security (RLS) policies are defined for every table and validated table-by-table.
- [x] All API inputs are validated with Zod at request boundaries.
- [x] Signed upload URLs have a time-to-live of 60 seconds (well under the 5 minute limit).
- [x] Machine management and capacity reserve endpoints are restricted to admin users only.
- [x] Application logs redact email addresses and authentication tokens before storage.
