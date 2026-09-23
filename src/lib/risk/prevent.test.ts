import { describe, expect, it } from 'vitest'
import named from './__fixtures__/named-profiles.json'
import random from './__fixtures__/random-profiles.json'
import { preventAll, preventRisk } from './prevent'
import { PREVENT_COEFFICIENTS } from './prevent-coefficients'
import type { ClinicalInput, Computed } from './types'

type Fixture = {
  name?: string
  input: Omit<ClinicalInput, 'sex'> & { sex: string }
  tenYear: { cvd: number; ascvd: number; hf: number }
  thirtyYear?: { cvd: number; ascvd: number; hf: number }
}

const value = (c: Computed) => {
  if (c.status !== 'ok') throw new Error(`not computable: ${c.reasons.join(', ')}`)
  return c.value
}

const asInput = (f: Fixture): ClinicalInput => ({ ...f.input, sex: f.input.sex as ClinicalInput['sex'] })

describe('PREVENT — published reference case (preventr README, matches the AHA calculator)', () => {
  // Female, 50 y, TC 200, HDL 45, SBP 160 on treatment, no statin, diabetes,
  // non-smoker, eGFR 90, BMI 35. Published outputs are given to 3 decimals as proportions.
  const input: ClinicalInput = {
    sex: 'female', age: 50, totalCholesterol: 200, hdl: 45, sbp: 160, bpTreated: true,
    statin: false, diabetes: true, smoker: false, egfr: 90, bmi: 35,
  }
  const r = preventAll(input)

  it.each([
    ['10-yr total CVD', r.tenYear.cvd, 14.7],
    ['10-yr ASCVD', r.tenYear.ascvd, 9.2],
    ['10-yr heart failure', r.tenYear.hf, 8.1],
    ['30-yr total CVD', r.thirtyYear.cvd, 53.0],
    ['30-yr ASCVD', r.thirtyYear.ascvd, 35.4],
    ['30-yr heart failure', r.thirtyYear.hf, 39.0],
  ])('%s = %s%%', (_label, computed, expected) => {
    expect(value(computed)).toBeCloseTo(expected, 0)
    expect(Math.abs(value(computed) - expected)).toBeLessThan(0.05)
  })
})

describe('PREVENT — named reference profiles (independent implementation, all 12 equations)', () => {
  for (const f of named as Fixture[]) {
    it(f.name ?? 'profile', () => {
      const r = preventAll(asInput(f))
      for (const o of ['cvd', 'ascvd', 'hf'] as const) {
        expect(value(r.tenYear[o])).toBeCloseTo(f.tenYear[o], 10)
        if (f.thirtyYear) expect(value(r.thirtyYear[o])).toBeCloseTo(f.thirtyYear[o], 10)
        else expect(r.thirtyYear[o].status).toBe('not_computable')
      }
    })
  }
})

describe('PREVENT — 120 random in-range profiles agree with the independent implementation', () => {
  it('matches to 1e-9 percentage points on every equation', () => {
    let checked = 0
    for (const f of random as Fixture[]) {
      const r = preventAll(asInput(f))
      for (const o of ['cvd', 'ascvd', 'hf'] as const) {
        expect(Math.abs(value(r.tenYear[o]) - f.tenYear[o])).toBeLessThan(1e-9)
        checked++
        if (f.thirtyYear) {
          expect(Math.abs(value(r.thirtyYear[o]) - f.thirtyYear[o])).toBeLessThan(1e-9)
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(500)
  })
})

describe('PREVENT — never extrapolates', () => {
  const base: ClinicalInput = {
    sex: 'male', age: 55, totalCholesterol: 200, hdl: 50, sbp: 130, bpTreated: false,
    statin: false, diabetes: false, smoker: false, egfr: 90, bmi: 26,
  }

  it.each([
    ['age 29', { age: 29 }, 'age_out_of_range'],
    ['age 80', { age: 80 }, 'age_out_of_range'],
    ['SBP 89', { sbp: 89 }, 'sbp_out_of_range'],
    ['SBP 201', { sbp: 201 }, 'sbp_out_of_range'],
    ['TC 129', { totalCholesterol: 129 }, 'tc_out_of_range'],
    ['TC 321', { totalCholesterol: 321 }, 'tc_out_of_range'],
    ['HDL 19', { hdl: 19 }, 'hdl_out_of_range'],
    ['HDL 101', { hdl: 101 }, 'hdl_out_of_range'],
    ['eGFR 14', { egfr: 14 }, 'egfr_out_of_range'],
    ['eGFR 141', { egfr: 141 }, 'egfr_out_of_range'],
    ['SBP unknown', { sbp: null }, 'sbp_missing'],
    ['eGFR unknown', { egfr: null }, 'egfr_missing'],
    ['TC unknown', { totalCholesterol: null }, 'tc_missing'],
  ] as const)('%s → not computable (%s)', (_l, patch, reason) => {
    const r = preventRisk({ ...base, ...patch }, 'ascvd', 10)
    expect(r.status).toBe('not_computable')
    if (r.status === 'not_computable') expect(r.reasons).toContain(reason)
  })

  it('accepts the exact range edges', () => {
    for (const patch of [
      { age: 30 }, { age: 79 }, { sbp: 90 }, { sbp: 200 }, { totalCholesterol: 130 },
      { totalCholesterol: 320 }, { hdl: 20 }, { hdl: 100 }, { egfr: 15 }, { egfr: 140 },
    ]) {
      expect(preventRisk({ ...base, ...patch }, 'ascvd', 10).status).toBe('ok')
    }
  })

  it('30-year outputs require age ≤ 59', () => {
    expect(preventRisk({ ...base, age: 59 }, 'cvd', 30).status).toBe('ok')
    const r = preventRisk({ ...base, age: 60 }, 'cvd', 30)
    expect(r.status === 'not_computable' && r.reasons).toEqual(['age_over_59_for_30yr'])
  })

  it('BMI outside 18.5–39.9 blocks only the heart-failure equations', () => {
    const obese = { ...base, bmi: 42 }
    expect(preventRisk(obese, 'hf', 10).status).toBe('not_computable')
    expect(preventRisk(obese, 'ascvd', 10).status).toBe('ok')
    expect(preventRisk(obese, 'cvd', 10).status).toBe('ok')
  })

  it('HDL must be below total cholesterol', () => {
    // Within the valid ranges HDL (≤100) is always below TC (≥130); the check
    // guards typos that land outside them.
    expect(preventRisk({ ...base, totalCholesterol: 150, hdl: 95 }, 'ascvd', 10).status).toBe('ok')
    const bad = preventRisk({ ...base, totalCholesterol: 150, hdl: 160 }, 'cvd', 10)
    expect(bad.status === 'not_computable' && bad.reasons).toEqual(['hdl_out_of_range', 'hdl_not_below_tc'])
  })
})

describe('PREVENT — clinical sanity properties', () => {
  const base: ClinicalInput = {
    sex: 'female', age: 55, totalCholesterol: 210, hdl: 50, sbp: 135, bpTreated: false,
    statin: false, diabetes: false, smoker: false, egfr: 85, bmi: 27,
  }
  const risk = (p: Partial<ClinicalInput>, o: 'cvd' | 'ascvd' | 'hf' = 'ascvd') =>
    value(preventRisk({ ...base, ...p }, o, 10))

  it('risk rises with age, SBP above 130, smoking, diabetes and low eGFR', () => {
    expect(risk({ age: 65 })).toBeGreaterThan(risk({}))
    expect(risk({ sbp: 160 })).toBeGreaterThan(risk({}))
    expect(risk({ smoker: true })).toBeGreaterThan(risk({}))
    expect(risk({ diabetes: true })).toBeGreaterThan(risk({}))
    expect(risk({ egfr: 40 })).toBeGreaterThan(risk({}))
  })

  it('higher HDL lowers ASCVD risk; higher non-HDL raises it', () => {
    expect(risk({ hdl: 70 })).toBeLessThan(risk({}))
    expect(risk({ totalCholesterol: 260 })).toBeGreaterThan(risk({}))
  })

  it('BMI moves heart-failure risk only', () => {
    expect(risk({ bmi: 38 }, 'hf')).toBeGreaterThan(risk({}, 'hf'))
    expect(risk({ bmi: 38 }, 'ascvd')).toBe(risk({}, 'ascvd'))
  })

  it('all outputs are valid percentages', () => {
    for (const f of random as Fixture[]) {
      const r = preventAll(asInput(f))
      for (const c of [...Object.values(r.tenYear), ...Object.values(r.thirtyYear)]) {
        if (c.status === 'ok') {
          expect(c.value).toBeGreaterThan(0)
          expect(c.value).toBeLessThan(100)
        }
      }
    }
  })

  it('has 12 coefficient sets with the published term counts', () => {
    const counts = Object.fromEntries(Object.entries(PREVENT_COEFFICIENTS).map(([k, v]) => [k, Object.keys(v).length]))
    for (const [k, n] of Object.entries(counts)) {
      const tenYear = k.endsWith(':10')
      const hf = k.includes(':hf:')
      expect(n, k).toBe((hf ? 17 : 20) + (tenYear ? 0 : 1))
    }
    expect(Object.keys(counts)).toHaveLength(12)
  })
})
