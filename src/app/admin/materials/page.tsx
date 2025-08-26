export const runtime = "nodejs";
import { requireAdmin } from '@/lib/auth';
import { createClient as createServerClient } from '@/lib/supabase/server';
import MaterialsClient from './MaterialsClient';

export default async function MaterialsPage() {
  await requireAdmin();
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('materials')
    .select('*')
    .order('name', { ascending: true });
  return <MaterialsClient initialRows={data ?? []} />;
}

