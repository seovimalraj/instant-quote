# Instant Quote — End-to-End Overview

## At-a-glance
- Node required (package.json engines): **18.x**
- Next.js version: **14.1.0**
- Total lines of code (src): **1234**

## Feature Status
- CAD Viewer (STL): ✅
- STEP/IGES Support (occt-import-js): ⚠️
- DFM Engine: ✅
- Email/Password Auth: ⚠️
- TailAdmin UI integration: ✅

### Working (based on static audit)
- 3D viewer renders STL (browser)
- DFM engine returns suggestions based on geometry/material/finish/tolerance

### Needs Attention / Caveats
- Signup/Login: magic-link or incomplete email/password flow—verify Supabase auth handlers.

## Pages
### Admin
- `/admin/dashboard/page.tsx`

### Customer
- `/quote/page.tsx`

## API Routes
- `/api/quote/route.ts`

## Workflows
1) **Instant Quote**
   - Upload STL/STEP/IGES → Viewer renders mesh → Geometry analyzed (bbox, area, volume).
   - Select material, finish, tolerance, quantity, lead time.
   - Pricing engine computes per-unit, shipping, tax, total; shows breakdown.
   - DFM engine lists manufacturability notes; actions: Generate QAP, Create Instant Quote.

2) **DFM Engine**
   - Inputs: CAD + material + purpose + tolerance + certification.
   - Output: feasibility, alternatives (materials/tolerances), expected lifetime and risks, drawing suggestions.

3) **Admin Panel**
   - Manage rate cards, materials, finishes, tolerances, machines, quotes, capacity.
   - Requires authenticated admin role; protect via server checks.

4) **Auth**
   - Email/password via Supabase Auth (if wired) or magic-link fallback.

## Environment & Secret Requirements
- **Required (build/runtime):** 
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY` (client)
  - `SUPABASE_SERVICE_ROLE_KEY` (server tasks only; never expose to client)
- **Vercel**
  - In Project Settings → Environment Variables, add the above keys.
  - Ensure `vercel.json` or route files export `runtime = 'nodejs'` for all API routes.

## Known Build Warnings
- None recorded

## Dummy Users (for walkthrough)
- **Admin**: `admin@example.com` / `Passw0rd!` (seed via script in Prompt 3/3)
- **Customer**: `customer@example.com` / `Passw0rd!` (seed via script in Prompt 3/3)

---
*Generated from `tmp/audit.json`.*
