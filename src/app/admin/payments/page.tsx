import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function PaymentsAdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("id,provider,amount,status,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Payments</h1>
      <ul className="space-y-2">
        {payments?.map((p) => (
          <li key={p.id} className="border p-4 rounded">
            <p className="text-sm">{p.provider}</p>
            <p className="text-sm">Amount: {p.amount}</p>
            <p className="text-sm">Status: {p.status}</p>
          </li>
        ))}
        {!payments?.length && <li className="text-sm text-gray-500">No payments</li>}
      </ul>
    </div>
  );
}

