export const runtime = 'nodejs'
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  finish_id: z.string().uuid(),
  finish_rate_multiplier: z.number().optional(),
  is_active: z.boolean().optional(),
});

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  await requireAdmin();
  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "0", 10);
  const PAGE_SIZE = 10;
  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from("machine_finishes")
    .select("id, finish_id, finish_rate_multiplier, is_active, finishes(name)", {
      count: "exact",
    })
    .eq("machine_id", params.id)
    .order("finishes.name")
    .ilike("finishes.name", `%${search}%`)
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data, count });
}

export async function POST(req: NextRequest, { params }: Params) {
  await requireAdmin();
  let body;
  try {
    body = schema.parse(await req.json());
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machine_finishes")
    .insert({ ...body, machine_id: params.id })
    .select("id, finish_id, finish_rate_multiplier, is_active, finishes(name)")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: Params) {
  await requireAdmin();
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  let body;
  try {
    body = schema.partial().parse(await req.json());
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machine_finishes")
    .update(body)
    .eq("id", id)
    .eq("machine_id", params.id)
    .select("id, finish_id, finish_rate_multiplier, is_active, finishes(name)")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  await requireAdmin();
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("machine_finishes")
    .delete()
    .eq("id", id)
    .eq("machine_id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

