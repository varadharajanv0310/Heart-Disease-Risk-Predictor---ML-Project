/**
 * AHA PREVENT base equations — exact implementation.
 *
 *   Khan SS, et al. Circulation 2024;149:430–449 (Supplemental Tables S12A–H).
 *
 * The model is a sex-specific logistic regression:
 *   risk = e^x / (1 + e^x)
 * with centred/scaled predictors and piecewise-linear splines for SBP, eGFR and
 * BMI. Cholesterol is converted to mmol/L with the factor 0.02586 used by the
 * published equations.
 */
import { coefficientsFor, type Horizon, type Outcome, type PreventCoefficients } from './prevent-coefficients'
import { PREVENT_RANGES, inRange } from './ranges'
import { type ClinicalInput, type Computed, type NotComputableReason, notComputable, ok } from './types'

/** mg/dL → mmol/L factor used by the published PREVENT equations. */
export const MGDL_TO_MMOL = 0.02586

export interface PreventTerms {
  age: number
  age2: number
  nonHdl: number
  hdl: number
  sbpLo: number
  sbpHi: number
  bmiLo: number
  bmiHi: number
  egfrLo: number
  egfrHi: number
  diabetes: number
  smoker: number
  bpTreated: number
  statin: number
}

/** Transforms raw inputs into the model's centred, scaled predictors. */
export function preventTerms(input: {
  age: number
  totalCholesterol: number
  hdl: number
  sbp: number
  egfr: number
  bmi: number
  diabetes: boolean
  smoker: boolean
  bpTreated: boolean
  statin: boolean
}): PreventTerms {
  const a = (input.age - 55) / 10
  return {
    age: a,
    age2: a * a,
    nonHdl: (input.totalCholesterol - input.hdl) * MGDL_TO_MMOL - 3.5,
    hdl: (input.hdl * MGDL_TO_MMOL - 1.3) / 0.3,
    sbpLo: (Math.min(input.sbp, 110) - 110) / 20,
    sbpHi: (Math.max(input.sbp, 110) - 130) / 20,
    bmiLo: (Math.min(input.bmi, 30) - 25) / 5,
    bmiHi: (Math.max(input.bmi, 30) - 30) / 5,
    egfrLo: (Math.min(input.egfr, 60) - 60) / -15,
    egfrHi: (Math.max(input.egfr, 60) - 90) / -15,
    diabetes: input.diabetes ? 1 : 0,
    smoker: input.smoker ? 1 : 0,
    bpTreated: input.bpTreated ? 1 : 0,
    statin: input.statin ? 1 : 0,
  }
}

/** Linear predictor x for one equation. Absent coefficients contribute 0. */
export function linearPredictor(c: PreventCoefficients, t: PreventTerms): number {
  const b = (v: number | undefined) => v ?? 0
  return (
    c.const +
    c.age * t.age +
    b(c.age2) * t.age2 +
    b(c.nonHdl) * t.nonHdl +
    b(c.hdl) * t.hdl +
    c.sbpLo * t.sbpLo +
    c.sbpHi * t.sbpHi +
    c.diabetes * t.diabetes +
    c.smoker * t.smoker +
    b(c.bmiLo) * t.bmiLo +
    b(c.bmiHi) * t.bmiHi +
    c.egfrLo * t.egfrLo +
    c.egfrHi * t.egfrHi +
    c.bpTreated * t.bpTreated +
    b(c.statin) * t.statin +
    c.bpTreatedXSbpHi * t.bpTreated * t.sbpHi +
    b(c.statinXNonHdl) * t.statin * t.nonHdl +
    b(c.ageXNonHdl) * t.age * t.nonHdl +
    b(c.ageXHdl) * t.age * t.hdl +
    c.ageXSbpHi * t.age * t.sbpHi +
    c.ageXDiabetes * t.age * t.diabetes +
    c.ageXSmoker * t.age * t.smoker +
    b(c.ageXBmiHi) * t.age * t.bmiHi +
    c.ageXEgfrLo * t.age * t.egfrLo
  )
}

const logistic = (x: number) => Math.exp(x) / (1 + Math.exp(x))

/** Lists every reason an equation cannot be evaluated for this input. */
export function preventValidation(input: ClinicalInput, outcome: Outcome, horizon: Horizon): NotComputableReason[] {
  const r: NotComputableReason[] = []
  if (!inRange(input.age, PREVENT_RANGES.age)) r.push('age_out_of_range')
  else if (horizon === 30 && !inRange(input.age, PREVENT_RANGES.age30yr)) r.push('age_over_59_for_30yr')

  if (input.sbp == null) r.push('sbp_missing')
  else if (!inRange(input.sbp, PREVENT_RANGES.sbp)) r.push('sbp_out_of_range')

  if (input.egfr == null) r.push('egfr_missing')
  else if (!inRange(input.egfr, PREVENT_RANGES.egfr)) r.push('egfr_out_of_range')

  if (outcome === 'hf') {
    // Only the heart-failure equations use BMI (and they do not use cholesterol).
    if (input.bmi == null) r.push('bmi_missing')
    else if (!inRange(input.bmi, PREVENT_RANGES.bmi)) r.push('bmi_out_of_range')
  } else {
    if (input.totalCholesterol == null) r.push('tc_missing')
    else if (!inRange(input.totalCholesterol, PREVENT_RANGES.totalCholesterol)) r.push('tc_out_of_range')
    if (input.hdl == null) r.push('hdl_missing')
    else if (!inRange(input.hdl, PREVENT_RANGES.hdl)) r.push('hdl_out_of_range')
    if (input.totalCholesterol != null && input.hdl != null && input.hdl >= input.totalCholesterol)
      r.push('hdl_not_below_tc')
  }
  return r
}

/** One PREVENT equation. Returns a percentage (0–100), or why it can't be computed. */
export function preventRisk(input: ClinicalInput, outcome: Outcome, horizon: Horizon): Computed {
  const reasons = preventValidation(input, outcome, horizon)
  if (reasons.length) return notComputable(reasons)
  const terms = preventTerms({
    age: input.age,
    // Unused inputs (lipids for HF, BMI for CVD/ASCVD) have zero coefficients;
    // neutral placeholders keep the arithmetic well-defined.
    totalCholesterol: input.totalCholesterol ?? 0,
    hdl: input.hdl ?? 0,
    sbp: input.sbp as number,
    egfr: input.egfr as number,
    bmi: input.bmi ?? 25,
    diabetes: input.diabetes,
    smoker: input.smoker,
    bpTreated: input.bpTreated,
    statin: input.statin,
  })
  return ok(100 * logistic(linearPredictor(coefficientsFor(input.sex, outcome, horizon), terms)))
}

export interface PreventResult {
  tenYear: Record<Outcome, Computed>
  thirtyYear: Record<Outcome, Computed>
}

export function preventAll(input: ClinicalInput): PreventResult {
  const row = (h: Horizon) => ({
    cvd: preventRisk(input, 'cvd', h),
    ascvd: preventRisk(input, 'ascvd', h),
    hf: preventRisk(input, 'hf', h),
  })
  return { tenYear: row(10), thirtyYear: row(30) }
}
