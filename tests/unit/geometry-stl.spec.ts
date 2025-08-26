import { parseSTL } from '../../src/lib/geometry/stl';
import fs from 'fs';
import path from 'path';

describe('parseSTL', () => {
  it('parses binary cube and computes bounding box', () => {
    const buf = fs.readFileSync(path.join(__dirname, '../../fixtures/parts/cube_10mm.stl'));
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const geom = parseSTL(arrayBuffer);
    geom.computeBoundingBox();
    expect(geom.getAttribute('position').count).toBe(36);
    expect(geom.boundingBox?.max.x).toBeCloseTo(10);
    expect(geom.boundingBox?.max.y).toBeCloseTo(10);
    expect(geom.boundingBox?.max.z).toBeCloseTo(10);
  });

  it('parses ascii plate', () => {
    const txt = fs.readFileSync(path.join(__dirname, '../../fixtures/parts/plate_10x10x2.stl'), 'utf8');
    const geom = parseSTL(txt);
    geom.computeBoundingBox();
    expect(geom.getAttribute('position').count).toBe(36);
    expect(geom.boundingBox?.max.z).toBeCloseTo(2);
  });
});
