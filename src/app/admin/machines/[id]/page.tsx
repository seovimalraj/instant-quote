import DataTable from "@/components/admin/DataTable";
import { requireAdmin } from "@/lib/auth";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { useEffect, useState } from "react";

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

  const [materials, setMaterials] = useState<any[]>([]);
  const [finishes, setFinishes] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [{ data: mats }, { data: fins }] = await Promise.all([
        supabase
          .from("materials")
          .select("id,name")
          .eq("is_active", true)
          .eq("process_code", machine.process_code)
          .order("name"),
        supabase
          .from("finishes")
          .select("id,name")
          .eq("is_active", true)
          .eq("process_code", machine.process_code)
          .order("name"),
      ]);
      setMaterials(mats || []);
      setFinishes(fins || []);
    };
    load();
  }, [machine.process_code]);

  const materialSchema = z.object({
    material_id: z.string().uuid(),
    material_rate_multiplier: z.number().optional(),
    is_active: z.boolean().optional(),
  });

  const materialColumns = [
    {
      accessorKey: "material_id",
      header: "Material",
      cell: ({ row }: any) => row.original.materials?.name || row.original.material_id,
    },
    { accessorKey: "material_rate_multiplier", header: "Multiplier" },
  ];

  const materialFields = [
    {
      name: "material_id",
      label: "Material",
      type: "select",
      options: materials.map((m) => ({ value: m.id, label: m.name })),
    },
    {
      name: "material_rate_multiplier",
      label: "Rate Multiplier",
      type: "number",
    },
    { name: "is_active", label: "Active", type: "checkbox" },
  ];

  const finishSchema = z.object({
    finish_id: z.string().uuid(),
    finish_rate_multiplier: z.number().optional(),
    is_active: z.boolean().optional(),
  });

  const finishColumns = [
    {
      accessorKey: "finish_id",
      header: "Finish",
      cell: ({ row }: any) => row.original.finishes?.name || row.original.finish_id,
    },
    { accessorKey: "finish_rate_multiplier", header: "Multiplier" },
  ];

  const finishFields = [
    {
      name: "finish_id",
      label: "Finish",
      type: "select",
      options: finishes.map((f) => ({ value: f.id, label: f.name })),
    },
    {
      name: "finish_rate_multiplier",
      label: "Rate Multiplier",
      type: "number",
    },
    { name: "is_active", label: "Active", type: "checkbox" },
  ];

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-10">
      <h1 className="text-2xl font-semibold mb-4">{machine.name}</h1>
      <div>
        <h2 className="text-xl font-semibold mb-4">Materials</h2>
        <DataTable
          table="machine_materials"
          columns={materialColumns}
          schema={materialSchema}
          fields={materialFields}
          filterKey="materials.name"
          select="id, material_id, material_rate_multiplier, is_active, materials(name)"
          eqFilters={{ machine_id: machine.id }}
          insertDefaults={{ machine_id: machine.id }}
        />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-4">Finishes</h2>
        <DataTable
          table="machine_finishes"
          columns={finishColumns}
          schema={finishSchema}
          fields={finishFields}
          filterKey="finishes.name"
          select="id, finish_id, finish_rate_multiplier, is_active, finishes(name)"
          eqFilters={{ machine_id: machine.id }}
          insertDefaults={{ machine_id: machine.id }}
        />
      </div>
    </div>
  );
}
