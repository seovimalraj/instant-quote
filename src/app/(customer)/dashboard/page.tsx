export const runtime = "nodejs";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
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

  const customerId = customer?.id;

  const [partsRes, quotesRes, ordersRes] = await Promise.all([
    supabase
      .from("parts")
      .select("id,file_name,created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    customerId
      ? supabase
          .from("quotes")
          .select("id,status,created_at")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
    customerId
      ? supabase
          .from("orders")
          .select("id,status,total,created_at")
          .eq("customer_id", customerId)
          .neq("status", "closed")
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  const quotes = quotesRes.data ?? [];
  const parts = partsRes.data ?? [];
  const orders = ordersRes.data ?? [];

  let messages: any[] = [];
  if (customerId) {
    const quoteIds = quotes.map((q: any) => q.id);
    if (quoteIds.length) {
      const { data: msgData } = await supabase
        .from("messages")
        .select("id,content,created_at")
        .in("quote_id", quoteIds)
        .order("created_at", { ascending: false })
        .limit(5);
      messages = msgData ?? [];
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <section>
        <h2 className="text-lg font-medium mb-2">Recent Quotes</h2>
        <ul className="space-y-1">
          {quotes.length ? (
            quotes.map((q: any) => (
              <li key={q.id} className="text-sm">
                <a href={`/quote/${q.id}`} className="text-blue-600 underline">
                  {q.id}
                </a>{" "}- {q.status}
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-500">No quotes</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Recent Messages</h2>
        <ul className="space-y-1">
          {messages.length ? (
            messages.map((m: any) => (
              <li key={m.id} className="text-sm">
                {m.content}
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-500">No messages</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Recent Parts</h2>
        <ul className="space-y-1">
          {parts.length ? (
            parts.map((p: any) => (
              <li key={p.id} className="text-sm">
                {p.file_name}
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-500">No parts</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Open Orders</h2>
        <ul className="space-y-1">
          {orders.length ? (
            orders.map((o: any) => (
              <li key={o.id} className="text-sm">
                <a href={`/order/${o.id}`} className="text-blue-600 underline">
                  {o.id}
                </a>{" "}- {o.status}
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-500">No open orders</li>
          )}
        </ul>
      </section>
    </div>
  );
}

