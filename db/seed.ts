import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

async function getOrCreateUser(email: string, password: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error && !data?.user) {
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list.users.find((u: any) => u.email === email);
    if (!existing) throw error;
    return existing.id;
  }
  return data!.user!.id;
}

export async function seed() {
  // Processes
  const { error: procErr } = await supabase.from('processes').upsert([
    { code: 'cnc_milling', name: 'CNC Milling' },
    { code: 'cnc_turning', name: 'CNC Turning' },
    { code: 'injection_molding', name: 'Injection Molding' },
    { code: 'casting', name: 'Casting' }
  ], { onConflict: 'code' });
  if (procErr) throw procErr;

  // Materials
  const { error: matErr } = await supabase.from('materials').upsert([
    { process_code: 'cnc_milling', name: 'Aluminum 6061', category: 'metal', density_kg_m3: 2700, cost_per_kg: 6 },
    { process_code: 'cnc_turning', name: 'Stainless Steel 304', category: 'alloy', density_kg_m3: 8000, cost_per_kg: 8 },
    { process_code: 'injection_molding', name: 'Nylon 12', category: 'resin', density_kg_m3: 1010, cost_per_kg: 3 },
    { process_code: 'casting', name: 'Zamak 3', category: 'alloy', density_kg_m3: 6800, cost_per_kg: 5 }
  ], { onConflict: 'process_code,name' });
  if (matErr) throw matErr;

  // Finishes
  const { error: finErr } = await supabase.from('finishes').upsert([
    { process_code: 'cnc_milling', name: 'Anodized', type: 'coating', cost_per_m2: 10, setup_fee: 30 },
    { process_code: 'cnc_turning', name: 'Polished', type: 'polish', cost_per_m2: 8, setup_fee: 20 },
    { process_code: 'casting', name: 'As Cast', type: 'raw', cost_per_m2: 0, setup_fee: 0 }
  ], { onConflict: 'process_code,name' });
  if (finErr) throw finErr;

  // Tolerances
  const { error: tolErr } = await supabase.from('tolerances').upsert([
    { process_code: 'cnc_milling', name: 'Standard', tol_min_mm: -0.1, tol_max_mm: 0.1, cost_multiplier: 1 },
    { process_code: 'cnc_milling', name: 'High', tol_min_mm: -0.05, tol_max_mm: 0.05, cost_multiplier: 1.2 },
    { process_code: 'cnc_turning', name: 'Standard', tol_min_mm: -0.1, tol_max_mm: 0.1, cost_multiplier: 1 }
  ], { onConflict: 'process_code,name' });
  if (tolErr) throw tolErr;

  // Certifications
  const { error: certErr } = await supabase.from('certifications').upsert(
    [
      { name: 'ISO9001' },
      { name: 'AS9100' },
    ],
    { onConflict: 'name' }
  );
  if (certErr) throw certErr;

  // Rate card
  const { error: rateErr } = await supabase.from('rate_cards').upsert([{
    region: 'us-east',
    currency: 'USD',
    three_axis_rate_per_min: 1.2,
    five_axis_rate_per_min: 1.6,
    turning_rate_per_min: 1.0,
    machine_setup_fee: 50,
    tax_rate: 0.07,
    shipping_flat: 15
  }], { onConflict: 'region' });
  if (rateErr) throw rateErr;

  // Users and profiles
  const adminId = await getOrCreateUser('admin@example.com', 'password');
  const buyerId = await getOrCreateUser('buyer@example.com', 'password');

  const { error: profErr } = await supabase.from('profiles').upsert([
    { id: adminId, email: 'admin@example.com', full_name: 'Demo Admin', role: 'admin' },
    { id: buyerId, email: 'buyer@example.com', full_name: 'Acme Buyer', role: 'customer' }
  ]);
  if (profErr) throw profErr;

  // Customer
  const { data: custData, error: custErr } = await supabase.from('customers').upsert([{
    id: '00000000-0000-0000-0000-000000000010',
    owner_id: buyerId,
    name: 'Acme Corp',
    website: 'https://acme.example'
  }], { onConflict: 'id' }).select().single();
  if (custErr) throw custErr;
  const customerId = custData.id;

  // Machines
  const { data: machines, error: machErr } = await supabase.from('machines').upsert([
    { name: 'HAAS VF-2SS', process_code: 'cnc_milling', process_kind: 'cnc_milling', axis_count: 3, rate_per_min: 1.2, setup_fee: 50 },
    { name: 'Hermle C42', process_code: 'cnc_milling', process_kind: 'cnc_milling', axis_count: 5, rate_per_min: 1.6, setup_fee: 75 },
    { name: 'Mazak Quick Turn', process_code: 'cnc_turning', process_kind: 'cnc_turning', axis_count: 2, rate_per_min: 1.0, setup_fee: 40 },
    { name: 'Arburg 200T', process_code: 'injection_molding', process_kind: 'injection_molding', axis_count: 0, rate_per_min: 0.03, setup_fee: 100 },
    { name: 'Buhler Casting Line', process_code: 'casting', process_kind: 'casting', axis_count: 0, rate_per_min: 0.05, setup_fee: 200 }
  ], { onConflict: 'name' }).select();
  if (machErr) throw machErr;

  const machineMap: Record<string, string> = {};
  machines?.forEach((m: any) => { machineMap[m.name] = m.id; });

  // Link machines to materials/finishes
  const { data: materials } = await supabase.from('materials').select('id,name');
  const { data: finishes } = await supabase.from('finishes').select('id,name');

  const aluminumId = materials?.find(m => m.name === 'Aluminum 6061')?.id;
  const steelId = materials?.find(m => m.name === 'Stainless Steel 304')?.id;
  const nylonId = materials?.find(m => m.name === 'Nylon 12')?.id;
  const zamakId = materials?.find(m => m.name === 'Zamak 3')?.id;

  const anodizedId = finishes?.find(f => f.name === 'Anodized')?.id;
  const polishedId = finishes?.find(f => f.name === 'Polished')?.id;
  const asCastId = finishes?.find(f => f.name === 'As Cast')?.id;

  if (aluminumId && steelId) {
    await supabase.from('machine_materials').upsert([
      { machine_id: machineMap['HAAS VF-2SS'], material_id: aluminumId },
      { machine_id: machineMap['Hermle C42'], material_id: aluminumId },
      { machine_id: machineMap['Hermle C42'], material_id: steelId },
      { machine_id: machineMap['Mazak Quick Turn'], material_id: steelId }
    ]);
  }
  if (nylonId) {
    await supabase.from('machine_resins').upsert([
      { machine_id: machineMap['Arburg 200T'], material_id: nylonId }
    ]);
  }
  if (zamakId) {
    await supabase.from('machine_alloys').upsert([
      { machine_id: machineMap['Buhler Casting Line'], material_id: zamakId }
    ]);
  }
  if (anodizedId && polishedId && asCastId) {
    await supabase.from('machine_finishes').upsert([
      { machine_id: machineMap['HAAS VF-2SS'], finish_id: anodizedId },
      { machine_id: machineMap['Hermle C42'], finish_id: anodizedId },
      { machine_id: machineMap['Mazak Quick Turn'], finish_id: polishedId },
      { machine_id: machineMap['Buhler Casting Line'], finish_id: asCastId }
    ]);
  }

  // Capacity days
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
  for (const name in machineMap) {
    const entries = days.map(day => ({
      machine_id: machineMap[name],
      day,
      minutes_available: 480
    }));
    await supabase.from('machine_capacity_days').upsert(entries, { onConflict: 'machine_id,day' });
  }

  // Part
  const { data: partData, error: partErr } = await supabase.from('parts').upsert([{
    id: '00000000-0000-0000-0000-000000000020',
    owner_id: buyerId,
    customer_id: customerId,
    file_url: 'https://example.com/fixture1.stl',
    file_name: 'fixture1.stl',
    file_ext: 'stl',
    size_bytes: 123456,
    process_code: 'cnc_milling'
  }], { onConflict: 'id' }).select().single();
  if (partErr) throw partErr;
  const partId = partData.id;

  // Quotes
  const quotes = [
    { id: '00000000-0000-0000-0000-000000000030', status: 'draft' },
    { id: '00000000-0000-0000-0000-000000000031', status: 'sent' },
    { id: '00000000-0000-0000-0000-000000000032', status: 'accepted' }
  ];
  for (const q of quotes) {
    const { error } = await supabase.from('quotes').upsert([{
      id: q.id,
      customer_id: customerId,
      created_by: buyerId,
      status: q.status,
      region: 'us-east',
      subtotal: 100,
      tax: 7,
      total: 107
    }], { onConflict: 'id' });
    if (error) throw error;
  }

  // Quote items
  const { data: tolData } = await supabase.from('tolerances').select('id,name,process_code');
  const tolStdMill = tolData?.find(t => t.name === 'Standard' && t.process_code === 'cnc_milling')?.id;
  const tolStdTurn = tolData?.find(t => t.name === 'Standard' && t.process_code === 'cnc_turning')?.id;
  const tolHighMill = tolData?.find(t => t.name === 'High' && t.process_code === 'cnc_milling')?.id;

  await supabase.from('quote_items').upsert([
    {
      id: '00000000-0000-0000-0000-000000000040',
      quote_id: '00000000-0000-0000-0000-000000000030',
      part_id: partId,
      process_code: 'cnc_milling',
      material_id: aluminumId,
      finish_id: anodizedId,
      tolerance_id: tolStdMill,
      quantity: 1,
      unit_price: 100,
      line_total: 100,
      machine_id: machineMap['Hermle C42']
    },
    {
      id: '00000000-0000-0000-0000-000000000041',
      quote_id: '00000000-0000-0000-0000-000000000031',
      part_id: partId,
      process_code: 'cnc_turning',
      material_id: steelId,
      finish_id: polishedId,
      tolerance_id: tolStdTurn,
      quantity: 1,
      unit_price: 120,
      line_total: 120,
      machine_id: machineMap['Mazak Quick Turn']
    },
    {
      id: '00000000-0000-0000-0000-000000000042',
      quote_id: '00000000-0000-0000-0000-000000000032',
      part_id: partId,
      process_code: 'cnc_milling',
      material_id: aluminumId,
      finish_id: anodizedId,
      tolerance_id: tolHighMill,
      quantity: 1,
      unit_price: 150,
      line_total: 150,
      machine_id: machineMap['HAAS VF-2SS']
    }
  ], { onConflict: 'id' });

  // Messages
  await supabase.from('messages').upsert([
    {
      id: '00000000-0000-0000-0000-000000000060',
      quote_id: '00000000-0000-0000-0000-000000000032',
      sender_id: buyerId,
      sender_role: 'customer',
      content: 'Can you expedite this order?'
    },
    {
      id: '00000000-0000-0000-0000-000000000061',
      quote_id: '00000000-0000-0000-0000-000000000032',
      sender_id: adminId,
      sender_role: 'staff',
      content: 'Yes, we can ship in two days.'
    }
  ], { onConflict: 'id' });

  // Order
  await supabase.from('orders').upsert([{
    id: '00000000-0000-0000-0000-000000000050',
    quote_id: '00000000-0000-0000-0000-000000000032',
    customer_id: customerId,
    status: 'created',
    total: 107
  }], { onConflict: 'id' });

  await supabase.from('order_items').upsert([{
    order_id: '00000000-0000-0000-0000-000000000050',
    quote_item_id: '00000000-0000-0000-0000-000000000042',
    part_id: partId,
    process_code: 'cnc_milling',
    quantity: 1,
    unit_price: 150,
    line_total: 150
  }], { onConflict: 'order_id,quote_item_id' });

  console.log('Seeding complete');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
