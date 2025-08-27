export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = "nodejs";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VendorDetailPage({ params }: Props) {
  const pr = await params;
  await requireAdmin();
  const supabase = await createClient();
  const { data: vendor } = await supabase
    .from("profiles")
    .select("id,full_name,email,role")
    .eq("id", pr.id)
    .single();

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Vendor {vendor?.email}</h1>
      <p className="text-sm">Name: {vendor?.full_name}</p>
      <p className="text-sm">Role: {vendor?.role}</p>
      <div className="p-4 border rounded">
        Assignment rules configuration coming soon.
      </div>
    </div>
  );
}

