# Demo Data

The seed scripts provide a minimal dataset for demonstrating the quoting and order flow.

## Catalogs
- **Processes:** CNC Milling, CNC Turning, Injection Molding, Casting
- **Materials:** Aluminum 6061 (metal), Stainless Steel 304 (alloy), Nylon 12 (resin), Zamak 3 (alloy)
- **Finishes:** Anodized, Polished, As Cast
- **Tolerances:** Standard and High for milling, Standard for turning
- **Certifications:** ISO9001, AS9100
- **Rate Card:** US-East region with USD pricing

## Machines
- HAAS VF-2SS – 3‑axis milling
- Hermle C42 – 5‑axis milling
- Mazak Quick Turn – turning center
- Arburg 200T – 200 ton injection press
- Buhler Casting Line – die casting

Each machine is linked to compatible materials/finishes and given 30 days of 8‑hour capacity.

Additional DFM seed data lives in `sql/seed_dfm.sql` and includes sample certifications,
a demo part and one day of machine capacity.

## Users and Customer
- `admin@example.com` – administrator
- `buyer@example.com` – customer for **Acme Corp**

## Sample Flow
1. Part `fixture1.stl` uploaded for Acme Corp.
2. Three quotes created (draft, sent, accepted) with corresponding quote items.
3. Conversation on accepted quote shows customer and staff messages.
4. Accepted quote generates an order with one order item.

Run `npm run db:seed` to populate the data or `tsx scripts/reset-demo.ts` to reset the demo environment.
