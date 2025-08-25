import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: { id: string };
}

export default async function CustomerDetailPage({ params }: Props) {
  await requireAdmin();
  const supabase = createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", params.id)
    .single();

  async function updateCustomer(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const notes = formData.get("notes") as string;
    const supabase = createClient();
    await supabase
      .from("customers")
      .update({ name, notes })
      .eq("id", params.id);
  }

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Customer {customer?.name}</h1>
      <form action={updateCustomer} className="space-y-4">
        <div>
          <label className="block text-sm">Name</label>
          <input
            name="name"
            defaultValue={customer?.name ?? ""}
            className="border p-1 rounded w-full"
          />
        </div>
        <div>
          <label className="block text-sm">Notes</label>
          <textarea
            name="notes"
            defaultValue={customer?.notes ?? ""}
            className="border p-1 rounded w-full"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Save
        </button>
      </form>
    </div>
  );
}

