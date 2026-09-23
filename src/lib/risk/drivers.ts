/**
 * The "insights" layer. Everything here is computed from the PREVENT equation
 * itself — no separate model — so it can never contradict the headline.
 *
 * Drivers are one-at-a-time counterfactuals: "if only this factor were at a
 * healthy level, your risk would be X". Because the model is non-linear, these
 * do not sum to the total; the UI says so.
 */
import type { Outcome } from './prevent-coefficients'
import { preventRisk } from './prevent'
import type { ClinicalInput } from './types'

export type DriverId = 'smoking' | 'bloodPressure' | 'cholesterol' | 'diabetes' | 'kidney'

export interface Driver {
  id: DriverId
  /** How changeable this is in real life. */
  modifiable: 'yes' | 'partly' | 'no'
  /** Current risk and risk with only this factor at its healthy reference (%). */
  current: number
  ifHealthy: number
  /** Percentage-point reduction, ≥ 0. */
  reduction: number
}

export interface DriverAnalysis {
  outcome: Outcome
  current: number
  /** Risk from age and sex alone, with every other input at a healthy reference. */
  baseline: number
  items: Driver[]
}

/** Healthy reference levels used for counterfactuals. */
export const HEALTHY = {
  sbp: 120, // mmHg — AHA "normal" systolic
  nonHdl: 130, // mg/dL — desirable non-HDL cholesterol
  egfr: 90, // mL/min/1.73 m² — normal kidney function
} as const

function withHealthy(input: ClinicalInput, id: DriverId): ClinicalInput {
  switch (id) {
    case 'smoking':
      return { ...input, smoker: false }
    case 'bloodPressure':
      return { ...input, sbp: Math.min(input.sbp ?? HEALTHY.sbp, HEALTHY.sbp) }
    case 'cholesterol': {
      const tc = input.totalCholesterol
      const hdl = input.hdl
      if (tc == null || hdl == null) return input
      return { ...input, totalCholesterol: Math.min(tc, hdl + HEALTHY.nonHdl) }
    }
    case 'diabetes':
      return { ...input, diabetes: false }
    case 'kidney':
      return { ...input, egfr: Math.max(input.egfr ?? HEALTHY.egfr, HEALTHY.egfr) }
  }
}

const MODIFIABLE: Record<DriverId, Driver['modifiable']> = {
  smoking: 'yes',
  bloodPressure: 'yes',
  cholesterol: 'yes',
  diabetes: 'partly',
  kidney: 'no',
}

export function analyseDrivers(input: ClinicalInput, outcome: Outcome = 'ascvd'): DriverAnalysis | null {
  const base = preventRisk(input, outcome, 10)
  if (base.status !== 'ok') return null

  const items: Driver[] = []
  for (const id of Object.keys(MODIFIABLE) as DriverId[]) {
    const alt = preventRisk(withHealthy(input, id), outcome, 10)
    if (alt.status !== 'ok') continue
    const reduction = base.value - alt.value
    if (reduction > 0.05) {
      items.push({ id, modifiable: MODIFIABLE[id], current: base.value, ifHealthy: alt.value, reduction })
    }
  }
  items.sort((a, b) => b.reduction - a.reduction)

  let healthy: ClinicalInput = { ...input, bpTreated: false, statin: false }
  for (const id of Object.keys(MODIFIABLE) as DriverId[]) healthy = withHealthy(healthy, id)
  const baseline = preventRisk(healthy, outcome, 10)

  return {
    outcome,
    current: base.value,
    baseline: baseline.status === 'ok' ? baseline.value : base.value,
    items,
  }
}

// ── What-if ────────────────────────────────────────────────────────────────

export interface WhatIf {
  quitSmoking: boolean
  /** mmHg lower systolic pressure. */
  sbpDrop: number
  /** mg/dL lower LDL, modelled as the same drop in total (and non-HDL) cholesterol. */
  ldlDrop: number
}

export const NO_CHANGE: WhatIf = { quitSmoking: false, sbpDrop: 0, ldlDrop: 0 }

/** SBP what-ifs stop at 110 mmHg, the lower knot of the PREVENT SBP spline. */
export const WHATIF_SBP_FLOOR = 110
/** Keep non-HDL at a physiologically plausible floor when lowering LDL. */
export const WHATIF_NONHDL_FLOOR = 30

export interface WhatIfLimits {
  canQuit: boolean
  maxSbpDrop: number
  maxLdlDrop: number
}

export function whatIfLimits(input: ClinicalInput): WhatIfLimits {
  const sbp = input.sbp ?? 0
  const tc = input.totalCholesterol ?? 0
  const hdl = input.hdl ?? 0
  const step = (v: number, s: number) => Math.max(0, Math.floor(v / s) * s)
  return {
    canQuit: input.smoker,
    maxSbpDrop: step(Math.min(40, sbp - WHATIF_SBP_FLOOR), 1),
    maxLdlDrop: input.totalCholesterol == null || input.hdl == null
      ? 0
      : step(Math.min(100, tc - 130, tc - hdl - WHATIF_NONHDL_FLOOR), 1),
  }
}

export function applyWhatIf(input: ClinicalInput, w: WhatIf): ClinicalInput {
  const lim = whatIfLimits(input)
  const sbpDrop = Math.min(Math.max(0, w.sbpDrop), lim.maxSbpDrop)
  const ldlDrop = Math.min(Math.max(0, w.ldlDrop), lim.maxLdlDrop)
  return {
    ...input,
    smoker: w.quitSmoking ? false : input.smoker,
    sbp: input.sbp == null ? null : input.sbp - sbpDrop,
    totalCholesterol: input.totalCholesterol == null ? null : input.totalCholesterol - ldlDrop,
  }
}
