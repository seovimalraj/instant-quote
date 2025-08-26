import { BufferGeometry, Vector3 } from "three";

/**
 * Compute the projected surface area of a mesh on the principal planes.
 *
 * The returned areas are in square units matching the units of the geometry
 * (typically millimetres for STL files).
 */
export function projectedArea(
  geom: BufferGeometry,
): { xy: number; yz: number; zx: number } {
  const pos = geom.getAttribute("position");
  const vA = new Vector3();
  const vB = new Vector3();
  const vC = new Vector3();
  const cb = new Vector3();
  const ab = new Vector3();

  let xy = 0;
  let yz = 0;
  let zx = 0;

  for (let i = 0; i < pos.count; i += 3) {
    vA.fromBufferAttribute(pos, i);
    vB.fromBufferAttribute(pos, i + 1);
    vC.fromBufferAttribute(pos, i + 2);

    cb.subVectors(vC, vB);
    ab.subVectors(vA, vB);
    const cross = cb.cross(ab);

    // Each component of the cross product corresponds to twice the
    // area of the triangle projected onto the respective plane.
    xy += Math.abs(cross.z) * 0.5;
    yz += Math.abs(cross.x) * 0.5;
    zx += Math.abs(cross.y) * 0.5;
  }

  return { xy, yz, zx };
}

/**
 * Convenience function returning the projected area on a single plane.
 *
 * @param geom The geometry to evaluate.
 * @param plane The plane to project on: "xy", "yz" or "zx".
 */
export function projectedAreaOnPlane(
  geom: BufferGeometry,
  plane: "xy" | "yz" | "zx",
): number {
  const areas = projectedArea(geom);
  switch (plane) {
    case "xy":
      return areas.xy;
    case "yz":
      return areas.yz;
    case "zx":
    default:
      return areas.zx;
  }
}

