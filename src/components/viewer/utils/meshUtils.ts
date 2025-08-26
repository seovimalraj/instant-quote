import * as THREE from 'three';

export interface GeometryMetrics {
  bbox: { min: THREE.Vector3; max: THREE.Vector3 };
  volume_mm3: number;
  surface_area_mm2: number;
  triangleCount: number;
}

/**
 * Compute common geometry metrics. Geometry is cloned and scaled into millimetres
 * before calculation so that metrics are always returned in mm units.
 */
export function computeMeshMetrics(
  geometry: THREE.BufferGeometry,
  unit: 'mm' | 'm' | 'cm' | 'in' | undefined = 'mm'
): GeometryMetrics {
  const geom = geometry.clone();

  // Normalise units so results are always in millimetres.
  const unitScale = unit === 'm' ? 1000 : unit === 'cm' ? 10 : unit === 'in' ? 25.4 : 1;
  geom.scale(unitScale, unitScale, unitScale);

  geom.computeBoundingBox();
  const bbox = geom.boundingBox ?? new THREE.Box3();

  const pos = geom.getAttribute('position');
  const index = geom.getIndex();
  let volume = 0;
  let area = 0;
  let triangleCount = 0;

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();

  if (pos) {
    const getVertex = (i: number, target: THREE.Vector3) => {
      target.fromBufferAttribute(pos as THREE.BufferAttribute, i);
    };

    const indices = index
      ? Array.from((index as THREE.BufferAttribute).array)
      : Array.from({ length: pos.count }, (_, i) => i);

    for (let i = 0; i < indices.length; i += 3) {
      getVertex(indices[i], vA);
      getVertex(indices[i + 1], vB);
      getVertex(indices[i + 2], vC);

      // Triangle area
      area += new THREE.Triangle(vA, vB, vC).getArea();

      // Tetrahedron volume relative to the origin
      volume += vA.dot(vB.cross(vC)) / 6;
      triangleCount += 1;
    }
  }

  return {
    bbox: { min: bbox.min.clone(), max: bbox.max.clone() },
    volume_mm3: Math.abs(volume),
    surface_area_mm2: Math.abs(area),
    triangleCount,
  };
}
