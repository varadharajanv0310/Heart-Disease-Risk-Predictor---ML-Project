import { describe, expect, it } from 'vitest'
import { framinghamLab, framinghamOffice, heartAge } from './framingham'
import type { Computed } from './types'

const value = (c: Computed) => {
  if (c.status !== 'ok') throw new Error(c.reasons.join(', '))
  return c.value
}

describe("Framingham general CVD — published worked examples (D'Agostino 2008)", () => {
  it('61-year-old woman, TC 180, HDL 47, untreated SBP 124, smoker → 10.48%', () => {
    const r = framinghamLab({
      sex: 'female', age: 61, totalCholesterol: 180, hdl: 47, sbp: 124,
      bpTreated: false, smoker: true, diabetes: false,
    })
    expect(value(r)).toBeCloseTo(10.48, 2)
  })

  it('53-year-old man, TC 161, HDL 55, treated SBP 125, diabetic → 15.62%', () => {
    const r = framinghamLab({
      sex: 'male', age: 53, totalCholesterol: 161, hdl: 55, sbp: 125,
      bpTreated: true, smoker: false, diabetes: true,
    })
    expect(value(r)).toBeCloseTo(15.62, 2)
  })
})

describe('Heart age', () => {
  it('equals chronological age for the reference "normal" person', () => {
    for (const sex of ['female', 'male'] as const) {
      for (const age of [35, 50, 65]) {
        const h = heartAge({
          sex, age, totalCholesterol: 180, hdl: 45, sbp: 125, bpTreated: false, smoker: false, diabetes: false,
        })
        expect(h.status === 'ok' && h.value).toBeCloseTo(age, 8)
      }
    }
  })

  it('is older than chronological age for a smoker', () => {
    const h = heartAge({
      sex: 'female', age: 61, totalCholesterol: 180, hdl: 47, sbp: 124, bpTreated: false, smoker: true, diabetes: false,
    })
    expect(h.status).toBe('ok')
    if (h.status === 'ok') {
      expect(h.value).toBeGreaterThan(70)
      expect(h.value).toBeLessThan(80)
      expect(h.bound).toBeNull()
    }
  })

  it('reports bounded values instead of extrapolating past 30–80', () => {
    const young = heartAge({
      sex: 'female', age: 30, totalCholesterol: 140, hdl: 90, sbp: 100, bpTreated: false, smoker: false, diabetes: false,
    })
    expect(young).toEqual({ status: 'ok', value: 30, bound: 'below' })
    const old = heartAge({
      sex: 'male', age: 70, totalCholesterol: 300, hdl: 25, sbp: 190, bpTreated: true, smoker: true, diabetes: true,
    })
    expect(old).toEqual({ status: 'ok', value: 80, bound: 'above' })
  })

  it('is not computable outside ages 30–74', () => {
    const h = heartAge({
      sex: 'male', age: 76, totalCholesterol: 180, hdl: 45, sbp: 125, bpTreated: false, smoker: false, diabetes: false,
    })
    expect(h.status === 'not_computable' && h.reasons).toContain('age_over_74_for_framingham')
  })
})

describe('Framingham office (BMI) model — estimate path', () => {
  it('gives a plausible, monotonic estimate', () => {
    const base = { sex: 'male' as const, age: 50, bmi: 26, sbp: 130, bpTreated: false, smoker: false, diabetes: false }
    const r = value(framinghamOffice(base))
    expect(r).toBeGreaterThan(3)
    expect(r).toBeLessThan(20)
    expect(value(framinghamOffice({ ...base, smoker: true }))).toBeGreaterThan(r)
    expect(value(framinghamOffice({ ...base, bmi: 34 }))).toBeGreaterThan(r)
  })

  it('reproduces the coefficient arithmetic exactly', () => {
    // Hand-expanded: 1 − 0.94833^exp(2.72107·ln55 + 0.51125·ln24 + 2.88267·ln142 + 0.61868 − 26.0145)
    const x = 2.72107 * Math.log(55) + 0.51125 * Math.log(24) + 2.88267 * Math.log(142) + 0.61868 - 26.0145
    const expected = 100 * (1 - Math.pow(0.94833, Math.exp(x)))
    const r = framinghamOffice({ sex: 'female', age: 55, bmi: 24, sbp: 142, bpTreated: true, smoker: true, diabetes: false })
    expect(value(r)).toBeCloseTo(expected, 12)
  })

  it('is not computable without blood pressure', () => {
    const r = framinghamOffice({ sex: 'female', age: 55, bmi: 24, sbp: null, bpTreated: false, smoker: false, diabetes: false })
    expect(r.status).toBe('not_computable')
  })
})
