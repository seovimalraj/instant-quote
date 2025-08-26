// src/components/viewer/loaders/obj.ts
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { mergeGeometriesCompat, mergeVerticesCompat } from '../utils/geometryCompat';

export async function loadOBJ(url: string) {
  // Fetch OBJ text and use the synchronous parser to avoid loader/load version churn
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch OBJ: ${res.status} ${res.statusText}`);
  const text = await res.text();

  const loader = new OBJLoader();
  const obj = loader.parse(text);

  // Collect child mesh geometries
  const geoms: THREE.BufferGeometry[] = [];
  obj.traverse((child: any) => {
    if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).geometry) {
      const g = (child as THREE.Mesh).geometry as THREE.BufferGeometry;
      geoms.push(g);
    }
  });

  // Merge (if multiple), then dedupe vertices
  const merged =
    geoms.length === 0
      ? new THREE.BufferGeometry()
      : geoms.length === 1
      ? geoms[0]
      : mergeGeometriesCompat(geoms, true);

  const dedup = mergeVerticesCompat(merged, 1e-4);

  // Ensure normals/bounds for proper shading and interactions
  if (!dedup.getAttribute('normal') || (dedup.getAttribute('normal') as any).count === 0) {
    dedup.computeVertexNormals();
  }
  dedup.computeBoundingBox();
  dedup.computeBoundingSphere();

  // Build a simple mesh
  const mat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.1,
    roughness: 0.8
  });
  const mesh = new THREE.Mesh(dedup, mat);

  return { object: mesh, geometry: dedup };
}
