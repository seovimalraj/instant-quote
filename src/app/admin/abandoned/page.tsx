export const runtime = "nodejs";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AbandonedAdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: abandoned } = await supabase
    .from("abandoned_quotes")
    .select("id,email,created_at")
    .order("created_at", { ascending: false });

  async function convert(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const supabase = await createClient();
    const { data } = await supabase
      .from("abandoned_quotes")
      .select("email")
      .eq("id", id)
      .single();
    if (data?.email) {
      await supabase.from("customers").insert({ name: data.email }).select("id");
      await supabase.from("abandoned_quotes").delete().eq("id", id);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Abandoned Quotes</h1>
      <ul className="space-y-4">
        {abandoned?.map((a) => (
          <li key={a.id} className="border p-4 rounded">
            <p className="text-sm">{a.email}</p>
            <form action={convert}>
              <input type="hidden" name="id" value={a.id} />
              <button
                type="submit"
                className="mt-2 px-3 py-1 bg-green-600 text-white rounded"
              >
                Convert to Customer
              </button>
            </form>
          </li>
        ))}
        {!abandoned?.length && (
          <li className="text-sm text-gray-500">No abandoned quotes</li>
        )}
      </ul>
    </div>
  );
}

