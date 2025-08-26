export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const ParamsSchema = z.object({ id: z.string().min(1) });

const MachineUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    is_active: z.boolean().optional(),
    process_kind: z
      .enum(['cnc_milling', 'cnc_turning', 'injection_molding', 'casting'])
      .optional(),
    rate_per_min: z.number().nonnegative().optional(),
    setup_fee: z.number().nonnegative().optional(),
    axis_count: z.number().int().min(3).max(5).optional(),
    max_work_envelope_mm: z
      .object({ x: z.number(), y: z.number(), z: z.number() })
      .optional(),
    params: z.record(z.any()).optional(),
  })
  .strict();

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const p = ParamsSchema.safeParse(await context.params);
  if (!p.success) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .eq('id', p.data.id)
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ item: data });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const p = ParamsSchema.safeParse(await context.params);
  if (!p.success) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }
  const json = await req.json().catch(() => null);
  const b = MachineUpdateSchema.safeParse(json ?? {});
  if (!b.success) {
    return NextResponse.json({ error: b.error.flatten() }, { status: 400 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('machines')
    .update(b.data)
    .eq('id', p.data.id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ item: data });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const p = ParamsSchema.safeParse(await context.params);
  if (!p.success) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from('machines')
    .delete()
    .eq('id', p.data.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

