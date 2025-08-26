import DataTable from "@/components/admin/DataTable";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Field } from "@/types/forms";

export default async function MaterialsPage() {
  await requireAdmin();
  return <ClientPage />;
}

function ClientPage() {
  "use client";

  const [processes, setProcesses] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("processes")
        .select("code,name")
        .order("name");
      setProcesses(data || []);
    };
    load();
  }, []);

  const schema = z.object({
    process_code: z.string().min(1),
    name: z.string().min(1),
    density_kg_m3: z.number().optional(),
    cost_per_kg: z.number().optional(),
    machinability_factor: z.number().optional(),
    is_active: z.boolean().optional(),
  });

  const columns = [
    { accessorKey: "process_code", header: "Process" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "density_kg_m3", header: "Density" },
    { accessorKey: "cost_per_kg", header: "Cost/kg" },
  ];

  const fields: Field[] = [
    {
      name: "process_code",
      label: "Process",
      type: "select",
      options: processes.map((p) => ({
        value: p.code as string,
        label: p.name as string,
      })),
    },
    { name: "name", label: "Name", type: "text" },
    { name: "density_kg_m3", label: "Density (kg/m3)", type: "number" },
    { name: "cost_per_kg", label: "Cost per kg", type: "number" },
    {
      name: "machinability_factor",
      label: "Machinability",
      type: "number",
    },
    { name: "is_active", label: "Active", type: "checkbox" },
  ] as const;

  const validate = async (values: any, existing?: any) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("materials")
      .select("id")
      .eq("process_code", values.process_code)
      .eq("name", values.name)
      .maybeSingle();
    if (data && data.id !== existing?.id) {
      return "Material with this process and name already exists";
    }
    return null;
  };

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-4">Materials</h1>
      <DataTable
        table="materials"
        columns={columns}
        schema={schema}
        fields={fields}
        filterKey="name"
        onValidate={validate}
      />
    </div>
  );
}

