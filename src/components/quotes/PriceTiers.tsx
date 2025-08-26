"use client";

import { useEffect, useState } from "react";
import { calculatePricing, PricingResult } from "@/lib/pricing";
import { Geometry } from "@/lib/validators/pricing";
// Buttons to display price for preset quantity tiers.
const TIERS = [1, 2, 5, 10, 25, 50, 100];

interface Props {
  part: any;
  material: any;
  finish?: any;
  tolerance?: any;
  rateCard: any;
  leadTime: "standard" | "expedite";
  active: number;
  onSelect: (qty: number, price: PricingResult) => void;
}

export default function PriceTiers({
  part,
  material,
  finish,
  tolerance,
  rateCard,
  leadTime,
  active,
  onSelect,
}: Props) {
  const [prices, setPrices] = useState<Record<number, PricingResult>>({});

  useEffect(() => {
    const geom: Geometry = {
      volume_mm3: part.volume_mm3 ?? 0,
      surface_area_mm2: part.surface_area_mm2 ?? 0,
      bbox: (part.bbox as [number, number, number]) ?? [0, 0, 0],
    };
    const rc = { ...rateCard };
    TIERS.forEach((qty) => {
      const pricing = calculatePricing({
        process: part.process_code,
        quantity: qty,
        material,
        finish,
        tolerance,
        geometry: geom,
        lead_time: leadTime,
        rate_card: rc,
      });
      setPrices((p) => ({ ...p, [qty]: pricing }));
    });
  }, [part, material, finish, tolerance, rateCard, leadTime]);

  return (
    <div className="flex gap-2 flex-wrap">
      {TIERS.map((qty) => {
        const price = prices[qty]?.total ?? 0;
        const isActive = qty === active;
        return (
          <button
            key={qty}
            type="button"
            onClick={() => price && onSelect(qty, prices[qty])}
            className={`px-3 py-2 rounded border text-sm min-w-[60px] ${
              isActive ? "bg-blue-600 text-white" : "bg-white"
            }`}
          >
            <div className="font-medium">{qty}</div>
            <div className="text-xs">${price.toFixed(2)}</div>
          </button>
        );
      })}
    </div>
  );
}

