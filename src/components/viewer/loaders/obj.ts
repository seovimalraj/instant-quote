import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { mergeGeometriesCompat, mergeVerticesCompat } from '../utils/geometryCompat';

export async function loadOBJ(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch OBJ: ${res.status}`);
  const text = await res.text();
  const loader = new OBJLoader();
  const obj = loader.parse(text);
  const geoms: THREE.BufferGeometry[] = [];
  obj.traverse((c: any) => {
    if ((c as THREE.Mesh).isMesh) {
      const g = (c as THREE.Mesh).geometry as THREE.BufferGeometry;
      geoms.push(g);
    }
  });
  const merged = geoms.length === 1 ? geoms[0] : mergeGeometriesCompat(geoms, true);
  const dedup = mergeVerticesCompat(merged);
  const mat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.1, roughness: 0.8 });
  const mesh = new THREE.Mesh(dedup, mat);
  return { object: mesh, geometry: dedup };
}
