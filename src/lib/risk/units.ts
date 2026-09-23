/**
 * Unit conversions. The engine works in mg/dL, mmHg, kg and cm.
 *
 * Cholesterol uses the factor 0.02586 (1 mg/dL = 0.02586 mmol/L) so that a
 * value typed in mmol/L round-trips to exactly what the PREVENT equations see.
 */
import { MGDL_TO_MMOL } from './prevent'
import { CREATININE_UMOL_PER_MGDL } from './ckd-epi'

export const cholesterol = {
  toMmol: (mgdl: number) => mgdl * MGDL_TO_MMOL,
  toMgdl: (mmol: number) => mmol / MGDL_TO_MMOL,
}

export const creatinine = {
  toUmol: (mgdl: number) => mgdl * CREATININE_UMOL_PER_MGDL,
  toMgdl: (umol: number) => umol / CREATININE_UMOL_PER_MGDL,
}

const CM_PER_INCH = 2.54
const KG_PER_LB = 0.45359237

export const length = {
  toFeetInches(cm: number): { feet: number; inches: number } {
    const totalIn = cm / CM_PER_INCH
    let feet = Math.floor(totalIn / 12)
    let inches = Math.round((totalIn - feet * 12) * 10) / 10
    if (inches >= 12) {
      feet += 1
      inches -= 12
    }
    return { feet, inches }
  },
  fromFeetInches: (feet: number, inches: number) => (feet * 12 + inches) * CM_PER_INCH,
}

export const mass = {
  toLb: (kg: number) => kg / KG_PER_LB,
  toKg: (lb: number) => lb * KG_PER_LB,
}

export function bmi(heightCm: number, weightKg: number): number {
  const m = heightCm / 100
  return weightKg / (m * m)
}

/** Round to `dp` decimal places without floating-point drift in the display. */
export function round(v: number, dp = 1): number {
  const f = 10 ** dp
  return Math.round((v + Number.EPSILON) * f) / f
}
