export const runtime = "nodejs";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPartsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: parts } = await supabase
    .from("parts")
    .select("id,file_name,owner_id,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">All Parts</h1>
      <ul className="space-y-2">
        {parts?.map((p) => (
          <li key={p.id} className="border p-4 rounded">
            <p className="text-sm">{p.file_name}</p>
            <p className="text-xs text-gray-500">Owner: {p.owner_id}</p>
          </li>
        ))}
        {!parts?.length && <li className="text-sm text-gray-500">No parts</li>}
      </ul>
    </div>
  );
}

