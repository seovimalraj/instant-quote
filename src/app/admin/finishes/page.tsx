import DataTable from "@/components/admin/DataTable";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default async function FinishesPage() {
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
    type: z.string().optional(),
    cost_per_m2: z.number().optional(),
    lead_time_days: z.number().optional(),
    is_active: z.boolean().optional(),
  });

  const columns = [
    { accessorKey: "process_code", header: "Process" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "type", header: "Type" },
    { accessorKey: "cost_per_m2", header: "Cost/m2" },
  ];

  const fields = [
    {
      name: "process_code",
      label: "Process",
      type: "select",
      options: processes.map((p) => ({ value: p.code, label: p.name })),
    },
    { name: "name", label: "Name", type: "text" },
    { name: "type", label: "Type", type: "text" },
    { name: "cost_per_m2", label: "Cost per m2", type: "number" },
    { name: "lead_time_days", label: "Lead time (days)", type: "number" },
    { name: "is_active", label: "Active", type: "checkbox" },
  ];

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-4">Finishes</h1>
      <DataTable
        table="finishes"
        columns={columns}
        schema={schema}
        fields={fields}
        filterKey="name"
      />
    </div>
  );
}

