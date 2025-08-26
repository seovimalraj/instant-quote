"use client";

import { useState } from "react";
import LineItemsTable from "./LineItemsTable";
import TotalBar from "./TotalBar";
import Badges from "./Badges";

interface BreakdownJson {
  breakdown: Record<string, number>;
  total?: number;
  meta?: Record<string, any>;
}

interface Props {
  breakdownJson: BreakdownJson;
}

export default function PriceExplainerModal({ breakdownJson }: Props) {
  const [open, setOpen] = useState(false);
  const total =
    breakdownJson.total ??
    Object.values(breakdownJson.breakdown).reduce((s, v) => s + v, 0);

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
            <Badges meta={breakdownJson.meta} />
            <LineItemsTable breakdown={breakdownJson.breakdown} />
            <TotalBar total={total} />
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
