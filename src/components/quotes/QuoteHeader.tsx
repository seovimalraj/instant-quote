"use client";

import React from "react";

interface QuoteHeaderProps {
  quote: {
    id: string;
    status: "estimate" | "ordered" | string;
    name?: string | null;
  };
  viewerRole?: "customer" | "staff";
  /** action when user wants to share the quote */
  onShare?: () => void;
  /** action when staff wants to update quote status */
  onMark?: () => void;
  /** action for customers to place an order */
  onOrder?: () => void;
}

export default function QuoteHeader({
  quote,
  viewerRole = "customer",
  onShare,
  onMark,
  onOrder,
}: QuoteHeaderProps) {
  const title =
    viewerRole === "staff"
      ? `Quote #${quote.id}${quote.name ? ` – ${quote.name}` : ""}`
      : quote.name || `Quote #${quote.id}`;
  const statusLabel = quote.status === "ordered" ? "Ordered" : "Estimate";
  const badgeColor =
    quote.status === "ordered" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  return (
    <header className="flex items-start justify-between mb-4 gap-2">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        <span className={`px-2 py-1 rounded text-xs font-medium ${badgeColor}`}>{statusLabel}</span>
      </div>
      <div className="flex gap-2">
        {viewerRole === "staff" && onMark && (
          <button
            type="button"
            onClick={onMark}
            className="px-3 py-1 text-sm border rounded"
          >
            Mark Quote
          </button>
        )}
        {viewerRole === "customer" && quote.status === "estimate" && onOrder && (
          <button
            type="button"
            onClick={onOrder}
            className="px-3 py-1 text-sm border rounded"
          >
            Place Order
          </button>
        )}
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            className="px-3 py-1 text-sm border rounded"
          >
            Share
          </button>
        )}
      </div>
    </header>
  );
}

