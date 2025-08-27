export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = "nodejs";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const pr = await params;
  await requireAdmin();
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", pr.id)
    .single();
  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", pr.id);

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Order {pr.id}</h1>
      <p>Status: {order?.status}</p>
      <p>Total: {order?.total}</p>
      <ul className="space-y-4">
        {items?.map((item: any) => (
          <li key={item.id} className="border p-4 rounded">
            <p className="text-sm">Part: {item.part_id}</p>
            <p className="text-sm">Quantity: {item.quantity}</p>
            <p className="text-sm">Line Total: {item.line_total}</p>
          </li>
        ))}
        {!items?.length && <li className="text-sm text-gray-500">No items</li>}
      </ul>
    </div>
  );
}

