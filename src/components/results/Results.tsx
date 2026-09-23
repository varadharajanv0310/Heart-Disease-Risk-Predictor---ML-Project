'use client'

/**
 * Results: the giant number, what it means, what drives it, and what would
 * move it. Everything is recomputed from local answers on this device.
 */
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { blocks, calculating as calcCopy, results as copy } from '@/content/copy'
import { type Prefs, store, useHydrated, useStored } from '@/lib/answers-store'
import { gsap } from '@/lib/gsap'
import { encodeReport } from '@/lib/report-link'
import { type Answers, type Assessment, assess } from '@/lib/risk/assess'
import { NO_CHANGE, type WhatIf, applyWhatIf, whatIfLimits } from '@/lib/risk/drivers'
import { heartAge as heartAgeOf } from '@/lib/risk/framingham'
import { preventRisk } from '@/lib/risk/prevent'
import type { ClinicalInput, Computed } from '@/lib/risk/types'
import { round } from '@/lib/risk/units'
import { prefersReducedMotion } from '@/hooks/use-media'
import { setScene } from '@/lib/scene-store'
import { Arrow, ButtonLink } from '../ui/Button'
import { Frame } from '../ui/Frame'
import { QrCode } from '../ui/QrCode'
import { CategoryScale, GiantNumber, HeartAgePair, ReasonList, pct } from './parts'

/** Risk % → scene intensity: calm & bright at ~1%, deep & heavy by ~30%. */
export const intensityFor = (risk: number) => Math.min(1, Math.max(0, Math.log(Math.max(risk, 1)) / Math.log(30)))

function useCalculating(key: string, enabled: boolean) {
  const [phase, setPhase] = useState<'calc' | 'done'>('done')
  useEffect(() => {
    if (!enabled) return
    let seen = false
    try {
      seen = sessionStorage.getItem('focal.revealed') === key
    } catch {
      /* ignore */
    }
    if (seen) {
      setScene({ mode: 'results', blur: 0.9 })
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase('calc')
    const reduced = prefersReducedMotion()
    setScene({ mode: 'calculating', blur: 1 })
    const b = { v: 1 }
    const tween = gsap.to(b, {
      v: 0,
      duration: reduced ? 0.3 : 1.7,
      ease: 'power2.inOut',
      onUpdate: () => setScene({ blur: b.v }),
      onComplete: () => {
        try {
          sessionStorage.setItem('focal.revealed', key)
        } catch {
          /* ignore */
        }
        setPhase('done')
        setScene({ mode: 'results', blur: 0.9 })
      },
    })
    return () => {
      tween.kill()
    }
  }, [key, enabled])
  return phase
}

export function Results() {
  const hydrated = useHydrated()
  const { answers, prefs } = useStored()
  const a = useMemo(() => assess(answers), [answers])
  const key = useMemo(() => JSON.stringify(answers), [answers])
  const phase = useCalculating(key, hydrated && a.kind !== 'blocked')

  useEffect(() => {
    if (a.kind === 'prevent' && a.headline.status === 'ok') setScene({ intensity: intensityFor(a.headline.value) })
    else if (a.kind === 'estimate' && a.estimate.status === 'ok') setScene({ intensity: intensityFor(a.estimate.value) })
    else setScene({ mode: 'quiet', blur: 0.8, intensity: 0.3 })
  }, [a])

  if (!hydrated) return <div className="min-h-[100svh]" aria-busy="true" />

  if (a.kind === 'blocked') return <Empty reason={a.reason} />
  if (phase === 'calc') return <Calculating />
  return a.kind === 'prevent' ? <PreventResults a={a} answers={answers} prefs={prefs} /> : <EstimateResults a={a} answers={answers} prefs={prefs} />
}

// ── Calculating ─────────────────────────────────────────────────────────


function Calculating() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, calcCopy.lines.length - 1)), 560)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center gap-6 text-center" role="status" aria-live="polite">
      <span className="sr-only">{calcCopy.sr}</span>
      <span aria-hidden className="beat inline-block h-3 w-3 rounded-full bg-signal" />
      <p aria-hidden className="pixel rounded-pill bg-white/90 px-3 py-1.5 text-[13px] text-crimson">
        {calcCopy.lines[i]}
      </p>
    </div>
  )
}

// ── Empty & blocked ─────────────────────────────────────────────────────

function Empty({ reason }: { reason: Exclude<Assessment, { kind: 'prevent' } | { kind: 'estimate' }>['reason'] }) {
  const b = reason !== 'incomplete' ? blocks[reason] : null
  useEffect(() => setScene({ mode: 'quiet', blur: 0.8 }), [])
  return (
    <div className="gutter flex min-h-[100svh] items-center justify-center pt-24">
      <div className={`${reason === 'symptoms' ? 'bg-crimson text-white rounded-[var(--r-glass)]' : 'glass-card'} w-full max-w-2xl p-8 md:p-12`}>
        <p className="micro font-medium">{copy.eyebrow}</p>
        <h1 className="mt-5 text-[clamp(2rem,5vw,3.4rem)] font-medium leading-[1.02] tracking-[-0.035em]">{b ? b.title : copy.empty.title}</h1>
        <p className="mt-4 text-[17px] leading-relaxed opacity-90">{b ? b.body[0] : copy.empty.body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {reason === 'symptoms' ? (
            <a href="tel:911" className="inline-flex min-h-14 items-center rounded-pill bg-white px-8 text-lg font-semibold text-crimson">
              {blocks.symptoms.primary}
            </a>
          ) : (
            <ButtonLink href="/check/">
              {copy.empty.cta}
              <Arrow />
            </ButtonLink>
          )}
        </div>
      </div>
    </div>
  )
}

// ── PREVENT results ─────────────────────────────────────────────────────

type PreventA = Extract<Assessment, { kind: 'prevent' }>

function PreventResults({ a, answers, prefs }: { a: PreventA; answers: Answers; prefs: Prefs }) {
  const [whatIf, setWhatIf] = useState<WhatIf>(NO_CHANGE)
  const h = a.headline
  const cat = a.category

  return (
    <div className="pb-10">
      {/* Hero: the giant number inside a hairline frame (ref 1). */}
      <section className="gutter flex min-h-[100svh] flex-col pb-4 pt-20 md:pb-6 md:pt-24" aria-labelledby="result-h">
        <Frame
          className="flex flex-1 flex-col justify-center"
          tl={[copy.label, copy.outcome]}
          tr={['Model', copy.model]}
          bl={cat ? [copy.categoryLabel, copy.categories[cat].name] : undefined}
          br={a.heartAge.status === 'ok' ? [copy.heartAge.heartAge, a.heartAge.bound === 'above' ? copy.heartAge.above : a.heartAge.bound === 'below' ? copy.heartAge.below : String(Math.round(a.heartAge.value))] : undefined}
        >
          <div className="relative isolate px-4 py-24 text-center md:px-10">
            {/* Ref 1's pale centre: keeps the red number legible over the ring. */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[min(78vmin,700px)] w-[min(118vmin,1040px)] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.92),rgba(255,244,245,0.6)_58%,rgba(255,255,255,0))]"
            />
            <h1 id="result-h" className="sr-only">
              {`${copy.label} ${copy.outcome}`}
            </h1>
            {h.status === 'ok' ? (
              <>
                <GiantNumber value={h.value} run className="text-[clamp(8rem,30vw,26rem)] font-normal tracking-[-0.06em] text-signal" />
                <p className="mx-auto mt-6 max-w-xl text-[clamp(1.05rem,1.6vw,1.35rem)] leading-snug text-blood">{copy.frequency(h.value)}</p>
                {cat && (
                  <p className="mt-5 inline-flex items-center gap-2 rounded-pill bg-blood px-4 py-2 text-[14px] font-medium text-white">
                    <span className="pixel text-[11px] text-[#ff8a96]">{copy.categoryLabel}</span>
                    {copy.categories[cat].name}
                  </p>
                )}
              </>
            ) : (
              <NotComputable c={h} />
            )}
          </div>
        </Frame>
      </section>

      <p className="gutter mx-auto mt-2 max-w-4xl text-center text-[13px] text-blood/80">{copy.disclaimer}</p>

      {h.status === 'ok' && cat && (
        <section className="gutter mx-auto mt-20 grid max-w-6xl gap-4 md:grid-cols-2" aria-label="What your number means">
          <div className="glass-card p-7 md:p-10">
            <h2 className="micro font-medium text-blood">{copy.categoryLabel}</h2>
            <p className="mt-4 text-[clamp(1.8rem,3.4vw,2.6rem)] font-medium tracking-[-0.03em]">{copy.categories[cat].name}</p>
            <p className="mt-3 text-[16px] leading-relaxed text-blood/85">{copy.categories[cat].text}</p>
            <div className="mt-8">
              <CategoryScale value={h.value} category={cat} />
            </div>
            <p className="mt-4 text-[12px] text-blood/70">{copy.categorySource}</p>
          </div>
          <div className="glass-card p-7 md:p-10">
            <h2 className="micro font-medium text-blood">{copy.heartAge.title}</h2>
            <div className="mt-6">
              <HeartAgePair age={a.input.age} heart={a.heartAge} />
            </div>
          </div>
        </section>
      )}

      <Horizons a={a} />
      {a.drivers && <Drivers a={a} />}
      {h.status === 'ok' && <WhatIfPanel input={a.input} value={whatIf} onChange={setWhatIf} baseRisk={h.value} />}
      <Notes a={a} />
      <NextSteps input={a.input} category={cat} />
      <Actions answers={answers} prefs={prefs} />
    </div>
  )
}

function NotComputable({ c }: { c: Computed }) {
  return (
    <div className="mx-auto max-w-xl">
      <p className="pixel text-[clamp(4rem,12vw,8rem)] leading-none text-signal" aria-hidden>
        —
      </p>
      <p className="mt-6 text-2xl font-medium">{copy.notComputable.title}</p>
      <p className="mt-2 text-blood/85">{copy.notComputable.body}</p>
      <div className="mt-3 inline-block text-left">
        <ReasonList c={c} />
      </div>
      <div className="mt-6">
        <ButtonLink href="/check/" variant="ghost">
          {copy.notComputable.fix}
        </ButtonLink>
      </div>
    </div>
  )
}

function Horizons({ a }: { a: PreventA }) {
  const t = copy.table
  const cell = (c: Computed) =>
    c.status === 'ok' ? (
      <span className="text-[clamp(1.4rem,2.6vw,2rem)] font-medium tracking-[-0.03em] tabular">{pct(c.value)}</span>
    ) : (
      <span>
        <span className="text-[14px] font-medium text-blood">{t.notComputable}</span>
        <ReasonList c={c} />
      </span>
    )
  return (
    <section className="gutter mx-auto mt-4 max-w-6xl" aria-labelledby="horizons-h">
      <div className="glass-card overflow-x-auto p-7 md:p-10">
        <h2 id="horizons-h" className="micro font-medium text-blood">
          {t.title}
        </h2>
        <table className="mt-6 w-full min-w-[520px] border-collapse text-left">
          <thead>
            <tr className="border-b border-blood/15 text-[12px] uppercase tracking-[0.08em] text-blood/80">
              <th scope="col" className="py-3 pr-4 font-medium">
                <span className="sr-only">Outcome</span>
              </th>
              <th scope="col" className="py-3 pr-4 font-medium">
                {t.tenYear}
              </th>
              <th scope="col" className="py-3 font-medium">
                {t.thirtyYear}
              </th>
            </tr>
          </thead>
          <tbody>
            {(['ascvd', 'cvd', 'hf'] as const).map((o) => (
              <tr key={o} className="border-b border-blood/10 align-top last:border-0">
                <th scope="row" className="py-5 pr-4 font-normal">
                  <span className="block text-[16px] font-semibold">{t.rows[o]}</span>
                  <span className="block text-[13px] text-blood/75">{t.rowsSub[o]}</span>
                </th>
                <td className="py-5 pr-4">{cell(a.prevent.tenYear[o])}</td>
                <td className="py-5">{cell(a.prevent.thirtyYear[o])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Drivers({ a }: { a: PreventA }) {
  const d = a.drivers!
  const max = Math.max(...d.items.map((i) => i.reduction), 0.1)
  const D = copy.drivers
  return (
    <section className="gutter mx-auto mt-4 max-w-6xl" aria-labelledby="drivers-h">
      <div className="glass-card p-7 md:p-10">
        <h2 id="drivers-h" className="text-[clamp(1.6rem,3vw,2.4rem)] font-medium tracking-[-0.03em]">
          {D.title}
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-blood/85">{D.body}</p>
        {d.items.length === 0 ? (
          <p className="mt-6 font-medium">{D.none}</p>
        ) : (
          <ul className="mt-8 grid gap-5">
            {d.items.map((i) => (
              <li key={i.id} className="grid gap-2 md:grid-cols-[12rem_1fr_8rem] md:items-center md:gap-6">
                <div>
                  <p className="font-semibold">{D.labels[i.id]}</p>
                  <p className="text-[12px] text-blood/75">{D.modifiable[i.modifiable]}</p>
                </div>
                <div className="relative h-3 rounded-pill bg-blood/10" aria-hidden>
                  <div className="absolute inset-y-0 left-0 rounded-pill bg-signal" style={{ width: `${(i.reduction / max) * 100}%` }} />
                </div>
                <p className="text-[14px] md:text-right">
                  <span className="font-semibold tabular">−{round(i.reduction, 1).toFixed(1)} pts</span>
                  <span className="block text-[12px] text-blood/75">
                    {D.detail[i.id]}: {pct(i.ifHealthy)}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-blood/10 pt-5">
          <p className="font-semibold">{D.baseline(pct(d.baseline))}</p>
          <p className="text-[14px] text-blood/80">{D.baselineNote}</p>
        </div>
      </div>
    </section>
  )
}

function WhatIfPanel({ input, value, onChange, baseRisk }: { input: ClinicalInput; value: WhatIf; onChange: (w: WhatIf) => void; baseRisk: number }) {
  const lim = whatIfLimits(input)
  const W = copy.whatIf
  const changed = applyWhatIf(input, value)
  const r = preventRisk(changed, 'ascvd', 10)
  const newRisk = r.status === 'ok' ? r.value : baseRisk
  const ha = heartAgeOf(changed)
  const hasLevers = lim.canQuit || lim.maxSbpDrop > 0 || lim.maxLdlDrop > 0

  useEffect(() => {
    setScene({ intensity: intensityFor(newRisk) })
  }, [newRisk])

  return (
    <section className="gutter mx-auto mt-4 max-w-6xl" aria-labelledby="whatif-h">
      <div className="glass-card grid gap-10 p-7 md:grid-cols-2 md:p-10">
        <div>
          <h2 id="whatif-h" className="text-[clamp(1.6rem,3vw,2.4rem)] font-medium tracking-[-0.03em]">
            {W.title}
          </h2>
          <p className="mt-3 text-[15px] text-blood/85">{W.body}</p>
          {!hasLevers ? (
            <p className="mt-6 font-medium">{W.noLevers}</p>
          ) : (
            <div className="mt-8 grid gap-8">
              {lim.canQuit && (
                <label className="flex cursor-pointer items-center justify-between gap-4">
                  <span className="font-medium">{W.quit}</span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={value.quitSmoking}
                    onChange={(e) => onChange({ ...value, quitSmoking: e.target.checked })}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="relative h-8 w-14 shrink-0 rounded-pill bg-blood/15 transition-colors duration-300 peer-checked:bg-signal peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-blood after:absolute after:left-1 after:top-1 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-300 after:ease-[var(--e-expo)] peer-checked:after:translate-x-6"
                  />
                </label>
              )}
              {lim.maxSbpDrop > 0 && (
                <Slider
                  label={W.sbp(value.sbpDrop)}
                  short={W.sbpShort}
                  unit="mmHg"
                  max={lim.maxSbpDrop}
                  value={value.sbpDrop}
                  from={input.sbp ?? 0}
                  onChange={(v) => onChange({ ...value, sbpDrop: v })}
                />
              )}
              {lim.maxLdlDrop > 0 && (
                <Slider
                  label={W.ldl(value.ldlDrop)}
                  short={W.ldlShort}
                  unit="mg/dL"
                  max={lim.maxLdlDrop}
                  value={value.ldlDrop}
                  onChange={(v) => onChange({ ...value, ldlDrop: v })}
                />
              )}
              <button type="button" className="justify-self-start text-[14px] font-medium text-blood underline underline-offset-4" onClick={() => onChange(NO_CHANGE)}>
                {W.reset}
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-between gap-8 rounded-card bg-white/70 p-6 md:p-8" aria-live="polite">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="micro text-blood/80">{W.now}</p>
              <p className="mt-2 text-[clamp(2.4rem,5vw,4rem)] font-medium leading-none tracking-[-0.05em] text-blood/80 tabular">{pct(baseRisk)}</p>
            </div>
            <div>
              <p className="micro text-crimson">{W.then}</p>
              <p className="mt-2 text-[clamp(2.4rem,5vw,4rem)] font-medium leading-none tracking-[-0.05em] text-signal tabular">{pct(newRisk)}</p>
            </div>
          </div>
          <div>
            <p className="text-[16px] leading-snug">{copy.frequency(newRisk)}</p>
            {ha.status === 'ok' && (
              <p className="mt-2 text-[14px] text-blood/80">
                {copy.heartAge.heartAge}: {ha.bound === 'above' ? copy.heartAge.above : ha.bound === 'below' ? copy.heartAge.below : Math.round(ha.value)}
              </p>
            )}
          </div>
          <p className="text-[12px] leading-relaxed text-blood/75">{W.caveat}</p>
        </div>
      </div>
    </section>
  )
}

function Slider({ label, short, unit, max, value, from, onChange }: { label: string; short: string; unit: string; max: number; value: number; from?: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-4">
        <span className="font-medium">{label}</span>
        {from !== undefined && (
          <span className="pixel shrink-0 text-[12px] text-blood tabular">
            {from}→{from - value}
          </span>
        )}
      </span>
      <input
        type="range"
        className="range mt-3"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${value} ${unit} lower ${short}`}
        style={{ ['--fill' as string]: `${(value / max) * 100}%` }}
      />
    </label>
  )
}

function Notes({ a }: { a: PreventA | Extract<Assessment, { kind: 'estimate' }> }) {
  if (!a.notes.length) return null
  return (
    <section className="gutter mx-auto mt-4 max-w-6xl" aria-label="Notes about your result">
      <ul className="grid gap-3 md:grid-cols-2">
        {a.notes.map((n) => (
          <li key={n} className="glass-card flex gap-4 p-6 text-[15px] leading-relaxed [border-radius:28px]">
            <span aria-hidden className="pixel mt-0.5 text-blood">
              !
            </span>
            <span>{copy.notes[n]}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function NextSteps({ input, category }: { input: ClinicalInput; category: PreventA['category'] }) {
  const n = copy.nextSteps
  const nonHdl = input.totalCholesterol != null && input.hdl != null ? input.totalCholesterol - input.hdl : 0
  const items = [
    n.share,
    (input.sbp ?? 0) >= 130 && n.bp,
    input.smoker && n.smoking,
    (nonHdl > 130 || category === 'intermediate' || category === 'high') && n.cholesterol,
    input.diabetes && n.diabetes,
    n.activity,
    (input.bmi ?? 0) >= 25 && n.weight,
    n.sleep,
    n.recheck,
  ].filter(Boolean) as string[]
  return (
    <section className="gutter mx-auto mt-4 max-w-6xl" aria-labelledby="next-h">
      <div className="glass-card p-7 md:p-10">
        <h2 id="next-h" className="text-[clamp(1.6rem,3vw,2.4rem)] font-medium tracking-[-0.03em]">
          {n.title}
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {items.map((t, i) => {
            const [head, ...rest] = t.split(': ')
            return (
              <li key={t} className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-blood/10 pt-4">
                <span className="pixel text-[12px] text-blood">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-[15px] leading-relaxed">
                  {rest.length ? (
                    <>
                      <strong className="font-semibold">{head}:</strong> {rest.join(': ')}
                    </>
                  ) : (
                    t
                  )}
                </p>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

function Actions({ answers, prefs }: { answers: Answers; prefs: Prefs }) {
  const [href, setHref] = useState<string | null>(null)
  const code = useMemo(() => encodeReport(answers, prefs), [answers, prefs])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHref(`${window.location.origin}/report/#${code}`)
  }, [code])
  return (
    <section className="gutter mx-auto mt-4 max-w-6xl" aria-label="Report and next actions">
      <div className="glass-card flex flex-col gap-8 p-7 md:flex-row md:items-center md:justify-between md:p-10">
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/report/#${code}`} data-cursor="Report">
            {copy.actions.report}
            <Arrow />
          </ButtonLink>
          <ButtonLink href="/check/" variant="ghost" onClick={() => store.setStep(0)}>
            {copy.actions.edit}
          </ButtonLink>
          <ButtonLink href="/method/" variant="quiet">
            {copy.actions.method}
          </ButtonLink>
        </div>
        <div className="flex items-end gap-4">
          <div className="max-w-[15rem] text-right">
            <p className="text-[13px] font-semibold">{copy.qr.label}</p>
            <p className="mt-1 text-[12px] leading-snug text-blood/75">{copy.qr.note}</p>
          </div>
          <QrCode value={href} size={132} label="QR code linking to your printable report" />
        </div>
      </div>
      <p className="mt-6 text-center">
        <Link
          href="/check/"
          className="text-[13px] text-blood/75 underline underline-offset-4 hover:text-crimson"
          onClick={() => {
            store.clear()
          }}
        >
          {copy.actions.restart}
        </Link>
      </p>
    </section>
  )
}

// ── Estimate results ────────────────────────────────────────────────────

function EstimateResults({ a, answers, prefs }: { a: Extract<Assessment, { kind: 'estimate' }>; answers: Answers; prefs: Prefs }) {
  const E = copy.estimate
  const missing = a.missing.map((m) => E.missing[m]).join(' and ')
  return (
    <div className="pb-10">
      <section className="gutter flex min-h-[100svh] flex-col pb-4 pt-20 md:pb-6 md:pt-24" aria-labelledby="result-h">
        <Frame className="flex flex-1 flex-col justify-center" tl={[E.label, E.outcome]} tr={['Model', E.models[a.model].split(',')[0]!]}>
          <div className="relative isolate px-4 py-24 text-center md:px-10">
            {/* Ref 1's pale centre: keeps the red number legible over the ring. */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[min(78vmin,700px)] w-[min(118vmin,1040px)] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.92),rgba(255,244,245,0.6)_58%,rgba(255,255,255,0))]"
            />
            <div className="mb-6">
              <p className="inline-flex items-center gap-2 rounded-pill border border-blood/30 bg-white/80 px-4 py-2 text-[13px] font-semibold text-blood">
                <span aria-hidden className="pixel text-crimson">
                  ≈
                </span>
                {E.badge}
              </p>
            </div>
            <h1 id="result-h" className="sr-only">
              {`${E.label} ${E.outcome}`}
            </h1>
            {a.estimate.status === 'ok' ? (
              <GiantNumber value={a.estimate.value} run className="text-[clamp(7rem,26vw,22rem)] font-normal tracking-[-0.06em] text-signal/90" />
            ) : (
              <NotComputable c={a.estimate} />
            )}
            <p className="mx-auto mt-6 max-w-2xl text-[20px] font-medium">{E.title}</p>
            <p className="mx-auto mt-3 max-w-2xl text-[16px] leading-relaxed text-blood/85">{E.body(missing, E.models[a.model])}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/check/" onClick={() => store.setStep(0)}>
                {E.addNumbers}
                <Arrow />
              </ButtonLink>
            </div>
          </div>
        </Frame>
      </section>
      <p className="gutter mx-auto mt-2 max-w-4xl text-center text-[13px] text-blood/80">{copy.disclaimer}</p>
      <section className="gutter mx-auto mt-20 grid max-w-6xl gap-4 md:grid-cols-2">
        <div className="glass-card p-7 md:p-10">
          <h2 className="micro font-medium">How to get your numbers</h2>
          <p className="mt-4 text-[16px] leading-relaxed">{E.getNumbers}</p>
        </div>
        <div className="glass-card p-7 md:p-10">
          <h2 className="micro font-medium">{copy.heartAge.title}</h2>
          <div className="mt-6">
            {a.heartAge ? <HeartAgePair age={a.input.age} heart={a.heartAge} /> : <p className="text-[15px] text-blood/80">{copy.heartAge.unavailable}</p>}
          </div>
        </div>
      </section>
      <Notes a={a} />
      <NextSteps input={a.input} category={null} />
      <Actions answers={answers} prefs={prefs} />
    </div>
  )
}
