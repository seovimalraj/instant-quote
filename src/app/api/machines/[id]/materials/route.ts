import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const materialSchema = z.object({
  material_id: z.string().uuid(),
  material_rate_multiplier: z.number().optional(),
  is_active: z.boolean().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  material_rate_multiplier: z.number().optional(),
  is_active: z.boolean().optional(),
});

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  await requireAdmin();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("machine_materials")
    .select("id, material_id, material_rate_multiplier, is_active, materials(name)")
    .eq("machine_id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: Params) {
  await requireAdmin();
  let body;
  try {
    body = materialSchema.parse(await req.json());
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("machine_materials")
    .insert({ machine_id: params.id, ...body })
    .select("*")
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
    body = updateSchema.parse(await req.json());
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("machine_materials")
    .update({
      material_rate_multiplier: body.material_rate_multiplier,
      is_active: body.is_active,
    })
    .eq("id", body.id)
    .eq("machine_id", params.id)
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: Params) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("machine_materials")
    .delete()
    .eq("id", id)
    .eq("machine_id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
