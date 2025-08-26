import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { priceItem } from "@/lib/pricing";
import { evaluateDfM } from "@/lib/dfm";
import { normalizeProcessKind } from "@/lib/process";

const requestSchema = z.object({
  partId: z.string().uuid(),
  process: z.string(),
  material_id: z.string().uuid(),
  finish_id: z.string().uuid().optional(),
  tolerance_id: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  units: z.enum(["mm", "inch"]),
  lead_time: z.enum(["standard", "expedite"]),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = requestSchema.parse(await req.json());
  } catch (err: any) {
    const message = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("owner_id", user.id)
      .single();
    let customerId = existingCustomer?.id;
    if (!customerId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,email")
        .eq("id", user.id)
        .single();
      const { data: newCustomer, error: custErr } = await supabase
        .from("customers")
        .insert({
          owner_id: user.id,
          name: profile?.full_name ?? profile?.email ?? "Customer",
        })
        .select("id")
        .single();
      if (custErr) throw custErr;
      customerId = newCustomer.id;
    }

    const { data: part, error: partErr } = await supabase
      .from("parts")
      .select("*")
      .eq("id", body.partId)
      .single();
    if (partErr) throw partErr;

    const [{ data: material }, { data: finish }, { data: tolerance }, { data: rateCard }] =
      await Promise.all([
        supabase.from("materials").select("*").eq("id", body.material_id).eq("is_active", true).single(),
        body.finish_id
          ? supabase
              .from("finishes")
              .select("*")
              .eq("id", body.finish_id)
              .eq("is_active", true)
              .single()
          : Promise.resolve({ data: null } as any),
        body.tolerance_id
          ? supabase
              .from("tolerances")
              .select("*")
              .eq("id", body.tolerance_id)
              .eq("is_active", true)
              .single()
          : Promise.resolve({ data: null } as any),
        supabase.from("rate_cards").select("*").eq("is_active", true).limit(1).single(),
      ]);

    const geometry = {
      volume_mm3: part.volume_mm3 ?? 0,
      surface_area_mm2: part.surface_area_mm2 ?? 0,
      bbox: part.bbox ?? [0, 0, 0],
      thickness_mm: part.thickness_mm ?? undefined,
      holes_count: part.holes_count ?? undefined,
      bends_count: part.bends_count ?? undefined,
      max_overhang_deg: part.max_overhang_deg ?? undefined,
    };

    const processKind = normalizeProcessKind(body.process);
    const pricing = await priceItem({
      process_kind: processKind,
      quantity: body.quantity,
      material: material!,
      finish: finish || undefined,
      tolerance: tolerance || undefined,
      geometry,
      lead_time: body.lead_time,
      rate_card: rateCard || {},
      machines: [],
      machineMaterials: [],
      machineFinishes: [],
    });

    const dfmHints = evaluateDfM(body.process, geometry);

    const { data: quote } = await supabase
      .from("quotes")
      .insert({
        customer_id: customerId,
        created_by: user.id,
        status: "draft",
        currency: rateCard?.currency ?? "USD",
        region: rateCard?.region,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        shipping: pricing.shipping,
        total: pricing.total,
      })
      .select("*")
      .single();

    const { data: item } = await supabase
      .from("quote_items")
      .insert({
        quote_id: quote.id,
        part_id: part.id,
        process_code: body.process,
        material_id: body.material_id,
        finish_id: body.finish_id,
        tolerance_id: body.tolerance_id,
        quantity: body.quantity,
        unit_price: pricing.total / body.quantity,
        line_total: pricing.total,
        pricing_breakdown: pricing.breakdownJson,
        lead_time_days: pricing.lead_time_days,
        dfm: dfmHints,
      })
      .select("*")
      .single();

    return NextResponse.json({ quote, item });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
  }
}

