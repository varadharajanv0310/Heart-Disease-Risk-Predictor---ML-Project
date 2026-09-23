import type { Sex } from './prevent-coefficients'

export type { Sex, Outcome, Horizon } from './prevent-coefficients'

/** Why a number could not be produced. Messages live in src/content/copy.ts. */
export type NotComputableReason =
  | 'age_out_of_range'
  | 'age_over_59_for_30yr'
  | 'age_over_74_for_framingham'
  | 'sbp_missing'
  | 'sbp_out_of_range'
  | 'tc_missing'
  | 'tc_out_of_range'
  | 'hdl_missing'
  | 'hdl_out_of_range'
  | 'hdl_not_below_tc'
  | 'egfr_missing'
  | 'egfr_out_of_range'
  | 'bmi_missing'
  | 'bmi_out_of_range'

/** A model output: either a percentage (0–100, unrounded) or an honest refusal. */
export type Computed =
  | { status: 'ok'; value: number }
  | { status: 'not_computable'; reasons: NotComputableReason[] }

/**
 * Canonical clinical inputs. Cholesterol in mg/dL, SBP in mmHg, eGFR in
 * mL/min/1.73 m², BMI in kg/m². `null` means "unknown".
 */
export interface ClinicalInput {
  sex: Sex
  age: number
  sbp: number | null
  bpTreated: boolean
  totalCholesterol: number | null
  hdl: number | null
  statin: boolean
  diabetes: boolean
  smoker: boolean
  egfr: number | null
  bmi: number | null
}

export const ok = (value: number): Computed => ({ status: 'ok', value })
export const notComputable = (reasons: NotComputableReason[]): Computed => ({
  status: 'not_computable',
  reasons,
})
export const isOk = (c: Computed): c is { status: 'ok'; value: number } => c.status === 'ok'
