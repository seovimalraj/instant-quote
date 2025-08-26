import { requireAdmin } from '@/lib/auth';
import { createClient as createServerClient } from '@/lib/supabase/server';
import MachinesClient from './MachinesClient';

export default async function MachinesPage() {
  await requireAdmin();
  const supabase = await createServerClient();
  const { data } = await supabase.from('machines').select('*').order('created_at', { ascending: false });
  return <MachinesClient initialRows={data ?? []} />;
}
