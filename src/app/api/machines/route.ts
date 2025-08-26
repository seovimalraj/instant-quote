import { NextRequest, NextResponse } from "next/server";
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

export async function GET(req: NextRequest) {
  await requireAdmin();
  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "0", 10);
  const PAGE_SIZE = 10;
  const supabase = createClient();
  const { data, count, error } = await supabase
    .from("machines")
    .select("*", { count: "exact" })
    .order("name")
    .ilike("name", `%${search}%`)
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data, count });
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  let body;
  try {
    body = machineSchema.parse(await req.json());
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("machines")
    .insert(body)
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
