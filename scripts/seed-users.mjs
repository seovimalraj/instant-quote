/* eslint-env node */
import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const supabase = createClient(url, key);

async function ensureUser(email, password, role) {
  // Create or update auth user
  const { data: authLookup } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let user = authLookup?.users?.find(u => u.email === email);
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { role } });
    if (error) throw error; user = data.user;
  }
  // Upsert domain tables (customers/admins)
  if (role === 'admin') {
    await supabase.from('admins').upsert({ owner_id: user.id, email }).select().single();
  } else {
    await supabase.from('customers').upsert({ owner_id: user.id, email, name: 'Demo Customer' }).select().single();
  }
  return user;
}

(async () => {
  const admin    = await ensureUser('admin@example.com',    'Passw0rd!', 'admin');
  const customer = await ensureUser('customer@example.com', 'Passw0rd!', 'customer');
  console.log(JSON.stringify({ admin: { id: admin.id, email: admin.email }, customer: { id: customer.id, email: customer.email } }, null, 2));
})();
