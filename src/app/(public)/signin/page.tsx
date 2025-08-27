'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch('/api/auth/signin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    setBusy(false);
    if (!res.ok) { const j = await res.json().catch(()=>({})); setErr(j.error || 'Login failed'); return; }
    r.push('/admin');
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 border p-5 rounded-xl">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <input className="border w-full px-3 py-2 rounded" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border w-full px-3 py-2 rounded" type="password" placeholder="••••••••" value={password} onChange={e=>setPw(e.target.value)} />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button disabled={busy} className="bg-black text-white px-3 py-2 rounded w-full">{busy? 'Signing in…':'Sign in'}</button>
        <p className="text-sm">No account? <a href="/signup" className="text-blue-600 underline">Create one</a></p>
      </form>
    </div>
  );
}
