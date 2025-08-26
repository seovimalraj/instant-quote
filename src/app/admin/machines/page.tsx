import DataTable from "@/components/admin/DataTable";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default async function MachinesPage() {
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
    name: z.string().min(1),
    process_code: z.string().min(1),
    axis_count: z.number().optional(),
    envelope_mm_x: z.number().optional(),
    envelope_mm_y: z.number().optional(),
    envelope_mm_z: z.number().optional(),
    rate_per_min: z.number().optional(),
    setup_fee: z.number().optional(),
    overhead_multiplier: z.number().optional(),
    expedite_multiplier: z.number().optional(),
    utilization_target: z.number().optional(),
    margin_pct: z.number().optional(),
    is_itar_certified: z.boolean().optional(),
    is_active: z.boolean().optional(),
  });

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: any) => (
        <a
          href={`/admin/machines/${row.original.id}`}
          className="text-blue-600 underline"
        >
          {row.original.name}
        </a>
      ),
    },
    { accessorKey: "process_code", header: "Process" },
    { accessorKey: "axis_count", header: "Axis" },
    { accessorKey: "rate_per_min", header: "Rate/min" },
    { accessorKey: "is_itar_certified", header: "ITAR" },
  ];

  const fields = [
    { name: "name", label: "Name", type: "text" },
    {
      name: "process_code",
      label: "Process",
      type: "select",
      options: processes.map((p) => ({ value: p.code, label: p.name })),
    },
    { name: "axis_count", label: "Axis Count", type: "number" },
    { name: "envelope_mm_x", label: "Envelope X (mm)", type: "number" },
    { name: "envelope_mm_y", label: "Envelope Y (mm)", type: "number" },
    { name: "envelope_mm_z", label: "Envelope Z (mm)", type: "number" },
    { name: "rate_per_min", label: "Rate/min", type: "number" },
    { name: "setup_fee", label: "Setup Fee", type: "number" },
    {
      name: "overhead_multiplier",
      label: "Overhead Multiplier",
      type: "number",
    },
    {
      name: "expedite_multiplier",
      label: "Expedite Multiplier",
      type: "number",
    },
    {
      name: "utilization_target",
      label: "Utilization Target",
      type: "number",
    },
    { name: "margin_pct", label: "Margin %", type: "number" },
    { name: "is_itar_certified", label: "ITAR Certified", type: "checkbox" },
    { name: "is_active", label: "Active", type: "checkbox" },
  ];

  return (
    <div className="max-w-6xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-4">Machines</h1>
      <DataTable
        table="machines"
        columns={columns}
        schema={schema}
        fields={fields}
        filterKey="name"
      />
    </div>
  );
}
