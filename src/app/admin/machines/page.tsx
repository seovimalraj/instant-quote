import DataTable from "@/components/admin/DataTable";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Field } from "@/types/forms";

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
    rate_per_min: z.number().nonnegative(),
    margin_pct: z.number().nonnegative(),
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
    { accessorKey: "rate_per_min", header: "Rate/min" },
    { accessorKey: "margin_pct", header: "Margin %" },
  ];

  const fields: Field[] = [
    { name: "name", label: "Name", type: "text" },
    {
      name: "process_code",
      label: "Process",
      type: "select",
      options: processes.map((p) => ({
        value: p.code as string,
        label: p.name as string,
      })),
    },
    { name: "rate_per_min", label: "Rate/min", type: "number" },
    { name: "margin_pct", label: "Margin %", type: "number" },
    { name: "is_active", label: "Active", type: "checkbox" },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-4">Machines</h1>
      <DataTable
        endpoint="/api/machines"
        columns={columns}
        schema={schema}
        fields={fields}
        filterKey="name"
        filterPlaceholder="Filter machines"
      />
    </div>
  );
}
