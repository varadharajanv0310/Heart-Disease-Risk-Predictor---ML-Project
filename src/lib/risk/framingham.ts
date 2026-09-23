/**
 * Framingham general cardiovascular risk profile (D'Agostino RB Sr, et al.
 * Circulation 2008;117:743–753), used for two clearly-labelled secondary
 * purposes only — never for the headline number:
 *
 *   1. Heart age ("vascular age"), the published communication construct
 *      from the same paper.
 *   2. An *estimate* when laboratory values are unknown: the lab model if
 *      cholesterol is known, otherwise the office (BMI-based) model.
 *
 * Risk = 1 − S0^exp(Σβx − mean), 10-year general CVD (CHD, stroke, PAD, HF).
 */
import type { Sex } from './prevent-coefficients'
import { FRAMINGHAM_RANGES, inRange } from './ranges'
import { type Computed, type NotComputableReason, notComputable, ok } from './types'

interface LabCoef {
  lnAge: number
  lnTc: number
  lnHdl: number
  lnSbpUntreated: number
  lnSbpTreated: number
  smoker: number
  diabetes: number
  mean: number
  s0: number
}

interface OfficeCoef {
  lnAge: number
  lnBmi: number
  lnSbpUntreated: number
  lnSbpTreated: number
  smoker: number
  diabetes: number
  mean: number
  s0: number
}

/** D'Agostino 2008, Table 2 (laboratory-based model). */
export const FRAMINGHAM_LAB: Record<Sex, LabCoef> = {
  female: {
    lnAge: 2.32888, lnTc: 1.20904, lnHdl: -0.70833, lnSbpUntreated: 2.76157,
    lnSbpTreated: 2.82263, smoker: 0.52873, diabetes: 0.69154, mean: 26.1931, s0: 0.95012,
  },
  male: {
    lnAge: 3.06117, lnTc: 1.1237, lnHdl: -0.93263, lnSbpUntreated: 1.93303,
    lnSbpTreated: 1.99881, smoker: 0.65451, diabetes: 0.57367, mean: 23.9802, s0: 0.88936,
  },
}

/** D'Agostino 2008, Table 2 (office-based model, BMI replaces lipids). */
export const FRAMINGHAM_OFFICE: Record<Sex, OfficeCoef> = {
  female: {
    lnAge: 2.72107, lnBmi: 0.51125, lnSbpUntreated: 2.81291, lnSbpTreated: 2.88267,
    smoker: 0.61868, diabetes: 0.77763, mean: 26.0145, s0: 0.94833,
  },
  male: {
    lnAge: 3.11296, lnBmi: 0.79277, lnSbpUntreated: 1.85508, lnSbpTreated: 1.92672,
    smoker: 0.70953, diabetes: 0.5316, mean: 23.9388, s0: 0.88431,
  },
}

/**
 * The "normal" reference person used to define heart age in D'Agostino 2008:
 * untreated SBP 125 mmHg, total cholesterol 180 mg/dL, HDL 45 mg/dL,
 * non-smoker, no diabetes.
 */
export const HEART_AGE_REFERENCE = { sbp: 125, totalCholesterol: 180, hdl: 45 } as const

/** Heart age is reported between these bounds (the paper's table runs "<30" … ">80"). */
export const HEART_AGE_BOUNDS = { min: 30, max: 80 } as const

export interface FraminghamLabInput {
  sex: Sex
  age: number
  totalCholesterol: number | null
  hdl: number | null
  sbp: number | null
  bpTreated: boolean
  smoker: boolean
  diabetes: boolean
}

export interface FraminghamOfficeInput {
  sex: Sex
  age: number
  bmi: number | null
  sbp: number | null
  bpTreated: boolean
  smoker: boolean
  diabetes: boolean
}

function commonReasons(age: number, sbp: number | null): NotComputableReason[] {
  const r: NotComputableReason[] = []
  if (!inRange(age, FRAMINGHAM_RANGES.age)) r.push('age_over_74_for_framingham')
  if (sbp == null) r.push('sbp_missing')
  else if (!inRange(sbp, FRAMINGHAM_RANGES.sbp)) r.push('sbp_out_of_range')
  return r
}

const survivalRisk = (x: number, mean: number, s0: number) => 1 - Math.pow(s0, Math.exp(x - mean))

/** Framingham lab model, 10-year general CVD risk (%). */
export function framinghamLab(input: FraminghamLabInput): Computed {
  const r = commonReasons(input.age, input.sbp)
  const { totalCholesterol: tc, hdl } = input
  if (tc == null) r.push('tc_missing')
  else if (!inRange(tc, FRAMINGHAM_RANGES.totalCholesterol)) r.push('tc_out_of_range')
  if (hdl == null) r.push('hdl_missing')
  else if (!inRange(hdl, FRAMINGHAM_RANGES.hdl)) r.push('hdl_out_of_range')
  if (tc != null && hdl != null && hdl >= tc) r.push('hdl_not_below_tc')
  if (r.length) return notComputable(r)

  const c = FRAMINGHAM_LAB[input.sex]
  const x =
    c.lnAge * Math.log(input.age) +
    c.lnTc * Math.log(tc as number) +
    c.lnHdl * Math.log(hdl as number) +
    (input.bpTreated ? c.lnSbpTreated : c.lnSbpUntreated) * Math.log(input.sbp as number) +
    c.smoker * (input.smoker ? 1 : 0) +
    c.diabetes * (input.diabetes ? 1 : 0)
  return ok(100 * survivalRisk(x, c.mean, c.s0))
}

/** Framingham office (BMI) model, 10-year general CVD risk (%). */
export function framinghamOffice(input: FraminghamOfficeInput): Computed {
  const r = commonReasons(input.age, input.sbp)
  if (input.bmi == null) r.push('bmi_missing')
  else if (!inRange(input.bmi, FRAMINGHAM_RANGES.bmi)) r.push('bmi_out_of_range')
  if (r.length) return notComputable(r)

  const c = FRAMINGHAM_OFFICE[input.sex]
  const x =
    c.lnAge * Math.log(input.age) +
    c.lnBmi * Math.log(input.bmi as number) +
    (input.bpTreated ? c.lnSbpTreated : c.lnSbpUntreated) * Math.log(input.sbp as number) +
    c.smoker * (input.smoker ? 1 : 0) +
    c.diabetes * (input.diabetes ? 1 : 0)
  return ok(100 * survivalRisk(x, c.mean, c.s0))
}

export type HeartAge =
  | { status: 'ok'; value: number; bound: 'below' | 'above' | null }
  | { status: 'not_computable'; reasons: NotComputableReason[] }

/**
 * Heart age: the age at which the reference "normal" person of the same sex
 * has the same Framingham lab-model risk. Solved in closed form:
 *   ln(age) = ( ln(ln(1−r)/ln S0) + mean − βTC·ln180 − βHDL·ln45 − βSBP·ln125 ) / βage
 */
export function heartAge(input: FraminghamLabInput): HeartAge {
  const risk = framinghamLab(input)
  if (risk.status !== 'ok') return risk
  const c = FRAMINGHAM_LAB[input.sex]
  const r = risk.value / 100
  const x = Math.log(Math.log(1 - r) / Math.log(c.s0)) + c.mean
  const rest =
    c.lnTc * Math.log(HEART_AGE_REFERENCE.totalCholesterol) +
    c.lnHdl * Math.log(HEART_AGE_REFERENCE.hdl) +
    c.lnSbpUntreated * Math.log(HEART_AGE_REFERENCE.sbp)
  const age = Math.exp((x - rest) / c.lnAge)
  if (age < HEART_AGE_BOUNDS.min) return { status: 'ok', value: HEART_AGE_BOUNDS.min, bound: 'below' }
  if (age > HEART_AGE_BOUNDS.max) return { status: 'ok', value: HEART_AGE_BOUNDS.max, bound: 'above' }
  return { status: 'ok', value: age, bound: null }
}
