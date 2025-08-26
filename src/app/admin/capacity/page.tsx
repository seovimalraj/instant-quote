export const runtime = "nodejs";
import { requireAdmin } from '@/lib/auth';
import { createClient as createServerClient } from '@/lib/supabase/server';
import CapacityClient from './CapacityClient';

export default async function CapacityPage() {
  await requireAdmin();
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('capacity')
    .select('*')
    .order('day', { ascending: true });
  return <CapacityClient initialRows={data ?? []} />;
}
