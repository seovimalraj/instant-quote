export const runtime = "nodejs";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PriceExplainerModal from "@/components/quotes/PriceExplainerModal";
import { formatCurrency } from "@/components/quotes/BreakdownRow";

interface Props {
  params: { id: string };
}

export default async function QuotePage({ params }: Props) {
  const supabase = await createClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("id,total,currency,quote_items(pricing_breakdown,process_code,lead_time_days)")
    .eq("id", params.id)
    .single();

  if (!quote) {
    notFound();
  }

  const item = quote.quote_items?.[0];

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-4">
      <h1 className="text-2xl font-semibold">Quote {quote.id}</h1>
      {quote.total !== null && (
        <p className="text-lg">
          Total: {formatCurrency(Number(quote.total), quote.currency as any)}
        </p>
      )}
      {item?.pricing_breakdown && (
        <PriceExplainerModal
          breakdownJson={item.pricing_breakdown}
          processKind={item.process_code}
          leadTime={item.lead_time_days && item.lead_time_days <= 3 ? "expedite" : "standard"}
        />
      )}
    </div>
  );
}

