'use client'

/**
 * Input primitives for the assessment: choice pills (native radios), a
 * number field with synced slider and unit toggle, and a help disclosure.
 */
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { assess as copy } from '@/content/copy'
import type { Range } from '@/lib/risk/ranges'

// ── Choice ──────────────────────────────────────────────────────────────

export interface Option<T extends string> {
  value: T
  label: string
}

export function Choice<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  onPick,
  size = 'lg',
  describedBy,
  labelledBy,
}: {
  name: string
  labelledBy?: string
  legend?: string
  options: Option<T>[]
  value: T | undefined
  onChange: (v: T) => void
  /** Called after a pointer pick (not keyboard) — used to auto-advance. */
  onPick?: () => void
  size?: 'lg' | 'sm'
  describedBy?: string
}) {
  return (
    <fieldset aria-describedby={describedBy} aria-labelledby={legend ? undefined : labelledBy}>
      {legend && <legend className="mb-3 text-[15px] font-medium text-blood">{legend}</legend>}
      <div className={`flex flex-wrap gap-2.5 ${size === 'lg' ? 'md:gap-3' : ''}`}>
        {options.map((o) => {
          const checked = value === o.value
          return (
            <label
              key={o.value}
              className={`group relative inline-flex cursor-pointer select-none items-center rounded-pill border transition-[background-color,border-color,color,box-shadow] duration-300 ease-[var(--e-expo)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-blood ${
                size === 'lg' ? 'min-h-14 px-7 text-[17px]' : 'min-h-11 px-5 text-[15px]'
              } ${
                checked
                  ? 'border-signal bg-signal text-white shadow-[0_14px_30px_-16px_rgba(227,0,15,0.9)]'
                  : 'border-blood/20 bg-white/70 text-blood hover:border-signal/60'
              }`}
              onClick={(e) => {
                // Pointer clicks produce detail ≥ 1; keyboard-triggered clicks are 0.
                if (e.detail > 0 && onPick) setTimeout(onPick, 380)
              }}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <span aria-hidden className={`mr-2.5 inline-block h-2 w-2 rounded-full transition-colors ${checked ? 'bg-white' : 'bg-blood/25 group-hover:bg-signal/60'}`} />
              {o.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

// ── Number with slider and units ────────────────────────────────────────

export interface UnitSpec {
  id: string
  label: string
  /** canonical → display */
  toDisplay: (v: number) => number
  /** display → canonical */
  toCanonical: (v: number) => number
  decimals: number
  step: number
  slider: Range
  plausible: Range
  /** Model range in display units (already rounded inward). */
  model?: Range
}

const fmt = (v: number, dp: number) => (Number.isFinite(v) ? v.toFixed(dp).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1') : '')

export function NumberField({
  id,
  label,
  value,
  onChange,
  units,
  unit,
  onUnitChange,
  describedBy,
  autoFocus,
  compact = false,
}: {
  id: string
  label: string
  value: number | undefined
  onChange: (canonical: number | undefined) => void
  units: UnitSpec[]
  unit: string
  onUnitChange?: (id: string) => void
  describedBy?: string
  autoFocus?: boolean
  compact?: boolean
}) {
  const spec = units.find((u) => u.id === unit) ?? units[0]!
  const [text, setText] = useState(value !== undefined ? fmt(spec.toDisplay(value), spec.decimals) : '')
  const [error, setError] = useState<string | null>(null)
  const errId = useId()
  const warnId = useId()
  const lastUnit = useRef(unit)
  /** The last canonical value this field emitted; anything else came from outside. */
  const emitted = useRef<number | undefined>(value)

  useEffect(() => {
    if (lastUnit.current !== unit || value !== emitted.current) {
      lastUnit.current = unit
      emitted.current = value
      setText(value !== undefined ? fmt(spec.toDisplay(value), spec.decimals) : '')
      setError(null)
    }
  }, [unit, value, spec])

  const emit = (v: number | undefined) => {
    emitted.current = v
    onChange(v)
  }

  const commit = (raw: string) => {
    setText(raw)
    if (raw.trim() === '') {
      setError(null)
      emit(undefined)
      return
    }
    const n = Number(raw.replace(',', '.'))
    if (!Number.isFinite(n)) {
      setError(copy.requiredNumber)
      emit(undefined)
      return
    }
    if (n < spec.plausible.min || n > spec.plausible.max) {
      setError(copy.implausible(spec.plausible.min, spec.plausible.max, spec.label))
      emit(undefined)
      return
    }
    setError(null)
    emit(spec.toCanonical(n))
  }

  const display = value !== undefined ? spec.toDisplay(value) : undefined
  const outOfModel =
    spec.model && display !== undefined && !error && (display < spec.model.min - 1e-9 || display > spec.model.max + 1e-9)
  const sliderVal = display ?? (spec.slider.min + spec.slider.max) / 2
  const fill = ((Math.min(Math.max(sliderVal, spec.slider.min), spec.slider.max) - spec.slider.min) / (spec.slider.max - spec.slider.min)) * 100
  const described = [describedBy, error ? errId : null, outOfModel ? warnId : null].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <div className="flex items-baseline gap-2 border-b-2 border-blood/15 pb-1 focus-within:border-signal">
          <input
            id={id}
            type="text"
            inputMode={spec.decimals > 0 ? 'decimal' : 'numeric'}
            autoComplete="off"
            enterKeyHint="next"
            value={text}
            autoFocus={autoFocus}
            onChange={(e) => commit(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={described}
            placeholder="—"
            className={`w-[4.2ch] bg-transparent font-medium tracking-[-0.04em] text-blood tabular outline-none [box-shadow:none]! placeholder:text-blood/20 ${
              compact ? 'text-[clamp(2.4rem,7vw,3.6rem)]' : 'text-[clamp(3.4rem,11vw,6rem)]'
            } leading-none`}
            style={{ width: `${Math.max(3, text.length + 0.6)}ch` }}
          />
          {units.length === 1 && <span className="pb-2 text-[15px] text-blood/80">{spec.label}</span>}
        </div>
        {units.length > 1 && (
          <div role="radiogroup" aria-label="Units" className="mb-2 inline-flex rounded-pill border border-blood/15 bg-white/70 p-1">
            {units.map((u) => (
              <button
                key={u.id}
                type="button"
                role="radio"
                aria-checked={u.id === unit}
                onClick={() => onUnitChange?.(u.id)}
                className={`rounded-pill px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-300 ${
                  u.id === unit ? 'bg-blood text-white' : 'text-blood hover:bg-white'
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <input
        type="range"
        className="range mt-6"
        min={spec.slider.min}
        max={spec.slider.max}
        step={spec.step}
        value={Math.min(Math.max(sliderVal, spec.slider.min), spec.slider.max)}
        onChange={(e) => commit(fmt(Number(e.target.value), spec.decimals))}
        aria-label={`${label} (${spec.label})`}
        aria-valuetext={display !== undefined ? `${fmt(display, spec.decimals)} ${spec.label}` : 'Not set'}
        style={{ ['--fill' as string]: `${fill}%` }}
        tabIndex={0}
      />
      <div className="mt-1 flex justify-between text-[12px] text-blood/70 tabular" aria-hidden>
        <span>{spec.slider.min}</span>
        <span>{spec.slider.max}</span>
      </div>

      <div aria-live="polite" className="min-h-6">
        {error && (
          <p id={errId} className="mt-3 text-[14px] font-medium text-blood">
            <span aria-hidden className="mr-2 inline-block h-2 w-2 translate-y-[-1px] bg-signal" />
            {error}
          </p>
        )}
        {outOfModel && spec.model && (
          <p id={warnId} className="mt-3 text-[14px] text-blood">
            <span aria-hidden className="mr-2 inline-block h-2 w-2 translate-y-[-1px] bg-signal" />
            {copy.outOfModel(`${fmt(spec.model.min, spec.decimals)} ${spec.label}`, `${fmt(spec.model.max, spec.decimals)} ${spec.label}`)}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Help disclosure ─────────────────────────────────────────────────────

export function Help({ label = copy.whereToFind, children }: { label?: string; children: ReactNode }) {
  return (
    <details className="group mt-5 rounded-2xl border border-blood/10 bg-white/60 px-4 py-3 open:bg-white/80">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-medium text-blood [&::-webkit-details-marker]:hidden">
        {label}
        <span aria-hidden className="text-lg leading-none transition-transform duration-300 group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="mt-2 text-[14px] leading-relaxed text-blood/85">{children}</div>
    </details>
  )
}

export function UnknownButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`mt-2 inline-flex min-h-11 items-center gap-2 rounded-pill border px-4 text-[14px] font-medium transition-colors duration-300 ${
        active ? 'border-blood bg-blood text-white' : 'border-blood/20 bg-white/60 text-blood hover:border-blood/50'
      }`}
    >
      <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${active ? 'bg-white' : 'bg-blood/30'}`} />
      {label}
    </button>
  )
}
