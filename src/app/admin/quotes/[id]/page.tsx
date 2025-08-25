import ExportPdfButton from "@/components/admin/ExportPdfButton";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: { id: string };
}

export default async function QuoteDetailPage({ params }: Props) {
  await requireAdmin();
  const supabase = createClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", params.id)
    .single();
  const { data: items } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", params.id);

  async function updateItem(formData: FormData) {
    "use server";
    const itemId = formData.get("item_id") as string;
    const quantity = Number(formData.get("quantity"));
    const process_code = formData.get("process_code") as string;
    const material_id = (formData.get("material_id") as string) || null;
    const finish_id = (formData.get("finish_id") as string) || null;
    const tolerance_id = (formData.get("tolerance_id") as string) || null;
    const supabase = createClient();
    await supabase
      .from("quote_items")
      .update({
        quantity,
        process_code,
        material_id,
        finish_id,
        tolerance_id,
      })
      .eq("id", itemId);
    await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/quotes/reprice`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: params.id }),
      },
    );
  }

  async function resendQuote() {
    "use server";
    const supabase = createClient();
    await supabase.from("quotes").update({ status: "sent" }).eq("id", params.id);
  }

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Quote {params.id}</h1>
      <div className="flex space-x-4">
        <form action={resendQuote}>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            Resend Link
          </button>
        </form>
        <ExportPdfButton quoteId={params.id} />
      </div>
      <ul className="space-y-4">
        {items?.map((item) => (
          <li key={item.id} className="border p-4 rounded">
            <form action={updateItem} className="space-y-2">
              <input type="hidden" name="item_id" value={item.id} />
              <div>
                <label className="block text-sm">Process</label>
                <input
                  name="process_code"
                  defaultValue={item.process_code ?? ""}
                  className="border p-1 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm">Quantity</label>
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  defaultValue={item.quantity}
                  className="border p-1 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm">Material ID</label>
                <input
                  name="material_id"
                  defaultValue={item.material_id ?? ""}
                  className="border p-1 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm">Finish ID</label>
                <input
                  name="finish_id"
                  defaultValue={item.finish_id ?? ""}
                  className="border p-1 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm">Tolerance ID</label>
                <input
                  name="tolerance_id"
                  defaultValue={item.tolerance_id ?? ""}
                  className="border p-1 rounded w-full"
                />
              </div>
              <button
                type="submit"
                className="mt-2 px-3 py-1 bg-green-600 text-white rounded"
              >
                Update
              </button>
            </form>
          </li>
        ))}
        {!items?.length && <li className="text-sm text-gray-500">No items</li>}
      </ul>
      <p className="text-sm">Total: {quote?.total}</p>
    </div>
  );
}

