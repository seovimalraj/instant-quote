import { parseSTL } from '../../src/lib/geometry/stl';
import fs from 'fs';
import path from 'path';

describe('parseSTL', () => {
  const file = path.join(__dirname, '../../fixtures/parts/plate_10x10x2.stl');

  it('parses binary STL and computes metrics', () => {
    const buf = fs.readFileSync(file);
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const geom = parseSTL(arrayBuffer);
    expect(geom.volume_mm3).toBeCloseTo(200);
    expect(geom.surfaceArea_mm2).toBeCloseTo(280);
    expect(geom.bbox.max[2]).toBeCloseTo(2);
  });

  it('parses ascii STL and computes metrics', () => {
    const txt = fs.readFileSync(file, 'utf8');
    const arrayBuffer = new TextEncoder().encode(txt).buffer;
    const geom = parseSTL(arrayBuffer);
    expect(geom.volume_mm3).toBeCloseTo(200);
    expect(geom.surfaceArea_mm2).toBeCloseTo(280);
    expect(geom.bbox.max[0]).toBeCloseTo(10);
  });
});
