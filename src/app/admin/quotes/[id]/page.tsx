import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { calculatePricing } from "@/lib/pricing";
import { normalizeProcessKind } from "@/lib/process";

interface Props {
  params: { id: string };
}

export default async function QuoteDetailPage({ params }: Props) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", params.id)
    .single();
  const { data: items } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", params.id);
  const { data: rateCard } = await supabase
    .from("rate_cards")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .single();

  const machinesByItem: Record<string, { id: string; name: string; total: number }[]> = {};
  for (const item of items ?? []) {
    const [
      { data: part },
      { data: material },
      { data: finish },
      { data: tolerance },
      { data: machinesRaw },
      { data: matLinks },
      finLinksRes,
    ] = await Promise.all([
      supabase.from("parts").select("*").eq("id", item.part_id).single(),
      supabase.from("materials").select("*").eq("id", item.material_id).single(),
      item.finish_id
        ? supabase.from("finishes").select("*").eq("id", item.finish_id).single()
        : Promise.resolve({ data: null } as any),
      item.tolerance_id
        ? supabase.from("tolerances").select("*").eq("id", item.tolerance_id).single()
        : Promise.resolve({ data: null } as any),
      supabase
        .from("machines")
        .select("*")
        .eq("process_code", item.process_code)
        .eq("is_active", true),
      supabase
        .from("machine_materials")
        .select("machine_id")
        .eq("material_id", item.material_id),
      item.finish_id
        ? supabase
            .from("machine_finishes")
            .select("machine_id")
            .eq("finish_id", item.finish_id)
        : Promise.resolve({ data: [] } as any),
    ]);

    const finishLinks = finLinksRes.data as any[];
    const allowedMaterialIds = (matLinks ?? []).map((m: any) => m.machine_id);
    const allowedFinishIds = (finishLinks ?? []).map((f: any) => f.machine_id);

    const feasible = (machinesRaw ?? []).filter(
      (m: any) =>
        allowedMaterialIds.includes(m.id) &&
        (!item.finish_id || allowedFinishIds.includes(m.id)),
    );

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

    machinesByItem[item.id] = await Promise.all(
      feasible.map(async (m: any) => {
        const rateCardForItem: any = { ...(rateCard || {}) };
        const rateKeyMap: Record<string, string> = {
          cnc_milling: "three_axis_rate_per_min",
          cnc_turning: "turning_rate_per_min",
          sheet_metal: "laser_rate_per_min",
        };
        const rateKey = rateKeyMap[item.process_code as keyof typeof rateKeyMap];
        if (rateKey) {
          rateCardForItem[rateKey] = m.rate_per_min;
        }
        const pricing = await calculatePricing({
          process_kind: normalizeProcessKind(item.process_code as string),
          quantity: item.quantity,
          material: material!,
          finish: finish || undefined,
          tolerance: tolerance || undefined,
          geometry,
          lead_time: leadTime,
          rate_card: rateCardForItem,
        });
        const total =
          (pricing.total + (m.setup_fee ?? 0)) * (1 + (m.margin_pct ?? 0));
        return { id: m.id, name: m.name, total };
      }),
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  async function selectMachine(formData: FormData) {
    "use server";
    const itemId = formData.get("item_id") as string;
    const machineId = formData.get("machine_id") as string;
    await fetch(`${origin}/api/quotes/reprice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId: params.id, itemId, machineId }),
    });
  }

  async function applyOverrides(formData: FormData) {
    "use server";
    const itemId = formData.get("item_id") as string;
    const rate_per_min = parseFloat(formData.get("rate_per_min") as string);
    const setup_fee = parseFloat(formData.get("setup_fee") as string);
    const margin_pct = parseFloat(formData.get("margin_pct") as string);
    const overrides: any = {};
    if (!Number.isNaN(rate_per_min)) overrides.rate_per_min = rate_per_min;
    if (!Number.isNaN(setup_fee)) overrides.setup_fee = setup_fee;
    if (!Number.isNaN(margin_pct)) overrides.margin_pct = margin_pct;
    await fetch(`${origin}/api/quotes/reprice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId: params.id, itemId, overrides }),
    });
  }

  async function acceptQuote() {
    "use server";
    const supabase = await createClient();
    await supabase.from("quotes").update({ status: "accepted" }).eq("id", params.id);
    await fetch(`${origin}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId: params.id }),
    });
  }

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Quote {params.id}</h1>
      <div className="flex space-x-4">
        <form action={acceptQuote}>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Accept &amp; Create Order
          </button>
        </form>
      </div>
      <ul className="space-y-4">
        {items?.map((item) => (
          <li key={item.id} className="border p-4 rounded flex">
            <div className="flex-1 space-y-1 text-sm">
              <p>Part: {item.part_id}</p>
              <p>Quantity: {item.quantity}</p>
              <p>Machine: {item.machine_id ?? "n/a"}</p>
              <p>Line Total: {item.line_total}</p>
            </div>
            <aside className="w-64 ml-4 border-l pl-4 text-sm space-y-2">
              <h3 className="font-semibold">Machine &amp; Rates</h3>
              <ul className="space-y-1">
                {machinesByItem[item.id]?.map((m) => (
                  <li key={m.id}>
                    <form action={selectMachine}>
                      <input type="hidden" name="item_id" value={item.id} />
                      <input type="hidden" name="machine_id" value={m.id} />
                      <button
                        type="submit"
                        className="underline text-blue-600"
                      >
                        {m.name} (${m.total.toFixed(2)})
                      </button>
                    </form>
                  </li>
                ))}
                {!machinesByItem[item.id]?.length && (
                  <li>No machines</li>
                )}
              </ul>
              <form action={applyOverrides} className="space-y-1 mt-2">
                <input type="hidden" name="item_id" value={item.id} />
                <div>
                  <label className="block">Rate/min</label>
                  <input
                    name="rate_per_min"
                    defaultValue={
                      (item.pricing_breakdown as any)?.overrides?.rate_per_min ?? ""
                    }
                    className="border p-1 w-full"
                  />
                </div>
                <div>
                  <label className="block">Setup Fee</label>
                  <input
                    name="setup_fee"
                    defaultValue={
                      (item.pricing_breakdown as any)?.overrides?.setup_fee ?? ""
                    }
                    className="border p-1 w-full"
                  />
                </div>
                <div>
                  <label className="block">Margin %</label>
                  <input
                    name="margin_pct"
                    defaultValue={
                      (item.pricing_breakdown as any)?.overrides?.margin_pct ?? ""
                    }
                    className="border p-1 w-full"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-1 px-2 py-1 bg-blue-600 text-white rounded"
                >
                  Apply
                </button>
              </form>
            </aside>
          </li>
        ))}
        {!items?.length && <li className="text-sm text-gray-500">No items</li>}
      </ul>
      <p className="text-sm">Total: {quote?.total}</p>
    </div>
  );
}

