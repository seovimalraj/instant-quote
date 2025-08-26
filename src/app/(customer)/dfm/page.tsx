"use client";

import { useState } from 'react';
import { ModelViewer } from '@/components/viewer';
import { OverlayList } from '@/components/dfm';

export default function DfmPage() {
  const [file, setFile] = useState<File | null>(null);
  const [overlays, setOverlays] = useState<any[]>([]);

  async function handleAnalyze() {
    if (!file) return;
    const res = await fetch('/api/dfm/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume_mm3: 10, surface_area_mm2: 2, bbox: { x: 1, y: 1, z: 1 } }),
    });
    if (res.ok) {
      const data = await res.json();
      setOverlays(data.overlays);
    }
  }

  async function handleQap() {
    const res = await fetch('/api/qap/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partName: file?.name ?? 'part', ctq: overlays.map((o) => o.message) }),
    });
    if (res.ok) alert('QAP generated');
  }

  return (
    <div className="space-y-4 p-4">
      <input type="file" accept=".step,.stp,.iges,.igs,.stl,.obj,.dxf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <ModelViewer file={file ?? undefined} />
      <button className="px-4 py-2 bg-blue-600 text-white" onClick={handleAnalyze}>Analyze</button>
      <OverlayList overlays={overlays} />
      <div className="space-x-2">
        <button className="px-4 py-2 bg-green-600 text-white" onClick={handleQap}>Generate QAP</button>
        <a href={`/instant-quote?part=${encodeURIComponent(file?.name ?? '')}`} className="px-4 py-2 bg-purple-600 text-white">Instant Quote</a>
      </div>
    </div>
  );
}
