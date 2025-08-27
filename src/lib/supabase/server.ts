export const runtime = 'nodejs';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const store = await cookies();
  const get = (name: string) => store.get(name)?.value;
  const set = (name: string, value: string, options: any) => store.set({ name, value, ...options });
  const remove = (name: string, options: any) => store.set({ name, value: '', ...options });

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get, set, remove } as any }
  );
}

