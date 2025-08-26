import * as THREE from 'three';

// Lazy load the heavy OCCT WASM module only when needed
let occt: any;
async function getOCCT() {
  if (!occt) {
    occt = await import('occt-import-js');
  }
  return occt;
}

export async function loadStepIges(
  url: string
): Promise<{ geometry: THREE.BufferGeometry; unit: string }> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const data = new Uint8Array(buffer);
  const ext = url.split('.').pop()?.toLowerCase();

  const occ = await getOCCT();
  let shape: any;
  if (ext === 'stp' || ext === 'step') {
    shape = await occ.readStepFile(data);
  } else {
    shape = await occ.readIgesFile(data);
  }

  const mesh = await occ.tessellate(shape, { deflection: 0.1 });
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
