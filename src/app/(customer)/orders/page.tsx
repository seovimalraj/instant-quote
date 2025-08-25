import { createClient } from "@/lib/supabase/server";

interface Props {
  searchParams: { [key: string]: string | string[] | undefined };
}

const PAGE_SIZE = 10;

export default async function OrdersPage({ searchParams }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-10">Please log in.</div>;
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  const page = Number(searchParams.page ?? "1");
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
            <a href={`/order/${o.id}`} className="text-blue-600 underline">
              {o.id}
            </a>
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

