/**
 * From questionnaire answers to a complete, honest assessment.
 *
 * Decision order:
 *   1. Safety & eligibility blocks (symptoms, known CVD, pregnancy).
 *   2. Age outside PREVENT's 30–79 → a guideline check of each number, with
 *      no risk percentage. Any age from 2 gets a result; none is extrapolated.
 *   3. No systolic BP → nothing is computable.
 *   4. Cholesterol and eGFR known → PREVENT (headline = 10-yr ASCVD).
 *   5. Otherwise → a clearly labelled Framingham *estimate*.
 */
import { BP_GUIDELINE_CVD_THRESHOLD, type Category, categorize } from './categories'
import { type DriverAnalysis, analyseDrivers } from './drivers'
import { FACTOR_MIN_AGE, type FactorCheck, checkFactors } from './factors'
import { type HeartAge, framinghamLab, framinghamOffice, heartAge } from './framingham'
import { type PreventResult, preventAll } from './prevent'
import type { Sex } from './prevent-coefficients'
import { PREVENT_RANGES, inRange } from './ranges'
import type { ClinicalInput, Computed } from './types'
import { bmi as bmiOf } from './units'

type YesNo = 'yes' | 'no'
type Known = number | 'unknown'

/** Raw answers as stored on the device. Values are canonical (mg/dL, cm, kg). */
export interface Answers {
  symptoms?: YesNo
  history?: YesNo | 'unsure'
  age?: number
  sex?: Sex
  pregnant?: YesNo
  sbp?: Known
  bpTreated?: YesNo
  totalCholesterol?: Known
  hdl?: Known
  statin?: YesNo
  diabetes?: YesNo
  smoker?: YesNo
  heightCm?: Known
  weightKg?: Known
  egfr?: Known
  southAsian?: YesNo | 'skip'
  familyHistory?: YesNo | 'skip'
}

export type BlockReason = 'symptoms' | 'history' | 'pregnancy' | 'sbp_unknown' | 'incomplete'

export type Note =
  | 'south_asian'
  | 'family_history'
  | 'history_unsure'
  | 'bp_stage1_over_threshold'
  | 'bp_stage1_under_threshold'
  | 'hf_bmi_unavailable'
  | 'thirty_year_age'

export type Assessment =
  | { kind: 'blocked'; reason: BlockReason }
  | {
      kind: 'prevent'
      input: ClinicalInput
      prevent: PreventResult
      headline: Computed
      category: Category | null
      heartAge: HeartAge
      drivers: DriverAnalysis | null
      notes: Note[]
    }
  | {
      kind: 'factors'
      input: ClinicalInput
      /** Why there's no percentage: PREVENT starts at 30 and stops at 79. */
      ageBand: 'under30' | 'over79'
      factors: FactorCheck[]
      notes: Note[]
    }
  | {
      kind: 'estimate'
      input: ClinicalInput
      model: 'framingham-lab' | 'framingham-office'
      estimate: Computed
      heartAge: HeartAge | null
      missing: ('lipids' | 'egfr')[]
      notes: Note[]
    }

const num = (v: Known | undefined): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

export function toClinicalInput(a: Answers): ClinicalInput | null {
  if (a.age == null || a.sex == null) return null
  const h = num(a.heightCm)
  const w = num(a.weightKg)
  return {
    sex: a.sex,
    age: a.age,
    sbp: num(a.sbp),
    bpTreated: a.bpTreated === 'yes',
    totalCholesterol: num(a.totalCholesterol),
    hdl: num(a.hdl),
    statin: a.statin === 'yes',
    diabetes: a.diabetes === 'yes',
    smoker: a.smoker === 'yes',
    egfr: num(a.egfr),
    bmi: h != null && w != null ? bmiOf(h, w) : null,
  }
}

/** PREVENT covers this age. Outside it, results are a guideline check with no percentage. */
export const preventAge = (age: number) => inRange(age, PREVENT_RANGES.age)

/** Youngest age we ask about pregnancy. */
export const PREGNANCY_MIN_AGE = 10

/**
 * Questions that only apply from a certain age: below it, their guideline needs
 * charts or equations we don't have, so we don't ask. Unknown age → ask.
 */
export function asks(question: 'sbp' | 'body' | 'egfr' | 'pregnant', a: Answers): boolean {
  if (question === 'pregnant' && a.sex !== 'female') return false
  if (a.age == null) return true
  const min = question === 'sbp' ? FACTOR_MIN_AGE.bp : question === 'body' ? FACTOR_MIN_AGE.bmi : question === 'egfr' ? FACTOR_MIN_AGE.egfr : PREGNANCY_MIN_AGE
  return a.age >= min
}

/** Which answers are required before we can compute anything. */
export function missingAnswers(a: Answers): (keyof Answers)[] {
  const required: (keyof Answers)[] = ['symptoms', 'history', 'age', 'sex']
  if (asks('pregnant', a)) required.push('pregnant')
  if (asks('sbp', a)) required.push('sbp', 'bpTreated')
  required.push('totalCholesterol', 'hdl', 'statin', 'diabetes', 'smoker')
  if (asks('body', a)) required.push('heightCm', 'weightKg')
  if (asks('egfr', a)) required.push('egfr')
  return required.filter((k) => a[k] === undefined)
}

export function blockReason(a: Answers): BlockReason | null {
  if (a.symptoms === 'yes') return 'symptoms'
  if (a.history === 'yes') return 'history'
  if (asks('pregnant', a) && a.pregnant === 'yes') return 'pregnancy'
  // Every risk equation needs blood pressure; a guideline check doesn't.
  if (a.sbp === 'unknown' && (a.age == null || preventAge(a.age))) return 'sbp_unknown'
  return null
}

function contextNotes(a: Answers): Note[] {
  const notes: Note[] = []
  if (a.history === 'unsure') notes.push('history_unsure')
  if (a.southAsian === 'yes') notes.push('south_asian')
  if (a.familyHistory === 'yes') notes.push('family_history')
  return notes
}

export function assess(a: Answers): Assessment {
  const blocked = blockReason(a)
  if (blocked) return { kind: 'blocked', reason: blocked }
  if (missingAnswers(a).length) return { kind: 'blocked', reason: 'incomplete' }

  const input = toClinicalInput(a)
  if (!input) return { kind: 'blocked', reason: 'incomplete' }
  const notes = contextNotes(a)

  if (!preventAge(input.age)) {
    // Answers left from an earlier, different age may still be stored: only
    // count the questions this age was asked.
    const asked: ClinicalInput = {
      ...input,
      sbp: asks('sbp', a) ? input.sbp : null,
      bpTreated: asks('sbp', a) && input.bpTreated,
      bmi: asks('body', a) ? input.bmi : null,
      egfr: asks('egfr', a) ? input.egfr : null,
    }
    return {
      kind: 'factors',
      input: asked,
      ageBand: input.age < PREVENT_RANGES.age.min ? 'under30' : 'over79',
      factors: checkFactors(asked),
      notes,
    }
  }

  const lipidsKnown = input.totalCholesterol != null && input.hdl != null
  const egfrKnown = input.egfr != null

  if (lipidsKnown && egfrKnown) {
    const prevent = preventAll(input)
    const headline = prevent.tenYear.ascvd
    const category = headline.status === 'ok' ? categorize(headline.value) : null

    const cvd10 = prevent.tenYear.cvd
    const sbp = input.sbp ?? 0
    if (!input.bpTreated && sbp >= 130 && sbp < 140 && cvd10.status === 'ok') {
      notes.push(cvd10.value >= BP_GUIDELINE_CVD_THRESHOLD ? 'bp_stage1_over_threshold' : 'bp_stage1_under_threshold')
    }
    if (prevent.tenYear.hf.status !== 'ok') notes.push('hf_bmi_unavailable')
    if (input.age > PREVENT_RANGES.age30yr.max) notes.push('thirty_year_age')

    return {
      kind: 'prevent',
      input,
      prevent,
      headline,
      category,
      heartAge: heartAge(input),
      drivers: analyseDrivers(input, 'ascvd'),
      notes,
    }
  }

  const missing: ('lipids' | 'egfr')[] = []
  if (!lipidsKnown) missing.push('lipids')
  if (!egfrKnown) missing.push('egfr')

  if (lipidsKnown) {
    return {
      kind: 'estimate',
      input,
      model: 'framingham-lab',
      estimate: framinghamLab(input),
      heartAge: heartAge(input),
      missing,
      notes,
    }
  }
  return {
    kind: 'estimate',
    input,
    model: 'framingham-office',
    estimate: framinghamOffice(input),
    heartAge: null,
    missing,
    notes,
  }
}
