import { requireAdmin } from "@/lib/auth";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { useState } from "react";

interface Props {
  params: { id: string };
}

export default async function MachineDetailPage({ params }: Props) {
  await requireAdmin();
  const supabase = createServerClient();
  const { data: machine } = await supabase
    .from("machines")
    .select("*")
    .eq("id", params.id)
    .single();
  return <ClientPage machine={machine} />;
}

function ClientPage({ machine }: { machine: any }) {
  "use client";

  const [form, setForm] = useState<any>({
    name: machine.name || "",
    rate_per_min: machine.rate_per_min ?? 0,
    margin_pct: machine.margin_pct ?? 0,
    is_active: machine.is_active ?? true,
    axis_count: machine.axis_count ?? 3,
    envelope_mm_x: machine.envelope_mm?.[0] ?? 0,
    envelope_mm_y: machine.envelope_mm?.[1] ?? 0,
    envelope_mm_z: machine.envelope_mm?.[2] ?? 0,
    clamp_tonnage: machine.meta?.clamp_tonnage ?? 0,
    shot_volume_cc: machine.meta?.shot_volume_cc ?? 0,
    max_cast_weight_kg: machine.meta?.max_cast_weight_kg ?? 0,
    mold_size_mm: machine.meta?.mold_size_mm ?? 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"details" | "test">("details");

  const baseSchema = z.object({
    name: z.string().min(1),
    rate_per_min: z.number().nonnegative(),
    margin_pct: z.number().nonnegative(),
    is_active: z.boolean().optional(),
  });
  const cncSchema = baseSchema.extend({
    axis_count: z.number().int().positive(),
    envelope_mm_x: z.number().nonnegative(),
    envelope_mm_y: z.number().nonnegative(),
    envelope_mm_z: z.number().nonnegative(),
  });
  const injectionSchema = baseSchema.extend({
    clamp_tonnage: z.number().nonnegative(),
    shot_volume_cc: z.number().nonnegative(),
  });
  const castingSchema = baseSchema.extend({
    max_cast_weight_kg: z.number().nonnegative(),
    mold_size_mm: z.number().nonnegative(),
  });

  const process = machine.process_code || "";
  const schema = process.includes("injection")
    ? injectionSchema
    : process.includes("casting")
    ? castingSchema
    : cncSchema;

  const handleChange = (name: string, value: any) => {
    setForm((f: any) => ({ ...f, [name]: value }));
  };

  const save = async () => {
    const result = schema.safeParse(form);
    if (!result.success) {
      const map: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        const key = i.path[0] as string;
        map[key] = i.message;
      });
      setErrors(map);
      return;
    }
    await fetch(`/api/machines/${machine.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
    });
    alert("Saved");
  };

  const [sim, setSim] = useState({
    volume_mm3: "",
    surface_area_mm2: "",
    quantity: 1,
  });
  const [simErrors, setSimErrors] = useState<Record<string, string>>({});
  const [breakdown, setBreakdown] = useState<any | null>(null);
  const simSchema = z.object({
    volume_mm3: z.number().nonnegative(),
    surface_area_mm2: z.number().nonnegative(),
    quantity: z.number().int().positive(),
  });

  const runSim = async () => {
    const parsed = simSchema.safeParse({
      volume_mm3: Number(sim.volume_mm3),
      surface_area_mm2: Number(sim.surface_area_mm2),
      quantity: Number(sim.quantity),
    });
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const key = i.path[0] as string;
        map[key] = i.message;
      });
      setSimErrors(map);
      return;
    }
    setSimErrors({});
    const body = {
      process: machine.process_code,
      quantity: parsed.data.quantity,
      geometry: {
        volume_mm3: parsed.data.volume_mm3,
        surface_area_mm2: parsed.data.surface_area_mm2,
        bbox: [0, 0, 0],
      },
      material: { cost_per_kg: 0 },
      rate_card: {},
    };
    const res = await fetch("/api/pricing/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setBreakdown(json.breakdown || json);
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-4">{machine.name}</h1>
      <nav className="mb-6 border-b">
        <ul className="flex space-x-4">
          <li>
            <a
              href={`/admin/materials?process=${process}`}
              className="text-blue-600"
            >
              Materials
            </a>
          </li>
          <li>
            <a
              href={`/admin/finishes?process=${process}`}
              className="text-blue-600"
            >
              Finishes
            </a>
          </li>
          <li>
            <a
              href={`/admin/resins?process=${process}`}
              className="text-blue-600"
            >
              Resins
            </a>
          </li>
          <li>
            <a
              href={`/admin/alloys?process=${process}`}
              className="text-blue-600"
            >
              Alloys
            </a>
          </li>
          <li>
            <button
              className={tab === "test" ? "font-semibold" : "text-blue-600"}
              onClick={() => setTab("test")}
            >
              Test Pricing
            </button>
          </li>
        </ul>
      </nav>
      {tab === "details" && (
        <div className="space-y-4">
          <div>
            <label className="block mb-1">
              Name
            </label>
            <input
              className="border rounded p-2 w-full"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            {errors.name && (
              <p className="text-red-600 text-sm">{errors.name}</p>
            )}
          </div>
          <div>
            <label className="block mb-1" title="Cost per minute of machine time">
              Rate per min
            </label>
            <input
              type="number"
              className="border rounded p-2 w-full"
              value={form.rate_per_min}
              onChange={(e) => handleChange("rate_per_min", Number(e.target.value))}
            />
            {errors.rate_per_min && (
              <p className="text-red-600 text-sm">{errors.rate_per_min}</p>
            )}
          </div>
          <div>
            <label className="block mb-1" title="Margin percentage applied to costs">
              Margin %
            </label>
            <input
              type="number"
              className="border rounded p-2 w-full"
              value={form.margin_pct}
              onChange={(e) => handleChange("margin_pct", Number(e.target.value))}
            />
            {errors.margin_pct && (
              <p className="text-red-600 text-sm">{errors.margin_pct}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => handleChange("is_active", e.target.checked)}
            />
            <label>Active</label>
          </div>
          {process.includes("injection") && (
            <div className="space-y-4">
              <div>
                <label className="block mb-1" title="Clamp force in tons">
                  Clamp tonnage
                </label>
                <input
                  type="number"
                  className="border rounded p-2 w-full"
                  value={form.clamp_tonnage}
                  onChange={(e) =>
                    handleChange("clamp_tonnage", Number(e.target.value))
                  }
                />
                {errors.clamp_tonnage && (
                  <p className="text-red-600 text-sm">{errors.clamp_tonnage}</p>
                )}
              </div>
              <div>
                <label className="block mb-1" title="Shot volume in cubic centimeters">
                  Shot volume (cc)
                </label>
                <input
                  type="number"
                  className="border rounded p-2 w-full"
                  value={form.shot_volume_cc}
                  onChange={(e) =>
                    handleChange("shot_volume_cc", Number(e.target.value))
                  }
                />
                {errors.shot_volume_cc && (
                  <p className="text-red-600 text-sm">{errors.shot_volume_cc}</p>
                )}
              </div>
            </div>
          )}
          {process.includes("casting") && (
            <div className="space-y-4">
              <div>
                <label className="block mb-1" title="Max part weight in kilograms">
                  Max cast weight (kg)
                </label>
                <input
                  type="number"
                  className="border rounded p-2 w-full"
                  value={form.max_cast_weight_kg}
                  onChange={(e) =>
                    handleChange("max_cast_weight_kg", Number(e.target.value))
                  }
                />
                {errors.max_cast_weight_kg && (
                  <p className="text-red-600 text-sm">{errors.max_cast_weight_kg}</p>
                )}
              </div>
              <div>
                <label className="block mb-1" title="Mold size in millimeters">
                  Mold size (mm)
                </label>
                <input
                  type="number"
                  className="border rounded p-2 w-full"
                  value={form.mold_size_mm}
                  onChange={(e) =>
                    handleChange("mold_size_mm", Number(e.target.value))
                  }
                />
                {errors.mold_size_mm && (
                  <p className="text-red-600 text-sm">{errors.mold_size_mm}</p>
                )}
              </div>
            </div>
          )}
          {process.includes("injection") || process.includes("casting") ? null : (
            <div className="space-y-4">
              <div>
                <label className="block mb-1" title="Number of controllable axes">
                  Axis count
                </label>
                <input
                  type="number"
                  className="border rounded p-2 w-full"
                  value={form.axis_count}
                  onChange={(e) =>
                    handleChange("axis_count", Number(e.target.value))
                  }
                />
                {errors.axis_count && (
                  <p className="text-red-600 text-sm">{errors.axis_count}</p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block mb-1" title="X travel in millimeters">
                    X (mm)
                  </label>
                  <input
                    type="number"
                    className="border rounded p-2 w-full"
                    value={form.envelope_mm_x}
                    onChange={(e) =>
                      handleChange("envelope_mm_x", Number(e.target.value))
                    }
                  />
                  {errors.envelope_mm_x && (
                    <p className="text-red-600 text-sm">
                      {errors.envelope_mm_x}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-1" title="Y travel in millimeters">
                    Y (mm)
                  </label>
                  <input
                    type="number"
                    className="border rounded p-2 w-full"
                    value={form.envelope_mm_y}
                    onChange={(e) =>
                      handleChange("envelope_mm_y", Number(e.target.value))
                    }
                  />
                  {errors.envelope_mm_y && (
                    <p className="text-red-600 text-sm">
                      {errors.envelope_mm_y}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-1" title="Z travel in millimeters">
                    Z (mm)
                  </label>
                  <input
                    type="number"
                    className="border rounded p-2 w-full"
                    value={form.envelope_mm_z}
                    onChange={(e) =>
                      handleChange("envelope_mm_z", Number(e.target.value))
                    }
                  />
                  {errors.envelope_mm_z && (
                    <p className="text-red-600 text-sm">
                      {errors.envelope_mm_z}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={save}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Save
          </button>
        </div>
      )}
      {tab === "test" && (
        <div className="space-y-4">
          <div>
            <label className="block mb-1" title="Part volume in cubic millimeters">
              Volume mm³
            </label>
            <input
              type="number"
              className="border rounded p-2 w-full"
              value={sim.volume_mm3}
              onChange={(e) => setSim({ ...sim, volume_mm3: e.target.value })}
            />
            {simErrors.volume_mm3 && (
              <p className="text-red-600 text-sm">{simErrors.volume_mm3}</p>
            )}
          </div>
          <div>
            <label className="block mb-1" title="Surface area in square millimeters">
              Surface area mm²
            </label>
            <input
              type="number"
              className="border rounded p-2 w-full"
              value={sim.surface_area_mm2}
              onChange={(e) =>
                setSim({ ...sim, surface_area_mm2: e.target.value })
              }
            />
            {simErrors.surface_area_mm2 && (
              <p className="text-red-600 text-sm">
                {simErrors.surface_area_mm2}
              </p>
            )}
          </div>
          <div>
            <label className="block mb-1">Quantity</label>
            <input
              type="number"
              className="border rounded p-2 w-full"
              value={sim.quantity}
              onChange={(e) => setSim({ ...sim, quantity: Number(e.target.value) })}
            />
            {simErrors.quantity && (
              <p className="text-red-600 text-sm">{simErrors.quantity}</p>
            )}
          </div>
          <button
            onClick={runSim}
            className="px-4 py-2 bg-blue-600 text-white rounded"
            type="button"
          >
            Simulate
          </button>
          {breakdown && (
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify(breakdown, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
