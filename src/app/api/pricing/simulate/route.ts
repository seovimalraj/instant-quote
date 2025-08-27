export const runtime = 'nodejs'
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { priceItem } from "@/lib/pricing";
import { normalizeProcessKind } from "@/lib/process";
import { geometrySchema } from "@/lib/validators/pricing";

const requestSchema = z.object({
  process: z.string(),
  material_id: z.string().uuid(),
  finish_id: z.string().uuid().optional(),
  tolerance_id: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  lead_time: z.enum(["standard", "expedite"]),
  geometry: geometrySchema,
});

const buckets = new Map<string, { tokens: number; last: number }>();
const TOKENS = 20;
const REFILL_MS = 60_000;

function consume(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) || { tokens: TOKENS, last: now };
  const delta = now - bucket.last;
  bucket.tokens = Math.min(TOKENS, bucket.tokens + (delta / REFILL_MS) * TOKENS);
  bucket.last = now;
  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anon";
  if (!consume(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body;
  try {
    body = requestSchema.parse(await req.json());
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const process_kind = normalizeProcessKind(body.process);

  const supabase = await createClient();

  let material = (
    await supabase
      .from("materials")
      .select("*")
      .eq("id", body.material_id)
      .eq("is_active", true)
      .maybeSingle()
  ).data;
  if (!material) {
    material = (
      await supabase
        .from("resins")
        .select("*")
        .eq("id", body.material_id)
        .eq("is_active", true)
        .maybeSingle()
    ).data;
  }
  if (!material) {
    material = (
      await supabase
        .from("alloys")
        .select("*")
        .eq("id", body.material_id)
        .eq("is_active", true)
        .maybeSingle()
    ).data;
  }
  if (!material) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }

  const [
    { data: finish },
    { data: tolerance },
    { data: rateCard },
    { data: machines },
    { data: mm },
    { data: mf },
    { data: mr },
    { data: ma },
  ] = await Promise.all([
    body.finish_id
      ? supabase
          .from("finishes")
          .select("*")
          .eq("id", body.finish_id)
          .eq("is_active", true)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    body.tolerance_id
      ? supabase
          .from("tolerances")
          .select("*")
          .eq("id", body.tolerance_id)
          .eq("is_active", true)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("rate_cards")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),
    supabase.from("machines").select("*").eq("is_active", true),
    supabase
      .from("machine_materials")
      .select("machine_id, material_id, material_rate_multiplier, is_active"),
    supabase
      .from("machine_finishes")
      .select("machine_id, finish_id, finish_rate_multiplier, is_active"),
    supabase
      .from("machine_resins")
      .select("machine_id, resin_id, resin_rate_multiplier, is_active"),
    supabase
      .from("machine_alloys")
      .select("machine_id, alloy_id, alloy_rate_multiplier, is_active"),
  ]);

  const materialLinks = [
    ...(mm ?? []),
    ...(mr ?? []).map((r: any) => ({
      machine_id: r.machine_id,
      material_id: r.resin_id,
      material_rate_multiplier: r.resin_rate_multiplier,
      is_active: r.is_active,
    })),
    ...(ma ?? []).map((a: any) => ({
      machine_id: a.machine_id,
      material_id: a.alloy_id,
      material_rate_multiplier: a.alloy_rate_multiplier,
      is_active: a.is_active,
    })),
  ].filter((l: any) => l.is_active !== false);

  const finishLinks = (mf ?? [])
    .filter((l: any) => l.is_active !== false)
    .map((l: any) => ({
      machine_id: l.machine_id,
      finish_id: l.finish_id,
      finish_rate_multiplier: l.finish_rate_multiplier,
    }));

  const pricing = await priceItem({
    process_kind,
    quantity: body.quantity,
    material,
    finish: finish || undefined,
    tolerance: tolerance || undefined,
    geometry: body.geometry,
    lead_time: body.lead_time,
    rate_card: rateCard || {},
    machines: machines || [],
    machineMaterials: materialLinks.map((l) => ({
      machine_id: l.machine_id,
      material_id: l.material_id,
      material_rate_multiplier: l.material_rate_multiplier,
    })),
    machineFinishes: finishLinks,
  });

  return NextResponse.json(pricing);
}
