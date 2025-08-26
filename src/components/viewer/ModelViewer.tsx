"use client";

import { Canvas, useThree, useLoader, extend } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
// @ts-ignore - OrbitControls lacks bundled type declarations under bundler resolution
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// @ts-ignore - example loaders lack type declarations
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
// @ts-ignore
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
// @ts-ignore
import { DXFLoader } from "three/examples/jsm/loaders/DXFLoader";
import * as THREE from "three";

extend({ OrbitControls });

interface Props {
  file?: File;
  url?: string;
}

function Model({ url, ext }: { url: string; ext: string }) {
  const geom = useLoader(
    ext === "stl"
      ? STLLoader
      : ext === "obj"
      ? OBJLoader
      : DXFLoader,
    url
  );
  return <primitive object={geom instanceof THREE.Group ? geom : new THREE.Mesh(geom)} />;
}

function Controls() {
  const { camera, gl } = useThree();
  const ref = useRef<any>();
  useEffect(() => {
    ref.current?.update();
  });
  // @ts-ignore
  return <orbitControls ref={ref} args={[camera, gl.domElement]} />;
}

export default function ModelViewer({ file, url }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [ext, setExt] = useState<string>("");

  useEffect(() => {
    if (file) {
      setSrc(URL.createObjectURL(file));
      setExt(file.name.split(".").pop()!.toLowerCase());
    } else if (url) {
      setSrc(url);
      const parts = url.split("?")[0].split(".");
      setExt(parts[parts.length - 1].toLowerCase());
    }
  }, [file, url]);

  if (!src) return <p className="text-sm">Upload a model to view</p>;
  if (["step", "stp", "iges", "igs"].includes(ext)) {
    return (
      <p className="text-sm text-red-600">
        STEP/IGES parsing requires server-side conversion.
      </p>
    );
  }

  return (
  <Canvas className="w-full h-64 border">
      <Controls />
      <ambientLight />
      {src && <Model url={src} ext={ext} />}
    </Canvas>
  );
}
