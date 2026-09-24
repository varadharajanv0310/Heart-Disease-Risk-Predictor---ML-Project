import { type Answers, asks, preventAge } from '@/lib/risk/assess'

export type StepId =
  | 'symptoms'
  | 'history'
  | 'age'
  | 'sex'
  | 'pregnant'
  | 'sbp'
  | 'bpTreated'
  | 'totalCholesterol'
  | 'hdl'
  | 'statin'
  | 'diabetes'
  | 'smoker'
  | 'body'
  | 'egfr'
  | 'context'
  | 'review'

const ORDER: StepId[] = [
  'symptoms', 'history', 'age', 'sex', 'pregnant', 'sbp', 'bpTreated', 'totalCholesterol', 'hdl',
  'statin', 'diabetes', 'smoker', 'body', 'egfr', 'context', 'review',
]

export function visibleSteps(a: Answers): StepId[] {
  return ORDER.filter((s) => {
    if (s === 'pregnant') return asks('pregnant', a)
    if (s === 'sbp' || s === 'bpTreated') return asks('sbp', a)
    if (s === 'body' || s === 'egfr') return asks(s, a)
    if (s === 'hdl') return a.totalCholesterol !== 'unknown'
    return true
  })
}

export function isAnswered(step: StepId, a: Answers): boolean {
  switch (step) {
    case 'body':
      return a.heightCm !== undefined && a.weightKg !== undefined
    case 'context':
    case 'review':
      return true
    default:
      return a[step] !== undefined
  }
}

/** A step that, once answered this way, stops the flow with an explanation. */
export function stepBlock(step: StepId, a: Answers) {
  if (step === 'symptoms' && a.symptoms === 'yes') return 'symptoms' as const
  if (step === 'history' && a.history === 'yes') return 'history' as const
  if (step === 'pregnant' && a.pregnant === 'yes') return 'pregnancy' as const
  // Outside 30–79 there's no equation to feed, so an unknown reading is just "not known".
  if (step === 'sbp' && a.sbp === 'unknown' && (typeof a.age !== 'number' || preventAge(a.age))) return 'sbp_unknown' as const
  return null
}

/** First visible step that still needs an answer (used to resume). */
export function firstOpenStep(a: Answers): number {
  const steps = visibleSteps(a)
  const i = steps.findIndex((s) => !isAnswered(s, a))
  return i === -1 ? steps.length - 1 : i
}
