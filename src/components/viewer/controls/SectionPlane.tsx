'use client';

import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEffect } from 'react';

interface SectionPlaneProps {
  enabled: boolean;
}

export function SectionPlane({ enabled }: SectionPlaneProps) {
  const { gl } = useThree();

  useEffect(() => {
    if (enabled) {
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      gl.clippingPlanes = [plane];
      gl.localClippingEnabled = true;
    } else {
      gl.clippingPlanes = [];
      gl.localClippingEnabled = false;
    }
  }, [enabled, gl]);

  return null;
}
