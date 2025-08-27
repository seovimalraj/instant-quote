export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = "nodejs";
import { requireAdmin } from '@/lib/auth';
import { createClient as createServerClient } from '@/lib/supabase/server';
import FinishesClient from './FinishesClient';

export default async function FinishesPage() {
  await requireAdmin();
  const supabase = await createServerClient();
  const { data } = await supabase.from('finishes').select('*').order('name');
  return <FinishesClient initialRows={data ?? []} />;
}
