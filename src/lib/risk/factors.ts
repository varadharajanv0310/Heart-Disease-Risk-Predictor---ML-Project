/**
 * Age-appropriate checks of each number against published guideline cut-offs.
 *
 * Used for everyone outside PREVENT's validated 30–79 range. It never produces
 * a risk percentage — it says, number by number, where a value sits against
 * the guideline for that person's age. Where a guideline needs data we don't
 * collect (children's percentile charts, paediatric kidney equations), the
 * factor is "not assessed" with the reason, never guessed.
 *
 * Sources:
 *   BP, ages ≥18 ........ 2025 AHA/ACC high blood pressure guideline
 *   BP, ages 13–17 ...... AAP 2017 clinical practice guideline (Flynn JT et al., Pediatrics 2017) —
 *                         from 13, the same systolic cut-offs as adults
 *   Lipids, ages 2–19 ... NHLBI 2011 Expert Panel on cardiovascular health and risk reduction in children
 *   Lipids, ages ≥20 .... NCEP ATP III (total, HDL; HDL <50 in women from its metabolic-syndrome criteria);
 *                         National Lipid Association 2015 (non-HDL)
 *   BMI, ages ≥20 ....... WHO adult BMI classification (under 20: BMI-for-age percentiles)
 *   eGFR, ages ≥18 ...... KDIGO 2024 CKD guideline, GFR categories G1–G5
 *   Smoking, diabetes ... AHA Life's Essential 8 (Lloyd-Jones 2022)
 */
import type { ClinicalInput } from './types'

/**
 * Youngest age each guideline covers. Below it, a factor is "not assessed" and
 * the question isn't asked. Lipid cut-offs start at 2, the youngest age we accept.
 */
export const FACTOR_MIN_AGE = { bp: 13, egfr: 18, bmi: 20 } as const

export type Band = 'healthy' | 'watch' | 'high' | 'unknown' | 'not_assessed'

export type FactorId = 'bp' | 'totalCholesterol' | 'nonHdl' | 'hdl' | 'bmi' | 'egfr' | 'smoking' | 'diabetes'

export type FactorSource = 'aha2025' | 'aap2017' | 'nhlbi2011' | 'atp3' | 'nla2015' | 'who' | 'kdigo2024' | 'le8'

export type NotAssessedReason = 'bp_under_13' | 'egfr_under_18' | 'bmi_under_20'

export interface FactorCheck {
  id: FactorId
  /** Value in canonical units (mmHg, mg/dL, kg/m², mL/min/1.73 m²); null if unknown or not asked. */
  value: number | null
  band: Band
  /** Category key, e.g. 'stage1', 'borderline'. Labels live in src/content/copy.ts. */
  category: string | null
  source: FactorSource | null
  reason?: NotAssessedReason
}

const unknown = (id: FactorId): FactorCheck => ({ id, value: null, band: 'unknown', category: null, source: null })
const notAssessed = (id: FactorId, value: number | null, reason: NotAssessedReason): FactorCheck => ({
  id,
  value,
  band: 'not_assessed',
  category: null,
  source: null,
  reason,
})
const check = (id: FactorId, value: number, [band, category]: [Band, string], source: FactorSource): FactorCheck => ({
  id,
  value,
  band,
  category,
  source,
})

export function checkBloodPressure(age: number, sbp: number | null): FactorCheck {
  if (age < FACTOR_MIN_AGE.bp) return notAssessed('bp', sbp, 'bp_under_13')
  if (sbp == null) return unknown('bp')
  const source = age < 18 ? 'aap2017' : 'aha2025'
  return check(
    'bp',
    sbp,
    sbp < 120 ? ['healthy', 'normal'] : sbp < 130 ? ['watch', 'elevated'] : sbp < 140 ? ['high', 'stage1'] : ['high', sbp >= 180 ? 'stage2Severe' : 'stage2'],
    source,
  )
}

export function checkTotalCholesterol(age: number, tc: number | null): FactorCheck {
  if (tc == null) return unknown('totalCholesterol')
  if (age < 20) return check('totalCholesterol', tc, tc < 170 ? ['healthy', 'acceptable'] : tc < 200 ? ['watch', 'borderline'] : ['high', 'high'], 'nhlbi2011')
  return check('totalCholesterol', tc, tc < 200 ? ['healthy', 'desirable'] : tc < 240 ? ['watch', 'borderline'] : ['high', 'high'], 'atp3')
}

export function checkNonHdl(age: number, tc: number | null, hdl: number | null): FactorCheck {
  if (tc == null || hdl == null) return unknown('nonHdl')
  const v = tc - hdl
  if (age < 20) return check('nonHdl', v, v < 120 ? ['healthy', 'acceptable'] : v < 145 ? ['watch', 'borderline'] : ['high', 'high'], 'nhlbi2011')
  return check(
    'nonHdl',
    v,
    v < 130
      ? ['healthy', 'desirable']
      : v < 160
        ? ['watch', 'aboveDesirable']
        : v < 190
          ? ['watch', 'borderline']
          : v < 220
            ? ['high', 'high']
            : ['high', 'veryHigh'],
    'nla2015',
  )
}

export function checkHdl(age: number, sex: ClinicalInput['sex'], hdl: number | null): FactorCheck {
  if (hdl == null) return unknown('hdl')
  if (age < 20) return check('hdl', hdl, hdl > 45 ? ['healthy', 'acceptable'] : hdl >= 40 ? ['watch', 'borderline'] : ['high', 'low'], 'nhlbi2011')
  return check(
    'hdl',
    hdl,
    hdl < 40 ? ['high', 'low'] : sex === 'female' && hdl < 50 ? ['watch', 'lowForWomen'] : hdl >= 60 ? ['healthy', 'high'] : ['healthy', 'normal'],
    'atp3',
  )
}

export function checkBmi(age: number, bmi: number | null): FactorCheck {
  if (age < FACTOR_MIN_AGE.bmi) return notAssessed('bmi', bmi, 'bmi_under_20')
  if (bmi == null) return unknown('bmi')
  return check(
    'bmi',
    bmi,
    bmi < 18.5 ? ['watch', 'underweight'] : bmi < 25 ? ['healthy', 'healthy'] : bmi < 30 ? ['watch', 'overweight'] : ['high', 'obesity'],
    'who',
  )
}

/** G1–G2 alone don't meet KDIGO's definition of CKD, so both read as healthy. */
export function checkEgfr(age: number, egfr: number | null): FactorCheck {
  if (age < FACTOR_MIN_AGE.egfr) return notAssessed('egfr', egfr, 'egfr_under_18')
  if (egfr == null) return unknown('egfr')
  return check(
    'egfr',
    egfr,
    egfr >= 90
      ? ['healthy', 'g1']
      : egfr >= 60
        ? ['healthy', 'g2']
        : egfr >= 45
          ? ['watch', 'g3a']
          : egfr >= 30
            ? ['high', 'g3b']
            : egfr >= 15
              ? ['high', 'g4']
              : ['high', 'g5'],
    'kdigo2024',
  )
}

/** Every factor for one person, in display order. */
export function checkFactors(input: ClinicalInput): FactorCheck[] {
  const { age } = input
  return [
    checkBloodPressure(age, input.sbp),
    checkTotalCholesterol(age, input.totalCholesterol),
    checkNonHdl(age, input.totalCholesterol, input.hdl),
    checkHdl(age, input.sex, input.hdl),
    checkBmi(age, input.bmi),
    checkEgfr(age, input.egfr),
    { id: 'smoking', value: null, band: input.smoker ? 'high' : 'healthy', category: input.smoker ? 'smokes' : 'none', source: 'le8' },
    { id: 'diabetes', value: null, band: input.diabetes ? 'high' : 'healthy', category: input.diabetes ? 'diagnosed' : 'none', source: 'le8' },
  ]
}

/** How many assessed factors sit in the healthy band. Unknown and not-assessed factors don't count either way. */
export function tally(factors: FactorCheck[]): { healthy: number; assessed: number } {
  const assessed = factors.filter((f) => f.band === 'healthy' || f.band === 'watch' || f.band === 'high')
  return { healthy: assessed.filter((f) => f.band === 'healthy').length, assessed: assessed.length }
}
