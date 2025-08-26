"use client";

import { useState } from "react";
import BreakdownRow, { BreakdownLine, formatCurrency } from "./BreakdownRow";

export interface BreakdownJson {
  lines: BreakdownLine[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
}

interface Props {
  breakdownJson: BreakdownJson;
  processKind: string;
  leadTime: string;
}

export default function PriceExplainerModal({
  breakdownJson,
  processKind,
  leadTime,
}: Props) {
  const [open, setOpen] = useState(false);

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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-md p-6 w-full max-w-md shadow">
            <h2 className="text-lg font-semibold mb-1">Price Breakdown</h2>
            <p className="text-xs text-gray-500 mb-4">
              {processKind} · {leadTime === "expedite" ? "Expedited" : "Standard"}
            </p>
            <table className="w-full mb-4">
              <tbody>
                {breakdownJson.lines.map((line) => (
                  <BreakdownRow
                    key={line.label}
                    line={line}
                    currency={breakdownJson.currency as any}
                  />
                ))}
                <tr className="text-sm font-medium border-t">
                  <td className="py-1 pr-4">Total</td>
                  <td className="py-1 text-right">
                    {formatCurrency(breakdownJson.total, breakdownJson.currency as any)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="text-right">
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

