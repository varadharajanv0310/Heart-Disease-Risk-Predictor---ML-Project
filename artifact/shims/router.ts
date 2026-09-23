/**
 * A tiny hash router for the single-page artifact build.
 *
 * The artifact sandbox only passes a bare `#token` (letters, digits, . _ ~ -)
 * through to the page, so routes map to tokens: `/check/` ↔ `#check`, and an
 * in-page anchor rides along as `#method.privacy`. Tokens that aren't routes
 * scroll to the matching element on the current page (e.g. `#how`, `#main`).
 */
import { useSyncExternalStore } from 'react'

const ROUTES: Record<string, string> = {
  home: '/',
  check: '/check/',
  results: '/results/',
  method: '/method/',
  report: '/report/',
}
const TOKENS: Record<string, string> = Object.fromEntries(Object.entries(ROUTES).map(([t, p]) => [p, t]))

let path = '/'

function resolve(hash: string): { path: string; anchor: string | null } {
  const token = decodeURIComponent(hash.replace(/^#/, ''))
  if (!token) return { path: '/', anchor: null }
  const [route, ...rest] = token.split('.')
  if (route && ROUTES[route]) return { path: ROUTES[route]!, anchor: rest.join('.') || null }
  if (document.getElementById(token)) return { path, anchor: token }
  return { path: '/404/', anchor: null }
}

/** `/method/#privacy` → `#method.privacy`; `#how` → `#how`; `/report/#data` → `#report`. */
export function toHash(href: string): string {
  if (href.startsWith('#')) return href
  const [p = '/', frag] = href.split('#')
  const token = TOKENS[p.endsWith('/') ? p : `${p}/`] ?? TOKENS[p] ?? 'home'
  return `#${token}${frag && token !== 'report' ? `.${frag}` : ''}`
}

const listeners = new Set<() => void>()

function sync() {
  const next = resolve(window.location.hash)
  const changed = next.path !== path
  path = next.path
  if (changed) listeners.forEach((l) => l())
  if (next.anchor) {
    const id = next.anchor
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }))
  }
}

if (typeof window !== 'undefined') {
  // Before first render no anchors exist yet, so an unknown token means home.
  const first = resolve(window.location.hash).path
  path = first === '/404/' ? '/' : first
  window.addEventListener('hashchange', sync)
}

export function useRoutePath(): string {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => path,
    () => '/',
  )
}

export function navigate(href: string) {
  const h = toHash(href)
  if (h === window.location.hash) sync()
  else window.location.hash = h
}
