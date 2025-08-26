/// <reference path='../../../types/occt-import-js.d.ts' />
import * as THREE from 'three';

export async function loadStepIges(
  url: string
): Promise<{ geometry: THREE.BufferGeometry; unit: string }> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const data = new Uint8Array(buffer);
  const ext = url.split('.').pop()?.toLowerCase();

  const occt: any = await import('occt-import-js');
  let shape: any;
  if (ext === 'stp' || ext === 'step') {
    shape = await occt.readStepFile(data);
  } else {
    shape = await occt.readIgesFile(data);
  }

  const mesh = await occt.tessellate(shape, { deflection: 0.1 });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(mesh.vertices, 3));
  if (mesh.normals) {
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.normals, 3));
  }
  if (mesh.indices) {
    geometry.setIndex(mesh.indices);
  }
  geometry.computeVertexNormals();

  return { geometry, unit: mesh.unit || 'mm' };
}
