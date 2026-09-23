'use client'

/**
 * The heart check: one question per screen on frosted glass.
 *
 * - Answers persist to localStorage on every change (this device only).
 * - Enter = next, Esc = back. Focus moves to the new question each step.
 * - Safety first: symptoms, prior heart disease, age and pregnancy stop the
 *   flow with an explanation rather than a number.
 */
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { assess as copy, blocks, questions as q } from '@/content/copy'
import { store, useHydrated, useStored } from '@/lib/answers-store'
import type { Answers, BlockReason } from '@/lib/risk/assess'
import { ckdEpi2021 } from '@/lib/risk/ckd-epi'
import { PREVENT_RANGES, PLAUSIBLE, inRange } from '@/lib/risk/ranges'
import { bmi as bmiOf, length, mass, round } from '@/lib/risk/units'
import { setScene } from '@/lib/scene-store'
import { Arrow, Button } from '../ui/Button'
import { Choice, Help, NumberField, UnknownButton } from './fields'
import { type StepId, firstOpenStep, isAnswered, stepBlock, visibleSteps } from './steps'
import { AGE, CREATININE, EGFR, HDL, SBP, TOTAL_CHOL } from './units'

type YN = 'yes' | 'no'
const YES_NO = [
  { value: 'yes' as YN, label: copy.yes },
  { value: 'no' as YN, label: copy.no },
]

export function Assessment() {
  const router = useRouter()
  const hydrated = useHydrated()
  const { answers, prefs, step: storedStep } = useStored()
  const steps = visibleSteps(answers)
  const index = Math.min(storedStep, firstOpenStep(answers), steps.length - 1)
  const step = steps[index]!
  const [block, setBlock] = useState<Exclude<BlockReason, 'incomplete'> | null>(null)
  const [nudge, setNudge] = useState(false)
  const headingId = useId()
  const card = useRef<HTMLDivElement>(null)
  const allAnswered = firstOpenStep(answers) === steps.length - 1

  useEffect(() => {
    setScene({ mode: 'assess', blur: 1, visible: true })
  }, [])

  // Emergency symptoms stop everything immediately — no need to press Next.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (answers.symptoms === 'yes') setBlock('symptoms')
  }, [answers.symptoms])

  const set = useCallback(<K extends keyof Answers>(k: K, v: Answers[K]) => {
    setNudge(false)
    store.setAnswer(k, v)
  }, [])

  /** True while a step change is waiting on the View Transition to commit. */
  const pending = useRef(false)

  const go = useCallback((to: number, dir: 'forward' | 'back') => {
    if (pending.current) return
    document.documentElement.dataset.dir = dir
    let done = false
    const run = () => {
      if (done) return
      done = true
      flushSync(() => store.setStep(to))
      pending.current = false
    }
    const d = document as Document & { startViewTransition?: (cb: () => void) => { skipTransition: () => void } }
    if (!d.startViewTransition) return run()
    pending.current = true
    const vt = d.startViewTransition(run)
    // The browser needs a frame to snapshot the old card. If that's slow (a busy
    // device), don't let input land on a stale question: skip the animation.
    setTimeout(() => {
      if (done) return
      vt.skipTransition()
      run()
    }, 180)
  }, [])

  // Move focus to the new question so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (!hydrated || block) return
    const el = card.current
    if (!el) return
    const id = requestAnimationFrame(() => {
      const target =
        el.querySelector<HTMLElement>('input[type="text"]') ??
        el.querySelector<HTMLElement>('input[type="radio"]:checked') ??
        el.querySelector<HTMLElement>('input[type="radio"]') ??
        el.querySelector<HTMLElement>('h1')
      target?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(id)
  }, [step, hydrated, block])

  const next = useCallback(() => {
    if (pending.current) return
    const a = store.get().answers
    const s = visibleSteps(a)
    const cur = s[Math.min(store.get().step, firstOpenStep(a), s.length - 1)]!
    if (!isAnswered(cur, a)) {
      setNudge(true)
      return
    }
    const b = stepBlock(cur, a)
    if (b) {
      setBlock(b)
      return
    }
    if (cur === 'review') {
      router.push('/results/')
      return
    }
    go(Math.min(s.indexOf(cur) + 1, s.length - 1), 'forward')
  }, [go, router])

  const back = useCallback(() => {
    if (block) return setBlock(null)
    const a = store.get().answers
    const i = Math.min(store.get().step, firstOpenStep(a), visibleSteps(a).length - 1)
    if (i > 0) go(i - 1, 'back')
  }, [block, go])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      // Keys wait until the next question is actually on screen.
      if (pending.current && (e.key === 'Enter' || e.key === 'Escape' || e.key.startsWith('Arrow') || e.key === ' ')) {
        e.preventDefault()
        return
      }
      if (e.key === 'Escape') {
        if (t?.closest('details[open]')) return
        e.preventDefault()
        back()
      } else if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        if (t?.closest('button, a, summary, textarea')) return
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [next, back])

  if (!hydrated) {
    return <div className="min-h-[100svh]" aria-busy="true" />
  }

  const progress = (index + (isAnswered(step, answers) ? 1 : 0.5)) / steps.length

  return (
    <div className="gutter relative flex min-h-[100svh] flex-col items-center justify-center pb-16 pt-24 md:pt-28">
      <div aria-hidden className="fixed inset-x-0 top-0 z-[55] h-[2px] bg-signal/15">
        <div className="h-full origin-left bg-signal transition-transform duration-700 ease-[var(--e-expo)]" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <p className="sr-only" aria-live="polite">
        {`Question ${index + 1} of ${steps.length}`}
      </p>

      {block ? (
        <BlockScreen reason={block} onClose={() => setBlock(null)} />
      ) : (
        <div ref={card} className="glass-card relative w-full max-w-3xl p-6 md:p-12" style={{ viewTransitionName: 'q-card' }}>
          <div className="flex items-start justify-between gap-4">
            <p className="micro font-medium text-blood">{eyebrow(step)}</p>
            <p className="pixel text-[13px] text-blood tabular" aria-hidden>
              {copy.stepOf(index + 1, steps.length)}
            </p>
          </div>

          <Question step={step} answers={answers} prefs={prefs} set={set} headingId={headingId} onPick={next} onEdit={(s) => go(steps.indexOf(s), 'back')} />

          {nudge && (
            <p role="alert" className="mt-4 text-[14px] font-medium text-blood">
              <span aria-hidden className="mr-2 inline-block h-2 w-2 translate-y-[-1px] bg-signal" />
              {step === 'age' || step === 'sbp' || step === 'totalCholesterol' || step === 'hdl' || step === 'egfr' || step === 'body' ? copy.requiredNumber : copy.requiredChoice}
            </p>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-blood/10 pt-6">
            <Button variant="quiet" onClick={back} disabled={index === 0} className="min-h-11">
              <Arrow dir="left" />
              {copy.back}
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              {allAnswered && step !== 'review' && (
                <Button variant="ghost" onClick={() => go(steps.length - 1, 'forward')}>
                  {copy.review}
                </Button>
              )}
              <Button onClick={next} data-cursor={step === 'review' ? 'Result' : 'Next'} aria-describedby="kbd-hint">
                {step === 'review' ? copy.seeResult : index === 0 ? copy.start : copy.next}
                <Arrow />
              </Button>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[12px] text-blood/75">
            <p className="flex items-center gap-2">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-signal" />
              {copy.saved}
              <span aria-hidden>·</span>
              <button
                type="button"
                className="underline underline-offset-4 hover:no-underline"
                onClick={() => {
                  if (window.confirm(copy.clearConfirm)) {
                    store.clear()
                    setBlock(null)
                  }
                }}
              >
                {copy.clear}
              </button>
            </p>
            <p id="kbd-hint" className="hidden md:block">
              {copy.keyboardHint}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function eyebrow(step: StepId): string {
  const map: Record<StepId, string> = {
    symptoms: q.symptoms.eyebrow, history: q.history.eyebrow, age: q.age.eyebrow, sex: q.sex.eyebrow,
    pregnant: q.pregnant.eyebrow, sbp: q.sbp.eyebrow, bpTreated: q.bpTreated.eyebrow,
    totalCholesterol: q.totalCholesterol.eyebrow, hdl: q.hdl.eyebrow, statin: q.statin.eyebrow,
    diabetes: q.diabetes.eyebrow, smoker: q.smoker.eyebrow, body: q.body.eyebrow, egfr: q.egfr.eyebrow,
    context: q.context.eyebrow, review: q.review.eyebrow,
  }
  return map[step]
}

// ── Questions ───────────────────────────────────────────────────────────

interface QProps {
  step: StepId
  answers: Answers
  prefs: ReturnType<typeof store.get>['prefs']
  set: <K extends keyof Answers>(k: K, v: Answers[K]) => void
  headingId: string
  onPick: () => void
  onEdit: (s: StepId) => void
}

function Title({ id, children, help }: { id: string; children: ReactNode; help?: string }) {
  return (
    <>
      <h1 id={id} tabIndex={-1} className="mt-6 max-w-[22ch] text-[clamp(1.9rem,4.4vw,3.2rem)] font-medium leading-[1.02] tracking-[-0.035em] text-blood outline-none">
        {children}
      </h1>
      {help && (
        <p id={`${id}-help`} className="mt-4 max-w-xl text-[16px] leading-relaxed text-blood/80">
          {help}
        </p>
      )}
    </>
  )
}

const num = (v: Answers[keyof Answers]) => (typeof v === 'number' ? v : undefined)

function Question({ step, answers: a, prefs, set, headingId: h, onPick, onEdit }: QProps) {
  const help = `${h}-help`
  const yn = (key: 'history' | 'pregnant' | 'bpTreated' | 'statin' | 'diabetes' | 'smoker', title: string, text: string, extra?: ReactNode) => (
    <>
      <Title id={h} help={text}>
        {title}
      </Title>
      <div className="mt-8">
        <Choice name={key} labelledBy={h} describedBy={help} options={YES_NO} value={a[key] as YN | undefined} onChange={(v) => set(key, v)} onPick={onPick} />
      </div>
      {extra}
    </>
  )

  switch (step) {
    case 'symptoms':
      return (
        <>
          <Title id={h} help={q.symptoms.help}>
            {q.symptoms.label}
          </Title>
          <div className="mt-8">
            <Choice
              name="symptoms"
              labelledBy={h}
              describedBy={help}
              options={[
                { value: 'no', label: q.symptoms.no },
                { value: 'yes', label: q.symptoms.yes },
              ]}
              value={a.symptoms}
              onChange={(v) => set('symptoms', v)}
              onPick={onPick}
            />
          </div>
        </>
      )
    case 'history':
      return (
        <>
          <Title id={h} help={q.history.help}>
            {q.history.label}
          </Title>
          <div className="mt-8">
            <Choice
              name="history"
              labelledBy={h}
              describedBy={help}
              options={[...YES_NO, { value: 'unsure', label: copy.notSure }]}
              value={a.history}
              onChange={(v) => set('history', v)}
              onPick={onPick}
            />
          </div>
        </>
      )
    case 'age':
      return (
        <>
          <Title id={h} help={q.age.help}>
            {q.age.label}
          </Title>
          <div className="mt-8">
            <NumberField id="age" label={q.age.label} value={num(a.age)} onChange={(v) => set('age', v === undefined ? undefined : Math.round(v))} units={AGE} unit="y" describedBy={help} />
          </div>
        </>
      )
    case 'sex':
      return (
        <>
          <Title id={h} help={q.sex.help}>
            {q.sex.label}
          </Title>
          <div className="mt-8">
            <Choice
              name="sex"
              labelledBy={h}
              describedBy={help}
              options={[
                { value: 'female', label: q.sex.female },
                { value: 'male', label: q.sex.male },
              ]}
              value={a.sex}
              onChange={(v) => set('sex', v)}
              onPick={onPick}
            />
          </div>
        </>
      )
    case 'pregnant':
      return yn('pregnant', q.pregnant.label, q.pregnant.help)
    case 'sbp': {
      const v = num(a.sbp)
      return (
        <>
          <Title id={h} help={q.sbp.help}>
            {q.sbp.label}
          </Title>
          <div className="mt-8">
            <NumberField id="sbp" label={q.sbp.label} value={v} onChange={(x) => set('sbp', x === undefined ? undefined : Math.round(x))} units={SBP} unit="mmHg" describedBy={help} />
          </div>
          {v !== undefined && v >= 180 && (
            <div role="alert" className="mt-2 rounded-2xl bg-crimson p-4 text-[14px] leading-relaxed text-white">
              {q.sbp.crisis}
            </div>
          )}
          <UnknownButton label={q.sbp.unknown} active={a.sbp === 'unknown'} onClick={() => set('sbp', a.sbp === 'unknown' ? undefined : 'unknown')} />
          <Help>{q.sbp.where}</Help>
        </>
      )
    }
    case 'bpTreated':
      return yn('bpTreated', q.bpTreated.label, q.bpTreated.help)
    case 'totalCholesterol':
      return (
        <>
          <Title id={h} help={q.totalCholesterol.help}>
            {q.totalCholesterol.label}
          </Title>
          <div className="mt-8">
            <NumberField
              id="tc"
              label={q.totalCholesterol.label}
              value={num(a.totalCholesterol)}
              onChange={(x) => {
                set('totalCholesterol', x)
                if (x !== undefined && a.hdl === 'unknown') set('hdl', undefined)
              }}
              units={TOTAL_CHOL}
              unit={prefs.chol}
              onUnitChange={(u) => store.setPref('chol', u as 'mgdl' | 'mmol')}
              describedBy={help}
            />
          </div>
          <UnknownButton
            label={q.totalCholesterol.unknown}
            active={a.totalCholesterol === 'unknown'}
            onClick={() => {
              if (a.totalCholesterol === 'unknown') {
                store.patchAnswers({ totalCholesterol: undefined, hdl: undefined })
              } else {
                store.patchAnswers({ totalCholesterol: 'unknown', hdl: 'unknown' })
              }
            }}
          />
          <Help>{q.totalCholesterol.where}</Help>
        </>
      )
    case 'hdl':
      return (
        <>
          <Title id={h} help={q.hdl.help}>
            {q.hdl.label}
          </Title>
          <div className="mt-8">
            <NumberField id="hdl" label={q.hdl.label} value={num(a.hdl)} onChange={(x) => set('hdl', x)} units={HDL} unit={prefs.chol} onUnitChange={(u) => store.setPref('chol', u as 'mgdl' | 'mmol')} describedBy={help} />
          </div>
          <UnknownButton label={q.hdl.unknown} active={a.hdl === 'unknown'} onClick={() => set('hdl', a.hdl === 'unknown' ? undefined : 'unknown')} />
          <Help>{q.hdl.where}</Help>
        </>
      )
    case 'statin':
      return yn('statin', q.statin.label, q.statin.help)
    case 'diabetes':
      return yn('diabetes', q.diabetes.label, q.diabetes.help)
    case 'smoker':
      return yn('smoker', q.smoker.label, q.smoker.help)
    case 'body':
      return <BodyStep a={a} prefs={prefs} h={h} />
    case 'egfr':
      return <EgfrStep a={a} set={set} h={h} prefs={prefs} />
    case 'context':
      return (
        <>
          <Title id={h} help={q.context.help}>
            {q.context.label}
          </Title>
          <div className="mt-8 grid gap-8">
            <Choice
              name="southAsian"
              size="sm"
              legend={q.context.southAsian}
              options={[...YES_NO, { value: 'skip', label: copy.skip }]}
              value={a.southAsian}
              onChange={(v) => set('southAsian', v)}
            />
            <Choice
              name="familyHistory"
              size="sm"
              legend={q.context.familyHistory}
              options={[...YES_NO, { value: 'skip', label: copy.notSure }]}
              value={a.familyHistory}
              onChange={(v) => set('familyHistory', v)}
            />
          </div>
        </>
      )
    case 'review':
      return <Review a={a} prefs={prefs} h={h} onEdit={onEdit} />
  }
}

// ── Body ────────────────────────────────────────────────────────────────

function BodyStep({ a, prefs, h }: { a: Answers; prefs: QProps['prefs']; h: string }) {
  const imperial = prefs.body === 'imperial'
  const hcm = num(a.heightCm)
  const wkg = num(a.weightKg)
  const fi = hcm !== undefined ? length.toFeetInches(hcm) : undefined
  const [draft, setDraft] = useState(() => ({
    cm: hcm !== undefined ? String(round(hcm, 0)) : '',
    kg: wkg !== undefined ? String(round(wkg, 1)) : '',
    ft: fi ? String(fi.feet) : '',
    inch: fi ? String(fi.inches) : '',
    lb: wkg !== undefined ? String(round(mass.toLb(wkg), 0)) : '',
  }))
  const [err, setErr] = useState<string | null>(null)
  const bmi = hcm !== undefined && wkg !== undefined ? bmiOf(hcm, wkg) : undefined
  const skipped = a.heightCm === 'unknown'

  const update = (patch: Partial<typeof draft>) => {
    const d = { ...draft, ...patch }
    setDraft(d)
    const n = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')))
    const heightCm = imperial ? length.fromFeetInches(n(d.ft), Number.isNaN(n(d.inch)) ? 0 : n(d.inch)) : n(d.cm)
    const weightKg = imperial ? mass.toKg(n(d.lb)) : n(d.kg)
    const hOk = inRange(heightCm, PLAUSIBLE.heightCm)
    const wOk = inRange(weightKg, PLAUSIBLE.weightKg)
    store.patchAnswers({ heightCm: hOk ? heightCm : undefined, weightKg: wOk ? weightKg : undefined })
    const touchedH = imperial ? d.ft !== '' : d.cm !== ''
    const touchedW = imperial ? d.lb !== '' : d.kg !== ''
    setErr(
      (touchedH && !hOk) || (touchedW && !wOk)
        ? imperial
          ? 'Please check your height (4–7 ft) and weight (66–660 lb).'
          : 'Please check your height (120–230 cm) and weight (30–300 kg).'
        : null,
    )
  }

  const field = 'w-full border-b-2 border-blood/15 bg-transparent pb-1 text-[clamp(2rem,6vw,3rem)] font-medium tracking-[-0.03em] text-blood tabular outline-none focus:border-signal placeholder:text-blood/25'
  const lab = 'micro mb-2 block text-blood/80'

  return (
    <>
      <Title id={h} help={q.body.help}>
        {q.body.label}
      </Title>
      <div role="radiogroup" aria-label="Units" className="mt-6 inline-flex rounded-pill border border-blood/15 bg-white/70 p-1">
        {(['metric', 'imperial'] as const).map((u) => (
          <button
            key={u}
            type="button"
            role="radio"
            aria-checked={prefs.body === u}
            onClick={() => store.setPref('body', u)}
            className={`rounded-pill px-3.5 py-1.5 text-[13px] font-medium ${prefs.body === u ? 'bg-blood text-white' : 'text-blood'}`}
          >
            {u === 'metric' ? 'cm · kg' : 'ft · lb'}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2" aria-describedby={`${h}-help`}>
        {imperial ? (
          <div>
            <span className={lab}>{q.body.height}</span>
            <div className="flex gap-3">
              <label className="flex items-baseline gap-1">
                <span className="sr-only">Height, feet</span>
                <input type="text" inputMode="numeric" className={field} value={draft.ft} onChange={(e) => update({ ft: e.target.value })} placeholder="5" />
                <span className="text-blood/80">ft</span>
              </label>
              <label className="flex items-baseline gap-1">
                <span className="sr-only">Height, inches</span>
                <input type="text" inputMode="decimal" className={field} value={draft.inch} onChange={(e) => update({ inch: e.target.value })} placeholder="8" />
                <span className="text-blood/80">in</span>
              </label>
            </div>
          </div>
        ) : (
          <label>
            <span className={lab}>{q.body.height}</span>
            <span className="flex items-baseline gap-2">
              <input type="text" inputMode="decimal" className={field} value={draft.cm} onChange={(e) => update({ cm: e.target.value })} placeholder="170" aria-label="Height in centimetres" />
              <span className="text-blood/80">cm</span>
            </span>
          </label>
        )}
        <label>
          <span className={lab}>{q.body.weight}</span>
          <span className="flex items-baseline gap-2">
            {imperial ? (
              <input type="text" inputMode="decimal" className={field} value={draft.lb} onChange={(e) => update({ lb: e.target.value })} placeholder="165" aria-label="Weight in pounds" />
            ) : (
              <input type="text" inputMode="decimal" className={field} value={draft.kg} onChange={(e) => update({ kg: e.target.value })} placeholder="72" aria-label="Weight in kilograms" />
            )}
            <span className="text-blood/80">{imperial ? 'lb' : 'kg'}</span>
          </span>
        </label>
      </div>
      <div aria-live="polite" className="mt-4 min-h-6 text-[14px]">
        {err && (
          <p className="font-medium text-blood">
            <span aria-hidden className="mr-2 inline-block h-2 w-2 translate-y-[-1px] bg-signal" />
            {err}
          </p>
        )}
        {!err && bmi !== undefined && (
          <p className="text-blood/85">
            <span className="pixel mr-2 text-blood">{q.body.bmi(round(bmi, 1).toFixed(1))}</span>
            {!inRange(bmi, PREVENT_RANGES.bmi) && q.body.bmiOut}
          </p>
        )}
      </div>
      <UnknownButton
        label={q.body.unknown}
        active={skipped}
        onClick={() => {
          if (skipped) store.patchAnswers({ heightCm: undefined, weightKg: undefined })
          else {
            store.patchAnswers({ heightCm: 'unknown', weightKg: 'unknown' })
            setErr(null)
          }
        }}
      />
    </>
  )
}

// ── eGFR with creatinine helper ─────────────────────────────────────────

function EgfrStep({ a, set, h, prefs }: { a: Answers; set: QProps['set']; h: string; prefs: QProps['prefs'] }) {
  const [creat, setCreat] = useState<number | undefined>(undefined)
  const canCalc = typeof a.age === 'number' && a.sex !== undefined
  const est = canCalc && creat !== undefined ? ckdEpi2021(a.sex!, a.age as number, creat) : null
  return (
    <>
      <Title id={h} help={q.egfr.help}>
        {q.egfr.label}
      </Title>
      <div className="mt-8">
        <NumberField id="egfr" label={q.egfr.label} value={num(a.egfr)} onChange={(x) => set('egfr', x === undefined ? undefined : Math.round(x))} units={EGFR} unit="egfr" describedBy={`${h}-help`} />
      </div>
      <UnknownButton label={q.egfr.unknown} active={a.egfr === 'unknown'} onClick={() => set('egfr', a.egfr === 'unknown' ? undefined : 'unknown')} />
      <Help>{q.egfr.where}</Help>
      <Help label={q.egfr.calc.toggle}>
        {canCalc ? (
          <div className="pt-2">
            <NumberField
              id="creatinine"
              label={q.egfr.calc.label}
              value={creat}
              onChange={setCreat}
              units={CREATININE}
              unit={prefs.creat}
              onUnitChange={(u) => store.setPref('creat', u as 'mgdl' | 'umol')}
              compact
            />
            <p className="text-[13px] text-blood/75">{q.egfr.calc.method}</p>
            {est != null && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="font-medium" aria-live="polite">
                  {q.egfr.calc.result(Math.round(est))}
                </p>
                <Button variant="ghost" className="min-h-10! px-4! text-[14px]!" onClick={() => set('egfr', Math.round(est))}>
                  {q.egfr.calc.use}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p>{q.egfr.calc.needs}</p>
        )}
      </Help>
    </>
  )
}

// ── Review ──────────────────────────────────────────────────────────────

function Review({ a, prefs, h, onEdit }: { a: Answers; prefs: QProps['prefs']; h: string; onEdit: (s: StepId) => void }) {
  const r = q.review
  const yn = (v?: string) => (v === 'yes' ? copy.yes : v === 'no' ? copy.no : v === 'unsure' ? copy.notSure : v === 'skip' ? '—' : r.notAnswered)
  const chol = (v: Answers['totalCholesterol']) =>
    v === 'unknown' ? r.unknown : typeof v === 'number' ? (prefs.chol === 'mmol' ? `${(v * 0.02586).toFixed(2)} mmol/L` : `${Math.round(v)} mg/dL`) : r.notAnswered
  const rows: [StepId, string, string][] = [
    ['symptoms', 'Symptoms now', yn(a.symptoms)],
    ['history', 'Past heart disease', yn(a.history)],
    ['age', 'Age', typeof a.age === 'number' ? `${a.age}` : r.notAnswered],
    ['sex', 'Sex at birth', a.sex === 'female' ? q.sex.female : a.sex === 'male' ? q.sex.male : r.notAnswered],
    ...(a.sex === 'female' ? [['pregnant', 'Pregnant', yn(a.pregnant)] as [StepId, string, string]] : []),
    ['sbp', 'Systolic blood pressure', typeof a.sbp === 'number' ? `${a.sbp} mmHg` : a.sbp === 'unknown' ? r.unknown : r.notAnswered],
    ['bpTreated', 'Blood pressure medicine', yn(a.bpTreated)],
    ['totalCholesterol', 'Total cholesterol', chol(a.totalCholesterol)],
    ['hdl', 'HDL cholesterol', chol(a.hdl)],
    ['statin', 'Statin', yn(a.statin)],
    ['diabetes', 'Diabetes', yn(a.diabetes)],
    ['smoker', 'Smokes cigarettes', yn(a.smoker)],
    [
      'body',
      'Height & weight',
      typeof a.heightCm === 'number' && typeof a.weightKg === 'number'
        ? prefs.body === 'imperial'
          ? `${length.toFeetInches(a.heightCm).feet} ft ${length.toFeetInches(a.heightCm).inches} in · ${Math.round(mass.toLb(a.weightKg))} lb`
          : `${Math.round(a.heightCm)} cm · ${round(a.weightKg, 1)} kg`
        : a.heightCm === 'unknown'
          ? r.unknown
          : r.notAnswered,
    ],
    ['egfr', 'eGFR', typeof a.egfr === 'number' ? `${a.egfr} mL/min/1.73m²` : a.egfr === 'unknown' ? r.unknown : r.notAnswered],
    ['context', 'South Asian ancestry · early family history', `${yn(a.southAsian)} · ${yn(a.familyHistory)}`],
  ]
  return (
    <>
      <Title id={h} help={r.help}>
        {r.label}
      </Title>
      <dl className="mt-8 divide-y divide-blood/10 border-y border-blood/10">
        {rows.map(([s, k, v]) => (
          <div key={s} className="flex items-center justify-between gap-4 py-3">
            <dt className="text-[14px] text-blood/80">{k}</dt>
            <dd className="flex items-center gap-3 text-right text-[15px] font-medium text-blood">
              {v}
              <button type="button" onClick={() => onEdit(s)} className="rounded-pill border border-blood/15 px-3 py-1 text-[12px] font-medium text-blood hover:border-signal" aria-label={`${r.edit} ${k}`}>
                {r.edit}
              </button>
            </dd>
          </div>
        ))}
      </dl>
    </>
  )
}

// ── Block screens ───────────────────────────────────────────────────────

function BlockScreen({ reason, onClose }: { reason: Exclude<BlockReason, 'incomplete'>; onClose: () => void }) {
  const b = blocks[reason]
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  const urgent = reason === 'symptoms'

  const secondary = () => {
    switch (reason) {
      case 'symptoms':
        store.setAnswer('symptoms', undefined)
        return onClose()
      case 'history':
        store.setAnswer('history', undefined)
        return onClose()
      default:
        return undefined
    }
  }

  return (
    <div
      role={urgent ? 'alertdialog' : 'region'}
      aria-labelledby="block-h"
      className={`relative w-full max-w-3xl p-6 md:p-12 ${urgent ? 'rounded-[var(--r-glass)] bg-crimson text-white shadow-[0_40px_80px_-30px_rgba(158,0,18,0.8)]' : 'glass-card'}`}
      style={{ viewTransitionName: 'q-card' }}
    >
      <p className={`micro font-medium ${urgent ? 'text-white' : 'text-blood'}`}>{urgent ? 'Important' : 'Before we go on'}</p>
      <h1 id="block-h" ref={heading} tabIndex={-1} className="mt-6 max-w-[20ch] text-[clamp(2rem,5vw,3.6rem)] font-medium leading-[1.02] tracking-[-0.035em] outline-none">
        {b.title}
      </h1>
      {b.body.map((p) => (
        <p key={p} className={`mt-5 max-w-2xl text-[17px] leading-relaxed ${urgent ? 'text-white' : 'text-blood/85'}`}>
          {p}
        </p>
      ))}
      <div className="mt-10 flex flex-wrap gap-3">
        {reason === 'symptoms' ? (
          <a href="tel:911" className="inline-flex min-h-14 items-center rounded-pill bg-white px-8 text-lg font-semibold text-crimson hover:bg-blush">
            {b.primary}
          </a>
        ) : reason === 'history' ? (
          <Link href="/method/#validity" className="inline-flex min-h-12 items-center rounded-pill bg-signal px-7 font-medium text-white hover:bg-ink-red">
            {b.primary}
          </Link>
        ) : (
          <Button
            onClick={() => {
              if (reason === 'sbp_unknown') store.setAnswer('sbp', undefined)
              if (reason === 'pregnancy') store.setAnswer('pregnant', undefined)
              if (reason === 'age') store.setAnswer('age', undefined)
              onClose()
            }}
          >
            {b.primary}
          </Button>
        )}
        {b.secondary &&
          (reason === 'symptoms' || reason === 'history' ? (
            <button type="button" onClick={secondary} className={`inline-flex min-h-12 items-center rounded-pill border px-6 font-medium ${urgent ? 'border-white/70 text-white hover:bg-white/10' : 'border-blood/20 text-blood'}`}>
              {b.secondary}
            </button>
          ) : (
            <Link href={reason === 'age' ? '/method/' : '/'} className="inline-flex min-h-12 items-center rounded-pill border border-blood/20 px-6 font-medium text-blood hover:border-signal">
              {b.secondary}
            </Link>
          ))}
      </div>
    </div>
  )
}
