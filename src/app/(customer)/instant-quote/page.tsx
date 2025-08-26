import InstantQuoteForm from "@/components/quotes/InstantQuoteForm";
import { createClient } from "@/lib/supabase/server";

interface Props {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function InstantQuotePage({ searchParams }: Props) {
  const partId = typeof searchParams.partId === "string" ? searchParams.partId : undefined;
  if (!partId) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-2xl font-semibold mb-6">Instant Quote</h1>
        <p className="text-sm text-gray-500">No part selected.</p>
      </div>
    );
  }

  const supabase = createClient();
  const { data: part } = await supabase
    .from("parts")
    .select("*")
    .eq("id", partId)
    .single();
  if (!part) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-2xl font-semibold mb-6">Instant Quote</h1>
        <p className="text-sm text-gray-500">Part not found.</p>
      </div>
    );
  }

  const [materials, finishes, tolerances, machines, rateCard] = await Promise.all([
    supabase
      .from("materials")
      .select("id,name,density_kg_m3,cost_per_kg,machinability_factor")
      .eq("process_code", part.process_code)
      .eq("is_active", true),
    supabase
      .from("finishes")
      .select("id,name,cost_per_m2,setup_fee")
      .eq("process_code", part.process_code)
      .eq("is_active", true),
    supabase
      .from("tolerances")
      .select("id,name,cost_multiplier")
      .eq("process_code", part.process_code)
      .eq("is_active", true),
    supabase
      .from("machines")
      .select("*")
      .eq("process_code", part.process_code)
      .eq("is_active", true),
    supabase
      .from("rate_cards")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single(),
  ]);

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Instant Quote</h1>
      <InstantQuoteForm
        part={part}
        materials={materials.data ?? []}
        finishes={finishes.data ?? []}
        tolerances={tolerances.data ?? []}
        machines={machines.data ?? []}
        rateCard={rateCard.data ?? {}}
      />
    </div>
  );
}

