import type { PricingInput, Geometry } from "./validators/pricing";
import type { Machine } from "./validators/machines";

export interface FeasibilityWarning {
  severity: "info" | "warn" | "error";
  message: string;
  metric?: number;
  limit?: number;
}

export interface FeasibilityResult {
  ok: boolean;
  warnings: FeasibilityWarning[];
}

export function checkFeasibility(
  item: PricingInput,
  machine: Machine,
  geometry: Geometry
): FeasibilityResult {
  const warnings: FeasibilityWarning[] = [];

  if (machine.process_kind === "cnc") {
    if (machine.envelope_mm) {
      const [x, y, z] = geometry.bbox;
      const [mx, my, mz] = machine.envelope_mm;
      if (x > mx || y > my || z > mz) {
        warnings.push({
          severity: "error",
          message: "Part exceeds machine envelope",
          metric: Math.max(x / mx, y / my, z / mz),
          limit: 1,
        });
      }
    }
  }

  if (machine.process_kind === "injection") {
    const runner = machine.params.runner_waste_pct ?? 0;
    const [x, y] = geometry.bbox;
    const projected_area_cm2 = (x * y) / 100;
    const tonnage_required = projected_area_cm2 * 0.015 * (1 + runner / 100);
    if (tonnage_required < machine.params.press_tonnage_min) {
      warnings.push({
        severity: "warn",
        message: "Required tonnage below machine minimum",
        metric: tonnage_required,
        limit: machine.params.press_tonnage_min,
      });
    }
    if (tonnage_required > machine.params.press_tonnage_max) {
      warnings.push({
        severity: "error",
        message: "Required tonnage exceeds machine capacity",
        metric: tonnage_required,
        limit: machine.params.press_tonnage_max,
      });
    }
    if (item.quantity > machine.params.tool_life_shots) {
      warnings.push({
        severity: "warn",
        message: "Requested quantity exceeds tool life",
        metric: item.quantity,
        limit: machine.params.tool_life_shots,
      });
    }
  }

  if (machine.process_kind === "casting") {
    const density = item.material?.density_kg_m3;
    if (density) {
      const mass_kg = (geometry.volume_mm3 / 1e9) * density;
      const yield_pct = machine.params.pour_yield_pct / 100;
      const scrap_pct = machine.params.scrap_pct / 100;
      const effective_yield = yield_pct * (1 - scrap_pct);
      const required_melt = effective_yield > 0 ? mass_kg / effective_yield : Infinity;
      if (required_melt > machine.params.melt_rate_kg_per_hr) {
        warnings.push({
          severity: "warn",
          message: "Part mass exceeds melt rate capacity",
          metric: required_melt,
          limit: machine.params.melt_rate_kg_per_hr,
        });
      }
    } else {
      warnings.push({
        severity: "info",
        message: "Material density not provided; casting mass check skipped",
      });
    }
  }

  return { ok: warnings.every((w) => w.severity !== "error"), warnings };
}

