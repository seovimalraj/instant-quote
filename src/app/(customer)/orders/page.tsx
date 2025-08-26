// src/app/(customer)/order/page.tsx (or /orders/page.tsx if that's your route)
export const runtime = "nodejs";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Record<string, string | string[] | undefined>;

const PAGE_SIZE = 10;

export default async function OrdersPage(props: {
  params?: any | Promise<any>;
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const searchParams: SearchParams = (await props?.searchParams) ?? {};

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // If you prefer redirect, use requireAuth() earlier or Next redirect() here
    return <div className="p-10">Please log in.</div>;
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  // normalize page query (string | string[] | undefined)
  const rawPage = searchParams.page;
  const pageStr =
    typeof rawPage === "string" ? rawPage : Array.isArray(rawPage) ? rawPage[0] : "1";
  const page = Math.max(1, Number.isFinite(Number(pageStr)) ? Number(pageStr) : 1);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: orders } = await supabase
    .from("orders")
    .select("id,status,total,created_at")
    .eq("customer_id", customer?.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Orders</h1>
      <ul className="space-y-2">
        {orders?.map((o) => (
          <li key={o.id} className="border p-4 rounded">
            <Link href={`/order/${o.id}`} className="text-blue-600 underline">
              {o.id}
            </Link>
            <p className="text-sm">Status: {o.status}</p>
            <p className="text-sm">Total: {o.total}</p>
          </li>
        ))}
        {!orders?.length && (
          <li className="text-sm text-gray-500">No orders</li>
        )}
      </ul>
    </div>
  );
}
