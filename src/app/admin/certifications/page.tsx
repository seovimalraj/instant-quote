export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = "nodejs";
import { requireAdmin } from '@/lib/auth';
import { createClient as createServerClient } from '@/lib/supabase/server';
import CertificationsClient from './CertificationsClient';

export default async function CertificationsPage() {
  await requireAdmin();
  const supabase = await createServerClient();
  const { data } = await supabase.from('certifications').select('*').order('name');
  return <CertificationsClient initialRows={data ?? []} />;
}
