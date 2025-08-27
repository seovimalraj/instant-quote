export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = "nodejs";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id,status,total,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Orders</h1>
      <ul className="space-y-2">
        {orders?.map((o: any) => (
          <li key={o.id} className="border p-4 rounded">
            <Link
              href={`/admin/orders/${o.id}`}
              className="text-blue-600 underline"
            >
              {o.id}
            </Link>
            <p className="text-sm">Status: {o.status}</p>
            <p className="text-sm">Total: {o.total}</p>
          </li>
        ))}
        {!orders?.length && (
          <li className="text-sm text-gray-500">No orders found</li>
        )}
      </ul>
    </div>
  );
}

