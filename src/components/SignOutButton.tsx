'use client';

import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <button onClick={handleSignOut} className="text-sm text-gray-600 hover:underline">
      Sign out
    </button>
  );
}

