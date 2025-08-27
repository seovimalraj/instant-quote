'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const handle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // no-op
    } finally {
      setBusy(false);
      router.push('/signin');
    }
  };

  return (
    <button
      className="text-sm px-3 py-2 border rounded disabled:opacity-50"
      disabled={busy}
      onClick={handle}
    >
      Sign out
    </button>
  );
}
