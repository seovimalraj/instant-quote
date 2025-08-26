import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { seed } from '../db/seed';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

export async function resetDemo() {
  const tables = [
    'machine_capacity_days',
    'machine_alloys',
    'machine_resins',
    'machine_finishes',
    'machine_materials',
    'machines',
    'order_items',
    'orders',
    'messages',
    'quote_items',
    'quotes',
    'parts',
    'customers',
    'profiles',
    'rate_cards',
    'tolerances',
    'finishes',
    'materials',
    'processes'
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) console.error(`Error clearing ${table}:`, error.message);
  }

  const { data: list } = await supabase.auth.admin.listUsers();
  for (const u of list.users) {
    if (['admin@example.com', 'buyer@example.com'].includes(u.email ?? '')) {
      await supabase.auth.admin.deleteUser(u.id);
    }
  }

  await seed();
  console.log('Demo data reset complete');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  resetDemo().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
