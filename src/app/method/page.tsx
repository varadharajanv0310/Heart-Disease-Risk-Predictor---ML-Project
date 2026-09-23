import type { Metadata } from 'next'
import { QuietScene } from '@/components/chrome/QuietScene'
import { Arrow, ButtonLink } from '@/components/ui/Button'
import { Frame } from '@/components/ui/Frame'
import { method } from '@/content/copy'
import { methodContent as m } from '@/content/method'

export const metadata: Metadata = {
  title: 'Methodology & sources',
  description: 'How Focal calculates: the AHA PREVENT equations, who they are for, their limits, and every source.',
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-28 border-t border-signal/25 py-12 md:grid md:grid-cols-12 md:gap-10 md:py-16">
      <h2 id={`${id}-h`} className="text-[clamp(1.5rem,2.6vw,2.1rem)] font-medium leading-tight tracking-[-0.03em] md:col-span-4">
        {title}
      </h2>
      <div className="mt-5 grid gap-4 text-[16px] leading-relaxed text-blood/90 md:col-span-8 md:mt-0">{children}</div>
    </section>
  )
}

const P = ({ items }: { items: string[] }) => (
  <>
    {items.map((t) => (
      <p key={t}>{t}</p>
    ))}
  </>
)

export default function MethodPage() {
  const s = method.sections
  return (
    <div className="gutter pb-10 pt-24 md:pt-28">
      <QuietScene />
      <Frame className="glass-card px-5 pb-12 pt-20 md:px-12 md:pb-16 md:pt-24" tl={[method.eyebrow, 'Version 1.0.0']} tr={['Last reviewed', '23 Sep 2026']}>
        <h1 className="max-w-[14ch] text-[clamp(2.8rem,7vw,6.5rem)] font-medium display-tight">{method.title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-blood/90">{method.intro}</p>
        <nav aria-label="On this page" className="mt-10 flex flex-wrap gap-2">
          {Object.entries({ model: s.model, validity: s.validity, 'heart-age': s.heartAge, unknown: s.unknown, insights: s.insights, verification: s.verification, limits: s.limits, privacy: s.privacy, sources: s.sources, changelog: s.changelog }).map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-pill border border-blood/20 bg-white/70 px-4 py-2 text-[13px] font-medium hover:border-signal hover:text-crimson">
              {label}
            </a>
          ))}
        </nav>
      </Frame>

      <div className="glass-card mt-4 px-5 md:px-12">
        <Section id="model" title={s.model}>
          <P items={m.model} />
          <pre className="overflow-x-auto rounded-2xl bg-blood p-5 text-[12.5px] leading-relaxed text-white">
            <code>{m.formula}</code>
          </pre>
          <p>{m.categories}</p>
          <table className="w-full text-[14px]">
            <caption className="sr-only">Valid input ranges</caption>
            <tbody>
              {m.ranges.map(([k, v]) => (
                <tr key={k} className="border-b border-blood/10">
                  <th scope="row" className="py-2 pr-4 text-left font-medium">
                    {k}
                  </th>
                  <td className="py-2 text-right tabular">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[14px]">{m.rangesNote}</p>
        </Section>

        <Section id="validity" title={s.validity}>
          <div>
            <h3 className="font-semibold">Built for</h3>
            <ul className="mt-2 grid gap-1.5">
              {m.validFor.map((t) => (
                <li key={t} className="flex gap-3">
                  <span aria-hidden className="pixel text-crimson">
                    +
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-2">
            <h3 className="font-semibold">Not for</h3>
            <ul className="mt-2 grid gap-1.5">
              {m.notFor.map((t) => (
                <li key={t} className="flex gap-3">
                  <span aria-hidden className="pixel text-crimson">
                    −
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        <Section id="heart-age" title={s.heartAge}>
          <P items={m.heartAge} />
        </Section>
        <Section id="unknown" title={s.unknown}>
          <P items={m.unknown} />
        </Section>
        <Section id="insights" title={s.insights}>
          <P items={m.insights} />
        </Section>
        <Section id="verification" title={s.verification}>
          <P items={m.verification} />
        </Section>
        <Section id="limits" title={s.limits}>
          <P items={m.limits} />
        </Section>
        <Section id="privacy" title={s.privacy}>
          <P items={m.privacy} />
        </Section>
        <Section id="sources" title={s.sources}>
          <ol className="grid list-decimal gap-2 pl-5 text-[14px]">
            {m.sources.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        </Section>
        <Section id="changelog" title={s.changelog}>
          {m.changelog.map((c) => (
            <div key={c.version}>
              <p className="flex items-baseline gap-3">
                <span className="pixel text-crimson">v{c.version}</span>
                <span className="text-[14px] text-blood/80">{c.date}</span>
              </p>
              <ul className="mt-3 grid list-disc gap-1.5 pl-5 text-[15px]">
                {c.items.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      </div>

      <div className="mt-16 flex justify-center">
        <ButtonLink href="/check/">
          Check your heart
          <Arrow />
        </ButtonLink>
      </div>
    </div>
  )
}
