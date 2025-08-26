import * as THREE from "three";
import { rules, type RuleResult, type GeometryMetrics } from "./rules";
import { makeOverlay, type Overlay } from "./overlays";
import type { Severity } from "./overlays";

export interface AnalyzeParams {
  mesh?: THREE.Mesh;
  tris?: Float32Array; // xyz triplets
  process_kind: string;
  material?: string;
  tolerance?: number;
  certification?: string[];
  purpose?: string;
}

export interface Suggestion {
  id: string;
  message: string;
  severity: Severity;
  category: "feasibility" | "manufacturability" | "cost" | "reliability";
  metric?: number | string;
  overlayId?: string;
}

export interface AnalysisResult {
  ok: boolean;
  metrics: GeometryMetrics & { maxOverhang?: number };
  suggestions: Suggestion[];
  overlays: Overlay[];
}

/**
 * Analyze a geometry against manufacturability rules and return suggestions
 * and overlay data for visualization.
 */
export function analyze(params: AnalyzeParams): AnalysisResult {
  const geometry = toGeometry(params);
  const metrics = computeMetrics(geometry);

  const ctxBase = {
    process_kind: params.process_kind,
    material: params.material,
    tolerance: params.tolerance,
    certification: params.certification,
    purpose: params.purpose,
    metrics,
  };

  const suggestions: Suggestion[] = [];
  const overlays: Overlay[] = [];

  for (const rule of rules) {
    if (!rule.applies(ctxBase)) continue;
    const res: RuleResult | null = rule.evaluate(ctxBase);
    if (res) {
      const overlayId = res.overlay ? `${res.id}-overlay` : undefined;
      if (res.overlay) {
        overlays.push(makeOverlay(overlayId!, res.overlay, geometry, res.severity));
      }
      suggestions.push({
        id: res.id,
        message: res.message,
        severity: res.severity,
        category: res.category,
        metric: res.metric,
        overlayId,
      });
    }
  }

  const ok = suggestions.every((s) => s.severity !== "error");
  return { ok, metrics, suggestions, overlays };
}

/** Convert input mesh or triangles into a BufferGeometry */
function toGeometry(params: AnalyzeParams): THREE.BufferGeometry {
  if (params.mesh) {
    return params.mesh.geometry as THREE.BufferGeometry;
  }
  if (params.tris) {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      "position",
      new THREE.BufferAttribute(params.tris, 3)
    );
    geom.computeVertexNormals();
    return geom;
  }
  throw new Error("analyze requires mesh or tris");
}

function computeMetrics(geometry: THREE.BufferGeometry): GeometryMetrics & { maxOverhang?: number } {
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const bbox = new THREE.Box3().setFromBufferAttribute(position);

  const count = position.count;
  const thicknessMap = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const tx = Math.min(x - bbox.min.x, bbox.max.x - x);
    const ty = Math.min(y - bbox.min.y, bbox.max.y - y);
    const tz = Math.min(z - bbox.min.z, bbox.max.z - z);
    thicknessMap[i] = 2 * Math.min(tx, ty, tz);
  }
  const minThickness = thicknessMap.reduce((m, v) => Math.min(m, v), Infinity);

  const overhangFaces: THREE.Vector3[] = [];
  const index = geometry.getIndex();
  const threshold = Math.cos((45 * Math.PI) / 180);
  if (index) {
    const arr = index.array;
    for (let i = 0; i < arr.length; i += 3) {
      const a = arr[i];
      const b = arr[i + 1];
      const c = arr[i + 2];
      const va = new THREE.Vector3(
        position.getX(a),
        position.getY(a),
        position.getZ(a)
      );
      const vb = new THREE.Vector3(
        position.getX(b),
        position.getY(b),
        position.getZ(b)
      );
      const vc = new THREE.Vector3(
        position.getX(c),
        position.getY(c),
        position.getZ(c)
      );
      const normal = new THREE.Vector3()
        .subVectors(vb, va)
        .cross(new THREE.Vector3().subVectors(vc, va))
        .normalize();
      if (normal.z < threshold) {
        const center = va.add(vb).add(vc).multiplyScalar(1 / 3);
        overhangFaces.push(center);
      }
    }
  }
  const maxOverhang = overhangFaces.length > 0 ? 90 : 0; // placeholder

  return {
    bbox,
    thicknessMap,
    minThickness: isFinite(minThickness) ? minThickness : undefined,
    overhangFaces,
    maxOverhang,
  };
}

