import { convertToMM, inferUnits, Units } from './units';

export interface ParsedSTL {
  triangles: number[][][];
  bbox: { min: [number, number, number]; max: [number, number, number] };
  surfaceArea_mm2: number;
  volume_mm3: number;
  units: Units;
  scaleToMM: (v: [number, number, number]) => [number, number, number];
}

function isBinarySTL(buf: Buffer): boolean {
  if (buf.length < 84) return false;
  const header = buf.slice(0, 80).toString('utf-8');
  const solid = header.trim().startsWith('solid');
  const triCount = buf.readUInt32LE(80);
  const expectedSize = 84 + triCount * 50;
  if (expectedSize === buf.length) return true;
  return !solid;
}

export function parseSTL(
  input: ArrayBuffer | Buffer,
  opts?: { unitsHint?: Units },
): ParsedSTL {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const triangles: number[][][] = [];
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity,
    maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity,
    surface = 0,
    volume = 0;

  const addTriangle = (
    v1: [number, number, number],
    v2: [number, number, number],
    v3: [number, number, number],
  ) => {
    triangles.push([v1, v2, v3]);
    const xs = [v1[0], v2[0], v3[0]];
    const ys = [v1[1], v2[1], v3[1]];
    const zs = [v1[2], v2[2], v3[2]];
    minX = Math.min(minX, ...xs);
    minY = Math.min(minY, ...ys);
    minZ = Math.min(minZ, ...zs);
    maxX = Math.max(maxX, ...xs);
    maxY = Math.max(maxY, ...ys);
    maxZ = Math.max(maxZ, ...zs);

    const ab = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
    const ac = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];
    const cross = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ];
    const area = 0.5 * Math.hypot(cross[0], cross[1], cross[2]);
    surface += area;
    volume += (v1[0] * cross[0] + v1[1] * cross[1] + v1[2] * cross[2]) / 6;
  };

  if (isBinarySTL(buf)) {
    const triCount = buf.readUInt32LE(80);
    let offset = 84;
    for (let i = 0; i < triCount; i++) {
      offset += 12; // skip normal
      const v1: [number, number, number] = [
        buf.readFloatLE(offset),
        buf.readFloatLE(offset + 4),
        buf.readFloatLE(offset + 8),
      ];
      offset += 12;
      const v2: [number, number, number] = [
        buf.readFloatLE(offset),
        buf.readFloatLE(offset + 4),
        buf.readFloatLE(offset + 8),
      ];
      offset += 12;
      const v3: [number, number, number] = [
        buf.readFloatLE(offset),
        buf.readFloatLE(offset + 4),
        buf.readFloatLE(offset + 8),
      ];
      offset += 12;
      offset += 2; // attribute byte count
      addTriangle(v1, v2, v3);
    }
  } else {
    const text = buf.toString('utf-8');
    const facetRegex = /facet[\s\S]*?endfacet/g;
    let match: RegExpExecArray | null;
    while ((match = facetRegex.exec(text))) {
      const verts: [number, number, number][] = [];
      const vertexRegex = /vertex\s+([\-+eE0-9\.]+)\s+([\-+eE0-9\.]+)\s+([\-+eE0-9\.]+)/g;
      let vMatch: RegExpExecArray | null;
      while ((vMatch = vertexRegex.exec(match[0]))) {
        verts.push([
          parseFloat(vMatch[1]),
          parseFloat(vMatch[2]),
          parseFloat(vMatch[3]),
        ]);
      }
      if (verts.length === 3) {
        addTriangle(verts[0], verts[1], verts[2]);
      }
    }
  }

  const bboxMin: [number, number, number] = [minX, minY, minZ];
  const bboxMax: [number, number, number] = [maxX, maxY, maxZ];
  const diag = Math.sqrt(
    (maxX - minX) ** 2 + (maxY - minY) ** 2 + (maxZ - minZ) ** 2,
  );
  const units = inferUnits(diag, opts?.unitsHint);
  const scale = convertToMM(1, units);
  const bbox = {
    min: bboxMin.map((v) => convertToMM(v, units)) as [
      number,
      number,
      number,
    ],
    max: bboxMax.map((v) => convertToMM(v, units)) as [
      number,
      number,
      number,
    ],
  };
  const surfaceArea_mm2 = surface * scale * scale;
  const volume_mm3 = Math.abs(volume) * scale * scale * scale;

  return {
    triangles,
    bbox,
    surfaceArea_mm2,
    volume_mm3,
    units,
    scaleToMM: (v: [number, number, number]) => [
      convertToMM(v[0], units),
      convertToMM(v[1], units),
      convertToMM(v[2], units),
    ],
  };
}
