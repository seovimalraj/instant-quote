import React, { useMemo } from "react";
import type { Suggestion } from "../../lib/dfm/engine";

export interface Alternatives {
  materials?: string[];
  tolerances?: string[];
}

export interface LifetimeEstimate {
  band: "Low" | "Med" | "High";
  rationale: string;
}

interface Props {
  suggestions: Suggestion[];
  alternatives?: Alternatives;
  lifetime?: LifetimeEstimate;
  onFocusOverlay?: (id: string) => void;
}

const CATEGORY_LABELS: Record<Suggestion["category"], string> = {
  feasibility: "Feasibility",
  manufacturability: "Manufacturability",
  cost: "Cost",
  reliability: "Reliability/Lifetime",
};

export function DFMPanel({
  suggestions,
  alternatives,
  lifetime,
  onFocusOverlay,
}: Props) {
  const grouped = useMemo(() => {
    const g: Record<string, Suggestion[]> = {};
    for (const s of suggestions) {
      (g[s.category] ||= []).push(s);
    }
    return g;
  }, [suggestions]);

  return (
    <div className="space-y-4 text-sm">
      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
        <div key={key}>
          <h3 className="font-medium text-xs text-gray-600 mb-1">{label}</h3>
          <ul className="space-y-1">
            {grouped[key]?.length ? (
              grouped[key].map((s) => (
                <li key={s.id}>
                  <button
                    className="text-left hover:underline"
                    onClick={() => s.overlayId && onFocusOverlay?.(s.overlayId)}
                  >
                    {s.message}
                  </button>
                </li>
              ))
            ) : (
              <li className="text-gray-400">No issues</li>
            )}
          </ul>
        </div>
      ))}

      {alternatives && (alternatives.materials || alternatives.tolerances) && (
        <div>
          <h3 className="font-medium text-xs text-gray-600 mb-1">Alternatives</h3>
          {alternatives.materials && (
            <p className="text-xs">Materials: {alternatives.materials.join(", ")}</p>
          )}
          {alternatives.tolerances && (
            <p className="text-xs">Tolerances: {alternatives.tolerances.join(", ")}</p>
          )}
        </div>
      )}

      {lifetime && (
        <div>
          <h3 className="font-medium text-xs text-gray-600 mb-1">Lifetime Estimate</h3>
          <p>
            <span className="font-semibold mr-1">{lifetime.band}</span>
            {lifetime.rationale}
          </p>
        </div>
      )}
    </div>
  );
}

export default DFMPanel;

