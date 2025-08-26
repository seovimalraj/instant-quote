import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { BufferGeometry } from 'three';

export function mergeGeometriesCompat(geoms: BufferGeometry[], useGroups = false): BufferGeometry {
  const anyB = BufferGeometryUtils as any;
  const fn = anyB.mergeGeometries || anyB.mergeBufferGeometries;
  if (!fn) throw new Error('BufferGeometryUtils.mergeGeometries not available');
  return fn(geoms, useGroups);
}

export function mergeVerticesCompat(geom: BufferGeometry, tol = 1e-4): BufferGeometry {
  const anyB = BufferGeometryUtils as any;
  if (!anyB.mergeVertices) return geom;
  return anyB.mergeVertices(geom, tol);
}
