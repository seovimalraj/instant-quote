export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import DataTable from "@/components/admin/DataTable";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { Field } from "@/types/forms";

export default async function RateCardsPage() {
  await requireAdmin();
  return <ClientPage />;
}

function ClientPage() {
  "use client";

  const schema = z.object({
    region: z.string().min(1),
    currency: z.string().min(1),
    three_axis_rate_per_min: z.number().optional(),
    five_axis_rate_per_min: z.number().optional(),
    turning_rate_per_min: z.number().optional(),
    is_active: z.boolean().optional(),
  });

  const columns = [
    { accessorKey: "region", header: "Region" },
    { accessorKey: "currency", header: "Currency" },
    { accessorKey: "three_axis_rate_per_min", header: "3-axis" },
    { accessorKey: "five_axis_rate_per_min", header: "5-axis" },
    { accessorKey: "turning_rate_per_min", header: "Turning" },
  ];

  const fields: Field[] = [
    { name: "region", label: "Region", type: "text" },
    { name: "currency", label: "Currency", type: "text" },
    {
      name: "three_axis_rate_per_min",
      label: "3-axis rate/min",
      type: "number",
    },
    {
      name: "five_axis_rate_per_min",
      label: "5-axis rate/min",
      type: "number",
    },
    {
      name: "turning_rate_per_min",
      label: "Turning rate/min",
      type: "number",
    },
    { name: "is_active", label: "Active", type: "checkbox" },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-4">Rate Cards</h1>
      <DataTable
        table="rate_cards"
        columns={columns}
        schema={schema}
        fields={fields}
        filterKey="region"
      />
    </div>
  );
}

