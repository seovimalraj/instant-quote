export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = "nodejs";
import { requireAdmin } from '@/lib/auth';
import { createClient as createServerClient } from '@/lib/supabase/server';
import TolerancesClient from './TolerancesClient';

export default async function TolerancesPage() {
  await requireAdmin();
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('tolerances')
    .select('*')
    .order('name', { ascending: true });
  return <TolerancesClient initialRows={data ?? []} />;
}

