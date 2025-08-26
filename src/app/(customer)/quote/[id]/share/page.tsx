import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface Props {
  params: { id: string };
  searchParams: { token?: string };
}

export default async function ShareQuotePage({ params, searchParams }: Props) {
  const token = searchParams.token;
  if (!token) {
    notFound();
  }

  const supabase = createClient();
  const { data: share } = await supabase
    .from("quote_share_tokens")
    .select("quote_id,expires_at")
    .eq("token", token)
    .single();

  if (
    !share ||
    share.quote_id !== params.id ||
    new Date(share.expires_at) < new Date()
  ) {
    notFound();
  }

  const { data: quote } = await supabase
    .from("quotes")
    .select(
      "id,status,total,quote_items(id,part_id,quantity,line_total)"
    )
    .eq("id", params.id)
    .single();

  if (!quote) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-4">Quote {quote.id}</h1>
      <p className="mb-2">Status: {quote.status}</p>
      {quote.total && <p className="mb-4">Total: {quote.total}</p>}
      <h2 className="text-lg font-medium mb-2">Items</h2>
      <ul className="space-y-2">
        {quote.quote_items?.map((item: any) => (
          <li key={item.id} className="text-sm">
            Part {item.part_id} x {item.quantity} - {item.line_total}
          </li>
        ))}
        {!quote.quote_items?.length && (
          <li className="text-sm text-gray-500">No items</li>
        )}
      </ul>
    </div>
  );
}

