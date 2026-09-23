/**
 * Motion-blurred pixel shapes drifting at the edges of the page (ref 2).
 * Built from a bitmap grid so they share the Silkscreen pixel language;
 * a horizontal Gaussian blur gives the smeared, in-motion look.
 * Purely decorative: aria-hidden, no pointer events, frozen when motion is reduced.
 */
import { useId } from 'react'

const GLYPHS = {
  heart: ['0110110', '1111111', '1111111', '1111111', '0111110', '0011100', '0001000'],
  plus: ['0011100', '0011100', '1111111', '1111111', '1111111', '0011100', '0011100'],
  pulse: ['0000100000', '0000110000', '0001010000', '1111010111', '0000011000', '0000001000'],
  percent: ['1100001', '1100010', '0000100', '0001000', '0010000', '0100011', '1000011'],
  zero: ['0111110', '1100011', '1100111', '1101011', '1110011', '1100011', '0111110'],
} as const

export type Glyph = keyof typeof GLYPHS

export function PixelDrift({
  glyph,
  className = '',
  blur = 10,
  angle = 0,
  delay = 0,
  opacity = 0.9,
}: {
  glyph: Glyph
  className?: string
  /** Horizontal motion-blur radius in viewBox units. */
  blur?: number
  angle?: number
  delay?: number
  opacity?: number
}) {
  const id = useId().replace(/:/g, '')
  const rows = GLYPHS[glyph]
  const w = rows[0]!.length
  const h = rows.length
  const pad = blur * 1.2
  return (
    <div aria-hidden className={`pointer-events-none absolute select-none ${className}`} style={{ opacity }}>
      <div className="pixel-drift h-full w-full" style={{ animationDelay: `${delay}s`, transform: `rotate(${angle}deg)` }}>
        <svg viewBox={`${-pad} ${-pad} ${w * 10 + pad * 2} ${h * 10 + pad * 2}`} className="h-full w-full overflow-visible" role="presentation">
          <defs>
            <filter id={`mb-${id}`} x="-40%" y="-20%" width="180%" height="140%">
              <feGaussianBlur stdDeviation={`${blur} ${blur * 0.18}`} />
            </filter>
          </defs>
          <g fill="var(--c-signal)" filter={`url(#mb-${id})`}>
            {rows.flatMap((row, y) => [...row].map((c, x) => (c === '1' ? <rect key={`${x}-${y}`} x={x * 10} y={y * 10} width="10.4" height="10.4" /> : null)))}
          </g>
        </svg>
      </div>
    </div>
  )
}
