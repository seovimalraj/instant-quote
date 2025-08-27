'use client';
export function SignOutButton() {
  return (
    <button
      className="text-sm px-3 py-2 border rounded"
      onClick={async () => { await fetch('/api/auth/signout', { method: 'POST' }); window.location.href = '/signin'; }}
    >
      Sign out
    </button>
  );
}
