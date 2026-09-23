'use client'

import { useRef } from 'react'
import { sections } from '@/content/copy'
import { prefersReducedMotion } from '@/hooks/use-media'
import { ScrollTrigger, gsap, useGSAP } from '@/lib/gsap'
import { setScene } from '@/lib/scene-store'
import { Arrow, ButtonLink } from '../ui/Button'
import { Frame } from '../ui/Frame'
import { Magnetic } from '../ui/Magnetic'
import { Reveal } from '../ui/Reveal'

const { why, measure, how, heartAge, final } = sections

function SectionLabel({ index, label, tone = 'red' }: { index: string; label: string; tone?: 'red' | 'light' }) {
  return (
    <p className={`micro flex items-center gap-3 ${tone === 'light' ? 'text-white/85' : 'text-ink-red'}`}>
      <span className="pixel text-[11px]">{index}</span>
      <span aria-hidden className={`h-px w-8 ${tone === 'light' ? 'bg-white/50' : 'bg-signal/50'}`} />
      {label}
    </p>
  )
}

/** Red smoke (ref 4) — soft blurred gradients, purely decorative. */
function Smoke() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-[20%] top-[10%] h-[70%] w-[70%] rounded-full bg-signal opacity-70 blur-[90px]" />
      <div className="absolute right-[-10%] top-[-10%] h-[60%] w-[55%] rounded-full bg-[#ff4d5e] opacity-40 blur-[110px]" />
      <div className="absolute bottom-[-20%] right-[10%] h-[60%] w-[60%] rounded-full bg-blood opacity-60 blur-[100px]" />
    </div>
  )
}

/** What the tear reveals: the top of section 01. */
export function WhyIntro() {
  return (
    <div className="gutter relative flex h-full flex-col justify-between bg-crimson pb-8 pt-24 text-white md:pb-10 md:pt-28">
      <Smoke />
      <div className="relative">
        <SectionLabel index={why.index} label={why.label} tone="light" />
      </div>
      <div className="relative">
        <p className="pixel text-[clamp(5.5rem,22vw,20rem)] leading-[0.85] text-white">{why.stat}</p>
        <p className="mt-4 max-w-[28rem] text-lg text-white/85 md:text-xl">{why.statLabel}</p>
      </div>
    </div>
  )
}

export function Why() {
  return (
    <section aria-labelledby="why-h" className="gutter relative bg-crimson pb-28 pt-6 text-white md:pb-40">
      <h2 className="sr-only">{why.label}</h2>
      <p className="sr-only">
        {why.stat} {why.statLabel}.
      </p>
      <div className="grid gap-10 md:grid-cols-12">
        <Reveal as="h3" id="why-h" className="text-[clamp(2rem,4.6vw,4.4rem)] font-medium display-tight md:col-span-7">
          {why.heading}
        </Reveal>
        <div className="md:col-span-4 md:col-start-9 md:pt-3">
          <Reveal as="p" className="text-lg leading-relaxed text-white/85" words={false}>
            {why.body}
          </Reveal>
          <p className="mt-6 text-[12px] text-white/75">{why.source}</p>
        </div>
      </div>
    </section>
  )
}

export function Measure() {
  return (
    <section aria-labelledby="measure-h" className="gutter relative py-28 md:py-40">
      <SectionLabel index={measure.index} label={measure.label} />
      <div className="mt-8 grid gap-6 md:grid-cols-12">
        <Reveal as="h2" id="measure-h" className="text-[clamp(2.2rem,5vw,4.8rem)] font-medium display-tight md:col-span-8">
          {measure.heading}
        </Reveal>
        <p className="max-w-md text-lg text-blood/85 md:col-span-4 md:pt-4">{measure.intro}</p>
      </div>
      <ul className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-measure-cards>
        {measure.cards.map((c, i) => (
          <li key={c.k} className="glass-strong flex min-h-48 flex-col justify-between p-6 [border-radius:28px]">
            <span className="pixel text-[11px] text-ink-red">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h3 className="text-xl font-semibold tracking-[-0.02em]">{c.k}</h3>
              <p className="mt-2 text-[15px] leading-snug text-blood/80">{c.v}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function How() {
  return (
    <section id="how" aria-labelledby="how-h" className="gutter relative scroll-mt-24 py-20 md:py-32">
      <Frame className="bg-paper/70 px-5 pb-16 pt-16 backdrop-blur-sm md:px-12 md:pb-20 md:pt-20" tl={[`${how.index} — ${how.label}`, '']} tr={['Model', 'PREVENT base equations']}>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <Reveal as="h2" id="how-h" className="text-[clamp(2.2rem,5vw,4.8rem)] font-medium display-tight">
              {how.heading}
            </Reveal>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-blood/85">{how.body}</p>
          </div>
          <ol className="grid gap-6 md:col-span-5 md:pt-2">
            {how.steps.map((s) => (
              <li key={s.n} className="grid grid-cols-[3rem_1fr] gap-4 border-t border-signal/25 pt-4">
                <span className="pixel text-sm text-ink-red">{s.n}</span>
                <div>
                  <h3 className="text-lg font-semibold">{s.k}</h3>
                  <p className="mt-1 text-[15px] leading-snug text-blood/80">{s.v}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-16 rounded-card bg-blood p-6 text-white md:mt-20 md:flex md:items-center md:gap-10 md:p-10">
          <p className="pixel text-[clamp(1rem,2.2vw,1.6rem)] leading-tight text-[#ff8a96] md:w-1/2">{how.privacyPixel}</p>
          <p className="mt-4 text-[15px] leading-relaxed text-white/85 md:mt-0 md:w-1/2">{how.privacyBody}</p>
        </div>
      </Frame>
    </section>
  )
}

export function HeartAge() {
  const root = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const el = root.current?.querySelector<HTMLElement>('[data-heart-age]')
      if (!el) return
      if (prefersReducedMotion()) return
      const n = { v: heartAge.demo.real }
      gsap.to(n, {
        v: heartAge.demo.heart,
        duration: 1.6,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 80%', once: true },
        onUpdate: () => {
          el.textContent = String(Math.round(n.v))
        },
      })
    },
    { scope: root },
  )
  return (
    <section ref={root} aria-labelledby="ha-h" className="gutter relative py-28 md:py-40">
      <SectionLabel index={heartAge.index} label={heartAge.label} />
      <div className="mt-8 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-6">
          <Reveal as="h2" id="ha-h" className="text-[clamp(2.2rem,5vw,4.8rem)] font-medium display-tight">
            {heartAge.heading}
          </Reveal>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-blood/85">{heartAge.body}</p>
          <p className="mt-4 text-lg font-semibold text-ink-red">{heartAge.kicker}</p>
          <p className="mt-8 text-sm text-muted">{heartAge.note}</p>
        </div>
        <div className="glass relative flex items-end justify-between gap-6 p-6 md:col-span-6 md:p-10" aria-label={`Example: age ${heartAge.demo.real}, heart age ${heartAge.demo.heart}`} role="img">
          <div>
            <p className="micro text-muted">{heartAge.demo.realLabel}</p>
            <p className="pixel text-[clamp(4.5rem,12vw,10rem)] leading-none text-blood">{heartAge.demo.real}</p>
          </div>
          <Arrow className="mb-8 h-8 w-8 text-signal" />
          <div className="text-right">
            <p className="micro text-ink-red">{heartAge.demo.heartLabel}</p>
            <p data-heart-age className="pixel text-[clamp(4.5rem,12vw,10rem)] leading-none text-signal">
              {heartAge.demo.heart}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section aria-labelledby="final-h" className="gutter relative py-28 text-center md:py-40">
      <Reveal as="h2" id="final-h" className="mx-auto max-w-[16ch] text-[clamp(2.6rem,7vw,7rem)] font-medium display-tight">
        {final.heading}
      </Reveal>
      <p className="mx-auto mt-6 max-w-xl text-lg text-blood/85">{final.body}</p>
      <div className="mt-10 flex justify-center">
        <Magnetic>
          <ButtonLink href="/check/" beat data-cursor="Begin">
            {final.cta}
            <Arrow />
          </ButtonLink>
        </Magnetic>
      </div>
    </section>
  )
}

/** Hooks the landing page's scroll into the 3D scene. */
export function LandingScene() {
  useGSAP(() => {
    setScene({ mode: 'hero', blur: 0.55, intensity: 0.35, scroll: 0, visible: true })
    const why = document.querySelector('[aria-labelledby="why-h"]')
    const st = why
      ? ScrollTrigger.create({
          trigger: why,
          start: 'top bottom',
          end: 'bottom top',
          // The crimson section covers the canvas completely: stop rendering.
          onToggle: (self) => setScene({ visible: !self.isActive }),
        })
      : null
    return () => {
      st?.kill()
      setScene({ visible: true })
    }
  })
  return null
}
