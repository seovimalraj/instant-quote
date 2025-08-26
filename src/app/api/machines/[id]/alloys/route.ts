export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Link an alloy to this machine (POST) and list alloys (GET) */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machine_alloys")
    .select("id, material_id, alloy_rate_multiplier")
    .eq("machine_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json(); // { material_id, alloy_rate_multiplier? }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machine_alloys")
    .insert({
      machine_id: id,
      material_id: body.material_id,
      alloy_rate_multiplier: body.alloy_rate_multiplier ?? 1.0,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { material_id } = await req.json();
  const supabase = await createClient();
  const { error } = await supabase
    .from("machine_alloys")
    .delete()
    .eq("machine_id", id)
    .eq("material_id", material_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
