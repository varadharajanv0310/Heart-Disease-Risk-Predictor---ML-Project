import { describe, expect, it } from 'vitest'
import { visibleSteps } from '@/components/assess/steps'
import { type Answers, assess, missingAnswers } from './assess'
import {
  type FactorCheck,
  checkBloodPressure,
  checkBmi,
  checkEgfr,
  checkFactors,
  checkHdl,
  checkNonHdl,
  checkTotalCholesterol,
  tally,
} from './factors'
import type { ClinicalInput } from './types'

const bc = (f: FactorCheck) => [f.band, f.category]

describe('guideline cut-offs (every boundary)', () => {
  it('blood pressure: AAP 2017 from 13, AHA/ACC 2025 from 18, not assessed under 13', () => {
    expect(checkBloodPressure(12, 150)).toMatchObject({ band: 'not_assessed', reason: 'bp_under_13', category: null })
    expect(checkBloodPressure(13, 119)).toMatchObject({ band: 'healthy', category: 'normal', source: 'aap2017' })
    expect(bc(checkBloodPressure(17, 120))).toEqual(['watch', 'elevated'])
    expect(bc(checkBloodPressure(25, 129))).toEqual(['watch', 'elevated'])
    expect(checkBloodPressure(18, 130)).toMatchObject({ band: 'high', category: 'stage1', source: 'aha2025' })
    expect(bc(checkBloodPressure(85, 139))).toEqual(['high', 'stage1'])
    expect(bc(checkBloodPressure(85, 140))).toEqual(['high', 'stage2'])
    expect(bc(checkBloodPressure(85, 179))).toEqual(['high', 'stage2'])
    expect(bc(checkBloodPressure(85, 180))).toEqual(['high', 'stage2Severe'])
    expect(checkBloodPressure(25, null).band).toBe('unknown')
  })

  it('total cholesterol: NHLBI 2011 under 20, ATP III from 20', () => {
    expect(checkTotalCholesterol(19, 169)).toMatchObject({ band: 'healthy', category: 'acceptable', source: 'nhlbi2011' })
    expect(bc(checkTotalCholesterol(19, 170))).toEqual(['watch', 'borderline'])
    expect(bc(checkTotalCholesterol(2, 199))).toEqual(['watch', 'borderline'])
    expect(bc(checkTotalCholesterol(2, 200))).toEqual(['high', 'high'])
    expect(checkTotalCholesterol(20, 199)).toMatchObject({ band: 'healthy', category: 'desirable', source: 'atp3' })
    expect(bc(checkTotalCholesterol(20, 200))).toEqual(['watch', 'borderline'])
    expect(bc(checkTotalCholesterol(90, 239))).toEqual(['watch', 'borderline'])
    expect(bc(checkTotalCholesterol(90, 240))).toEqual(['high', 'high'])
  })

  it('non-HDL cholesterol: NHLBI 2011 under 20, NLA 2015 from 20', () => {
    const y = (v: number) => bc(checkNonHdl(10, v + 50, 50))
    expect([y(119), y(120), y(144), y(145)]).toEqual([
      ['healthy', 'acceptable'],
      ['watch', 'borderline'],
      ['watch', 'borderline'],
      ['high', 'high'],
    ])
    const a = (v: number) => bc(checkNonHdl(25, v + 50, 50))
    expect([a(129), a(130), a(159), a(160), a(189), a(190), a(219), a(220)]).toEqual([
      ['healthy', 'desirable'],
      ['watch', 'aboveDesirable'],
      ['watch', 'aboveDesirable'],
      ['watch', 'borderline'],
      ['watch', 'borderline'],
      ['high', 'high'],
      ['high', 'high'],
      ['high', 'veryHigh'],
    ])
    expect(checkNonHdl(25, 200, null).band).toBe('unknown')
  })

  it('HDL: NHLBI 2011 under 20; ATP III from 20, with the lower bar for women', () => {
    expect([46, 45, 40, 39].map((v) => bc(checkHdl(15, 'male', v)))).toEqual([
      ['healthy', 'acceptable'],
      ['watch', 'borderline'],
      ['watch', 'borderline'],
      ['high', 'low'],
    ])
    expect([39, 40, 59, 60].map((v) => bc(checkHdl(25, 'male', v)))).toEqual([
      ['high', 'low'],
      ['healthy', 'normal'],
      ['healthy', 'normal'],
      ['healthy', 'high'],
    ])
    expect([39, 40, 49, 50].map((v) => bc(checkHdl(85, 'female', v)))).toEqual([
      ['high', 'low'],
      ['watch', 'lowForWomen'],
      ['watch', 'lowForWomen'],
      ['healthy', 'normal'],
    ])
  })

  it('BMI: WHO adult classes from 20, not assessed under 20', () => {
    expect(checkBmi(19, 31)).toMatchObject({ band: 'not_assessed', reason: 'bmi_under_20' })
    expect([18.4, 18.5, 24.9, 25, 29.9, 30].map((v) => bc(checkBmi(20, v)))).toEqual([
      ['watch', 'underweight'],
      ['healthy', 'healthy'],
      ['healthy', 'healthy'],
      ['watch', 'overweight'],
      ['watch', 'overweight'],
      ['high', 'obesity'],
    ])
  })

  it('eGFR: KDIGO 2024 categories from 18, not assessed under 18', () => {
    expect(checkEgfr(17, 50)).toMatchObject({ band: 'not_assessed', reason: 'egfr_under_18' })
    expect([90, 89, 60, 59, 45, 44, 30, 29, 15, 14].map((v) => bc(checkEgfr(18, v)))).toEqual([
      ['healthy', 'g1'],
      ['healthy', 'g2'],
      ['healthy', 'g2'],
      ['watch', 'g3a'],
      ['watch', 'g3a'],
      ['high', 'g3b'],
      ['high', 'g3b'],
      ['high', 'g4'],
      ['high', 'g4'],
      ['high', 'g5'],
    ])
  })

  it('tally counts only assessed factors', () => {
    const input: ClinicalInput = {
      sex: 'female', age: 8, sbp: null, bpTreated: false, totalCholesterol: 210, hdl: 50,
      statin: false, diabetes: false, smoker: false, egfr: null, bmi: null,
    }
    const f = checkFactors(input)
    expect(f.map((x) => x.band)).toEqual(['not_assessed', 'high', 'high', 'healthy', 'not_assessed', 'not_assessed', 'healthy', 'healthy'])
    expect(tally(f)).toEqual({ healthy: 3, assessed: 5 })
  })
})

const adult: Answers = {
  symptoms: 'no', history: 'no', age: 50, sex: 'female', pregnant: 'no', sbp: 160, bpTreated: 'yes',
  totalCholesterol: 200, hdl: 45, statin: 'no', diabetes: 'yes', smoker: 'no',
  heightCm: 165, weightKg: 95.2875, egfr: 90,
}

const child: Answers = {
  symptoms: 'no', history: 'no', age: 8, sex: 'male', totalCholesterol: 180, hdl: 50,
  statin: 'no', diabetes: 'no', smoker: 'no',
}

describe('any age gets a result, and none is extrapolated', () => {
  it('PREVENT exactly at 30–79; a guideline check (never a percentage) just outside', () => {
    expect(assess({ ...adult, age: 30 }).kind).toBe('prevent')
    expect(assess({ ...adult, age: 79 }).kind).toBe('prevent')
    const young = assess({ ...adult, age: 29 })
    const old = assess({ ...adult, age: 80 })
    expect(young).toMatchObject({ kind: 'factors', ageBand: 'under30' })
    expect(old).toMatchObject({ kind: 'factors', ageBand: 'over79' })
    for (const a of [young, old]) {
      expect(a).not.toHaveProperty('prevent')
      expect(a).not.toHaveProperty('headline')
      expect(a).not.toHaveProperty('estimate')
    }
  })

  it('works at the extremes of the accepted range', () => {
    expect(assess({ ...child, age: 2 }).kind).toBe('factors')
    expect(assess({ ...adult, age: 120 }).kind).toBe('factors')
  })

  it('a child is asked only what their guidelines can read', () => {
    expect(missingAnswers(child)).toEqual([])
    expect(visibleSteps(child)).not.toEqual(expect.arrayContaining(['sbp']))
    expect(visibleSteps(child)).toEqual(
      ['symptoms', 'history', 'age', 'sex', 'totalCholesterol', 'hdl', 'statin', 'diabetes', 'smoker', 'context', 'review'],
    )
    expect(visibleSteps({ ...child, age: 15, sex: 'female' })).toEqual(
      ['symptoms', 'history', 'age', 'sex', 'pregnant', 'sbp', 'bpTreated', 'totalCholesterol', 'hdl', 'statin', 'diabetes', 'smoker', 'context', 'review'],
    )
    expect(visibleSteps({ ...child, age: 18 })).toContain('egfr')
    expect(visibleSteps({ ...child, age: 18 })).not.toContain('body')
    expect(visibleSteps({ ...child, age: 20 })).toContain('body')
  })

  it('answers left from an earlier age are ignored where the new age isn’t asked', () => {
    const a = assess({ ...child, sbp: 150, bpTreated: 'yes', heightCm: 130, weightKg: 60, egfr: 40 })
    if (a.kind !== 'factors') throw new Error(a.kind)
    expect(a.input.sbp).toBeNull()
    expect(a.input.bpTreated).toBe(false)
    expect(a.factors.filter((f) => f.band === 'not_assessed').map((f) => f.id)).toEqual(['bp', 'bmi', 'egfr'])
  })

  it('an unknown blood pressure blocks PREVENT, but not a guideline check', () => {
    expect(assess({ ...adult, sbp: 'unknown' })).toEqual({ kind: 'blocked', reason: 'sbp_unknown' })
    const a = assess({ ...adult, age: 85, sbp: 'unknown' })
    expect(a.kind === 'factors' && a.factors[0]!.band).toBe('unknown')
  })

  it('safety blocks still apply at every age', () => {
    expect(assess({ ...child, symptoms: 'yes' })).toEqual({ kind: 'blocked', reason: 'symptoms' })
    expect(assess({ ...adult, age: 85, history: 'yes' })).toEqual({ kind: 'blocked', reason: 'history' })
    expect(assess({ ...adult, age: 22, pregnant: 'yes' })).toEqual({ kind: 'blocked', reason: 'pregnancy' })
  })
})
