'use client'

/**
 * Signature transition (ref 2): scrolling tears a ragged hole through the hero
 * "paper", revealing section 01 beneath, until it fills the screen.
 *
 * The hole is a clip-path polygon; a white ragged rim with a soft shadow sells
 * the torn edge. Reduced motion: no pin, no tear — sections simply follow.
 */
import { type ReactNode, useMemo, useRef } from 'react'
import { prefersReducedMotion } from '@/hooks/use-media'
import { ScrollTrigger, gsap, useGSAP } from '@/lib/gsap'
import { seeded } from '@/lib/random'
import { setScene } from '@/lib/scene-store'

const N = 150

function useTearShape() {
  return useMemo(() => {
    const rnd = seeded(42)
    // Paper tears irregularly: a slow wobble, finer ripples, fibre-level
    // jitter, and the occasional deeper notch.
    return Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2
      const wobble = Math.sin(a * 3 + 1.1) * 0.055 + Math.sin(a * 7 + 2.3) * 0.03
      const fibre = (rnd() - 0.5) * 0.07
      const notch = rnd() < 0.07 ? (rnd() - 0.6) * 0.2 : 0
      return { a, r: 0.9 + wobble + fibre + notch }
    })
  }, [])
}

export function TornReveal({ hero, reveal }: { hero: ReactNode; reveal: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null)
  const layer = useRef<HTMLDivElement>(null)
  const rim = useRef<SVGPathElement>(null)
  const rimSvg = useRef<SVGSVGElement>(null)
  const heroLayer = useRef<HTMLDivElement>(null)
  const shape = useTearShape()

  useGSAP(
    () => {
      const w = wrap.current
      if (!w || !layer.current) return
      const reduced = prefersReducedMotion()

      const draw = (p: number) => {
        const el = layer.current
        if (!el) return
        const W = el.clientWidth
        const H = el.clientHeight
        const cx = W * 0.5
        const cy = H * 0.52
        // Radius large enough that the smallest jag still clears the corners.
        const Rmax = Math.hypot(W / 2, H / 2) / 0.66
        const e = p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p)
        const R = Rmax * e
        const pts = shape.map(({ a, r }) => [cx + Math.cos(a) * r * R, cy + Math.sin(a) * r * R * 0.86] as const)
        el.style.clipPath = R <= 0.5 ? 'polygon(50% 50%, 50% 50%, 50% 50%)' : `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`
        if (rim.current && rimSvg.current) {
          rimSvg.current.setAttribute('viewBox', `0 0 ${W} ${H}`)
          rim.current.setAttribute('d', R <= 0.5 ? '' : `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`)
          rimSvg.current.style.opacity = e > 0.97 ? String(Math.max(0, (1 - e) / 0.03)) : '1'
        }
        if (heroLayer.current && !reduced) {
          heroLayer.current.style.filter = `blur(${(e * 10).toFixed(2)}px)`
          heroLayer.current.style.transform = `scale(${1 - e * 0.04})`
        }
      }

      if (reduced) {
        draw(0)
        return
      }

      draw(0)
      ScrollTrigger.create({
        trigger: w,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          const p = gsap.utils.clamp(0, 1, (self.progress - 0.12) / 0.88)
          draw(p)
          setScene({ scroll: self.progress, mode: self.progress > 0.55 ? 'narrative' : 'hero', blur: 0.55 + self.progress * 0.45 })
        },
        onRefresh: (self) => draw(gsap.utils.clamp(0, 1, (self.progress - 0.12) / 0.88)),
      })

      // Corner labels drift at different depths.
      gsap.utils.toArray<HTMLElement>('[data-speed]', w).forEach((el) => {
        const speed = Number(el.dataset.speed)
        gsap.to(el, { yPercent: speed * -400, ease: 'none', scrollTrigger: { trigger: w, start: 'top top', end: 'bottom bottom', scrub: true } })
      })
    },
    { scope: wrap },
  )

  return (
    <div ref={wrap} className="relative motion-safe:h-[260svh]">
      <div className="top-0 h-[100svh] overflow-hidden motion-safe:sticky">
        <div ref={heroLayer} className="absolute inset-0 will-change-[filter,transform]">
          {hero}
        </div>
        <div ref={layer} aria-hidden className="absolute inset-0 motion-reduce:hidden" style={{ clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%)' }}>
          {reveal}
        </div>
        <svg ref={rimSvg} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full motion-reduce:hidden" preserveAspectRatio="none">
          <defs>
            <filter id="tear-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#1A0004" floodOpacity="0.28" />
            </filter>
          </defs>
          <path ref={rim} fill="none" stroke="#FFFFFF" strokeWidth="12" strokeLinejoin="round" filter="url(#tear-shadow)" />
        </svg>
      </div>
    </div>
  )
}
