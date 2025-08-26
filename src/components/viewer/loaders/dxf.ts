import * as THREE from 'three';
import DxfParser from 'dxf-parser';

type DxfEntity = { type: string } & (
  | { type: 'LINE'; start: { x: number; y: number }; end: { x: number; y: number } }
  | { type: 'LWPOLYLINE'; vertices: { x: number; y: number }[] }
  | { type: 'POLYLINE'; vertices: { x: number; y: number }[] }
  | { type: 'CIRCLE'; center: { x: number; y: number }; radius: number }
  | {
      type: 'ARC';
      center: { x: number; y: number };
      radius: number;
      startAngle: number;
      endAngle: number;
    }
);

export async function loadDXF(
  url: string
): Promise<{ object: THREE.LineSegments; geometry: THREE.BufferGeometry; unit: string }> {
  const res = await fetch(url);
  const text = await res.text();
  const parser = new DxfParser();
  const dxf: any = parser.parseSync(text);
  if (!dxf) {
    throw new Error('Failed to parse DXF');
  }

  const positions: number[] = [];
  const entities: DxfEntity[] = (dxf.entities as DxfEntity[]) || [];

  for (const e of entities) {
    if (e.type === 'LINE' && e.start && e.end) {
      positions.push(e.start.x, e.start.y, 0, e.end.x, e.end.y, 0);
    } else if (
      (e.type === 'LWPOLYLINE' || e.type === 'POLYLINE') &&
      Array.isArray(e.vertices)
    ) {
      for (let i = 0; i < e.vertices.length - 1; i++) {
        const v1 = e.vertices[i];
        const v2 = e.vertices[i + 1];
        positions.push(v1.x, v1.y, 0, v2.x, v2.y, 0);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color: 0x000000 });
  const lines = new THREE.LineSegments(geometry, material);

  // Determine units; default to mm
  const unit = dxf.header && dxf.header.$INSUNITS ? 'mm' : 'mm';

  return { object: lines, geometry, unit };
}
