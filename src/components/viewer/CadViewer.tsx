'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SectionPlane } from './controls/SectionPlane';
import { ViewportHUD, Overlay } from './controls/ViewportHUD';
import { loadStepIges } from './loaders/stepIges';
import { loadSTL } from './loaders/stl';
import { loadOBJ } from './loaders/obj';
import { loadDXF } from './loaders/dxf';
import { computeMeshMetrics, GeometryMetrics } from './utils/meshUtils';

interface CadViewerProps {
  fileUrl: string;
  fileName: string;
  onGeometry: (metrics: GeometryMetrics) => void;
  overlays?: Overlay[];
  onSelect?: (object: THREE.Object3D) => void;
}

export function CadViewer({
  fileUrl,
  fileName,
  onGeometry,
  overlays = [],
  onSelect,
}: CadViewerProps) {
  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const [isOrtho, setIsOrtho] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [section, setSection] = useState(false);
  const [sldprt, setSldprt] = useState(false);

  const screenshotRef = useRef<() => void>();

  useEffect(() => {
    if (!fileUrl) return;
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    if (!ext) return;
    if (ext === 'sldprt') {
      setSldprt(true);
      return;
    }
    setSldprt(false);
    setIsOrtho(ext === 'dxf');

    async function load() {
      try {
        if (['step', 'stp', 'iges', 'igs'].includes(ext)) {
          const { geometry, unit } = await loadStepIges(fileUrl);
          const material = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.1, roughness: 0.8 });
          const mesh = new THREE.Mesh(geometry, material);
          setObject(mesh);
          onGeometry(computeMeshMetrics(geometry, unit as any));
        } else if (ext === 'stl') {
          const geometry = await loadSTL(fileUrl);
          const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xcccccc }));
          setObject(mesh);
          onGeometry(computeMeshMetrics(geometry));
        } else if (ext === 'obj') {
          const geometry = await loadOBJ(fileUrl);
          const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xcccccc }));
          setObject(mesh);
          onGeometry(computeMeshMetrics(geometry));
        } else if (ext === 'dxf') {
          const { object, geometry, unit } = await loadDXF(fileUrl);
          setObject(object);
          onGeometry(computeMeshMetrics(geometry, unit as any));
        }
      } catch (e) {
        console.error('Failed to load CAD file', e);
      }
    }
    load();
  }, [fileUrl, fileName, onGeometry]);

  const handleSelect = (e: any) => {
    e.stopPropagation();
    onSelect?.(e.object);
  };

  const Capture = () => {
    const { gl, scene, camera } = useThree();
    useEffect(() => {
      screenshotRef.current = () => {
        gl.render(scene, camera);
        const link = document.createElement('a');
        link.href = gl.domElement.toDataURL('image/png');
        link.download = `${fileName}.png`;
        link.click();
      };
    }, [gl, scene, camera]);
    return null;
  };

  const Controls = () => {
    const { camera, gl } = useThree();
    useEffect(() => {
      const controls = new OrbitControls(camera, gl.domElement);
      controls.enableDamping = true;
      return () => controls.dispose();
    }, [camera, gl]);
    return null;
  };

  if (!fileUrl) {
    return null;
  }

  return (
    <div className="relative w-full h-full">
      {sldprt && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-200 text-black px-4 py-2 z-20 rounded shadow">
          SLDPRT not supported by in-browser kernels. Export STEP/IGES to view, or enable server converter.
        </div>
      )}
      <Canvas orthographic={isOrtho} onCreated={({ gl }) => gl.setClearColor('#ffffff')}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        {object && <primitive object={object} onClick={handleSelect} />}
        {showGrid && <gridHelper args={[100, 100]} />}
        {showAxes && <axesHelper args={[50]} />}
        <SectionPlane enabled={section} />
        <Controls />
        <Capture />
      </Canvas>
      <ViewportHUD
        showGrid={showGrid}
        toggleGrid={() => setShowGrid(!showGrid)}
        showAxes={showAxes}
        toggleAxes={() => setShowAxes(!showAxes)}
        section={section}
        toggleSection={() => setSection(!section)}
        onScreenshot={() => screenshotRef.current?.()}
        overlays={overlays}
      />
    </div>
  );
}
