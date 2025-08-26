"use client";

import BreakdownRow, { BreakdownLine, Currency } from "./BreakdownRow";

interface Props {
  lines: BreakdownLine[];
  currency: Currency;
}

export default function LineItemsTable({ lines, currency }: Props) {
  return (
    <table className="w-full">
      <tbody>
        {lines.map((line, i) => (
          <BreakdownRow key={i} line={line} currency={currency} />
        ))}
      </tbody>
    </table>
  );
}

