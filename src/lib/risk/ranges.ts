/**
 * Valid input ranges. Outside these, a model is *not computable* — we never
 * extrapolate.
 *
 * PREVENT ranges follow the AHA PREVENT calculator (Khan 2024). Framingham
 * (D'Agostino 2008) was derived at ages 30–74; for its other inputs we apply the
 * same, more conservative PREVENT ranges.
 */
export interface Range {
  min: number
  max: number
}

export const PREVENT_RANGES = {
  age: { min: 30, max: 79 },
  age30yr: { min: 30, max: 59 },
  totalCholesterol: { min: 130, max: 320 }, // mg/dL
  hdl: { min: 20, max: 100 }, // mg/dL
  sbp: { min: 90, max: 200 }, // mmHg
  egfr: { min: 15, max: 140 }, // mL/min/1.73 m²
  bmi: { min: 18.5, max: 39.9 }, // kg/m² (heart-failure equations only)
} as const satisfies Record<string, Range>

export const FRAMINGHAM_RANGES = {
  age: { min: 30, max: 74 },
  totalCholesterol: PREVENT_RANGES.totalCholesterol,
  hdl: PREVENT_RANGES.hdl,
  sbp: PREVENT_RANGES.sbp,
  bmi: PREVENT_RANGES.bmi,
} as const satisfies Record<string, Range>

/**
 * Plausibility bounds for the input UI. Values outside these are almost
 * certainly typos and are rejected at entry; values inside them but outside
 * the model range are accepted and reported as "not computable".
 *
 * Age starts at 2, the youngest age with published cholesterol cut-offs
 * (NHLBI 2011). Ages outside PREVENT's 30–79 get a guideline check instead.
 */
export const PLAUSIBLE = {
  age: { min: 2, max: 120 },
  sbp: { min: 60, max: 260 },
  totalCholesterol: { min: 50, max: 600 },
  hdl: { min: 5, max: 200 },
  egfr: { min: 5, max: 200 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 30, max: 300 },
  creatinineMgDl: { min: 0.2, max: 15 },
} as const satisfies Record<string, Range>

export const inRange = (v: number, r: Range) => Number.isFinite(v) && v >= r.min && v <= r.max
