'use client';

import React from 'react';

export interface Overlay {
  id: string;
  element: React.ReactNode;
}

interface ViewportHUDProps {
  showGrid: boolean;
  toggleGrid: () => void;
  showAxes: boolean;
  toggleAxes: () => void;
  section: boolean;
  toggleSection: () => void;
  onScreenshot: () => void;
  overlays?: Overlay[];
}

export function ViewportHUD({
  showGrid,
  toggleGrid,
  showAxes,
  toggleAxes,
  section,
  toggleSection,
  onScreenshot,
  overlays = [],
}: ViewportHUDProps) {
  return (
    <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
      <button
        className="bg-white/70 px-2 py-1 text-xs rounded"
        onClick={onScreenshot}
        title="Screenshot"
      >
        📷
      </button>
      <button
        className="bg-white/70 px-2 py-1 text-xs rounded"
        onClick={toggleSection}
        title="Toggle section plane"
      >
        {section ? 'Section Off' : 'Section'}
      </button>
      <button
        className="bg-white/70 px-2 py-1 text-xs rounded"
        onClick={toggleGrid}
        title="Toggle grid"
      >
        {showGrid ? 'Grid Off' : 'Grid'}
      </button>
      <button
        className="bg-white/70 px-2 py-1 text-xs rounded"
        onClick={toggleAxes}
        title="Toggle axes"
      >
        {showAxes ? 'Axes Off' : 'Axes'}
      </button>
      {overlays.map((o) => (
        <React.Fragment key={o.id}>{o.element}</React.Fragment>
      ))}
    </div>
  );
}
