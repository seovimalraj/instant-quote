import { requireAdmin } from '@/lib/auth';
import { createClient as createServerClient } from '@/lib/supabase/server';
import MachineDetailClient from './MachineDetailClient';

export default async function MachineDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const supabase = await createServerClient();
  const { data: machine } = await supabase.from('machines').select('*').eq('id', params.id).single();
  const { data: links } = await supabase.from('machine_alloys').select('*').eq('machine_id', params.id);
  return <MachineDetailClient machine={machine} links={links ?? []} />;
}
