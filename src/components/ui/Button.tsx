import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'quiet' | 'invert'

const styles: Record<Variant, string> = {
  primary:
    'bg-signal text-white hover:bg-ink-red active:bg-crimson shadow-[0_18px_40px_-18px_rgba(227,0,15,0.8)]',
  ghost: 'border border-signal/60 text-ink-red hover:bg-signal hover:text-white hover:border-signal',
  quiet: 'text-blood underline-offset-4 hover:underline px-1!',
  invert: 'bg-white text-crimson hover:bg-blush',
}

const base =
  'relative inline-flex min-h-12 items-center justify-center gap-2 rounded-pill px-7 text-[15px] font-medium tracking-[-0.01em] transition-[background-color,color,border-color,box-shadow] duration-300 ease-[var(--e-expo)] disabled:cursor-not-allowed disabled:opacity-40'

export function ButtonLink({
  variant = 'primary',
  className = '',
  children,
  beat = false,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; beat?: boolean; children: ReactNode }) {
  return (
    <Link {...props} className={`${base} ${styles[variant]} ${className}`}>
      {beat && <span aria-hidden className="beat-ring absolute inset-0 rounded-pill border border-signal" />}
      {children}
    </Link>
  )
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ComponentProps<'button'> & { variant?: Variant; children: ReactNode }) {
  return (
    <button type="button" {...props} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  )
}

export function Arrow({ className = '', dir = 'right' }: { className?: string; dir?: 'right' | 'left' | 'down' | 'up' }) {
  const rot = { right: 0, down: 90, left: 180, up: 270 }[dir]
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={`h-4 w-4 ${className}`} style={{ transform: `rotate(${rot}deg)` }}>
      <path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  )
}
