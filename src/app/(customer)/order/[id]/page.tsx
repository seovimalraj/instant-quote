import { createClient } from "@/lib/supabase/server";

interface Props {
  params: { id: string };
}

export default async function OrderPage({ params }: Props) {
  const supabase = createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id,status,total,created_at,order_items(id,part_id,quantity,line_total)")
    .eq("id", params.id)
    .single();

  if (!order) {
    return <div className="p-10">Order not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-4">Order {order.id}</h1>
      <p className="mb-2">Status: {order.status}</p>
      <p className="mb-4">Total: {order.total}</p>
      <h2 className="text-lg font-medium mb-2">Items</h2>
      <ul className="space-y-2">
        {order.order_items?.map((item: any) => (
          <li key={item.id} className="text-sm">
            Part {item.part_id} x {item.quantity} - {item.line_total}
          </li>
        ))}
        {!order.order_items?.length && (
          <li className="text-sm text-gray-500">No items</li>
        )}
      </ul>
    </div>
  );
}

