"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { calculatePricing, PricingResult } from "@/lib/pricing";
import { Geometry } from "@/lib/validators/pricing";
import { createClient } from "@/lib/supabase/client";
import { BreakdownJson } from "./PriceExplainerModal";
import { BreakdownLine } from "./BreakdownRow";

interface Props {
  partId: string;
  onPricingChange?: (info: {
    price: PricingResult;
    breakdown: BreakdownJson;
    processKind: string;
    leadTime: string;
  }) => void;
}

export default function InstantQuoteForm({ partId, onPricingChange }: Props) {
  const [part, setPart] = useState<any | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [finishes, setFinishes] = useState<any[]>([]);
  const [tolerances, setTolerances] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [rateCard, setRateCard] = useState<any | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const { register, watch, setValue } = useForm<any>({
    defaultValues: {
      quantity: 1,
      cavities: 1,
      projected_area_cm2: 0,
      annual_volume: 0,
      machining_allowance_pct: 0,
      heat_treat: false,
      lead_time: "standard",
    },
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: partData } = await supabase
        .from("parts")
        .select("*")
        .eq("id", partId)
        .single();
      if (!partData) return;

      if (
        partData.volume_mm3 === null ||
        partData.surface_area_mm2 === null ||
        partData.bbox === null
      ) {
        const res = await fetch("/api/parts/geometry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ part_id: partId }),
        });
        if (res.ok) {
          const g = await res.json();
          partData.volume_mm3 = g.geometry.volume_mm3;
          partData.surface_area_mm2 = g.geometry.surface_area_mm2;
          partData.bbox = g.geometry.bbox;
        }
      }

      const [materialsRes, finishesRes, tolerancesRes, machinesRes, rateCardRes] =
        await Promise.all([
          supabase
            .from("materials")
            .select("*")
            .eq("is_active", true)
            .eq("process_code", partData.process_code),
          supabase
            .from("finishes")
            .select("*")
            .eq("is_active", true)
            .eq("process_code", partData.process_code),
          supabase
            .from("tolerances")
            .select("*")
            .eq("is_active", true)
            .eq("process_code", partData.process_code),
          supabase
            .from("machines")
            .select("*")
            .eq("process_code", partData.process_code)
            .eq("is_active", true),
          supabase
            .from("rate_cards")
            .select("*")
            .eq("is_active", true)
            .limit(1)
            .single(),
        ]);

  setPart(partData);
  setMaterials(materialsRes.data ?? []);
  setFinishes(finishesRes.data ?? []);
  setTolerances(tolerancesRes.data ?? []);
  setMachines(machinesRes.data ?? []);
  setRateCard(rateCardRes.data ?? null);

  if (materialsRes.data && materialsRes.data[0]) {
    setValue("material_id", materialsRes.data[0].id);
    setValue("resin_id", materialsRes.data[0].id);
    setValue("alloy_id", materialsRes.data[0].id);
  }
    }
    load();
  }, [partId, setValue]);

  const materialId = watch("material_id");
  const finishId = watch("finish_id");
  const toleranceId = watch("tolerance_id");
  const quantity = watch("quantity");
  const leadTime = watch("lead_time");

  const resinId = watch("resin_id");
  const cavities = watch("cavities");
  const projectedArea = watch("projected_area_cm2");
  const annualVolume = watch("annual_volume");

  const alloyId = watch("alloy_id");
  const castingType = watch("casting_type");
  const machiningAllowance = watch("machining_allowance_pct");
  const heatTreat = watch("heat_treat");

  function buildBreakdown(pricing: PricingResult, currency: string): BreakdownJson {
    const lines: BreakdownLine[] = [];
    for (const [key, value] of Object.entries(pricing.breakdown)) {
      lines.push({ label: key.replace(/_/g, " "), value, kind: "overhead" });
    }
    return {
      lines,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      shipping: pricing.shipping,
      total: pricing.total,
      currency: currency as any,
    };
  }

  useEffect(() => {
    if (!part || !rateCard) return;
    const processKind = part.process_code || "";

    const material =
      materials.find((m) => m.id === materialId || m.id === resinId || m.id === alloyId) ||
      materials[0];
    if (!material) return;

    const finish = finishes.find((f) => f.id === finishId);
    const tolerance = tolerances.find((t) => t.id === toleranceId);

    const geom: Geometry = {
      volume_mm3: part.volume_mm3 ?? 0,
      surface_area_mm2: part.surface_area_mm2 ?? 0,
      bbox: (part.bbox as [number, number, number]) ?? [0, 0, 0],
    };

    const bbox = geom.bbox;
    const machine = machines
      .filter((m) => {
        if (!m.envelope_mm) return true;
        const { x, y, z } = m.envelope_mm;
        return (
          bbox[0] <= (x ?? Infinity) &&
          bbox[1] <= (y ?? Infinity) &&
          bbox[2] <= (z ?? Infinity)
        );
      })
      .sort((a, b) => (a.rate_per_min ?? 0) - (b.rate_per_min ?? 0))[0];

    const rc = { ...(rateCard || {}) } as any;
    if (machine) {
      switch (part.process_code) {
        case "cnc_milling":
          rc.three_axis_rate_per_min = machine.rate_per_min;
          break;
        case "cnc_turning":
          rc.turning_rate_per_min = machine.rate_per_min;
          break;
        case "sheet_metal":
          rc.laser_rate_per_min = machine.rate_per_min;
          break;
        case "3dp_fdm":
          rc.fdm_rate_per_cm3 = machine.rate_per_min;
          break;
        case "3dp_sla":
          rc.sla_rate_per_cm3 = machine.rate_per_min;
          break;
        case "3dp_sls":
          rc.sls_rate_per_cm3 = machine.rate_per_min;
          break;
      }
    }

    const qty =
      processKind.startsWith("injection") ? annualVolume || 1 : quantity || 1;

    const pricing = calculatePricing({
      process: part.process_code,
      quantity: qty,
      material,
      finish: finish || undefined,
      tolerance: tolerance || undefined,
      geometry: geom,
      lead_time: leadTime,
      rate_card: rc,
    });

    const currency = rateCard?.currency || "USD";
    const breakdown = buildBreakdown(pricing, currency);

    onPricingChange?.({
      price: pricing,
      breakdown,
      processKind: part.process_code,
      leadTime,
    });

    async function checkFeasibility() {
      try {
        const res = await fetch("/api/quotes/feasibility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            part_id: partId,
            process_code: part.process_code,
            inputs: {
              material_id: materialId || resinId || alloyId,
              finish_id: finishId,
              tolerance_id: toleranceId,
              quantity: qty,
              cavities,
              projected_area_cm2: projectedArea,
              annual_volume: annualVolume,
              casting_type: castingType,
              machining_allowance_pct: machiningAllowance,
              heat_treat: heatTreat,
              lead_time: leadTime,
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setWarnings(data.warnings || []);
        } else {
          setWarnings([]);
        }
      } catch {
        setWarnings([]);
      }
    }
    checkFeasibility();
  }, [
    part,
    rateCard,
    materials,
    finishes,
    tolerances,
    machines,
    materialId,
    finishId,
    toleranceId,
    quantity,
    leadTime,
    resinId,
    cavities,
    projectedArea,
    annualVolume,
    alloyId,
    castingType,
    machiningAllowance,
    heatTreat,
    onPricingChange,
    partId,
  ]);

  if (!part) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  const processKind = part.process_code.startsWith("cnc")
    ? "cnc"
    : part.process_code.includes("injection")
    ? "injection"
    : part.process_code.includes("casting")
    ? "casting"
    : "other";

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      {warnings.length > 0 && (
        <ul className="p-2 bg-yellow-50 text-yellow-700 rounded text-sm space-y-1">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}

      {processKind === "cnc" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Material</label>
            <select
              {...register("material_id", { required: true })}
              className="w-full border rounded p-2"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Finish</label>
            <select {...register("finish_id")} className="w-full border rounded p-2">
              <option value="">None</option>
              {finishes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tolerance</label>
            <select
              {...register("tolerance_id")}
              className="w-full border rounded p-2"
            >
              <option value="">Standard</option>
              {tolerances.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <select
                {...register("quantity", { valueAsNumber: true })}
                className="w-full border rounded p-2"
              >
                {[1, 2, 5, 10, 25, 50, 100].map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Lead time</label>
              <select
                {...register("lead_time")}
                className="w-full border rounded p-2"
              >
                <option value="standard">Standard</option>
                <option value="expedite">Expedite</option>
              </select>
            </div>
          </div>
        </>
      )}

      {processKind === "injection" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Resin</label>
            <select
              {...register("resin_id", { required: true })}
              className="w-full border rounded p-2"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Cavities</label>
              <input
                type="number"
                {...register("cavities", { valueAsNumber: true })}
                className="w-full border rounded p-2"
                min={1}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Projected Area (cm²)
              </label>
              <input
                type="number"
                {...register("projected_area_cm2", { valueAsNumber: true })}
                className="w-full border rounded p-2"
                min={0}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Annual Volume (optional)
            </label>
            <input
              type="number"
              {...register("annual_volume", { valueAsNumber: true })}
              className="w-full border rounded p-2"
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Lead time</label>
            <select
              {...register("lead_time")}
              className="w-full border rounded p-2"
            >
              <option value="standard">Standard</option>
              <option value="expedite">Expedite</option>
            </select>
          </div>
        </>
      )}

      {processKind === "casting" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Alloy</label>
            <select
              {...register("alloy_id", { required: true })}
              className="w-full border rounded p-2"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Casting Type</label>
            <select
              {...register("casting_type")}
              className="w-full border rounded p-2"
            >
              <option value="die_cast">Die Cast</option>
              <option value="sand_cast">Sand Cast</option>
              <option value="investment_cast">Investment Cast</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Machining Allowance (%)
            </label>
            <input
              type="number"
              {...register("machining_allowance_pct", { valueAsNumber: true })}
              className="w-full border rounded p-2"
              min={0}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input type="checkbox" {...register("heat_treat")} />
            <label className="text-sm">Heat Treat</label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Lead time</label>
            <select
              {...register("lead_time")}
              className="w-full border rounded p-2"
            >
              <option value="standard">Standard</option>
              <option value="expedite">Expedite</option>
            </select>
          </div>
        </>
      )}
    </form>
  );
}

