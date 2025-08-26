"use client";

import type { Overlay } from "@/lib/dfm/types";

interface Props {
  overlays: Overlay[];
}

export default function OverlayList({ overlays }: Props) {
  if (!overlays.length) return <p className="text-sm">No DFM issues</p>;
  return (
    <ul className="space-y-1 text-sm">
      {overlays.map((o) => (
        <li key={o.id} className={`p-2 border rounded ${o.severity === 'error' ? 'border-red-500' : o.severity === 'warning' ? 'border-yellow-500' : 'border-gray-300'}`}>
          <strong>{o.type.replace('_', ' ')}:</strong> {o.message}
        </li>
      ))}
    </ul>
  );
}
