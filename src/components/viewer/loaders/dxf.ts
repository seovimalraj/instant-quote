// src/components/viewer/loaders/dxf.ts
import * as THREE from 'three';
import DxfParser from 'dxf-parser';

/**
 * Minimal, safe DXF entity unions with optional fields (parser variants differ).
 */
type DxfLine = { type: 'LINE'; start?: { x: number; y: number }; end?: { x: number; y: number } };
type DxfLWPolyline = { type: 'LWPOLYLINE'; vertices?: { x: number; y: number }[]; closed?: boolean };
type DxfPolyline = { type: 'POLYLINE'; vertices?: { x: number; y: number }[]; closed?: boolean };
type DxfCircle = { type: 'CIRCLE'; center?: { x: number; y: number }; radius?: number };
type DxfArc = {
  type: 'ARC';
  center?: { x: number; y: number };
  radius?: number;
  startAngle?: number; // degrees
  endAngle?: number; // degrees
};

type DxfEntity = (DxfLine | DxfLWPolyline | DxfPolyline | DxfCircle | DxfArc) & { type: string };

type ParsedDXF = {
  entities?: DxfEntity[];
  header?: { $INSUNITS?: number };
};

function unitFromInsunits(code?: number): 'mm' | 'inch' | 'cm' | 'm' | 'unitless' {
  switch (code) {
    case 1:
      return 'inch';
    case 4:
      return 'mm';
    case 5:
      return 'cm';
    case 6:
      return 'm';
    case 0:
    default:
      return 'mm'; // default to mm if unknown/unitless
  }
}

function pushLine(positions: number[], x1: number, y1: number, x2: number, y2: number) {
  positions.push(x1, y1, 0, x2, y2, 0);
}

function tessellateCircle(
  positions: number[],
  cx: number,
  cy: number,
  r: number,
  segments = 64
) {
  if (!(isFinite(cx) && isFinite(cy) && isFinite(r) && r > 0)) return;
  let prevX = cx + r;
  let prevY = cy;
  for (let i = 1; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = cx + r * Math.cos(theta);
    const y = cy + r * Math.sin(theta);
    pushLine(positions, prevX, prevY, x, y);
    prevX = x;
    prevY = y;
  }
}

function tessellateArc(
  positions: number[],
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
  segments = 48
) {
  if (!(isFinite(cx) && isFinite(cy) && isFinite(r) && r > 0)) return;
  // Normalize to radians, ensure positive sweep
  let start = (startDeg * Math.PI) / 180;
  let end = (endDeg * Math.PI) / 180;
  while (end < start) end += Math.PI * 2;
  const sweep = end - start;
  const steps = Math.max(2, Math.round((segments * sweep) / (Math.PI * 2)));

  let prevX = cx + r * Math.cos(start);
  let prevY = cy + r * Math.sin(start);
  for (let i = 1; i <= steps; i++) {
    const t = start + (i / steps) * sweep;
    const x = cx + r * Math.cos(t);
    const y = cy + r * Math.sin(t);
    pushLine(positions, prevX, prevY, x, y);
    prevX = x;
    prevY = y;
  }
}

export async function loadDXF(
  url: string
): Promise<{ object: THREE.LineSegments; geometry: THREE.BufferGeometry; unit: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch DXF: ${res.status} ${res.statusText}`);
  const text = await res.text();

  const parser = new DxfParser();
  const dxf = (parser.parseSync(text) as ParsedDXF) ?? {};
  const entities: DxfEntity[] = Array.isArray(dxf.entities) ? (dxf.entities as DxfEntity[]) : [];
  const positions: number[] = [];

  for (const e of entities) {
    switch (e.type) {
      case 'LINE': {
        const { start, end } = e as DxfLine;
        if (start && end) pushLine(positions, start.x, start.y, end.x, end.y);
        break;
      }
      case 'LWPOLYLINE':
      case 'POLYLINE': {
        const poly = e as DxfLWPolyline | DxfPolyline;
        const verts = Array.isArray(poly.vertices) ? poly.vertices : [];
        for (let i = 0; i < verts.length - 1; i++) {
          const v1 = verts[i];
          const v2 = verts[i + 1];
          if (v1 && v2) pushLine(positions, v1.x, v1.y, v2.x, v2.y);
        }
        // Close if marked closed and there are 2+ vertices
        const isClosed = Boolean((poly as any).closed);
        if (isClosed && verts.length > 2) {
          const vA = verts[0];
          const vB = verts[verts.length - 1];
          if (vA && vB) pushLine(positions, vB.x, vB.y, vA.x, vA.y);
        }
        break;
      }
      case 'CIRCLE': {
        const { center, radius } = e as DxfCircle;
        if (center && typeof radius === 'number') {
          tessellateCircle(positions, center.x, center.y, radius);
        }
        break;
      }
      case 'ARC': {
        const { center, radius, startAngle, endAngle } = e as DxfArc;
        if (center && typeof radius === 'number' && typeof startAngle === 'number' && typeof endAngle === 'number') {
          tessellateArc(positions, center.x, center.y, radius, startAngle, endAngle);
        }
        break;
      }
      default:
        // Unsupported or unhandled entity; skip safely
        break;
    }
  }

  const geometry = new THREE.BufferGeometry();
  if (positions.length > 0) {
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  } else {
    // Create an empty attribute to keep Three happy
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
  }

  const material = new THREE.LineBasicMaterial({ color: 0x111111 });
  const lines = new THREE.LineSegments(geometry, material);

  // Units
  const unit = unitFromInsunits(dxf.header?.$INSUNITS);

  return { object: lines, geometry, unit };
}
