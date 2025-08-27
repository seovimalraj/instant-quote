'use client';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SignInPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    window.location.href = '/';
  };

  return (
    <div className="max-w-md mx-auto card p-6 mt-10">
      <h1 className="text-xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-sm text-slate-600">Email</label>
          <input type="email" className="mt-1 w-full rounded-xl border px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm text-slate-600">Password</label>
          <input type="password" className="mt-1 w-full rounded-xl border px-3 py-2" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <div className="text-sm text-slate-600 mt-3">No account? <Link href="/signup" className="link">Sign up</Link></div>
    </div>
  );
}
