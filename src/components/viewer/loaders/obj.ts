import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export async function loadOBJ(url: string): Promise<THREE.BufferGeometry> {
  const loader = new OBJLoader();
  return await new Promise((resolve, reject) => {
    loader.load(
      url,
      (obj) => {
        const geometries: THREE.BufferGeometry[] = [];
        obj.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if ((mesh as any).isMesh && mesh.geometry) {
            const geom = mesh.geometry as THREE.BufferGeometry;
            geometries.push(geom);
          }
        });
        const merged = BufferGeometryUtils.mergeBufferGeometries(geometries, true);
        const geometry = BufferGeometryUtils.mergeVertices(merged);
        geometry.computeVertexNormals();
        resolve(geometry);
      },
      undefined,
      (err) => reject(err)
    );
  });
}
