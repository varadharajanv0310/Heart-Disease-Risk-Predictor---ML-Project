'use client'

import { useSyncExternalStore } from 'react'

function mediaStore(query: string) {
  return {
    subscribe(cb: () => void) {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    get: () => window.matchMedia(query).matches,
  }
}

const cache = new Map<string, ReturnType<typeof mediaStore>>()

export function useMedia(query: string, serverDefault = false): boolean {
  let s = cache.get(query)
  if (!s) {
    s = mediaStore(query)
    cache.set(query, s)
  }
  return useSyncExternalStore(s.subscribe, s.get, () => serverDefault)
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)', false)
export const useFinePointer = () => useMedia('(hover: hover) and (pointer: fine)', false)
export const useIsMobile = () => useMedia('(max-width: 767px)', false)

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Coarse, cheap capability check for the 3D scene. We fall back to a static
 * image when WebGL is missing, the user asked to save data, or the device is
 * clearly low-power. (No probe context is created here — that alone can cost
 * hundreds of milliseconds; a failed context later is caught by an error
 * boundary instead.)
 */
export function canRender3D(): boolean {
  if (typeof window === 'undefined') return false
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  if (nav.connection?.saveData) return false
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 2) return false
  if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency < 2) return false
  return typeof WebGLRenderingContext !== 'undefined'
}
