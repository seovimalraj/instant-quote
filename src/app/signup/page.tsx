'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SignUpPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setErr(error.message); return; }
    setOk(true);
  };

  return (
    <div className="max-w-md mx-auto card p-6 mt-10">
      <h1 className="text-xl font-semibold mb-4">Create account</h1>
      {ok ? (
        <div className="text-sm">Account created. <Link href="/signin" className="link">Sign in</Link>.</div>
      ) : (
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
          <button type="submit" className="btn btn-primary w-full">Sign up</button>
        </form>
      )}
      <div className="text-sm text-slate-600 mt-3">Have an account? <Link href="/signin" className="link">Sign in</Link></div>
    </div>
  );
}
