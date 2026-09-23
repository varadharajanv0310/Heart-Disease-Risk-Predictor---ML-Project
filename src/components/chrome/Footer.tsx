'use client'

/**
 * Editorial footer.
 *
 * On the landing page it becomes a full ref-4 composition: a year stamp at top
 * centre, a giant wordmark that comes into focus through red smoke, a dense
 * red paragraph bottom-left and a working QR code bottom-right — with ref 2's
 * small round red button in the corner. Other pages get the compact version.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { brand, footer } from '@/content/copy'
import { prefersReducedMotion } from '@/hooks/use-media'
import { gsap, useGSAP } from '@/lib/gsap'
import { getLenis } from './SmoothScroll'
import { QrCode } from '../ui/QrCode'

/** Soft red smoke on white (ref 4), drifting very slowly. */
function Smoke() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="smoke absolute left-[8%] top-[18%] h-[46%] w-[48%] rounded-[50%] bg-signal opacity-55 blur-[90px]" />
      <div className="smoke absolute right-[6%] top-[6%] h-[38%] w-[40%] rounded-[50%] bg-[#ff5a6b] opacity-40 blur-[110px] [animation-delay:-6s]" />
      <div className="smoke absolute bottom-[22%] left-[34%] h-[30%] w-[42%] rounded-[50%] bg-[#ff8f9b] opacity-45 blur-[100px] [animation-delay:-11s]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-paper to-transparent" />
    </div>
  )
}

export function Footer() {
  const pathname = usePathname() ?? '/'
  const full = pathname === '/'
  const [href, setHref] = useState<string | null>(null)
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    // Static export: the origin is only known in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHref(`${window.location.origin}/check/`)
  }, [])

  useGSAP(
    () => {
      const word = root.current?.querySelector<HTMLElement>('[data-wordmark]')
      if (!word || prefersReducedMotion()) return
      // The wordmark resolves from a red smear into focus as you arrive (ref 4).
      gsap.fromTo(
        word,
        { filter: 'blur(34px)', scale: 1.06, xPercent: -2 },
        { filter: 'blur(2px)', scale: 1, xPercent: 0, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom bottom', scrub: true } },
      )
    },
    { scope: root, dependencies: [full] },
  )

  const toTop = () => {
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(0)
    else window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    document.getElementById('main')?.focus({ preventScroll: true })
  }

  return (
    <footer
      ref={root}
      data-site-footer
      className={`gutter relative z-10 text-ink-red ${full ? 'mt-10 flex min-h-[100svh] flex-col justify-between overflow-hidden bg-paper pb-6 pt-8' : 'mt-24 pb-6 pt-16'}`}
    >
      {full && (
        <>
          <Smoke />
          <p className="relative flex flex-col items-center leading-none">
            <span className="text-[17px] font-semibold tracking-[-0.03em]">{brand.wordmark}</span>
            <span className="pixel mt-1 text-[10px]">{brand.year}</span>
          </p>
          <p
            data-wordmark
            aria-hidden
            className="relative select-none text-center text-[clamp(7rem,30vw,30rem)] font-semibold leading-[0.8] tracking-[-0.07em] text-signal will-change-[filter,transform]"
          >
            {brand.wordmark}
          </p>
        </>
      )}

      <div className={`relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between ${full ? '' : 'border-t border-signal/30 pt-8'}`}>
        <div className="max-w-[980px]">
          {!full && (
            <p className="mb-3 flex items-baseline gap-3">
              <span className="text-xl font-semibold tracking-[-0.03em]">{brand.wordmark}</span>
              <span className="pixel text-[10px]">{brand.year}</span>
            </p>
          )}
          <p className="text-[11.5px] font-medium leading-[1.45]">{footer.paragraph}</p>
        </div>
        <div className="flex items-end gap-3">
          <p className="micro max-w-[7rem] text-right text-[10px] leading-tight">{footer.qrLabel}</p>
          <QrCode value={href} size={84} label="QR code linking to the Focal heart check" />
        </div>
      </div>
      <nav aria-label="Footer" className="relative mt-8 grid grid-cols-2 items-center gap-3 text-[10px] uppercase tracking-[0.08em] md:flex md:justify-between">
        <span>{footer.rights}</span>
        {footer.links.map((l) => (
          <Link key={l.href} href={l.href} className="underline-offset-4 hover:underline">
            {l.label}
          </Link>
        ))}
        <a href="tel:911" className="font-semibold underline-offset-4 hover:underline">
          {footer.emergency}
        </a>
        <span className="normal-case tracking-normal text-muted">{footer.credits}</span>
        <button
          type="button"
          onClick={toTop}
          aria-label="Back to top"
          data-cursor="Top"
          className="justify-self-end inline-flex h-10 w-10 items-center justify-center rounded-full bg-signal text-white shadow-[0_10px_24px_-10px_rgba(227,0,15,0.9)] transition-colors hover:bg-ink-red"
        >
          <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4">
            <path d="M12 12 4 4M4 10V4h6" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      </nav>
    </footer>
  )
}
