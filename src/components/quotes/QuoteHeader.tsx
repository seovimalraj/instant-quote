"use client";

import React from "react";

interface QuoteHeaderProps {
  quote: {
    id: string;
    status: "estimate" | "ordered" | string;
    name?: string | null;
  };
  viewerRole?: "customer" | "staff";
}

export default function QuoteHeader({ quote, viewerRole = "customer" }: QuoteHeaderProps) {
  const title =
    viewerRole === "staff"
      ? `Quote #${quote.id}${quote.name ? ` – ${quote.name}` : ""}`
      : quote.name || `Quote #${quote.id}`;
  const statusLabel = quote.status === "ordered" ? "Ordered" : "Estimate";
  const badgeColor =
    quote.status === "ordered" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  return (
    <header className="flex items-center justify-between mb-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      <span className={`px-2 py-1 rounded text-xs font-medium ${badgeColor}`}>{statusLabel}</span>
    </header>
  );
}

