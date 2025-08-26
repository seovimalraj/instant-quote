import { inferUnits, convertToMM, Units } from "./units";

export interface ParsedSTL {
  bbox: { min: [number, number, number]; max: [number, number, number] };
  surfaceArea_mm2: number;
  volume_mm3: number;
  units: Units;
}

function isBinary(data: ArrayBuffer): boolean {
  if (data.byteLength < 84) return false;
  const reader = new DataView(data);
  const faceCount = reader.getUint32(80, true);
  const expected = 84 + faceCount * 50;
  if (expected === data.byteLength) return true;
  const dec = new TextDecoder();
  const head = dec
    .decode(new Uint8Array(data.slice(0, 5)))
    .toLowerCase();
  return head !== "solid";
}

function parseBinary(data: ArrayBuffer): Float32Array {
  const reader = new DataView(data);
  const faces = reader.getUint32(80, true);
  let offset = 84;
  const positions = new Float32Array(faces * 9);
  for (let i = 0; i < faces; i++) {
    offset += 12; // skip normal
    for (let j = 0; j < 3; j++) {
      const vx = reader.getFloat32(offset, true);
      const vy = reader.getFloat32(offset + 4, true);
      const vz = reader.getFloat32(offset + 8, true);
      const idx = i * 9 + j * 3;
      positions[idx] = vx;
      positions[idx + 1] = vy;
      positions[idx + 2] = vz;
      offset += 12;
    }
    offset += 2; // attribute byte count
  }
  return positions;
}

function parseASCII(text: string): Float32Array {
  const positions: number[] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("vertex")) {
      const parts = trimmed.split(/\s+/);
      positions.push(
        parseFloat(parts[1]),
        parseFloat(parts[2]),
        parseFloat(parts[3]),
      );
    }
  }
  return new Float32Array(positions);
}

export function parseSTL(
  data: ArrayBuffer,
  opts: { unitsHint?: Units } = {},
): ParsedSTL {
  const positions = isBinary(data)
    ? parseBinary(data)
    : parseASCII(new TextDecoder().decode(new Uint8Array(data)));

  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity,
    maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;
  let surface = 0;
  let volume = 0;

  for (let i = 0; i < positions.length; i += 9) {
    const ax = positions[i];
    const ay = positions[i + 1];
    const az = positions[i + 2];
    const bx = positions[i + 3];
    const by = positions[i + 4];
    const bz = positions[i + 5];
    const cx = positions[i + 6];
    const cy = positions[i + 7];
    const cz = positions[i + 8];

    if (ax < minX) minX = ax;
    if (ay < minY) minY = ay;
    if (az < minZ) minZ = az;
    if (ax > maxX) maxX = ax;
    if (ay > maxY) maxY = ay;
    if (az > maxZ) maxZ = az;
    if (bx < minX) minX = bx;
    if (by < minY) minY = by;
    if (bz < minZ) minZ = bz;
    if (bx > maxX) maxX = bx;
    if (by > maxY) maxY = by;
    if (bz > maxZ) maxZ = bz;
    if (cx < minX) minX = cx;
    if (cy < minY) minY = cy;
    if (cz < minZ) minZ = cz;
    if (cx > maxX) maxX = cx;
    if (cy > maxY) maxY = cy;
    if (cz > maxZ) maxZ = cz;

    const abx = bx - ax;
    const aby = by - ay;
    const abz = bz - az;
    const acx = cx - ax;
    const acy = cy - ay;
    const acz = cz - az;

    const crossX = aby * acz - abz * acy;
    const crossY = abz * acx - abx * acz;
    const crossZ = abx * acy - aby * acx;

    const area = Math.sqrt(
      crossX * crossX + crossY * crossY + crossZ * crossZ,
    ) * 0.5;
    surface += area;

    volume += (ax * crossX + ay * crossY + az * crossZ) / 6;
  }

  const dx = maxX - minX;
  const dy = maxY - minY;
  const dz = maxZ - minZ;
  const diagonal = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const units = inferUnits(diagonal, opts.unitsHint);
  const scale = convertToMM(1, units);

  const bbox = {
    min: [minX * scale, minY * scale, minZ * scale] as [
      number,
      number,
      number,
    ],
    max: [maxX * scale, maxY * scale, maxZ * scale] as [
      number,
      number,
      number,
    ],
  };

  return {
    bbox,
    surfaceArea_mm2: surface * scale * scale,
    volume_mm3: Math.abs(volume) * scale * scale * scale,
    units,
  };
}

