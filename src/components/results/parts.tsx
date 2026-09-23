'use client'

import { useEffect, useRef, useState } from 'react'
import { results as copy, reasons } from '@/content/copy'
import { prefersReducedMotion } from '@/hooks/use-media'
import { CATEGORY_ORDER, type Category } from '@/lib/risk/categories'
import type { HeartAge } from '@/lib/risk/framingham'
import type { Computed, NotComputableReason } from '@/lib/risk/types'
import { round } from '@/lib/risk/units'
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
          <p className="micro text-crimson">{h.heartAge}</p>
          <p className={`pixel whitespace-nowrap leading-none text-signal ${shown.length > 3 ? 'text-[clamp(1.6rem,3.4vw,2.6rem)]' : 'text-[clamp(3.5rem,9vw,7rem)]'}`}>{shown}</p>
        </div>
      </div>
      <p className="mt-5 text-[17px] font-medium text-blood">{message}</p>
      <p className="mt-2 text-[13px] text-blood/75">{h.method}</p>
    </div>
  )
}
