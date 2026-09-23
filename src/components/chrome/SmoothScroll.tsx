'use client'

import Lenis from 'lenis'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useReducedMotion } from '@/hooks/use-media'
import { ScrollTrigger, gsap } from '@/lib/gsap'

let lenis: Lenis | null = null
export const getLenis = () => lenis

/** Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync. */
export function SmoothScroll() {
  const reduced = useReducedMotion()
  const pathname = usePathname()

  useEffect(() => {
    if (reduced) return
    const instance = new Lenis({
      duration: 1.15,
      easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenis = instance
    instance.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => instance.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      instance.destroy()
      lenis = null
    }
  }, [reduced])

  useEffect(() => {
    // Respect an in-page anchor (e.g. /method/#privacy); otherwise start at the top.
    const anchor = window.location.hash.slice(1)
    if (anchor && document.getElementById(anchor)) return
    lenis?.scrollTo(0, { immediate: true })
    window.scrollTo(0, 0)
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [pathname])

  return null
}
