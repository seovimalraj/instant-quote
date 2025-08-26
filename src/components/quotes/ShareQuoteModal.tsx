"use client";

import { useState } from "react";

interface Props {
  quoteId: string;
}

export default function ShareQuoteModal({ quoteId }: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch("/api/quotes/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote_id: quoteId }),
      });
      if (res.ok) {
        const { token } = await res.json();
        const link = `${window.location.origin}/quote/${quoteId}/share?token=${token}`;
        setUrl(link);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        className="px-3 py-2 border rounded"
      >
        Share Quote
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-md p-6 w-full max-w-md shadow">
            <h2 className="text-lg font-semibold mb-4">Share Quote</h2>
            {loading && <p className="text-sm">Generating link...</p>}
            {!loading && url && (
              <div className="space-y-2">
                <input
                  type="text"
                  readOnly
                  value={url}
                  className="w-full border px-2 py-1 text-sm"
                />
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

