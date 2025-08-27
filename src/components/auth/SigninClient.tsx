'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SigninClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl border">
      <h1 className="text-xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          className="w-full border rounded-xl px-3 py-2"
          placeholder="you@example.com"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full border rounded-xl px-3 py-2"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full px-3 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50"
        >{busy ? 'Signing in…' : 'Sign in'}</button>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </form>
      <p className="mt-3 text-sm text-slate-600">New here? <a className="text-indigo-600 underline" href="/signup">Create an account</a></p>
    </div>
  );
}
