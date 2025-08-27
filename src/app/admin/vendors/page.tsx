export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = "nodejs";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function VendorsAdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: vendors } = await supabase
    .from("profiles")
    .select("id,full_name,email")
    .eq("role", "vendor")
    .order("created_at", { ascending: false });

  async function assignVendor(formData: FormData) {
    "use server";
    const userId = formData.get("user_id") as string;
    const supabase = await createClient();
    await supabase.from("profiles").update({ role: "vendor" }).eq("id", userId);
  }

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Vendors</h1>
      <form action={assignVendor} className="flex space-x-2">
        <input
          name="user_id"
          placeholder="User ID"
          className="border p-1 rounded flex-1"
        />
        <button
          type="submit"
          className="px-4 py-1 bg-blue-600 text-white rounded"
        >
          Add Vendor
        </button>
      </form>
      <ul className="space-y-4">
        {vendors?.map((v: any) => (
          <li key={v.id} className="border p-4 rounded">
            <a
              href={`/admin/vendors/${v.id}`}
              className="text-blue-600 underline"
            >
              {v.email || v.full_name || v.id}
            </a>
          </li>
        ))}
        {!vendors?.length && (
          <li className="text-sm text-gray-500">No vendors found</li>
        )}
      </ul>
    </div>
  );
}

