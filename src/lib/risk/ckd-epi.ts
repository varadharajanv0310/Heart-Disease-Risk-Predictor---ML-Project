/**
 * CKD-EPI 2021 creatinine equation (race-free).
 *
 *   Inker LA, et al. New creatinine- and cystatin C–based equations to estimate
 *   GFR without race. N Engl J Med 2021;385:1737–1749.
 *
 *   eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^−1.200 × 0.9938^age × 1.012 [female]
 *   κ = 0.7 (female) / 0.9 (male); α = −0.241 (female) / −0.302 (male)
 *
 * Offered only as a helper for people whose lab report lists creatinine but not
 * eGFR. Adults (≥18) only.
 */
import type { Sex } from './prevent-coefficients'

/** µmol/L per mg/dL for serum creatinine. */
export const CREATININE_UMOL_PER_MGDL = 88.4

export function ckdEpi2021(sex: Sex, age: number, creatinineMgDl: number): number | null {
  if (!(age >= 18) || !(creatinineMgDl > 0) || !Number.isFinite(creatinineMgDl)) return null
  const kappa = sex === 'female' ? 0.7 : 0.9
  const alpha = sex === 'female' ? -0.241 : -0.302
  const ratio = creatinineMgDl / kappa
  return (
    142 *
    Math.pow(Math.min(ratio, 1), alpha) *
    Math.pow(Math.max(ratio, 1), -1.2) *
    Math.pow(0.9938, age) *
    (sex === 'female' ? 1.012 : 1)
  )
}
