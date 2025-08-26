"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import InstantQuoteForm from "@/components/quotes/InstantQuoteForm";
import PriceExplainerModal, { BreakdownJson } from "@/components/quotes/PriceExplainerModal";
import Badges from "@/components/quotes/Badges";
import { PricingResult } from "@/lib/pricing";
import { formatCurrency } from "@/components/quotes/BreakdownRow";
import { LeadTime, normalizeLeadTime } from "@/lib/uiTypes";

export default function InstantQuoteClient({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const partId = typeof searchParams.partId === "string" ? searchParams.partId : undefined;
  const quoteId = typeof searchParams.quoteId === "string" ? searchParams.quoteId : undefined;
  const materialId = typeof searchParams.materialId === "string" ? searchParams.materialId : undefined;
  const toleranceId = typeof searchParams.toleranceId === "string" ? searchParams.toleranceId : undefined;
  const certificationCodes = typeof searchParams.certificationCodes === "string"
    ? searchParams.certificationCodes.split(",").map((c) => c.trim()).filter(Boolean)
    : [];
  const purpose = typeof searchParams.purpose === "string" ? searchParams.purpose : undefined;

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [price, setPrice] = useState<PricingResult | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownJson | null>(null);
  const [processKind, setProcessKind] = useState<string>("");
  const [leadTime, setLeadTime] = useState<LeadTime>("standard");
  const [toleranceLabel, setToleranceLabel] = useState<string | undefined>(undefined);

  const handlePricing = (info: {
    price: PricingResult;
    breakdown: BreakdownJson;
    processKind: string;
    leadTime: string;
    toleranceLabel?: string;
  }) => {
    setPrice(info.price);
    setBreakdown(info.breakdown);
    setProcessKind(info.processKind);
    setLeadTime(normalizeLeadTime(info.leadTime));
    setToleranceLabel(info.toleranceLabel);
  };

  const requestQuote = async () => {
    if (!quoteId) return;
    setLoading(true);
    const res = await fetch("/api/quotes/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote_id: quoteId })
    });
    setLoading(false);
    if (res.ok) {
      setToast("Quote requested successfully");
      setTimeout(() => router.push(`/quote/${quoteId}`), 1000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Instant Quote</h1>
      {partId ? (
        <InstantQuoteForm
          partId={partId}
          defaultMaterialId={materialId}
          defaultToleranceId={toleranceId}
          purpose={purpose}
          onPricingChange={handlePricing}
        />
      ) : (
        <p className="text-sm text-gray-500">No part selected.</p>
      )}

      {price && breakdown && (
        <div className="mt-6 p-4 bg-gray-100 rounded space-y-2">
          <Badges
            processKind={processKind}
            leadTime={leadTime}
            certifications={certificationCodes}
            tolerance={toleranceLabel}
          />
          <p className="text-sm">Unit price: {formatCurrency(price.unit_price, (breakdown as any).currency)}</p>
          <p className="text-lg font-medium">Total: {formatCurrency(price.total, (breakdown as any).currency)}</p>
          <PriceExplainerModal breakdownJson={breakdown} processKind={processKind} leadTime={leadTime} />
          <button
            onClick={requestQuote}
            disabled={!quoteId || loading}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            Request Quote
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow">{toast}</div>
      )}
    </div>
  );
}

