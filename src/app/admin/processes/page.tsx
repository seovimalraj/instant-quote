import DataTable from "@/components/admin/DataTable";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { Field } from "@/types/forms";

export default async function ProcessesPage() {
  await requireAdmin();
  return <ClientPage />;
}

function ClientPage() {
  "use client";

  const schema = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    is_active: z.boolean().optional(),
  });

  const columns = [
    { accessorKey: "code", header: "Code" },
    { accessorKey: "name", header: "Name" },
  ];

  const fields: Field[] = [
    { name: "code", label: "Code", type: "text" },
    { name: "name", label: "Name", type: "text" },
    { name: "is_active", label: "Active", type: "checkbox" },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-4">Processes</h1>
      <DataTable
        table="processes"
        columns={columns}
        schema={schema}
        fields={fields}
        filterKey="name"
      />
    </div>
  );
}

