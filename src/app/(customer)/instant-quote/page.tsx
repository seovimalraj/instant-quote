"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InstantQuoteForm from "@/components/quotes/InstantQuoteForm";

interface Props {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function InstantQuotePage({ searchParams }: Props) {
  const partId = typeof searchParams.partId === "string" ? searchParams.partId : undefined;
  const quoteId = typeof searchParams.quoteId === "string" ? searchParams.quoteId : undefined;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [geomReady, setGeomReady] = useState(!partId);

  useEffect(() => {
    if (!partId) return;
    (async () => {
      try {
        await fetch("/api/parts/geometry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ part_id: partId }),
        });
      } finally {
        setGeomReady(true);
      }
    })();
  }, [partId]);

  const requestQuote = async () => {
    if (!quoteId) return;
    setLoading(true);
    const res = await fetch("/api/quotes/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote_id: quoteId }),
    });
    setLoading(false);
    if (res.ok) {
      alert("Quote requested successfully");
      router.push(`/quote/${quoteId}`);
    } else {
      console.error(await res.json());
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Instant Quote</h1>
      {partId ? (
        geomReady ? (
          <InstantQuoteForm partId={partId} />
        ) : (
          <p className="text-sm text-gray-500">Analyzing geometry...</p>
        )
      ) : (
        <p className="text-sm text-gray-500">No part selected.</p>
      )}
      <div className="mt-6">
        <button
          onClick={requestQuote}
          disabled={!quoteId || loading}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          Request Quote
        </button>
      </div>
    </div>
  );
}