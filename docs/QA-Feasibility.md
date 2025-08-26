# QA Feasibility

## CNC
- Create a machine with process set to CNC and verify axis and envelope validation errors trigger when fields are empty.
- Save changes and confirm the machine appears in the list with updated rate and margin.
- Use Test Pricing with sample geometry to ensure a pricing breakdown is returned.

## Injection
- Configure an injection machine and ensure clamp tonnage and shot volume require numeric input.
- Attempt test pricing with invalid geometry to confirm zod errors appear.
- Run a valid simulation and check that the breakdown includes material and machining lines.

## Casting
- Set up a casting machine and validate max cast weight and mold size fields.
- Run the pricing simulator to confirm responses render without client errors.
- Toggle the machine active state and ensure it updates in the Machines grid.
