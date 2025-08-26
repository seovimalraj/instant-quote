export const runtime = "nodejs";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

export default async function PartsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-10">Please log in.</div>;

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  const { data: parts, error } = await supabase
    .from("parts")
    .select("id, name, created_at")
    .eq("customer_id", customer?.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return <div className="p-10 text-red-600">{error.message}</div>;

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Parts</h1>
      <ul className="space-y-2">
        {parts?.map((p) => (
          <li key={p.id} className="border p-4 rounded">
            <a href={`/part/${p.id}`} className="text-blue-600 underline">{p.name || p.id}</a>
            <p className="text-sm text-gray-600">Created: {new Date(p.created_at).toLocaleString()}</p>
          </li>
        ))}
        {!parts?.length && (<li className="text-sm text-gray-500">No parts</li>)}
      </ul>
    </div>
  );
}

