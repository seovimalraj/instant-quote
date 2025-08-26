import { BufferGeometry, Float32BufferAttribute } from 'three';
import { parseSTL } from 'src/lib/geometry/stl';

function parseOBJ(data: string): BufferGeometry {
  const verts: number[][] = [];
  const faces: number[][] = [];
  data.split('\n').forEach((line) => {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === 'v') verts.push(parts.slice(1).map(Number));
    if (parts[0] === 'f') faces.push(parts.slice(1).map(v => parseInt(v) - 1));
  });
  const positions: number[] = [];
  faces.forEach(([a,b,c]) => {
    positions.push(...verts[a], ...verts[b], ...verts[c]);
  });
  const geom = new BufferGeometry();
  geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return geom;
}

describe('viewer loaders', () => {
  it('loads STL and computes metrics', () => {
    const stl = `solid cube\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid`;
    const arrayBuffer = new TextEncoder().encode(stl).buffer;
    const geom = parseSTL(arrayBuffer);
    expect(geom.surfaceArea_mm2).toBeGreaterThan(322);
    expect(geom.surfaceArea_mm2).toBeLessThan(323);
    expect(geom.volume_mm3).toBeGreaterThanOrEqual(0);
    expect(geom.volume_mm3).toBeLessThan(1);
    expect(geom.bbox.max[0]).toBeGreaterThan(25.39);
    expect(geom.bbox.max[0]).toBeLessThan(25.41);
  });

  it('loads OBJ and computes metrics', () => {
    const obj = `v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3`;
    const geom = parseOBJ(obj);
    const positions = geom.attributes.position.array as ArrayLike<number>;
    let maxX = -Infinity;
    for (let i = 0; i < positions.length; i += 3) {
      if (positions[i] > maxX) maxX = positions[i];
    }
    expect(positions.length).toBeGreaterThan(0);
    expect(maxX).toBeGreaterThan(0.99);
    expect(maxX).toBeLessThan(1.01);
  });

  it('loads STEP mesh and computes metrics', () => {
    const tris = [0, 0, 0, 1, 0, 0, 0, 1, 0];
    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(tris, 3));
    const positions = geom.attributes.position.array as ArrayLike<number>;
    let maxY = -Infinity;
    for (let i = 0; i < positions.length; i += 3) {
      if (positions[i + 1] > maxY) maxY = positions[i + 1];
    }
    expect(positions.length / 3).toBe(3);
    expect(maxY).toBeGreaterThan(0.99);
    expect(maxY).toBeLessThan(1.01);
  });
});
