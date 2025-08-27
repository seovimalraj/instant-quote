export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = "nodejs";
import { requireAdmin } from '@/lib/auth';
import { createClient as createServerClient } from '@/lib/supabase/server';
import MachineDetailClient from './MachineDetailClient';

export default async function MachineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const pr = await params;
  await requireAdmin();
  const supabase = await createServerClient();
  const { data: machine } = await supabase.from('machines').select('*').eq('id', pr.id).single();
  const { data: links } = await supabase.from('machine_alloys').select('*').eq('machine_id', pr.id);
  return <MachineDetailClient machine={machine} links={links ?? []} />;
}
