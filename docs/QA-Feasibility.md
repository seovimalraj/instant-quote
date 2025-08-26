# QA - Feasibility Flows

Steps to validate the feasibility tooling for each manufacturing process.

## CNC
1. Create a machine with process set to **CNC**.
2. Leave axis and envelope fields empty and confirm validation errors appear.
3. Save with valid rate and margin; verify the machine appears in the list.
4. Use **Test Pricing** with sample geometry and ensure a pricing breakdown is returned.

## Injection
1. Configure an **Injection** machine and ensure clamp tonnage and shot volume require numeric input.
2. Attempt test pricing with invalid geometry to confirm Zod validation errors surface.
3. Run a valid simulation and check that the breakdown includes material and machining lines.

## Casting
1. Set up a **Casting** machine and validate max cast weight and mold size fields.
2. Run the pricing simulator to confirm responses render without client errors.
3. Toggle the machine active state and ensure it updates in the Machines grid.
