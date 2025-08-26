import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  vendor_id: z.string().uuid(),
  certification_id: z.string().uuid(),
  is_active: z.boolean().optional(),
});

export async function GET() {
  await requireAdmin();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vendor_certifications")
    .select("*, profiles(full_name), certifications(name)")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
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
  const supabase = createClient();
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

