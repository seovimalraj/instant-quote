"use client";

import Link from "next/link";

interface MeasurementInfoProps {
  bbox: [number, number, number];
  surface_area_mm2: number;
  volume_mm3: number;
  units: "mm" | "inch";
  partId?: string;
}

export default function MeasurementInfo({
  bbox,
  surface_area_mm2,
  volume_mm3,
  units,
  partId,
}: MeasurementInfoProps) {
  const factor = units === "inch" ? 25.4 : 1;
  const [lx, ly, lz] = bbox.map((d) => (d / factor).toFixed(2));
  const area = (surface_area_mm2 / (factor * factor)).toFixed(2);
  const volume = (volume_mm3 / (factor * factor * factor)).toFixed(2);

  return (
    <div className="space-y-1 text-sm">
      <div>
        Bounding box: {lx} × {ly} × {lz} {units}
      </div>
      <div>Surface area: {area} {units}²</div>
      <div>Volume: {volume} {units}³</div>
      {partId && (
        <Link
          href={`/viewer/${partId}`}
          className="text-blue-600 hover:underline"
          title="Open in 3D viewer"
        >
          View 3D model
        </Link>
      )}
    </div>
  );
}

