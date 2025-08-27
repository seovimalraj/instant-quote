export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let quote_id: string | undefined;
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const body = await req.json().catch(() => ({} as any));
    quote_id = body?.quote_id;
  } else if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const form = await req.formData();
    quote_id = String(form.get('quote_id') || '');
  }

  if (!quote_id) return NextResponse.json({ error: 'quote_id required' }, { status: 400 });

  // TODO: implement your DB logic to mark the quote as requested for this user.
  // Example placeholder:
  // const { error } = await supabase.from('quotes').update({ status: 'requested' }).eq('id', quote_id);
  // if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, quote_id });
}
