"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const formSchema = z.object({
  process_code: z.string(),
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
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      quantity: 1,
      units: "mm",
      lead_time: "standard",
    },
  });

  const [processes, setProcesses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [finishes, setFinishes] = useState<any[]>([]);
  const [tolerances, setTolerances] = useState<any[]>([]);

  const processCode = watch("process_code");

  useEffect(() => {
    const loadCatalogs = async () => {
      const supabase = createClient();
      const [proc, mat, fin, tol] = await Promise.all([
        supabase.from("processes").select("code,name").eq("is_active", true),
        supabase.from("materials").select("id,name,process_code").eq("is_active", true),
        supabase.from("finishes").select("id,name,process_code").eq("is_active", true),
        supabase.from("tolerances").select("id,name,process_code").eq("is_active", true),
      ]);
      setProcesses(proc.data ?? []);
      setMaterials(mat.data ?? []);
      setFinishes(fin.data ?? []);
      setTolerances(tol.data ?? []);
    };
    loadCatalogs();
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const parsed = formSchema.parse(values);
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed, partId }),
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

  const filteredMaterials = materials.filter((m) => m.process_code === processCode);
  const filteredFinishes = finishes.filter((f) => f.process_code === processCode);
  const filteredTolerances = tolerances.filter((t) => t.process_code === processCode);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Process</label>
        <select {...register("process_code", { required: true })} className="w-full border rounded p-2">
          <option value="">Select process</option>
          {processes.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Material</label>
        <select {...register("material_id", { required: true })} className="w-full border rounded p-2">
          <option value="">Select material</option>
          {filteredMaterials.map((m) => (
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
          {filteredFinishes.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tolerance</label>
        <select {...register("tolerance_id")} className="w-full border rounded p-2">
          <option value="">Standard</option>
          {filteredTolerances.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <select {...register("quantity", { valueAsNumber: true })} className="w-full border rounded p-2">
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
        <select {...register("lead_time")} className="w-full border rounded p-2">
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

