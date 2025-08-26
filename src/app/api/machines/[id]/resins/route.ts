export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: { id: string } };

/** Link a resin to this machine (POST) and list resins (GET) */
export async function GET(_req: Request, { params }: Ctx) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machine_resins")
    .select("id, material_id, resin_rate_multiplier")
    .eq("machine_id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: Ctx) {
  const body = await req.json(); // { material_id, resin_rate_multiplier? }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machine_resins")
    .insert({
      machine_id: params.id,
      material_id: body.material_id,
      resin_rate_multiplier: body.resin_rate_multiplier ?? 1.0,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { material_id } = await req.json();
  const supabase = await createClient();
  const { error } = await supabase
    .from("machine_resins")
    .delete()
    .eq("machine_id", params.id)
    .eq("material_id", material_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
