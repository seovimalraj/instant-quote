import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const machineSchema = z.object({
  name: z.string().min(1),
  process_code: z.string().min(1),
  axis_count: z.number().optional(),
  envelope_mm_x: z.number().optional(),
  envelope_mm_y: z.number().optional(),
  envelope_mm_z: z.number().optional(),
  rate_per_min: z.number().optional(),
  setup_fee: z.number().optional(),
  overhead_multiplier: z.number().optional(),
  expedite_multiplier: z.number().optional(),
  utilization_target: z.number().optional(),
  margin_pct: z.number().optional(),
  is_active: z.boolean().optional(),
});

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  await requireAdmin();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("machines")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PUT(req: Request, { params }: Params) {
  await requireAdmin();
  let body;
  try {
    body = machineSchema.partial().parse(await req.json());
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("machines")
    .update(body)
    .eq("id", params.id)
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("machines").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
