import type { UnitSpec } from './fields'
import { PLAUSIBLE, PREVENT_RANGES } from '@/lib/risk/ranges'
import { cholesterol, creatinine } from '@/lib/risk/units'

const id = (v: number) => v
const inward = (min: number, max: number, dp: number) => {
  const f = 10 ** dp
  return { min: Math.ceil(min * f - 1e-9) / f, max: Math.floor(max * f + 1e-9) / f }
}

export const AGE: UnitSpec[] = [
  { id: 'y', label: 'years', toDisplay: id, toCanonical: id, decimals: 0, step: 1, slider: { min: 18, max: 100 }, plausible: PLAUSIBLE.age, model: PREVENT_RANGES.age },
]

export const SBP: UnitSpec[] = [
  { id: 'mmHg', label: 'mmHg', toDisplay: id, toCanonical: id, decimals: 0, step: 1, slider: { min: 80, max: 220 }, plausible: PLAUSIBLE.sbp, model: PREVENT_RANGES.sbp },
]

export const EGFR: UnitSpec[] = [
  { id: 'egfr', label: 'mL/min/1.73m²', toDisplay: id, toCanonical: id, decimals: 0, step: 1, slider: { min: 5, max: 160 }, plausible: PLAUSIBLE.egfr, model: PREVENT_RANGES.egfr },
]

function chol(range: { min: number; max: number }, plausible: { min: number; max: number }, slider: [number, number]): UnitSpec[] {
  return [
    { id: 'mgdl', label: 'mg/dL', toDisplay: id, toCanonical: id, decimals: 0, step: 1, slider: { min: slider[0], max: slider[1] }, plausible, model: range },
    {
      id: 'mmol',
      label: 'mmol/L',
      toDisplay: cholesterol.toMmol,
      toCanonical: cholesterol.toMgdl,
      decimals: 2,
      step: 0.01,
      slider: { min: Math.round(cholesterol.toMmol(slider[0]) * 10) / 10, max: Math.round(cholesterol.toMmol(slider[1]) * 10) / 10 },
      plausible: { min: Math.round(cholesterol.toMmol(plausible.min) * 10) / 10, max: Math.round(cholesterol.toMmol(plausible.max) * 10) / 10 },
      // Rounded inward so a value shown as in-range is always computable.
      model: inward(cholesterol.toMmol(range.min), cholesterol.toMmol(range.max), 2),
    },
  ]
}

export const TOTAL_CHOL = chol(PREVENT_RANGES.totalCholesterol, PLAUSIBLE.totalCholesterol, [100, 400])
export const HDL = chol(PREVENT_RANGES.hdl, PLAUSIBLE.hdl, [10, 130])

export const CREATININE: UnitSpec[] = [
  { id: 'mgdl', label: 'mg/dL', toDisplay: id, toCanonical: id, decimals: 2, step: 0.01, slider: { min: 0.3, max: 3 }, plausible: PLAUSIBLE.creatinineMgDl },
  {
    id: 'umol',
    label: 'µmol/L',
    toDisplay: creatinine.toUmol,
    toCanonical: creatinine.toMgdl,
    decimals: 0,
    step: 1,
    slider: { min: 27, max: 265 },
    plausible: { min: Math.round(creatinine.toUmol(PLAUSIBLE.creatinineMgDl.min)), max: Math.round(creatinine.toUmol(PLAUSIBLE.creatinineMgDl.max)) },
  },
]
