# Demo Data

The seed scripts provide a minimal dataset for demonstrating the quoting and order flow.

## Catalogs
- **Processes:** CNC Milling, Injection Molding, Casting
- **Materials:** Aluminum 6061, Stainless Steel 304, ABS, Aluminum A356
- **Tolerances:** ISO 2768-m and ISO 2768-f
- **Certifications:** ISO 9001, AS9100, ITAR
- **Rate Card:** US-East region with USD pricing

## Machines
- 3-Axis Mill
- 5-Axis Mill
- 200T Press
- Casting Line

Each machine is linked to compatible materials/finishes and given 30 days of 8‑hour capacity.

## Users and Customer
- `admin@example.com` – administrator
- `buyer@example.com` – customer for **Acme Corp**

## Sample Data
Three sample parts are seeded with preview images:

1. `cube.stl` – CNC milling with a DFM report and generated QAP.
2. `bracket.obj` – CNC milling.
3. `housing.step` – Casting.

One accepted quote includes price breakdown and messages, and an order is created from it.

Run `npm run db:seed` to populate the data or `tsx scripts/reset-demo.ts` to reset the demo environment.
