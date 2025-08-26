"use client";

import { useState } from "react";

interface PriceBreakdown {
  material?: number;
  machining?: number;
  finish?: number;
  setup?: number;
  tolerance?: number;
  overhead?: number;
  margin?: number;
  tax?: number;
  ship?: number;
  carbon_offset?: number;
}

interface Props {
  breakdown: PriceBreakdown;
}

export default function PriceExplainerModal({ breakdown }: Props) {
  const [open, setOpen] = useState(false);

  const entries = Object.entries(breakdown).filter(
    ([, value]) => typeof value === "number"
  );

  const total = entries.reduce((sum, [, value]) => sum + (value || 0), 0);

  return (
    <>
      <button
        type="button"
        className="text-sm underline"
        onClick={() => setOpen(true)}
      >
        View price details
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-md p-6 w-full max-w-md shadow">
            <h2 className="text-lg font-semibold mb-4">Price Breakdown</h2>
            <ul className="space-y-1 text-sm">
              {entries.map(([key, value]) => (
                <li key={key} className="flex justify-between">
                  <span className="capitalize">{key.replace(/_/g, " ")}</span>
                  <span>${value?.toFixed(2)}</span>
                </li>
              ))}
              <li className="flex justify-between font-medium border-t pt-1 mt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </li>
            </ul>
            <div className="mt-4 text-right">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

