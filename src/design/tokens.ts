/**
 * Focal design tokens — the single source of truth.
 *
 * These values are rendered once into CSS custom properties (see `tokensToCss`)
 * and mapped into Tailwind via `@theme inline` in globals.css. JavaScript
 * consumers (three.js materials, GSAP timelines) import them directly.
 *
 * Contrast (WCAG 2.2, measured):
 *   signal  #E3000F  4.91:1 on white · 4.43:1 on paper → large text / graphics only on paper
 *   inkRed  #C4000D  5.65:1 on paper · 5.17:1 on blush → any size
 *   crimson #9E0012  8.53:1 on white
 *   blood   #1A0004  18.1:1 on paper
 *   muted   #6B4A4D  6.98:1 on paper
 */
export const color = {
  signal: '#E3000F',
  inkRed: '#C4000D',
  crimson: '#9E0012',
  blood: '#1A0004',
  muted: '#6B4A4D',
  paper: '#F4F3F1',
  white: '#FFFFFF',
  blush: '#FBE4E5',
  blushDeep: '#F6C9CC',
} as const

export const font = {
  sans: 'var(--font-inter-tight), "Inter Tight", ui-sans-serif, system-ui, sans-serif',
  pixel: 'var(--font-silkscreen), "Silkscreen", ui-monospace, monospace',
} as const

/** Fluid type scale: [min px, max px] between 360px and 1440px viewports. */
export const type = {
  micro: [11, 11],
  xs: [12, 12],
  sm: [14, 14],
  base: [16, 17],
  lg: [18, 20],
  xl: [21, 24],
  '2xl': [28, 40],
  '3xl': [40, 72],
  display: [56, 160],
  mega: [140, 420],
} as const

export const space = [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192] as const

export const radius = {
  hairline: 6,
  card: 24,
  glass: 44,
  pill: 999,
} as const

export const blur = { none: 0, xs: 4, sm: 12, md: 24, lg: 48 } as const

export const glass = {
  fill: 'rgba(255,255,255,0.34)',
  fillStrong: 'rgba(255,255,255,0.62)',
  /** Text-bearing cards: keeps small crimson text ≥4.5:1 even over the deepest red. */
  fillCard: 'rgba(255,255,255,0.8)',
  blur: 28,
  saturate: 1.4,
  border: 'rgba(255,255,255,0.65)',
  highlight: 'inset 0 1px 0 rgba(255,255,255,0.8)',
  shadow: '0 40px 80px -40px rgba(158,0,18,0.35)',
} as const

/** Durations in milliseconds. `beat` is one heartbeat at 60 bpm. */
export const duration = {
  instant: 120,
  fast: 240,
  base: 480,
  slow: 900,
  cinematic: 1400,
  beat: 1000,
} as const

/** Soft, expensive-feeling easings. No overshooting springs anywhere. */
export const easing = {
  expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  quint: 'cubic-bezier(0.22, 1, 0.36, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const

/** GSAP equivalents of `easing`. */
export const gsapEase = {
  expo: 'expo.out',
  quint: 'power4.out',
  inOut: 'power3.inOut',
} as const

export const tokens = { color, font, type, space, radius, blur, glass, duration, easing } as const

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)

function fluid([min, max]: readonly [number, number]): string {
  if (min === max) return `${min / 16}rem`
  const slope = (max - min) / (1440 - 360)
  const base = min - slope * 360
  return `clamp(${min / 16}rem, ${(base / 16).toFixed(4)}rem + ${(slope * 100).toFixed(4)}vw, ${max / 16}rem)`
}

/** Serialises tokens to a `:root { … }` block. Rendered once in the root layout. */
export function tokensToCss(): string {
  const vars: string[] = []
  for (const [k, v] of Object.entries(color)) vars.push(`--c-${kebab(k)}:${v}`)
  for (const [k, v] of Object.entries(type)) vars.push(`--t-${k}:${fluid(v)}`)
  space.forEach((v, i) => vars.push(`--s-${i}:${v / 16}rem`))
  for (const [k, v] of Object.entries(radius)) vars.push(`--r-${k}:${v}px`)
  for (const [k, v] of Object.entries(blur)) vars.push(`--blur-${k}:${v}px`)
  vars.push(`--glass-fill:${glass.fill}`, `--glass-fill-strong:${glass.fillStrong}`, `--glass-fill-card:${glass.fillCard}`)
  vars.push(`--glass-blur:${glass.blur}px`, `--glass-saturate:${glass.saturate}`)
  vars.push(`--glass-border:${glass.border}`, `--glass-highlight:${glass.highlight}`, `--glass-shadow:${glass.shadow}`)
  for (const [k, v] of Object.entries(duration)) vars.push(`--d-${k}:${v}ms`)
  for (const [k, v] of Object.entries(easing)) vars.push(`--e-${kebab(k)}:${v}`)
  return `:root{${vars.join(';')}}`
}
