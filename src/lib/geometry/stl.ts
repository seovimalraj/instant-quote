import { BufferGeometry, Vector3, BufferAttribute } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";

export interface GeometryData {
  volume_mm3: number;
  surface_area_mm2: number;
  bbox: [number, number, number];
  projected_area_mm2?: number;
}

/** Compute geometry metrics from a THREE.BufferGeometry. */
export function geometryFromBufferGeometry(geom: BufferGeometry): GeometryData {
  geom.computeBoundingBox();
  const bbox = geom.boundingBox!;
  const size = bbox.getSize(new Vector3());
  const bboxArr: [number, number, number] = [size.x, size.y, size.z];

  const pos = geom.getAttribute("position");
  const vA = new Vector3();
  const vB = new Vector3();
  const vC = new Vector3();
  const cb = new Vector3();
  const ab = new Vector3();
  let volume = 0;
  let surface = 0;
  for (let i = 0; i < pos.count; i += 3) {
    vA.fromBufferAttribute(pos, i);
    vB.fromBufferAttribute(pos, i + 1);
    vC.fromBufferAttribute(pos, i + 2);
    cb.subVectors(vC, vB);
    ab.subVectors(vA, vB);
    const cross = cb.cross(ab);
    const area = cross.length() * 0.5;
    surface += area;
    volume += vA.dot(cross) / 6;
  }
  volume = Math.abs(volume);
  surface = Math.abs(surface);
  return { volume_mm3: volume, surface_area_mm2: surface, bbox: bboxArr };
}

/** Parse an STL file and compute geometry metrics. */
export function computeStlGeometry(arrayBuffer: ArrayBuffer): GeometryData {
  const loader = new STLLoader();
  const geom = loader.parse(arrayBuffer);
  return geometryFromBufferGeometry(geom);
}

/** Helper to build BufferGeometry from raw mesh data. */
export function bufferGeometryFromMesh(mesh: {
  vertices: number[][];
  faces: number[][];
}): BufferGeometry {
  const geometry = new BufferGeometry();
  const flatVerts = new Float32Array(mesh.vertices.flat());
  geometry.setAttribute("position", new BufferAttribute(flatVerts, 3));
  const flatIdx = mesh.faces.flat();
  geometry.setIndex(flatIdx);
  geometry.computeVertexNormals();
  return geometry;
}
