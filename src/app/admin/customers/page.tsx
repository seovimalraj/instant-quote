export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = "nodejs";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function CustomersAdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id,name,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Customers</h1>
      <ul className="space-y-2">
        {customers?.map((c: any) => (
          <li key={c.id} className="border p-4 rounded">
            <Link
              href={`/admin/customers/${c.id}`}
              className="text-blue-600 underline"
            >
              {c.name}
            </Link>
          </li>
        ))}
        {!customers?.length && (
          <li className="text-sm text-gray-500">No customers found</li>
        )}
      </ul>
    </div>
  );
}

