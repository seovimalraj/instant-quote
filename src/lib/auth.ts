import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (data?.role !== 'admin') redirect('/');
  return user;
}

