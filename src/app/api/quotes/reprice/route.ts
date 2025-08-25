import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculatePricing } from "@/lib/pricing";
import { z } from "zod";

const requestSchema = z.object({
  quoteId: z.string().uuid(),
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
  const { quoteId } = body;

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
    const [{ data: part }, { data: material }, { data: finish }, { data: tolerance }] =
      await Promise.all([
        supabase.from("parts").select("*").eq("id", item.part_id).single(),
        supabase.from("materials").select("*").eq("id", item.material_id).single(),
        item.finish_id
          ? supabase.from("finishes").select("*").eq("id", item.finish_id).single()
          : Promise.resolve({ data: null } as any),
        item.tolerance_id
          ? supabase.from("tolerances").select("*").eq("id", item.tolerance_id).single()
          : Promise.resolve({ data: null } as any),
      ]);

    const geometry = {
      volume_mm3: part?.volume_mm3 ?? 0,
      surface_area_mm2: part?.surface_area_mm2 ?? 0,
      bbox: part?.bbox ?? [0, 0, 0],
      thickness_mm: part?.thickness_mm ?? undefined,
      holes_count: part?.holes_count ?? undefined,
      bends_count: part?.bends_count ?? undefined,
      max_overhang_deg: part?.max_overhang_deg ?? undefined,
    };

    const leadTime = item.lead_time_days && item.lead_time_days <= 3 ? "expedite" : "standard";

    const pricing = calculatePricing({
      process: item.process_code as any,
      quantity: item.quantity,
      material: material!,
      finish: finish || undefined,
      tolerance: tolerance || undefined,
      geometry,
      lead_time: leadTime,
      rate_card: rateCard || {},
    });

    await supabase
      .from("quote_items")
      .update({
        unit_price: pricing.total / item.quantity,
        line_total: pricing.total,
        pricing_breakdown: pricing.breakdownJson,
        lead_time_days: pricing.lead_time_days,
      })
      .eq("id", item.id);

    subtotal += pricing.subtotal;
    tax += pricing.tax;
    shipping += pricing.shipping;
    total += pricing.total;
  }

  await supabase
    .from("quotes")
    .update({ subtotal, tax, shipping, total })
    .eq("id", quoteId);

  return NextResponse.json({ subtotal, tax, shipping, total });
}

