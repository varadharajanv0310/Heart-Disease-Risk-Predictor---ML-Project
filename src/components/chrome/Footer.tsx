'use client'

/**
 * Editorial footer (refs 2 & 4): a dense small-text paragraph, a year stamp,
 * a working QR code, and tiny labels spaced along the bottom edge.
 */
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { brand, footer } from '@/content/copy'
import { QrCode } from '../ui/QrCode'

export function Footer() {
  const [href, setHref] = useState<string | null>(null)
  useEffect(() => {
    // Static export: the origin is only known in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHref(`${window.location.origin}/check/`)
  }, [])

  return (
    <footer data-site-footer className="gutter relative z-10 mt-24 pb-6 pt-16 text-ink-red">
      <div className="flex flex-col gap-8 border-t border-signal/30 pt-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-[980px]">
          <p className="mb-3 flex items-baseline gap-3">
            <span className="text-xl font-semibold tracking-[-0.03em]">{brand.wordmark}</span>
            <span className="pixel text-[10px]">{brand.year}</span>
          </p>
          <p className="text-[11.5px] leading-[1.45] font-medium">{footer.paragraph}</p>
        </div>
        <div className="flex items-end gap-3">
          <p className="micro max-w-[7rem] text-right text-[10px] leading-tight">{footer.qrLabel}</p>
          <QrCode value={href} size={84} label="QR code linking to the Focal heart check" />
        </div>
      </div>
      <nav aria-label="Footer" className="mt-8 grid grid-cols-2 gap-3 text-[10px] uppercase tracking-[0.08em] md:flex md:items-center md:justify-between">
        <span>{footer.rights}</span>
        {footer.links.map((l) => (
          <Link key={l.href} href={l.href} className="underline-offset-4 hover:underline">
            {l.label}
          </Link>
        ))}
        <a href="tel:911" className="font-semibold underline-offset-4 hover:underline">
          {footer.emergency}
        </a>
        <span className="col-span-2 normal-case tracking-normal text-muted md:col-span-1">{footer.credits}</span>
      </nav>
    </footer>
  )
}
