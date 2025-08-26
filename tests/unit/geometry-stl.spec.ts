import { describe, it, expect } from 'vitest';
import { parseSTL } from '../../src/lib/geometry/stl';
import fs from 'fs';
import path from 'path';

describe('parseSTL', () => {
  it('parses ascii plate', () => {
    const txt = fs.readFileSync(path.join(__dirname, '../../fixtures/parts/plate_10x10x2.stl'), 'utf8');
    const geom = parseSTL(txt);
    geom.computeBoundingBox();
    expect(geom.boundingBox?.max.x).toBeCloseTo(10);
    expect(geom.boundingBox?.max.y).toBeCloseTo(10);
    expect(geom.boundingBox?.max.z).toBeCloseTo(2);
  });
});
