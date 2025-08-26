/// <reference path='../../../types/occt-import-js.d.ts' />
import * as THREE from 'three';
import { mergeGeometriesCompat, mergeVerticesCompat } from '../utils/geometryCompat';

export async function loadSTEPorIGES(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch CAD: ${res.status}`);
  const buf = await res.arrayBuffer();
  const occt: any = await import('occt-import-js');
  const api = await occt();
  const ext = url.toLowerCase().split('.').pop() || 'step';
  const isStep = ext === 'step' || ext === 'stp';
  const doc = isStep ? api.ReadStepFile(buf) : api.ReadIgesFile(buf);
  const meshes: THREE.Mesh[] = [];
  const geoms: THREE.BufferGeometry[] = [];
  for (const s of doc.shapes || []) {
    const tri = api.Triangulate(s, 0.5, true); // view tolerance
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(tri.vertices, 3));
    if (tri.normals?.length) geom.setAttribute('normal', new THREE.Float32BufferAttribute(tri.normals, 3));
    geoms.push(geom);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8aa2c8, metalness: 0.2, roughness: 0.8 });
    meshes.push(new THREE.Mesh(geom, mat));
  }
  const group = new THREE.Group(); meshes.forEach(m => group.add(m));
  const merged = geoms.length === 1 ? geoms[0] : mergeGeometriesCompat(geoms, true);
  const dedup = mergeVerticesCompat(merged);
  const unit = doc.unit || 'mm';
  return { object: group, geometry: dedup, unit };
}
