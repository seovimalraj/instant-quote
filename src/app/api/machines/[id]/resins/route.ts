export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ParamsSchema = z.object({ id: z.string().min(1) });
const BodySchema = z.object({
  material_id: z.string().uuid(),
  resin_rate_multiplier: z.number().min(0.1).max(10).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const p = ParamsSchema.safeParse(await params);
  if (!p.success) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machine_resins")
    .select("id, material_id, resin_rate_multiplier")
    .eq("machine_id", p.data.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: Request, { params }: Ctx) {
  const p = ParamsSchema.safeParse(await params);
  if (!p.success) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }
  const json = await req.json().catch(() => null);
  const b = BodySchema.safeParse(json);
  if (!b.success) {
    return NextResponse.json({ error: b.error.flatten() }, { status: 400 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machine_resins")
    .upsert(
      {
        machine_id: p.data.id,
        material_id: b.data.material_id,
        resin_rate_multiplier: b.data.resin_rate_multiplier ?? 1,
      },
      { onConflict: "machine_id,material_id" }
    )
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const p = ParamsSchema.safeParse(await params);
  if (!p.success) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const material_id = searchParams.get("material_id") || undefined;
  if (!material_id) {
    return NextResponse.json({ error: "material_id required" }, { status: 400 });
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("machine_resins")
    .delete()
    .eq("machine_id", p.data.id)
    .eq("material_id", material_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

