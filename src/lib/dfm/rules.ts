import * as THREE from "three";
import type { OverlaySpec } from "./overlays";
import type { Severity } from "./overlays";

export interface RuleContext {
  process_kind: string;
  material?: string;
  tolerance?: number;
  certification?: string[];
  purpose?: string;
  metrics: GeometryMetrics;
}

export interface GeometryMetrics {
  bbox: THREE.Box3;
  minThickness?: number;
  thicknessMap?: Float32Array;
  overhangFaces?: THREE.Vector3[];
  holeDepthRatio?: number;
  bossDiameter?: number;
  bendRadius?: number;
  thickness?: number;
  draftAngle?: number;
  cornerRadius?: number;
  machiningAllowance?: number;
}

export interface RuleResult {
  id: string;
  message: string;
  severity: Severity;
  category: "feasibility" | "manufacturability" | "cost" | "reliability";
  metric?: number | string;
  overlay?: OverlaySpec;
}

export interface Rule {
  id: string;
  description: string;
  applies: (ctx: RuleContext) => boolean;
  evaluate: (ctx: RuleContext) => RuleResult | null;
}

const thinWall: Rule = {
  id: "thin_wall",
  description: "Wall thickness should exceed process minimums",
  applies: ({ process_kind }) =>
    process_kind.startsWith("cnc") || process_kind === "3dp_sls",
  evaluate: (ctx) => {
    const { metrics, process_kind } = ctx;
    if (!metrics.thicknessMap) return null;
    const threshold = process_kind.startsWith("cnc") ? 0.8 : 1.2;
    if (metrics.minThickness !== undefined && metrics.minThickness < threshold) {
      return {
        id: "thin_wall",
        message: `Walls thinner than ${threshold}mm detected`,
        severity: "warning",
        category: "manufacturability",
        metric: metrics.minThickness,
        overlay: {
          type: "heatmap",
          values: metrics.thicknessMap,
          threshold,
        },
      };
    }
    return null;
  },
};

const holeDepth: Rule = {
  id: "hole_depth_ratio",
  description: "Hole depth to diameter ratio should not exceed 6:1",
  applies: ({ process_kind }) => process_kind.startsWith("cnc"),
  evaluate: ({ metrics }) => {
    if (metrics.holeDepthRatio !== undefined && metrics.holeDepthRatio > 6) {
      return {
        id: "hole_depth_ratio",
        message: "Hole depth exceeds 6:1 depth-to-diameter ratio",
        severity: "warning",
        category: "manufacturability",
        metric: metrics.holeDepthRatio,
      };
    }
    return null;
  },
};

const bossDiameter: Rule = {
  id: "min_boss_diameter",
  description: "Boss features require minimum diameters",
  applies: ({ process_kind }) => process_kind === "injection_molding",
  evaluate: ({ metrics }) => {
    if (metrics.bossDiameter !== undefined && metrics.bossDiameter < 1.0) {
      return {
        id: "min_boss_diameter",
        message: "Boss diameter below 1mm may not mold correctly",
        severity: "error",
        category: "feasibility",
        metric: metrics.bossDiameter,
      };
    }
    return null;
  },
};

const overhang: Rule = {
  id: "overhang",
  description: "Overhangs above 45° require support",
  applies: ({ process_kind }) => process_kind.startsWith("3dp"),
  evaluate: ({ metrics }) => {
    if (metrics.overhangFaces && metrics.overhangFaces.length > 0) {
      return {
        id: "overhang",
        message: ">45° overhangs detected",
        severity: "warning",
        category: "manufacturability",
        overlay: { type: "markers", points: metrics.overhangFaces },
      };
    }
    return null;
  },
};

const bendRadius: Rule = {
  id: "bend_radius",
  description: "Bend radius should be >= thickness",
  applies: ({ process_kind }) => process_kind === "sheet_metal",
  evaluate: ({ metrics }) => {
    if (
      metrics.bendRadius !== undefined &&
      metrics.thickness !== undefined &&
      metrics.bendRadius < metrics.thickness
    ) {
      return {
        id: "bend_radius",
        message: "Bend radius should be at least material thickness",
        severity: "warning",
        category: "manufacturability",
        metric: metrics.bendRadius,
      };
    }
    return null;
  },
};

const draft: Rule = {
  id: "draft_required",
  description: "Draft is required for casting/die processes",
  applies: ({ process_kind }) =>
    process_kind === "casting" || process_kind === "die_casting",
  evaluate: ({ metrics }) => {
    if (metrics.draftAngle !== undefined && metrics.draftAngle < 1) {
      return {
        id: "draft_required",
        message: "Add at least 1° draft for release",
        severity: "error",
        category: "manufacturability",
        metric: metrics.draftAngle,
      };
    }
    return null;
  },
};

const sharpCorners: Rule = {
  id: "sharp_internal_corners",
  description: "Internal corners should have fillets",
  applies: ({ process_kind }) => process_kind.startsWith("cnc"),
  evaluate: ({ metrics }) => {
    if (metrics.cornerRadius !== undefined && metrics.cornerRadius < 0.2) {
      return {
        id: "sharp_internal_corners",
        message: "Sharp internal corners may be unmachinable",
        severity: "warning",
        category: "manufacturability",
        metric: metrics.cornerRadius,
      };
    }
    return null;
  },
};

const machiningAllowance: Rule = {
  id: "machining_allowance",
  description: "Cast parts need machining allowance",
  applies: ({ process_kind, purpose }) =>
    process_kind === "casting" && purpose === "machining",
  evaluate: ({ metrics }) => {
    if (metrics.machiningAllowance !== undefined && metrics.machiningAllowance < 2) {
      return {
        id: "machining_allowance",
        message: "Add ≥2mm machining allowance to casting",
        severity: "warning",
        category: "cost",
        metric: metrics.machiningAllowance,
      };
    }
    return null;
  },
};

const toleranceVsProcess: Rule = {
  id: "tolerance_vs_process",
  description: "Requested tolerance may exceed process capability",
  applies: () => true,
  evaluate: ({ process_kind, tolerance }) => {
    if (tolerance === undefined) return null;
    const capability: Record<string, number> = {
      cnc_milling: 0.01,
      cnc_turning: 0.02,
      injection_molding: 0.05,
      sheet_metal: 0.1,
      casting: 0.5,
      "3dp_sls": 0.2,
    };
    const cap = capability[process_kind] ?? 0.1;
    if (tolerance < cap) {
      return {
        id: "tolerance_vs_process",
        message: "Specified tolerance may drive up cost",
        severity: "warning",
        category: "cost",
        metric: tolerance,
      };
    }
    return null;
  },
};

const certification: Rule = {
  id: "certification_implications",
  description: "Certain certifications increase process controls",
  applies: ({ certification }) =>
    certification !== undefined && certification.length > 0,
  evaluate: ({ certification }) => {
    const strict = certification?.some((c) => c === "AS9100" || c === "ITAR");
    if (strict) {
      return {
        id: "certification_implications",
        message: "Certifications like AS9100/ITAR increase cost and controls",
        severity: "info",
        category: "cost",
      };
    }
    return null;
  },
};

export const rules: Rule[] = [
  thinWall,
  holeDepth,
  bossDiameter,
  overhang,
  bendRadius,
  draft,
  sharpCorners,
  machiningAllowance,
  toleranceVsProcess,
  certification,
];

