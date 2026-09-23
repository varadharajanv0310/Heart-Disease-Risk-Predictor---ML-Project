/**
 * Risk categories for 10-year PREVENT-ASCVD risk, from the 2026 ACC/AHA
 * multisociety dyslipidemia guideline (Circulation 2026,
 * doi:10.1161/CIR.0000000000001423):
 *
 *   Low <3% · Borderline 3–<5% · Intermediate 5–<10% · High ≥10%
 *
 * We categorise the value *as displayed* (rounded to one decimal) so the label
 * can never disagree with the number on screen.
 */
import { round } from './units'

export type Category = 'low' | 'borderline' | 'intermediate' | 'high'

export const CATEGORY_ORDER: Category[] = ['low', 'borderline', 'intermediate', 'high']

/** Lower bound (inclusive) of each category, in percent. */
export const CATEGORY_THRESHOLDS: Record<Category, number> = {
  low: 0,
  borderline: 3,
  intermediate: 5,
  high: 10,
}

export function categorize(ascvd10Percent: number): Category {
  const v = round(ascvd10Percent, 1)
  if (v >= CATEGORY_THRESHOLDS.high) return 'high'
  if (v >= CATEGORY_THRESHOLDS.intermediate) return 'intermediate'
  if (v >= CATEGORY_THRESHOLDS.borderline) return 'borderline'
  return 'low'
}

/**
 * 2025 AHA/ACC high blood pressure guideline: with stage 1 hypertension
 * (SBP 130–139 mmHg), a 10-year PREVENT total-CVD risk ≥7.5% favours starting
 * blood-pressure medicine.
 */
export const BP_GUIDELINE_CVD_THRESHOLD = 7.5
