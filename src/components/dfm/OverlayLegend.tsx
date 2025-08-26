import { severityColorMap } from "../../lib/dfm/overlays";
import React from "react";

/** Simple legend showing overlay severity colors. */
export function OverlayLegend() {
  return (
    <div className="space-y-1 text-xs">
      {Object.entries(severityColorMap).map(([sev, color]) => (
        <div key={sev} className="flex items-center space-x-2">
          <span
            className="w-3 h-3 rounded"
            style={{ background: `#${color.toString(16).padStart(6, "0")}` }}
          />
          <span className="capitalize">{sev}</span>
        </div>
      ))}
    </div>
  );
}

export default OverlayLegend;

