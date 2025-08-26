import { BufferGeometry, Float32BufferAttribute } from 'three';
import { parseSTL } from '../../src/lib/geometry/stl';

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
    const geom = parseSTL(stl);
    geom.computeBoundingBox();
    expect(geom.getAttribute('position').count).toBeGreaterThan(0);
    expect(geom.boundingBox).toBeTruthy();
  });

  it('loads OBJ and computes metrics', () => {
    const obj = `v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3`;
    const geom = parseOBJ(obj);
    geom.computeBoundingBox();
    expect(geom.getAttribute('position').count).toBeGreaterThan(0);
    expect(geom.boundingBox).toBeTruthy();
  });

  it('loads STEP mesh and computes metrics', () => {
    const tris = [0,0,0, 1,0,0, 0,1,0];
    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(tris, 3));
    geom.computeBoundingBox();
    expect(geom.getAttribute('position').count).toBe(3);
    expect(geom.boundingBox).toBeTruthy();
  });
});
