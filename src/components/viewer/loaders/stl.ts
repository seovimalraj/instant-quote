import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

export async function loadSTL(url: string): Promise<THREE.BufferGeometry> {
  const loader = new STLLoader();
  return await new Promise((resolve, reject) => {
    loader.load(
      url,
      (geo) => {
        const geometry = geo as THREE.BufferGeometry;
        geometry.computeVertexNormals();
        resolve(geometry);
      },
      undefined,
      (err) => reject(err)
    );
  });
}
