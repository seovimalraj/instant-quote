"use client";

import { Info } from "lucide-react";

export type Currency = "USD" | "EUR" | "INR";

export interface BreakdownLine {
  label: string;
  value: number;
  unit?: string;
  info?: string;
  kind:
    | "material"
    | "machining"
    | "press"
    | "mold"
    | "setup"
    | "finish"
    | "overhead"
    | "margin"
    | "tax"
    | "shipping"
    | "carbon";
}

const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "VND"]);

export function formatCurrency(value: number, currency: Currency) {
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    minimumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2,
    maximumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2,
  };
  return new Intl.NumberFormat(undefined, options).format(value);
}

interface Props {
  line: BreakdownLine;
  currency: Currency;
}

export default function BreakdownRow({ line, currency }: Props) {
  return (
    <tr className="text-sm">
      <td className="py-1 pr-4">
        <span>{line.label}</span>
        {line.info && (
          <span
            title={line.info}
            className="ml-1 text-gray-400 inline-flex align-middle"
          >
            <Info size={12} />
          </span>
        )}
      </td>
      <td className="py-1 text-right">
        {formatCurrency(line.value, currency)}
        {line.unit ? `/${line.unit}` : ""}
      </td>
    </tr>
  );
}

