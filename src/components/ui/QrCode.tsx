'use client'

import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { color } from '@/design/tokens'

/** A functional QR code, drawn as crisp SVG in ink red. */
export function QrCode({ value, size = 88, label, className = '' }: { value: string | null; size?: number; label: string; className?: string }) {
  const [svg, setSvg] = useState<string | null>(null)

  useEffect(() => {
    if (!value) return
    let alive = true
    QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: color.inkRed, light: '#FFFFFF' },
    })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(null))
    return () => {
      alive = false
    }
  }, [value])

  return (
    <div
      role="img"
      aria-label={label}
      className={`shrink-0 bg-white [&>svg]:h-full [&>svg]:w-full ${className}`}
      style={{ width: size, height: size }}
      // The SVG is generated locally from `value`; no external content.
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  )
}
