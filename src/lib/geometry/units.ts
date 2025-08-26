export type Units = 'mm' | 'inch' | 'm';

/** Convert a value from given units to millimeters */
export function convertToMM(value: number, from: Units): number {
  switch (from) {
    case 'inch':
      return value * 25.4;
    case 'm':
      return value * 1000;
    default:
      return value;
  }
}

/**
 * Infer mesh units from the bounding box diagonal. If a hint is provided,
 * it takes precedence. Heuristic ranges are purposely loose and clamped to
 * avoid absurd results.
 */
export function inferUnits(diagonal: number, hint?: Units): Units {
  if (hint) return hint;
  if (!isFinite(diagonal) || diagonal <= 0) return 'mm';

  // Diagonal already in millimeters and reasonable (10mm - 2m)
  if (diagonal >= 10 && diagonal <= 2000) return 'mm';

  // Very large numbers are likely already in millimeters representing meter
  // scale parts.
  if (diagonal > 2000) return 'm';

  // For small values (<10) decide between inches and meters
  const asInchMM = diagonal * 25.4; // interpret value as inches then to mm
  if (asInchMM >= 10 && asInchMM <= 2000) return 'inch';

  return 'm';
}
