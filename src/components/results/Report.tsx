'use client'

/**
 * Printable report. Reads answers from the URL fragment (from the QR code or
 * the results page), falling back to this device's saved answers.
 */
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { brand, disclaimerLine, questions as q, report as copy, reasons, results as rc } from '@/content/copy'
import { type Prefs, useHydrated, useStored } from '@/lib/answers-store'
import { decodeReport, encodeReport } from '@/lib/report-link'
import { type Answers, assess } from '@/lib/risk/assess'
import type { Computed } from '@/lib/risk/types'
import { length, mass, round } from '@/lib/risk/units'
import { setScene } from '@/lib/scene-store'
import { IS_ARTIFACT } from '@/lib/target'
import { Button } from '../ui/Button'
import { QrCode } from '../ui/QrCode'
import { pct } from './parts'

function useReportSource(): { answers: Answers; prefs: Partial<Prefs>; fromLink: boolean } | null {
  const hydrated = useHydrated()
  const stored = useStored()
  const [hash, setHash] = useState<string>('')
  useEffect(() => {
    const read = () => setHash(window.location.hash)
    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [])
  return useMemo(() => {
    if (!hydrated) return null
    const decoded = hash ? decodeReport(hash) : null
    if (decoded) return { ...decoded, fromLink: true }
    return { answers: stored.answers, prefs: stored.prefs, fromLink: false }
  }, [hydrated, hash, stored])
}

const v = (c: Computed) => (c.status === 'ok' ? pct(c.value) : '—')
const why = (c: Computed) => (c.status === 'ok' ? '' : Array.from(new Set(c.reasons)).map((r) => reasons[r]).join(' '))

export function Report() {
  const src = useReportSource()
  const [href, setHref] = useState<string | null>(null)
  const a = useMemo(() => (src ? assess(src.answers) : null), [src])

  useEffect(() => {
    setScene({ visible: false })
    return () => setScene({ visible: true })
  }, [])

  useEffect(() => {
    if (!src) return
    const code = encodeReport(src.answers, { chol: src.prefs.chol ?? 'mgdl', body: src.prefs.body ?? 'metric', creat: 'mgdl' })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHref(`${window.location.origin}/report/#${code}`)
  }, [src])

  if (!src || !a) return <div className="min-h-[100svh] bg-paper" aria-busy="true" />

  const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

  if (a.kind === 'blocked') {
    return (
      <div className="relative z-10 min-h-[100svh] bg-paper px-4 pb-16 pt-28">
        <div className="mx-auto max-w-2xl rounded-card bg-white p-8 md:p-12">
          <h1 className="text-3xl font-medium tracking-[-0.03em]">{copy.title}</h1>
          <p className="mt-4 text-blood/85">{copy.empty}</p>
          <div className="mt-6">
            <Link href="/check/" className="font-medium text-crimson underline underline-offset-4">
              {rc.empty.cta}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const i = a.input
  const chol = (mg: number | null) => (mg == null ? 'Not known' : src.prefs.chol === 'mmol' ? `${(mg * 0.02586).toFixed(2)} mmol/L (${Math.round(mg)} mg/dL)` : `${Math.round(mg)} mg/dL`)
  const answers = src.answers
  const body =
    typeof answers.heightCm === 'number' && typeof answers.weightKg === 'number'
      ? src.prefs.body === 'imperial'
        ? `${length.toFeetInches(answers.heightCm).feet} ft ${length.toFeetInches(answers.heightCm).inches} in, ${Math.round(mass.toLb(answers.weightKg))} lb`
        : `${Math.round(answers.heightCm)} cm, ${round(answers.weightKg, 1)} kg`
      : 'Not given'
  const inputs: [string, string][] = [
    ['Age', `${i.age} years`],
    ['Sex assigned at birth', i.sex === 'female' ? q.sex.female : q.sex.male],
    ['Systolic blood pressure', i.sbp == null ? 'Not known' : `${i.sbp} mmHg`],
    ['Blood pressure medicine', i.bpTreated ? 'Yes' : 'No'],
    ['Total cholesterol', chol(i.totalCholesterol)],
    ['HDL cholesterol', chol(i.hdl)],
    ['Statin', i.statin ? 'Yes' : 'No'],
    ['Diabetes', i.diabetes ? 'Yes' : 'No'],
    ['Current smoker', i.smoker ? 'Yes' : 'No'],
    ['Height, weight', body],
    ['BMI', i.bmi == null ? '—' : `${round(i.bmi, 1).toFixed(1)} kg/m²`],
    ['eGFR', i.egfr == null ? 'Not known' : `${i.egfr} mL/min/1.73m²`],
  ]

  return (
    <div className="relative z-10 min-h-[100svh] bg-paper px-3 pb-16 pt-24 print:p-0 md:px-6 md:pt-28">
      <div data-no-print className="mx-auto mb-6 flex max-w-[210mm] flex-wrap items-center justify-between gap-3">
        <Link href="/results/" className="text-[14px] font-medium text-crimson underline underline-offset-4">
          ← {copy.back}
        </Link>
        {!IS_ARTIFACT && <Button onClick={() => window.print()}>{copy.print}</Button>}
      </div>

      <article className="mx-auto max-w-[210mm] bg-white p-8 text-blood shadow-[0_30px_80px_-40px_rgba(26,0,4,0.35)] print:max-w-none print:p-0 print:shadow-none md:p-12">
        <header className="flex items-start justify-between gap-6 border-b border-blood/15 pb-6">
          <div>
            <p className="flex items-baseline gap-2 text-ink-red">
              <span className="text-xl font-semibold tracking-[-0.03em]">{brand.wordmark}</span>
              <span className="pixel text-[9px]">{brand.year}</span>
            </p>
            <h1 className="mt-3 text-[28px] font-medium tracking-[-0.03em]">{copy.title}</h1>
            <p className="mt-1 text-[13px] text-blood/75">{copy.generated(date)}</p>
          </div>
          {!IS_ARTIFACT && <QrCode value={href} size={96} label="QR code linking to this report" />}
        </header>

        {a.kind === 'prevent' ? (
          <section className="mt-6 grid grid-cols-[1fr_auto] items-end gap-6 border-b border-blood/15 pb-6">
            <div>
              <p className="text-[12px] uppercase tracking-[0.08em] text-blood/75">{rc.label} {rc.outcome}</p>
              <p className="mt-1 text-[64px] font-medium leading-none tracking-[-0.05em] text-ink-red">{v(a.headline)}</p>
              {a.headline.status === 'ok' && <p className="mt-2 text-[14px]">{rc.frequency(a.headline.value)}</p>}
              {a.headline.status !== 'ok' && <p className="mt-2 text-[13px]">{why(a.headline)}</p>}
            </div>
            <dl className="text-right text-[14px]">
              {a.category && (
                <>
                  <dt className="text-[12px] uppercase tracking-[0.08em] text-blood/75">{rc.categoryLabel}</dt>
                  <dd className="text-[20px] font-semibold">{rc.categories[a.category].name}</dd>
                  <dd className="text-[12px] text-blood/75">{rc.categories[a.category].range}</dd>
                </>
              )}
              <dt className="mt-3 text-[12px] uppercase tracking-[0.08em] text-blood/75">{rc.heartAge.heartAge}</dt>
              <dd className="text-[20px] font-semibold">
                {a.heartAge.status === 'ok' ? (a.heartAge.bound === 'above' ? rc.heartAge.above : a.heartAge.bound === 'below' ? rc.heartAge.below : Math.round(a.heartAge.value)) : '—'}
              </dd>
            </dl>
          </section>
        ) : (
          <section className="mt-6 border-b border-blood/15 pb-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em]">{rc.estimate.badge}</p>
            <p className="mt-1 text-[48px] font-medium leading-none tracking-[-0.05em] text-ink-red">{v(a.estimate)}</p>
            <p className="mt-2 text-[13px]">{rc.estimate.body(a.missing.map((m) => rc.estimate.missing[m]).join(' and '), rc.estimate.models[a.model])}</p>
          </section>
        )}

        <div className="mt-6 grid gap-8 md:grid-cols-2 print:grid-cols-2">
          <section>
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-blood/75">{copy.patient}</h2>
            <table className="mt-3 w-full text-[13px]">
              <tbody>
                {inputs.map(([k, val]) => (
                  <tr key={k} className="border-b border-blood/10">
                    <th scope="row" className="py-1.5 pr-3 text-left font-normal text-blood/80">
                      {k}
                    </th>
                    <td className="py-1.5 text-right font-medium">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {a.kind === 'prevent' && (
            <section>
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-blood/75">{copy.results}</h2>
              <table className="mt-3 w-full text-[13px]">
                <thead>
                  <tr className="border-b border-blood/15 text-blood/75">
                    <th scope="col" className="py-1.5 text-left font-normal">
                      PREVENT
                    </th>
                    <th scope="col" className="py-1.5 text-right font-normal">
                      10-yr
                    </th>
                    <th scope="col" className="py-1.5 text-right font-normal">
                      30-yr
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(['ascvd', 'cvd', 'hf'] as const).map((o) => (
                    <tr key={o} className="border-b border-blood/10">
                      <th scope="row" className="py-1.5 pr-2 text-left font-normal">
                        {rc.table.rows[o]}
                      </th>
                      <td className="py-1.5 text-right font-semibold tabular">{v(a.prevent.tenYear[o])}</td>
                      <td className="py-1.5 text-right font-semibold tabular">{v(a.prevent.thirtyYear[o])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {a.drivers && a.drivers.items.length > 0 && (
                <>
                  <h3 className="mt-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-blood/75">{rc.drivers.title}</h3>
                  <ul className="mt-2 text-[13px]">
                    {a.drivers.items.map((d) => (
                      <li key={d.id} className="flex justify-between border-b border-blood/10 py-1.5">
                        <span>
                          {rc.drivers.labels[d.id]} <span className="text-blood/70">({rc.drivers.ifShort[d.id]}: {pct(d.ifHealthy)})</span>
                        </span>
                        <span className="font-semibold tabular">−{round(d.reduction, 1).toFixed(1)} pts</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}
        </div>

        {a.notes.length > 0 && (
          <section className="mt-6">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-blood/75">{copy.notes}</h2>
            <ul className="mt-2 list-disc pl-5 text-[13px] leading-relaxed">
              {a.notes.map((n) => (
                <li key={n}>{rc.notes[n]}</li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-8 border-t border-blood/15 pt-4 text-[11px] leading-relaxed text-blood/80">
          <p className="font-semibold">{copy.forClinician}</p>
          <p className="mt-1">{copy.method}</p>
          <p className="mt-2">{disclaimerLine}</p>
        </footer>
      </article>
    </div>
  )
}
