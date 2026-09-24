'use client'

import { useEffect, useRef, useState } from 'react'
import { results as copy, reasons } from '@/content/copy'
import type { Prefs } from '@/lib/answers-store'
import { prefersReducedMotion } from '@/hooks/use-media'
import { CATEGORY_ORDER, type Category } from '@/lib/risk/categories'
import type { Assessment, Note } from '@/lib/risk/assess'
import type { Band, FactorCheck } from '@/lib/risk/factors'
import type { HeartAge } from '@/lib/risk/framingham'
import type { ClinicalInput, Computed, NotComputableReason } from '@/lib/risk/types'
import { cholesterol, round } from '@/lib/risk/units'
import { gsap } from '@/lib/gsap'

export const pct = (v: number) => `${round(v, 1).toFixed(1)}%`

/** Giant count-up number (ref 1's "0"). Screen readers get the final value only. */
export function GiantNumber({ value, run, className = '' }: { value: number; run: boolean; className?: string }) {
  const el = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(run ? 0 : value)
  const final = round(value, 1)

  useEffect(() => {
    if (!run) return
    if (prefersReducedMotion()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShown(final)
      return
    }
    const o = { v: 0 }
    const t = gsap.to(o, { v: final, duration: 1.6, ease: 'expo.out', onUpdate: () => setShown(o.v) })
    return () => {
      t.kill()
    }
  }, [final, run])

  const [int, dec] = round(shown, 1).toFixed(1).split('.')
  return (
    <span className={`relative inline-flex items-start leading-none ${className}`}>
      <span className="sr-only">{`${final.toFixed(1)} percent`}</span>
      <span ref={el} aria-hidden className="tabular">
        {int}
        <span className="text-[0.42em] align-top">.{dec}</span>
      </span>
      <span aria-hidden className="ml-[0.04em] mt-[0.08em] text-[0.3em] font-normal">
        %
      </span>
    </span>
  )
}

/** Plain-language reasons a value couldn't be computed. */
export function ReasonList({ c }: { c: Computed }) {
  if (c.status === 'ok') return null
  const unique = Array.from(new Set(c.reasons)) as NotComputableReason[]
  return (
    <ul className="mt-1 text-[13px] leading-snug text-blood/80">
      {unique.map((r) => (
        <li key={r}>{reasons[r]}</li>
      ))}
    </ul>
  )
}

const GLYPH: Record<Category, string> = { low: '▁', borderline: '▃', intermediate: '▅', high: '▇' }
const SHADE: Record<Category, string> = {
  low: 'bg-blush-deep',
  borderline: 'bg-[#f08791]',
  intermediate: 'bg-signal',
  high: 'bg-crimson',
}

/** Where a value sits on the four-band scale (equal-width bands). */
export function scalePosition(v: number): number {
  const bands: [number, number][] = [
    [0, 3],
    [3, 5],
    [5, 10],
    [10, 30],
  ]
  for (let i = 0; i < bands.length; i++) {
    const [lo, hi] = bands[i]!
    if (v < hi || i === bands.length - 1) return (i + Math.min(1, Math.max(0, (v - lo) / (hi - lo)))) / bands.length
  }
  return 1
}

/**
 * Category scale. Risk level is conveyed by label, position, a glyph and the
 * band's name — never by colour alone.
 */
export function CategoryScale({ value, category }: { value: number; category: Category }) {
  const pos = scalePosition(round(value, 1))
  return (
    <figure aria-label={`Risk category: ${copy.categories[category].name}, ${pct(value)}`}>
      <div className="relative">
        <div className="flex h-3 overflow-hidden rounded-pill" aria-hidden>
          {CATEGORY_ORDER.map((c) => (
            <div key={c} className={`flex-1 ${SHADE[c]} ${c === category ? '' : 'opacity-45'} border-r border-white last:border-r-0`} />
          ))}
        </div>
        <div className="absolute -top-2 h-7 w-[3px] -translate-x-1/2 rounded-full bg-blood shadow-[0_0_0_3px_white]" style={{ left: `${pos * 100}%` }} aria-hidden />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1 text-[12px]" aria-hidden>
        {CATEGORY_ORDER.map((c) => (
          <div key={c} className={c === category ? 'font-semibold text-blood' : 'text-blood/70'}>
            <span className="mr-1 font-mono">{GLYPH[c]}</span>
            {copy.categories[c].name}
            <div className="text-[11px] font-normal text-blood/70">{copy.categories[c].range}</div>
          </div>
        ))}
      </div>
    </figure>
  )
}

export function HeartAgePair({ age, heart }: { age: number; heart: HeartAge }) {
  const h = copy.heartAge
  if (heart.status !== 'ok') {
    return <p className="text-[15px] text-blood/80">{h.unavailable}</p>
  }
  const shown = heart.bound === 'below' ? h.below : heart.bound === 'above' ? h.above : String(Math.round(heart.value))
  const diff = Math.round(heart.value) - age
  const message =
    heart.bound === 'above'
      ? h.olderAtLeast(Math.max(diff, 1))
      : diff > 0
        ? h.older(diff)
        : heart.bound === 'below'
          ? age === 30
            ? h.same
            : h.younger(Math.abs(diff))
          : diff < 0
            ? h.younger(Math.abs(diff))
            : h.same
  return (
    <div>
      <div className="flex items-end gap-6 md:gap-10" role="img" aria-label={`${h.yourAge} ${age}. ${h.heartAge} ${shown}.`}>
        <div>
          <p className="micro text-blood/80">{h.yourAge}</p>
          <p className="pixel text-[clamp(3.5rem,9vw,7rem)] leading-none text-blood">{age}</p>
        </div>
        <svg aria-hidden viewBox="0 0 40 16" className="mb-5 h-4 w-10 text-signal">
          <path d="M0 8h36M30 2l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        <div>
          <p className="micro text-blood">{h.heartAge}</p>
          <p className={`pixel whitespace-nowrap leading-none text-crimson ${shown.length > 3 ? 'text-[clamp(1.6rem,3.4vw,2.6rem)]' : 'text-[clamp(3.5rem,9vw,7rem)]'}`}>{shown}</p>
        </div>
      </div>
      <p className="mt-5 text-[17px] font-medium text-blood">{message}</p>
      <p className="mt-2 text-[13px] text-blood/75">{h.method}</p>
    </div>
  )
}

// ── Guideline check ─────────────────────────────────────────────────────

const BAND_GLYPH: Record<Band, string> = { healthy: '✓', watch: '!', high: '▲', unknown: '?', not_assessed: '–' }
const BAND_STYLE: Record<Band, string> = {
  healthy: 'bg-blush text-blood',
  watch: 'bg-[#fcd2d6] text-blood',
  high: 'bg-crimson text-white',
  unknown: 'border border-blood/25 text-blood',
  not_assessed: 'border border-blood/25 text-blood/80',
}

/** A band is always a glyph plus words; colour only reinforces it. */
export function BandBadge({ band }: { band: Band }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill px-2.5 py-1 text-[12px] font-semibold ${BAND_STYLE[band]}`}>
      <span aria-hidden>{BAND_GLYPH[band]}</span>
      {copy.factors.bands[band]}
    </span>
  )
}

/** Formats a factor's value in the person's own units. */
export function factorValue(f: FactorCheck, chol: Prefs['chol']): string {
  if (f.value == null) return f.id === 'smoking' || f.id === 'diabetes' ? '' : copy.factors.notGiven
  switch (f.id) {
    case 'bp':
      return `${Math.round(f.value)} mmHg`
    case 'totalCholesterol':
    case 'nonHdl':
    case 'hdl':
      return chol === 'mmol' ? `${cholesterol.toMmol(f.value).toFixed(2)} mmol/L` : `${Math.round(f.value)} mg/dL`
    case 'bmi':
      return `${round(f.value, 1).toFixed(1)} kg/m²`
    case 'egfr':
      return `${Math.round(f.value)} mL/min/1.73m²`
    default:
      return ''
  }
}

/** The guideline cut-off sentence for one factor. */
export function factorTarget(f: FactorCheck, input: ClinicalInput, chol: Prefs['chol']): string {
  const F = copy.factors
  if (f.band === 'not_assessed') return F.notAssessed[f.reason!]
  if (f.band === 'unknown') return F.unknown
  const c = (mg: number) => (chol === 'mmol' ? `${cholesterol.toMmol(mg).toFixed(1)} mmol/L` : `${mg} mg/dL`)
  const young = input.age < 20
  switch (f.id) {
    case 'bp':
      return F.target.bp()
    case 'totalCholesterol':
      return F.target.totalCholesterol(young, c)
    case 'nonHdl':
      return F.target.nonHdl(young, c)
    case 'hdl':
      return F.target.hdl(young, c, input.sex === 'female')
    case 'bmi':
      return F.target.bmi()
    case 'egfr':
      return F.target.egfr()
    case 'smoking':
      return F.target.smoking(input.smoker)
    case 'diabetes':
      return F.target.diabetes(input.diabetes)
  }
}

/** A note's text; a guideline check (no equation behind it) has its own wording for some. */
export const noteText = (a: Exclude<Assessment, { kind: 'blocked' }>, n: Note) =>
  (a.kind === 'factors' ? (copy.factors.notes as Partial<Record<Note, string>>)[n] : undefined) ?? copy.notes[n]
