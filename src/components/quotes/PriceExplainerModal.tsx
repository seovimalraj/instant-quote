"use client";

import { useState } from "react";
import Badges from "./Badges";
import LineItemsTable from "./LineItemsTable";
import TotalBar from "./TotalBar";
import type { BreakdownLine, Currency } from "./BreakdownRow";

export interface BreakdownWarning {
  severity: "info" | "warn" | "error";
  message: string;
}

export interface BreakdownJson {
  lines: BreakdownLine[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: Currency;
  warnings?: BreakdownWarning[];
}

interface Props {
  breakdownJson: BreakdownJson;
  processKind?: string;
  leadTime?: "standard" | "expedite";
}

const warningColors: Record<"info" | "warn" | "error", string> = {
  info: "bg-blue-50 text-blue-800",
  warn: "bg-yellow-50 text-yellow-800",
  error: "bg-red-50 text-red-800",
};

export default function PriceExplainerModal({
  breakdownJson,
  processKind,
  leadTime,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showCalc, setShowCalc] = useState(false);

  const subtotal = breakdownJson.lines.reduce((sum, l) => sum + l.value, 0);
  const total = subtotal + breakdownJson.tax + breakdownJson.shipping;

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
          <div className="bg-white rounded-md p-6 w-full max-w-lg shadow space-y-4">
            <Badges processKind={processKind} leadTime={leadTime} />
            {breakdownJson.warnings?.map((w, i) => (
              <div
                key={i}
                className={`px-2 py-1 rounded text-sm ${warningColors[w.severity]}`}
              >
                {w.message}
              </div>
            ))}
            <LineItemsTable
              lines={breakdownJson.lines}
              currency={breakdownJson.currency}
            />
            <TotalBar
              subtotal={subtotal}
              tax={breakdownJson.tax}
              shipping={breakdownJson.shipping}
              total={total}
              currency={breakdownJson.currency}
            />
            <div>
              <button
                type="button"
                className="text-sm underline"
                onClick={() => setShowCalc((s) => !s)}
              >
                {showCalc ? "Hide details" : "How we calculated this"}
              </button>
              {showCalc && (
                <p className="mt-2 text-sm text-gray-600">
                  Our price is derived from material, machine time, setup, finish, and
                  other factors, plus tax and shipping.
                </p>
              )}
            </div>
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

