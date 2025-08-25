import DataTable from "@/components/admin/DataTable";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default async function TolerancesPage() {
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
    tol_min_mm: z.number().optional(),
    tol_max_mm: z.number().optional(),
    cost_multiplier: z.number().optional(),
    is_active: z.boolean().optional(),
  });

  const columns = [
    { accessorKey: "process_code", header: "Process" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "tol_min_mm", header: "Min (mm)" },
    { accessorKey: "tol_max_mm", header: "Max (mm)" },
  ];

  const fields = [
    {
      name: "process_code",
      label: "Process",
      type: "select",
      options: processes.map((p) => ({ value: p.code, label: p.name })),
    },
    { name: "name", label: "Name", type: "text" },
    { name: "tol_min_mm", label: "Min (mm)", type: "number" },
    { name: "tol_max_mm", label: "Max (mm)", type: "number" },
    { name: "cost_multiplier", label: "Cost multiplier", type: "number" },
    { name: "is_active", label: "Active", type: "checkbox" },
  ];

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-4">Tolerances</h1>
      <DataTable
        table="tolerances"
        columns={columns}
        schema={schema}
        fields={fields}
        filterKey="name"
      />
    </div>
  );
}

