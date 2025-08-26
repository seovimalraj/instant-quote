"use client";

import { Currency, formatCurrency } from "./BreakdownRow";

interface Props {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: Currency;
}

export default function TotalBar({ subtotal, tax, shipping, total, currency }: Props) {
  return (
    <div className="text-sm space-y-1 mt-2">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal, currency)}</span>
      </div>
      <div className="flex justify-between">
        <span>Tax</span>
        <span>{formatCurrency(tax, currency)}</span>
      </div>
      <div className="flex justify-between">
        <span>Shipping</span>
        <span>{formatCurrency(shipping, currency)}</span>
      </div>
      <div className="flex justify-between font-medium border-t pt-1 mt-1">
        <span>Total</span>
        <span>{formatCurrency(total, currency)}</span>
      </div>
    </div>
  );
}

