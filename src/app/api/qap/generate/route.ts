import { NextRequest, NextResponse } from 'next/server';
import { qapInputSchema, generateQAP } from '@/lib/qap';

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const body = qapInputSchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const res = await generateQAP(body.data);
  return NextResponse.json({ id: res.id, file: res.file }, { headers: { 'cache-control': 'private, max-age=300' } });
}
