export type Axis = 'x' | 'y' | 'z';

/**
 * Compute projected area of a triangle mesh along a given axis.
 * @param tris Array of triangles, each triangle is [[x,y,z],[x,y,z],[x,y,z]] in mm.
 * @param axis Axis onto which the area is projected.
 * @returns Projected area in cm^2
 */
export function projectedAreaFromMesh(
  tris: number[][][],
  axis: Axis,
): { area_cm2: number } {
  const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  let areaComponent = 0;
  for (const tri of tris) {
    const [a, b, c] = tri;
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cross = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ];
    areaComponent += Math.abs(cross[axisIndex]);
  }
  // cross component is 2 * area * (n · axis), divide by 4 to avoid double counting
  const area_mm2 = areaComponent / 4;
  const area_cm2 = area_mm2 / 100;
  return { area_cm2 };
}

/**
 * Determine the axis with maximum projected area.
 */
export function maxProjectedArea(
  tris: number[][][],
): { axis: Axis; area_cm2: number } {
  const axes: Axis[] = ['x', 'y', 'z'];
  let max = { axis: 'x' as Axis, area_cm2: 0 };
  for (const axis of axes) {
    const { area_cm2 } = projectedAreaFromMesh(tris, axis);
    if (area_cm2 > max.area_cm2) {
      max = { axis, area_cm2 };
    }
  }
  return max;
}

/**
 * Compute projected area from bounding box dimensions.
 * @param bbox [dx, dy, dz] in mm
 * @param axis Axis of projection
 * @returns Area in cm^2
 */
export function bboxProjectedArea(
  bbox: [number, number, number],
  axis: Axis,
): number {
  const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  const dims = bbox.slice();
  dims.splice(axisIndex, 1);
  const area_mm2 = dims[0] * dims[1];
  return area_mm2 / 100;
}
