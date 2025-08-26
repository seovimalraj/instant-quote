export const runtime = "nodejs";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function UsersAdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id,full_name,email,role")
    .order("created_at", { ascending: false });

  async function updateRole(formData: FormData) {
    "use server";
    const userId = formData.get("user_id") as string;
    const role = formData.get("role") as string;
    const supabase = await createClient();
    await supabase.from("profiles").update({ role }).eq("id", userId);
  }

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>
      <ul className="space-y-4">
        {users?.map((u) => (
          <li key={u.id} className="border p-4 rounded">
            <p className="text-sm font-semibold">{u.email}</p>
            <p className="text-sm mb-2">Role: {u.role}</p>
            <form action={updateRole} className="flex space-x-2">
              <input type="hidden" name="user_id" value={u.id} />
              <select name="role" defaultValue={u.role} className="border p-1 rounded">
                <option value="admin">admin</option>
                <option value="staff">staff</option>
                <option value="customer">customer</option>
                <option value="vendor">vendor</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </form>
          </li>
        ))}
        {!users?.length && <li className="text-sm text-gray-500">No users</li>}
      </ul>
    </div>
  );
}

