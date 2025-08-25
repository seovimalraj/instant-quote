import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export default async function AdminQuotesPage() {
  await requireAdmin();
  const supabase = createClient();
  const { data: quotes } = await supabase
    .from("quotes")
    .select("id,status,total,updated_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Quotes</h1>
      <ul className="space-y-2">
        {quotes?.map((q) => (
          <li key={q.id} className="border p-4 rounded">
            <a
              href={`/admin/quotes/${q.id}`}
              className="text-blue-600 underline"
            >
              {q.id}
            </a>
            <p className="text-sm">Status: {q.status}</p>
            <p className="text-sm">Total: {q.total}</p>
          </li>
        ))}
        {!quotes?.length && (
          <li className="text-sm text-gray-500">No quotes found</li>
        )}
      </ul>
    </div>
  );
}

