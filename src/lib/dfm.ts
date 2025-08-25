import type { Geometry } from "./validators/pricing";

export type DfmHint = {
  severity: "info" | "warning" | "error";
  message: string;
  metric?: number | string;
};

/**
 * Evaluate design-for-manufacturability hints for a given process.
 *
 * ```ts
 * const hints = evaluateDfM("cnc_milling", {
 *   volume_mm3: 1000,
 *   surface_area_mm2: 500,
 *   bbox: [10, 10, 10],
 *   thickness_mm: 0.5,
 * });
 * console.log(hints[0].message);
 * ```
 */
export function evaluateDfM(process: string, geometry: Geometry): DfmHint[] {
  const hints: DfmHint[] = [];

  // Thin wall rule
  if (geometry.thickness_mm !== undefined) {
    const thinWallThreshold =
      process === "3dp_sls" ? 1.2 : process.startsWith("cnc") ? 0.8 : undefined;
    if (thinWallThreshold !== undefined && geometry.thickness_mm < thinWallThreshold) {
      hints.push({
        severity: "warning",
        message: "Wall thickness may be too thin for the selected process",
        metric: geometry.thickness_mm,
      });
    }
  }

  // Hole depth to diameter ratio
  if (geometry.hole_depth_diameter_ratio !== undefined && geometry.hole_depth_diameter_ratio > 6) {
    hints.push({
      severity: "warning",
      message: "Hole depth exceeds 6:1 depth-to-diameter ratio",
      metric: geometry.hole_depth_diameter_ratio,
    });
  }

  // Tap drill size match (simple boolean flag)
  if (geometry.tap_drill_mismatch) {
    hints.push({
      severity: "info",
      message: "Verify tap drill size matches standard recommendations",
    });
  }

  // Sheet metal bend radius
  if (
    process === "sheet_metal" &&
    geometry.bend_radius_mm !== undefined &&
    geometry.thickness_mm !== undefined &&
    geometry.bend_radius_mm < geometry.thickness_mm
  ) {
    hints.push({
      severity: "warning",
      message: "Bend radius should be at least the material thickness",
      metric: geometry.bend_radius_mm,
    });
  }

  // 3D printing overhang rule
  if (
    process.startsWith("3dp") &&
    geometry.max_overhang_deg !== undefined &&
    geometry.max_overhang_deg > 45
  ) {
    hints.push({
      severity: "warning",
      message: "Overhangs above 45° may require supports",
      metric: geometry.max_overhang_deg,
    });
  }

  // SLA minimum feature size
  if (
    process === "3dp_sla" &&
    geometry.min_feature_mm !== undefined &&
    geometry.min_feature_mm < 0.2
  ) {
    hints.push({
      severity: "warning",
      message: "Features smaller than 0.2mm may not print accurately",
      metric: geometry.min_feature_mm,
    });
  }

  return hints;
}
