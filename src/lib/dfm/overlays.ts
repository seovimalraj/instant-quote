import * as THREE from "three";

export type Severity = "info" | "warning" | "error";

export const severityColorMap: Record<Severity, number> = {
  info: 0x3b82f6, // blue
  warning: 0xfbbf24, // amber
  error: 0xef4444, // red
};

export type HeatmapSpec = {
  type: "heatmap";
  values: Float32Array;
  threshold: number;
};

export type ShellSpec = {
  type: "shell";
};

export type BBoxSpec = {
  type: "bbox";
  box: THREE.Box3;
};

export type MarkersSpec = {
  type: "markers";
  points: THREE.Vector3[];
};

export type OverlaySpec = HeatmapSpec | ShellSpec | BBoxSpec | MarkersSpec;

export type Overlay = {
  id: string;
  type: OverlaySpec["type"];
  object: THREE.Object3D;
  severity: Severity;
};

/** Convert a rule hit overlay spec into a THREE.js object that can be
 * rendered in a scene. */
export function makeOverlay(
  id: string,
  spec: OverlaySpec,
  geometry: THREE.BufferGeometry,
  severity: Severity
): Overlay {
  switch (spec.type) {
    case "heatmap": {
      const geom = geometry.clone();
      const count = spec.values.length;
      const colors = new Float32Array(count * 3);
      const color = new THREE.Color();
      for (let i = 0; i < count; i++) {
        const v = spec.values[i];
        const t = Math.min(v / spec.threshold, 1);
        // 0 -> red, 1 -> green (safe)
        color.setHSL((t * 0.4) / 1.0, 1, 0.5);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
      geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({
        vertexColors: true,
        size: 2,
        transparent: true,
        opacity: 0.8,
      });
      return { id, type: "heatmap", object: new THREE.Points(geom, mat), severity };
    }
    case "shell": {
      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: severityColorMap[severity] })
      );
      return { id, type: "shell", object: line, severity };
    }
    case "bbox": {
      const helper = new THREE.Box3Helper(spec.box, severityColorMap[severity]);
      return { id, type: "bbox", object: helper, severity };
    }
    case "markers": {
      const markerGeom = new THREE.BufferGeometry().setFromPoints(spec.points);
      const mat = new THREE.PointsMaterial({
        color: severityColorMap[severity],
        size: 4,
      });
      return { id, type: "markers", object: new THREE.Points(markerGeom, mat), severity };
    }
  }
}

