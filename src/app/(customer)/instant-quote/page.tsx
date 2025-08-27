/* eslint-disable @next/next/no-img-element */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import InstantQuoteForm from "@/components/quotes/InstantQuoteForm";
import PriceExplainerModal, { BreakdownJson } from "@/components/quotes/PriceExplainerModal";
import Badges from "@/components/quotes/Badges";
import { PricingResult } from "@/lib/pricing";
import { formatCurrency } from "@/components/quotes/BreakdownRow";
import { LeadTime, normalizeLeadTime } from "@/lib/uiTypes";

export default function InstantQuotePage() {
  const router = useRouter();
  const sp = useSearchParams();

  // Read params from URL (client-safe)
  const partId = sp.get("partId") ?? undefined;
  const quoteId = sp.get("quoteId") ?? undefined;
  const defaultMaterialId = sp.get("materialId") ?? undefined;
  const defaultToleranceId = sp.get("toleranceId") ?? undefined;
  const certificationCodes = (sp.get("certificationCodes") || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  const purpose = sp.get("purpose") ?? undefined;

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

  const goToCheckout = () => {
    if (!quoteId) return;
    const next = `/checkout?quoteId=${encodeURIComponent(quoteId)}`;
    router.push(next);
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Instant Quote</h1>
      {partId ? (
        <InstantQuoteForm
          partId={partId}
          defaultMaterialId={defaultMaterialId}
          defaultToleranceId={defaultToleranceId}
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
          <p className="text-sm">
            Unit price: {formatCurrency(price.unit_price, breakdown.currency as any)}
          </p>
          <p className="text-lg font-medium">
            Total: {formatCurrency(price.total, breakdown.currency as any)}
          </p>
          <PriceExplainerModal
            breakdownJson={breakdown}
            processKind={processKind}
            leadTime={leadTime}
          />

          <button
            onClick={goToCheckout}
            disabled={!quoteId || loading}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            Continue to checkout
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow">
          {toast}
        </div>
      )}
    </div>
  );
}

