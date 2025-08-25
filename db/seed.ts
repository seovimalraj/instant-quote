import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

async function seed() {
  // Processes
  const { error: procErr } = await supabase.from('processes').upsert([
    { code: 'cnc_milling', name: 'CNC Milling' },
    { code: 'cnc_turning', name: 'CNC Turning' },
    { code: 'sheet_metal', name: 'Sheet Metal' },
    { code: '3dp_fdm', name: 'FDM 3D Printing' },
    { code: '3dp_sla', name: 'SLA 3D Printing' },
    { code: '3dp_sls', name: 'SLS 3D Printing' },
    { code: 'injection_proto', name: 'Injection Prototype' }
  ], { onConflict: 'code' });
  if (procErr) throw procErr;

  // Materials
  const { error: matErr } = await supabase.from('materials').upsert([
    { process_code: 'cnc_milling', name: 'Aluminum 6061', density_kg_m3: 2700, cost_per_kg: 5 },
    { process_code: 'sheet_metal', name: 'Aluminum Sheet', density_kg_m3: 2700, cost_per_kg: 4 },
    { process_code: '3dp_fdm', name: 'PLA', density_kg_m3: 1240, cost_per_kg: 20 },
    { process_code: '3dp_sla', name: 'Resin', density_kg_m3: 1100, cost_per_kg: 150 },
    { process_code: '3dp_sls', name: 'Nylon', density_kg_m3: 950, cost_per_kg: 70 },
    { process_code: 'injection_proto', name: 'ABS', density_kg_m3: 1040, cost_per_kg: 2.5 }
  ], { onConflict: 'process_code,name' });
  if (matErr) throw matErr;

  // Finishes
  const { error: finErr } = await supabase.from('finishes').upsert([
    { process_code: 'cnc_milling', name: 'Anodized', type: 'coating', cost_per_m2: 10, setup_fee: 30 },
    { process_code: 'sheet_metal', name: 'Powder Coat', type: 'coating', cost_per_m2: 8, setup_fee: 25 }
  ], { onConflict: 'process_code,name' });
  if (finErr) throw finErr;

  // Tolerances
  const { error: tolErr } = await supabase.from('tolerances').upsert([
    { process_code: 'cnc_milling', name: 'Standard', tol_min_mm: -0.1, tol_max_mm: 0.1, cost_multiplier: 1 },
    { process_code: 'cnc_milling', name: 'High', tol_min_mm: -0.05, tol_max_mm: 0.05, cost_multiplier: 1.2 }
  ], { onConflict: 'process_code,name' });
  if (tolErr) throw tolErr;

  // Rate cards
  const { error: rateErr } = await supabase.from('rate_cards').upsert([
    {
      region: 'us',
      currency: 'USD',
      three_axis_rate_per_min: 1.2,
      five_axis_rate_per_min: 1.5,
      turning_rate_per_min: 1.0,
      sheet_setup_fee: 15,
      bend_rate_per_bend: 0.5,
      laser_rate_per_min: 0.8,
      fdm_rate_per_cm3: 0.2,
      sla_rate_per_cm3: 0.5,
      sls_rate_per_cm3: 0.6,
      injection_mold_setup: 500,
      injection_part_rate: 2,
      machine_setup_fee: 50,
      tax_rate: 0.07,
      shipping_flat: 15
    }
  ], { onConflict: 'region' });
  if (rateErr) throw rateErr;

  console.log('Seeding complete');
}

seed().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
