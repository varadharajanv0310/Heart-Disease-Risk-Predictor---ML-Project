'use client'

/**
 * Pill navigation (ref 2): the active item is a solid red pill that glides
 * between items. Wordmark + year stamp top-centre (ref 4).
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLayoutEffect, useRef, useState } from 'react'
import { brand, nav } from '@/content/copy'
import { Magnetic } from '../ui/Magnetic'

function activeIndex(pathname: string): number {
  if (pathname.startsWith('/check') || pathname.startsWith('/results') || pathname.startsWith('/report')) return 1
  if (pathname.startsWith('/method')) return 2
  if (pathname === '/') return 0
  return -1
}

export function Nav() {
  const pathname = usePathname() ?? '/'
  const idx = activeIndex(pathname)
  const refs = useRef<(HTMLAnchorElement | null)[]>([])
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null)

  useLayoutEffect(() => {
    const measure = () => {
      const el = idx >= 0 ? refs.current[idx] : null
      setPill(el ? { x: el.offsetLeft, w: el.offsetWidth } : null)
    }
    measure()
    window.addEventListener('resize', measure)
    document.fonts?.ready.then(measure).catch(() => {})
    return () => window.removeEventListener('resize', measure)
  }, [idx])

  return (
    <header data-nav className="gutter pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between pt-3 md:pt-5">
      <nav aria-label="Main" className="pointer-events-auto">
        <div className="relative flex items-center rounded-pill border border-white/80 bg-white/70 p-1 shadow-[0_10px_30px_-18px_rgba(158,0,18,0.45)] backdrop-blur-xl">
          {pill && (
            <span
              aria-hidden
              className="absolute top-1 bottom-1 rounded-pill bg-signal transition-[transform,width] duration-700 ease-[var(--e-expo)]"
              style={{ width: pill.w, transform: `translateX(${pill.x - 4}px)`, left: 4 }}
            />
          )}
          {nav.items.map((item, i) => {
            const active = i === idx
            return (
              <Link
                key={item.href}
                ref={(el) => {
                  refs.current[i] = el
                }}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative z-10 rounded-pill px-4 py-2 text-[13px] font-medium transition-colors duration-500 md:px-5 ${
                  active ? 'text-white' : 'text-blood hover:text-ink-red'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      <Link
        href="/"
        className="pointer-events-auto absolute left-1/2 top-4 hidden -translate-x-1/2 flex-col items-center text-ink-red md:top-6 md:flex"
        aria-label={`${brand.name} — home`}
      >
        <span className="text-[17px] font-semibold tracking-[-0.03em]">{brand.wordmark}</span>
        <span className="pixel text-[9px] leading-none">{brand.year}</span>
      </Link>

      <div className="pointer-events-auto flex items-center gap-4 rounded-pill border border-white/80 bg-white/70 py-1 pl-2 pr-4 shadow-[0_10px_30px_-18px_rgba(158,0,18,0.45)] backdrop-blur-xl md:gap-5">
        <Magnetic strength={0.25}>
          <Link
            href="/check/"
            className="hidden rounded-pill px-2 py-2 text-[13px] font-medium text-ink-red underline-offset-4 hover:underline md:inline-block"
            data-cursor="Start"
          >
            {nav.cta}
          </Link>
        </Magnetic>
        <div className="py-1 text-right leading-tight" aria-label="Private — computed on your device">
          <p className="text-[13px] font-semibold text-blood">{nav.privacyLabel}.</p>
          <p className="micro text-[9px] text-muted">{nav.privacySub}</p>
        </div>
      </div>
    </header>
  )
}
