"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { calculatePricing, PricingResult } from "@/lib/pricing";
import { Geometry } from "@/lib/validators/pricing";
import { createClient } from "@/lib/supabase/client";

const formSchema = z.object({
  material_id: z.string(),
  finish_id: z.string().optional(),
  tolerance_id: z.string().optional(),
  quantity: z.number().min(1),
  units: z.enum(["mm", "inch"]),
  lead_time: z.enum(["standard", "expedite"]),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  partId: string;
}

export default function InstantQuoteForm({ partId }: Props) {
  const router = useRouter();
  const [part, setPart] = useState<any | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [finishes, setFinishes] = useState<any[]>([]);
  const [tolerances, setTolerances] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [rateCard, setRateCard] = useState<any | null>(null);
  const [price, setPrice] = useState<PricingResult | null>(null);

  const { register, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: { quantity: 1, units: "mm", lead_time: "standard" },
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

      // compute geometry if missing
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
          supabase.from("materials").select("*").eq("is_active", true),
          supabase.from("finishes").select("*").eq("is_active", true),
          supabase.from("tolerances").select("*").eq("is_active", true),
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
      }
      setValue("units", partData.units || "mm");
    }
    load();
  }, [partId, setValue]);

  const materialId = watch("material_id");
  const finishId = watch("finish_id");
  const toleranceId = watch("tolerance_id");
  const quantity = watch("quantity");
  const leadTime = watch("lead_time");

  useEffect(() => {
    if (!part || !rateCard) return;
    const material = materials.find((m) => m.id === materialId);
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
    const pricing = calculatePricing({
      process: part.process_code,
      quantity: quantity || 1,
      material,
      finish: finish || undefined,
      tolerance: tolerance || undefined,
      geometry: geom,
      lead_time: leadTime,
      rate_card: rc,
    });
    setPrice(pricing);
  }, [
    materialId,
    finishId,
    toleranceId,
    quantity,
    leadTime,
    machines,
    materials,
    finishes,
    tolerances,
    part,
    rateCard,
  ]);

  const onSubmit = handleSubmit(async (values) => {
    if (!part) return;
    try {
      const parsed = formSchema.parse(values);
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed,
          partId: part.id,
          process_code: part.process_code,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/quote/${data.quote.id}`);
      } else {
        console.error(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  });

  if (!part) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {price && (
        <div className="p-4 bg-gray-100 rounded">
          <p className="text-lg font-medium">
            Estimated Price: ${price.total.toFixed(2)}
          </p>
        </div>
      )}

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
        <select
          {...register("finish_id")}
          className="w-full border rounded p-2"
        >
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
          <label className="block text-sm font-medium mb-1">Units</label>
          <select {...register("units")} className="w-full border rounded p-2">
            <option value="mm">Metric (mm)</option>
            <option value="inch">Imperial (inch)</option>
          </select>
        </div>
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

      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
        Get Quote
      </button>
    </form>
  );
}

