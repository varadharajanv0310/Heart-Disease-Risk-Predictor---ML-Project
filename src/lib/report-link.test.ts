import { describe, expect, it } from 'vitest'
import { decodeReport, encodeReport } from './report-link'
import { assess } from './risk/assess'
import { round } from './risk/units'

const answers = {
  symptoms: 'no', history: 'no', age: 50, sex: 'female', pregnant: 'no', sbp: 160, bpTreated: 'yes',
  totalCholesterol: 200, hdl: 45, statin: 'no', diabetes: 'yes', smoker: 'no', heightCm: 165,
  weightKg: 95.2875, egfr: 90, southAsian: 'yes', familyHistory: 'skip',
} as const

describe('report link (URL fragment)', () => {
  it('is short, URL-safe and round-trips answers and unit preferences', () => {
    const code = encodeReport(answers, { chol: 'mmol', body: 'imperial', creat: 'mgdl' })
    expect(code.length).toBeLessThan(80)
    expect(code).toMatch(/^[0-9A-Za-z.~?-]+$/)
    const back = decodeReport(`#${code}`)!
    expect(back.prefs).toEqual({ chol: 'mmol', body: 'imperial' })
    expect(back.answers).toEqual({ ...answers, weightKg: 95.29 })
  })

  it('keeps unknowns and omits unanswered fields', () => {
    const code = encodeReport({ age: 44, sex: 'male', totalCholesterol: 'unknown' }, { chol: 'mgdl', body: 'metric', creat: 'mgdl' })
    expect(decodeReport(code)!.answers).toEqual({ age: 44, sex: 'male', totalCholesterol: 'unknown' })
  })

  it('reproduces the on-screen result after rounding', () => {
    const mmolTc = 5.17 / 0.02586 // a value typed in mmol/L has many decimals in mg/dL
    const a = { ...answers, totalCholesterol: mmolTc }
    const back = decodeReport(encodeReport(a, { chol: 'mmol', body: 'metric', creat: 'mgdl' }))!
    const x = assess(a)
    const y = assess(back.answers)
    if (x.kind !== 'prevent' || y.kind !== 'prevent' || x.headline.status !== 'ok' || y.headline.status !== 'ok') throw new Error()
    expect(round(y.headline.value, 1)).toBe(round(x.headline.value, 1))
    expect(Math.abs(y.headline.value - x.headline.value)).toBeLessThan(1e-3)
  })

  it('rejects garbage', () => {
    expect(decodeReport('#not-a-report')).toBeNull()
    expect(decodeReport('#2.gm~x')).toBeNull()
    expect(decodeReport('')).toBeNull()
  })
})
