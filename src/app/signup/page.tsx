'use client';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setErr(error.message);
    else setOk(true);
  };

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto p-6 space-y-3">
      <h1 className="text-xl font-semibold">Create account</h1>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border rounded px-3 py-2 w-full"
        placeholder="you@company.com"
      />
      <input
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border rounded px-3 py-2 w-full"
        placeholder="Password"
      />
      <button className="px-3 py-2 rounded bg-black text-white">Sign up</button>
      {err && <div className="text-red-600 text-sm">{err}</div>}
      {ok && <div className="text-green-700 text-sm">Check your email to verify.</div>}
    </form>
  );
}
