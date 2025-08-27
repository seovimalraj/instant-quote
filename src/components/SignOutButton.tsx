'use client';

import { useState } from 'react';

export function SignOutButton() {
  const [busy, setBusy] = useState(false);

  return (
    <button
      className="text-sm px-3 py-2 border rounded disabled:opacity-50"
      disabled={busy}
      onClick={async () => {
        try {
          setBusy(true);
          await fetch('/api/auth/signout', { method: 'POST' });
        } catch {
          // ignore
        } finally {
          window.location.href = '/signin';
        }
      }}
    >
      Sign out
    </button>
  );
}
