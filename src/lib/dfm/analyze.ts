import { Overlay } from './types';
import { randomUUID } from 'crypto';

export interface AnalyzeInput {
  volume_mm3: number;
  surface_area_mm2: number;
  bbox: { x: number; y: number; z: number };
}

export function analyzeGeometry(input: AnalyzeInput): Overlay[] {
  const overlays: Overlay[] = [];
  const minWall = Math.min(input.bbox.x, input.bbox.y, input.bbox.z);
  if (minWall < 2)
    overlays.push({
      id: randomUUID(),
      type: 'thin_wall',
      message: 'Wall thickness under 2mm',
      severity: 'warning',
    });
  if (input.volume_mm3 / input.surface_area_mm2 > 5)
    overlays.push({
      id: randomUUID(),
      type: 'overhang',
      message: 'High overhang ratio',
      severity: 'info',
    });
  return overlays;
}
