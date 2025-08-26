export type Unit = "mm" | "inch";

/** Convert a value from the given unit to millimeters. */
export function toMM(value: number, unit: Unit): number {
  return unit === "mm" ? value : value * 25.4;
}

/** Convert a value in millimeters to the requested unit. */
export function fromMM(value: number, unit: Unit): number {
  return unit === "mm" ? value : value / 25.4;
}

/** Convert between metric and imperial units. */
export function convert(value: number, from: Unit, to: Unit): number {
  return fromMM(toMM(value, from), to);
}
