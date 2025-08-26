import { BufferGeometry, Vector3 } from "three";

/** Compute the projected area of a mesh on the XY plane. */
export function projectedArea(geom: BufferGeometry): number {
  const pos = geom.getAttribute("position");
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  let area = 0;
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const acx = c.x - a.x;
    const acy = c.y - a.y;
    area += Math.abs(abx * acy - aby * acx) / 2;
  }
  return area;
}
