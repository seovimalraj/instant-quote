import { BufferGeometry, Float32BufferAttribute } from "three";

export interface ParsedSTL {
  geometry: BufferGeometry;
}

function isBinary(data: ArrayBuffer): boolean {
  const reader = new DataView(data);
  if (data.byteLength < 84) {
    return false;
  }
  const faceCount = reader.getUint32(80, true);
  const expected = 84 + faceCount * 50;
  if (expected === data.byteLength) {
    return true;
  }
  const dec = new TextDecoder();
  const head = dec.decode(new Uint8Array(data.slice(0, 5))).toLowerCase();
  return head !== "solid";
}

function parseBinary(data: ArrayBuffer): BufferGeometry {
  const reader = new DataView(data);
  const faces = reader.getUint32(80, true);
  let offset = 84;
  const positions = new Float32Array(faces * 9);
  const normals = new Float32Array(faces * 9);
  for (let i = 0; i < faces; i++) {
    const nx = reader.getFloat32(offset, true);
    const ny = reader.getFloat32(offset + 4, true);
    const nz = reader.getFloat32(offset + 8, true);
    offset += 12;
    for (let j = 0; j < 3; j++) {
      const vx = reader.getFloat32(offset, true);
      const vy = reader.getFloat32(offset + 4, true);
      const vz = reader.getFloat32(offset + 8, true);
      const vertIndex = 9 * i + 3 * j;
      positions[vertIndex] = vx;
      positions[vertIndex + 1] = vy;
      positions[vertIndex + 2] = vz;
      normals[vertIndex] = nx;
      normals[vertIndex + 1] = ny;
      normals[vertIndex + 2] = nz;
      offset += 12;
    }
    offset += 2; // attribute byte count
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  return geometry;
}

function parseASCII(data: string): BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const lines = data.split(/\r?\n/);
  let normal: number[] | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("facet normal")) {
      const parts = trimmed.split(/\s+/);
      normal = [parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4])];
    } else if (trimmed.startsWith("vertex")) {
      const parts = trimmed.split(/\s+/);
      positions.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
      if (normal) normals.push(...normal);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(new Float32Array(positions), 3),
  );
  if (normals.length === positions.length) {
    geometry.setAttribute(
      "normal",
      new Float32BufferAttribute(new Float32Array(normals), 3),
    );
  }
  return geometry;
}

export function parseSTL(data: ArrayBuffer | string): BufferGeometry {
  if (typeof data === "string") {
    return parseASCII(data);
  }
  return isBinary(data) ? parseBinary(data) : parseASCII(new TextDecoder().decode(new Uint8Array(data)));
}

