'use client'

/**
 * Intro loader: a 000→100 pixel counter, an ECG drawing itself across a
 * hairline frame, and a red cell resolving out of blur.
 *
 * - Once per session (sessionStorage), hidden before paint on repeat visits.
 * - 1.5–2.5 s, skippable with any key or click.
 * - Never gates content: the page is fully rendered and interactive beneath.
 */
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { loader as copy } from '@/content/copy'
import { prefersReducedMotion } from '@/hooks/use-media'
import { gsap } from '@/lib/gsap'

const KEY = 'focal.intro'
const MIN = 1500
const MAX = 2500

function ecgPath(): string {
  let d = 'M0 100'
  for (let b = 0; b < 4; b++) {
    const x = b * 250
    d += ` L${x + 40} 100 Q${x + 50} 86 ${x + 60} 100 L${x + 76} 100 L${x + 81} 112 L${x + 89} 24 L${x + 97} 158 L${x + 103} 100 L${x + 128} 100 Q${x + 146} 76 ${x + 164} 100 L${x + 250} 100`
  }
  return d
}
const ECG = ecgPath()

export function Loader() {
  const pathname = usePathname()
  const [active, setActive] = useState(true)
  const [line, setLine] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const path = useRef<SVGPathElement>(null)
  const cell = useRef<HTMLDivElement>(null)
  const counter = useRef<HTMLParagraphElement>(null)
  const done = useRef(false)

  useEffect(() => {
    const html = document.documentElement
    if (html.classList.contains('loader-seen') || pathname?.startsWith('/report')) {
      html.classList.add('loader-done')
      // Reads a class set before paint; nothing to render for returning sessions.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActive(false)
      return
    }
    const reduced = prefersReducedMotion()
    const t0 = performance.now()
    let fontsReady = false
    document.fonts?.ready.then(() => (fontsReady = true)).catch(() => (fontsReady = true))
    const length = path.current?.getTotalLength() ?? 2000
    if (path.current) {
      path.current.style.strokeDasharray = `${length}`
      path.current.style.strokeDashoffset = `${length}`
    }

    const finish = () => {
      if (done.current) return
      done.current = true
      try {
        sessionStorage.setItem(KEY, '1')
      } catch {
        /* ignore */
      }
      html.classList.add('loader-done')
      const el = root.current
      if (!el) return setActive(false)
      const state = { r: 0 }
      gsap.to(state, {
        r: 1,
        duration: reduced ? 0.3 : 1.1,
        ease: 'expo.inOut',
        onUpdate: () => {
          if (reduced) {
            el.style.opacity = String(1 - state.r)
            return
          }
          // Iris: an even-odd hole that grows from the frame to the viewport.
          const ix = 50 - 50 * state.r
          const iy = 50 - 50 * state.r
          el.style.clipPath = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${ix}% ${iy}%, ${100 - ix}% ${iy}%, ${100 - ix}% ${100 - iy}%, ${ix}% ${100 - iy}%, ${ix}% ${iy}%)`
        },
        onComplete: () => setActive(false),
      })
    }

    let raf = 0
    let lastLine = 0
    const tick = (now: number) => {
      const elapsed = now - t0
      const target = fontsReady ? MIN : MAX
      const p = Math.min(1, elapsed / target)
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
      if (counter.current) counter.current.textContent = String(Math.round(eased * 100)).padStart(3, '0')
      const nextLine = Math.min(copy.lines.length - 1, Math.floor(p * copy.lines.length))
      if (nextLine !== lastLine) {
        lastLine = nextLine
        setLine(nextLine)
      }
      if (path.current) path.current.style.strokeDashoffset = `${length * (1 - (reduced ? 1 : eased))}`
      if (cell.current) cell.current.style.filter = `blur(${reduced ? 0 : 24 * (1 - eased)}px)`
      if (p < 1 && elapsed < MAX) raf = requestAnimationFrame(tick)
      else finish()
    }
    raf = requestAnimationFrame(tick)

    const skip = () => {
      cancelAnimationFrame(raf)
      if (counter.current) counter.current.textContent = '100'
      finish()
    }
    window.addEventListener('keydown', skip, { once: true })
    root.current?.addEventListener('pointerdown', skip, { once: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', skip)
    }
  }, [pathname])

  if (!active) return null

  return (
    <div
      ref={root}
      data-loader
      role="status"
      aria-live="polite"
      aria-label={copy.srLabel}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-paper"
    >
      <div className="relative flex h-[62svh] w-[min(88vw,1100px)] flex-col justify-between p-4 hairline md:p-6">
        <div className="flex items-start justify-between text-ink-red">
          <p className="micro font-medium">focal — 2026</p>
          <p className="micro text-right" aria-hidden>
            {copy.lines[line]}
          </p>
        </div>

        <div
          ref={cell}
          aria-hidden
          className="beat absolute left-1/2 top-1/2 h-[18vmin] w-[26vmin] -translate-x-1/2 -translate-y-1/2 rounded-[50%] will-change-[filter]"
          style={{
            background:
              'radial-gradient(ellipse 40% 34% at 52% 56%, #8a000e 0%, #c20a1f 55%, transparent 56%), radial-gradient(ellipse at 36% 30%, #ff7686 0%, #e3000f 42%, #9e0012 78%, #3a0006 100%)',
            filter: 'blur(24px)',
          }}
        />

        <svg aria-hidden viewBox="0 0 1000 200" preserveAspectRatio="none" className="absolute inset-x-0 top-1/2 h-[26%] w-full -translate-y-1/2">
          <path ref={path} d={ECG} fill="none" stroke="var(--c-signal)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>

        <div className="flex items-end justify-between">
          <button type="button" className="micro text-muted underline-offset-4 hover:underline" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown'))}>
            {copy.skip}
          </button>
          <p ref={counter} className="pixel text-[clamp(3rem,10vw,7.5rem)] leading-none text-signal tabular" aria-hidden>
            000
          </p>
        </div>
      </div>
    </div>
  )
}
