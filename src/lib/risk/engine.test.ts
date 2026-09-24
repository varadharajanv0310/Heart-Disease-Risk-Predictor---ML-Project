import { describe, expect, it } from 'vitest'
import { type Answers, assess, missingAnswers } from './assess'
import { categorize } from './categories'
import { ckdEpi2021 } from './ckd-epi'
import { NO_CHANGE, analyseDrivers, applyWhatIf, whatIfLimits } from './drivers'
import { preventRisk } from './prevent'
import type { ClinicalInput } from './types'
import { bmi, cholesterol, length, mass, round } from './units'

describe('CKD-EPI 2021 (race-free)', () => {
  it.each([
    ['female', 60, 1.0, 64.495],
    ['male', 50, 1.2, 73.6735],
    ['female', 45, 0.6, 112.7347],
    ['male', 70, 0.8, 95.2063],
  ] as const)('%s %i y, Scr %f mg/dL → %f', (sex, age, scr, expected) => {
    expect(ckdEpi2021(sex, age, scr)).toBeCloseTo(expected, 3)
  })
  it('rejects children and non-positive creatinine', () => {
    expect(ckdEpi2021('female', 16, 0.8)).toBeNull()
    expect(ckdEpi2021('male', 40, 0)).toBeNull()
  })
})

describe('Units', () => {
  it('cholesterol mmol/L ↔ mg/dL round-trips with the PREVENT factor', () => {
    expect(cholesterol.toMgdl(5.172)).toBeCloseTo(200, 6)
    expect(cholesterol.toMmol(cholesterol.toMgdl(4.2))).toBeCloseTo(4.2, 12)
  })
  it('imperial body measures', () => {
    expect(length.fromFeetInches(5, 10)).toBeCloseTo(177.8, 6)
    expect(length.toFeetInches(177.8)).toEqual({ feet: 5, inches: 10 })
    expect(mass.toKg(160)).toBeCloseTo(72.5748, 3)
    expect(mass.toLb(mass.toKg(160))).toBeCloseTo(160, 9)
  })
  it('BMI', () => {
    expect(bmi(175, 70)).toBeCloseTo(22.857, 3)
  })
})

describe('Categories (2026 ACC/AHA, 10-yr PREVENT-ASCVD)', () => {
  it.each([
    [0.4, 'low'], [2.94, 'low'], [2.95, 'borderline'], [3, 'borderline'], [4.9, 'borderline'],
    [5, 'intermediate'], [9.94, 'intermediate'], [9.95, 'high'], [10, 'high'], [34, 'high'],
  ] as const)('%f%% → %s (as displayed, 1 dp)', (v, cat) => {
    expect(categorize(v)).toBe(cat)
  })
})

const person: ClinicalInput = {
  sex: 'male', age: 58, totalCholesterol: 240, hdl: 42, sbp: 148, bpTreated: false,
  statin: false, diabetes: false, smoker: true, egfr: 88, bmi: 29,
}

describe('Drivers (counterfactual insights)', () => {
  const d = analyseDrivers(person)!

  it('orders the modifiable factors by impact and only lists ones that lower risk', () => {
    expect(d.items.map((i) => i.id)).toEqual(expect.arrayContaining(['smoking', 'bloodPressure', 'cholesterol']))
    for (let i = 1; i < d.items.length; i++) expect(d.items[i - 1]!.reduction).toBeGreaterThanOrEqual(d.items[i]!.reduction)
    for (const i of d.items) expect(i.ifHealthy).toBeLessThan(i.current)
  })

  it('the smoking counterfactual equals the model with smoker = false', () => {
    const smoking = d.items.find((i) => i.id === 'smoking')!
    const r = preventRisk({ ...person, smoker: false }, 'ascvd', 10)
    expect(r.status === 'ok' && r.value).toBeCloseTo(smoking.ifHealthy, 12)
  })

  it('baseline (age and sex alone) is below current risk', () => {
    expect(d.baseline).toBeLessThan(d.current)
  })
})

describe('What-if', () => {
  it('no change is the identity', () => {
    expect(applyWhatIf(person, NO_CHANGE)).toEqual(person)
  })
  it('limits keep inputs inside the valid range', () => {
    const lim = whatIfLimits(person)
    expect(lim).toEqual({ canQuit: true, maxSbpDrop: 38, maxLdlDrop: 100 })
    const all = applyWhatIf(person, { quitSmoking: true, sbpDrop: 999, ldlDrop: 999 })
    expect(all.sbp).toBe(110)
    expect(all.totalCholesterol).toBe(140)
    expect(preventRisk(all, 'ascvd', 10).status).toBe('ok')
  })
  it('each lever lowers risk', () => {
    const r = (c: ClinicalInput) => {
      const v = preventRisk(c, 'ascvd', 10)
      return v.status === 'ok' ? v.value : NaN
    }
    const now = r(person)
    expect(r(applyWhatIf(person, { ...NO_CHANGE, quitSmoking: true }))).toBeLessThan(now)
    expect(r(applyWhatIf(person, { ...NO_CHANGE, sbpDrop: 20 }))).toBeLessThan(now)
    expect(r(applyWhatIf(person, { ...NO_CHANGE, ldlDrop: 40 }))).toBeLessThan(now)
  })
})

const complete: Answers = {
  symptoms: 'no', history: 'no', age: 50, sex: 'female', pregnant: 'no', sbp: 160, bpTreated: 'yes',
  totalCholesterol: 200, hdl: 45, statin: 'no', diabetes: 'yes', smoker: 'no',
  heightCm: 165, weightKg: 95.2875, egfr: 90,
}

describe('assess()', () => {
  it('reproduces the published reference case end-to-end', () => {
    const a = assess(complete)
    expect(a.kind).toBe('prevent')
    if (a.kind !== 'prevent') return
    expect(a.headline.status === 'ok' && round(a.headline.value, 1)).toBe(9.2)
    expect(a.category).toBe('intermediate')
    expect(a.prevent.tenYear.cvd.status === 'ok' && round(a.prevent.tenYear.cvd.value, 1)).toBe(14.7)
    expect(a.prevent.tenYear.hf.status === 'ok' && round(a.prevent.tenYear.hf.value, 1)).toBe(8.1)
  })

  it('blocks for symptoms, known heart disease and pregnancy — never for age', () => {
    expect(assess({ ...complete, symptoms: 'yes' })).toEqual({ kind: 'blocked', reason: 'symptoms' })
    expect(assess({ ...complete, history: 'yes' })).toEqual({ kind: 'blocked', reason: 'history' })
    expect(assess({ ...complete, age: 82 }).kind).toBe('factors')
    expect(assess({ ...complete, pregnant: 'yes' })).toEqual({ kind: 'blocked', reason: 'pregnancy' })
    expect(assess({ ...complete, sbp: 'unknown' })).toEqual({ kind: 'blocked', reason: 'sbp_unknown' })
  })

  it('never computes from incomplete answers', () => {
    const rest: Answers = { ...complete }
    delete rest.egfr
    expect(missingAnswers(rest)).toEqual(['egfr'])
    expect(assess(rest)).toEqual({ kind: 'blocked', reason: 'incomplete' })
  })

  it('unknown eGFR → Framingham lab estimate, never PREVENT', () => {
    const a = assess({ ...complete, egfr: 'unknown' })
    expect(a.kind === 'estimate' && a.model).toBe('framingham-lab')
    expect(a.kind === 'estimate' && a.missing).toEqual(['egfr'])
  })

  it('unknown cholesterol → Framingham office (BMI) estimate with no heart age', () => {
    const a = assess({ ...complete, totalCholesterol: 'unknown', hdl: 'unknown' })
    expect(a.kind === 'estimate' && a.model).toBe('framingham-office')
    expect(a.kind === 'estimate' && a.heartAge).toBeNull()
  })

  it('adds the stage 1 blood-pressure guideline note only for untreated SBP 130–139', () => {
    const a = assess({ ...complete, sbp: 134, bpTreated: 'no' })
    expect(a.kind === 'prevent' && a.notes.some((n) => n.startsWith('bp_stage1'))).toBe(true)
    const b = assess({ ...complete, sbp: 150, bpTreated: 'no' })
    expect(b.kind === 'prevent' && b.notes.some((n) => n.startsWith('bp_stage1'))).toBe(false)
  })

  it('context answers add notes but never change the number', () => {
    const a = assess(complete)
    const b = assess({ ...complete, southAsian: 'yes', familyHistory: 'yes' })
    if (a.kind !== 'prevent' || b.kind !== 'prevent') throw new Error()
    expect(b.headline).toEqual(a.headline)
    expect(b.notes).toEqual(expect.arrayContaining(['south_asian', 'family_history']))
  })
})
