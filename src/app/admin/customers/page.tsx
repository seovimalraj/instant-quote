import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function CustomersAdminPage() {
  await requireAdmin();
  const supabase = createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id,name,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Customers</h1>
      <ul className="space-y-2">
        {customers?.map((c) => (
          <li key={c.id} className="border p-4 rounded">
            <a
              href={`/admin/customers/${c.id}`}
              className="text-blue-600 underline"
            >
              {c.name}
            </a>
          </li>
        ))}
        {!customers?.length && (
          <li className="text-sm text-gray-500">No customers found</li>
        )}
      </ul>
    </div>
  );
}

