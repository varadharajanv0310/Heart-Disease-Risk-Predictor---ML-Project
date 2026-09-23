import type { ReactNode } from 'react'

/**
 * Swiss editorial hairline frame (ref 1) with micro-labels tucked into its
 * corners. Corners accept two lines each: a label and a value.
 */
type Corner = readonly string[] | undefined

export function Frame({
  children,
  tl,
  tr,
  bl,
  br,
  className = '',
  labelClass = 'text-ink-red',
  parallax = false,
}: {
  children?: ReactNode
  tl?: Corner
  tr?: Corner
  bl?: Corner
  br?: Corner
  className?: string
  labelClass?: string
  parallax?: boolean
}) {
  const label = (c: Corner, align: 'left' | 'right', speed: number) =>
    c && (
      <div
        className={`rounded-md bg-paper/60 px-1.5 py-1 leading-tight backdrop-blur-md ${align === 'right' ? 'text-right' : ''}`}
        data-speed={parallax ? speed : undefined}
      >
        <p className="text-[12px] font-medium">{c[0]}</p>
        {c[1] && <p className="text-[12px] text-blood/75">{c[1]}</p>}
      </div>
    )
  return (
    <div className={`relative hairline ${className}`}>
      <div className={`pointer-events-none absolute inset-x-2 top-2 flex justify-between md:inset-x-3.5 md:top-3 ${labelClass}`}>
        {label(tl, 'left', 0.06)}
        {label(tr, 'right', 0.1)}
      </div>
      {children}
      <div className={`pointer-events-none absolute inset-x-2 bottom-2 flex items-end justify-between md:inset-x-3.5 md:bottom-3 ${labelClass}`}>
        {label(bl, 'left', -0.05)}
        {label(br, 'right', -0.09)}
      </div>
    </div>
  )
}
