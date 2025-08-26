export const runtime = 'nodejs'
import { NextResponse } from 'next/server';
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  vendor_id: z.string().uuid(),
  certification_id: z.string().uuid(),
  is_active: z.boolean().optional(),
});

export async function GET(req: Request) {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "0", 10);
  const filterKey = searchParams.get("filterKey") || "profiles.full_name";
  const PAGE_SIZE = 10;
  const supabase = await createClient();
  let query = supabase
    .from("vendor_certifications")
    .select("*, profiles(full_name), certifications(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .ilike(filterKey, `%${search}%`)
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  searchParams.forEach((value, key) => {
    if (!["search", "page", "filterKey"].includes(key)) {
      query = query.eq(key, value);
    }
  });
  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data, count });
}

export async function POST(req: Request) {
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
    .from("vendor_certifications")
    .insert(body)
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
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
    .from("vendor_certifications")
    .update(body)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("vendor_certifications")
    .delete()
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({});
}

