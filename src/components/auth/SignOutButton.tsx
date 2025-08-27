'use client';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const router = useRouter();
  const handle = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/signin');
  };
  return <button onClick={handle} className="btn">Sign out</button>;
}

