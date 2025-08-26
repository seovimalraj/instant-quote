import * as THREE from 'three';
import DxfParser from 'dxf-parser';

export async function loadDXF(
  url: string
): Promise<{ object: THREE.LineSegments; geometry: THREE.BufferGeometry; unit: string }> {
  const res = await fetch(url);
  const text = await res.text();
  const parser = new DxfParser();
  const dxf = parser.parseSync(text);

  const positions: number[] = [];
  const entities: any[] = Array.isArray(dxf.entities) ? dxf.entities : [];

  for (const e of entities) {
    if (e.type === 'LINE') {
      const { start, end } = e;
      if (start && end) {
        positions.push(start.x, start.y, 0, end.x, end.y, 0);
      }
    } else if (e.type === 'LWPOLYLINE' || e.type === 'POLYLINE') {
      const verts = Array.isArray(e.vertices) ? e.vertices : [];
      for (let i = 0; i < verts.length - 1; i++) {
        const v1 = verts[i];
        const v2 = verts[i + 1];
        if (v1 && v2) {
          positions.push(v1.x, v1.y, 0, v2.x, v2.y, 0);
        }
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
