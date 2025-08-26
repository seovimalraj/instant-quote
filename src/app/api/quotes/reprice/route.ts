import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { priceItem } from "@/lib/pricing";
import { normalizeProcessKind } from "@/lib/process";
import { z } from "zod";

const requestSchema = z.object({
  quoteId: z.string().uuid(),
  itemId: z.string().uuid().optional(),
  machineId: z.string().uuid().optional(),
  overrides: z
    .object({
      rate_per_min: z.number().optional(),
      setup_fee: z.number().optional(),
      margin_pct: z.number().optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" && profile?.role !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = requestSchema.parse(await req.json());
  } catch (err: any) {
    const message = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const { quoteId, itemId, machineId, overrides } = body;

  if (itemId && machineId) {
    await supabase
      .from("quote_items")
      .update({ machine_id: machineId })
      .eq("id", itemId)
      .eq("quote_id", quoteId);
  }

  const { data: rateCard } = await supabase
    .from("rate_cards")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .single();

  const { data: items } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", quoteId);

  if (!items || !items.length) {
    return NextResponse.json({ error: "No items" }, { status: 400 });
  }

  let subtotal = 0;
  let tax = 0;
  let shipping = 0;
  let total = 0;

  for (const item of items) {
    if (itemId && item.id === itemId && machineId) {
      item.machine_id = machineId;
    }

    const [
      { data: part },
      { data: material },
      { data: finish },
      { data: tolerance },
      machineRes,
    ] = await Promise.all([
      supabase.from("parts").select("*").eq("id", item.part_id).single(),
      supabase.from("materials").select("*").eq("id", item.material_id).single(),
      item.finish_id
        ? supabase.from("finishes").select("*").eq("id", item.finish_id).single()
        : Promise.resolve({ data: null } as any),
      item.tolerance_id
        ? supabase.from("tolerances").select("*").eq("id", item.tolerance_id).single()
        : Promise.resolve({ data: null } as any),
      item.machine_id
        ? supabase.from("machines").select("*").eq("id", item.machine_id).single()
        : Promise.resolve({ data: null } as any),
    ]);

    const machine = machineRes?.data ?? null;

    const geometry = {
      volume_mm3: part?.volume_mm3 ?? 0,
      surface_area_mm2: part?.surface_area_mm2 ?? 0,
      bbox: part?.bbox ?? [0, 0, 0],
      thickness_mm: part?.thickness_mm ?? undefined,
      holes_count: part?.holes_count ?? undefined,
      bends_count: part?.bends_count ?? undefined,
      max_overhang_deg: part?.max_overhang_deg ?? undefined,
    };

    const leadTime =
      item.lead_time_days && item.lead_time_days <= 3 ? "expedite" : "standard";

    const existingOverrides =
      (item.pricing_breakdown as any)?.overrides ?? {};
    const appliedOverrides =
      item.id === itemId
        ? { ...existingOverrides, ...(overrides ?? {}) }
        : existingOverrides;

    const rateCardForItem: any = { ...(rateCard || {}) };
    const rateKeyMap: Record<string, string> = {
      cnc_milling: "three_axis_rate_per_min",
      cnc_turning: "turning_rate_per_min",
      sheet_metal: "laser_rate_per_min",
    };
    const rateKey = rateKeyMap[item.process_code as keyof typeof rateKeyMap];
    const ratePerMin = appliedOverrides.rate_per_min ?? machine?.rate_per_min ?? 0;
    if (rateKey) {
      rateCardForItem[rateKey] = ratePerMin;
    }

    const processKind = normalizeProcessKind(item.process_code as string);
    const pricing = await priceItem({
      process_kind: processKind,
      quantity: item.quantity,
      material: material!,
      finish: finish || undefined,
      tolerance: tolerance || undefined,
      geometry,
      lead_time: leadTime,
      rate_card: rateCardForItem,
      machines: [],
      machineMaterials: [],
      machineFinishes: [],
    });

    const setupFee = appliedOverrides.setup_fee ?? machine?.setup_fee ?? 0;
    const marginPct = appliedOverrides.margin_pct ?? machine?.margin_pct ?? 0;
    const marginFactor = 1 + marginPct;

    const itemSubtotal = (pricing.subtotal + setupFee) * marginFactor;
    const itemTax = pricing.tax * marginFactor;
    const itemShipping = pricing.shipping * marginFactor;
    const itemTotal = itemSubtotal + itemTax + itemShipping;

    const breakdown: any = { ...pricing.breakdownJson, overrides: appliedOverrides };

    await supabase
      .from("quote_items")
      .update({
        machine_id: item.machine_id,
        unit_price: itemTotal / item.quantity,
        line_total: itemTotal,
        pricing_breakdown: breakdown,
        lead_time_days: pricing.lead_time_days,
      })
      .eq("id", item.id);

    subtotal += itemSubtotal;
    tax += itemTax;
    shipping += itemShipping;
    total += itemTotal;
  }

  await supabase
    .from("quotes")
    .update({ subtotal, tax, shipping, total })
    .eq("id", quoteId);

  await supabase.from("activities").insert({
    actor_id: user.id,
    quote_id: quoteId,
    type: "quote_repriced",
    data: {
      item_id: itemId ?? null,
      machine_id: machineId ?? null,
      overrides: overrides ?? null,
    },
  });

  return NextResponse.json({ subtotal, tax, shipping, total });
}

