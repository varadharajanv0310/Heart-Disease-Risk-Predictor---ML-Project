'use client'

/**
 * Blur-to-focus reveal. Text comes into focus word by word as it enters the
 * viewport. Reduced motion: a plain fade.
 */
import { type ReactNode, useRef } from 'react'
import { prefersReducedMotion } from '@/hooks/use-media'
import { gsap, useGSAP } from '@/lib/gsap'

interface RevealProps {
  as?: 'div' | 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'li'
  children: ReactNode
  className?: string
  /** Split plain-string children into words (default true). */
  words?: boolean
  delay?: number
  stagger?: number
  /** Animate on mount instead of on scroll. */
  immediate?: boolean
  id?: string
}

export function Reveal({
  as = 'div',
  children,
  className = '',
  words = true,
  delay = 0,
  stagger = 0.045,
  immediate = false,
  id,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const Tag = as as 'div'

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      const targets = el.querySelectorAll<HTMLElement>('[data-reveal-part]')
      const parts = targets.length ? Array.from(targets) : [el]
      const reduced = prefersReducedMotion()
      const from = reduced ? { opacity: 0 } : { opacity: 0, filter: 'blur(14px)', y: 14 }
      const to = {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: reduced ? 0.4 : 1.4,
        ease: 'expo.out',
        stagger: reduced ? 0 : stagger,
        delay,
        clearProps: 'filter,transform',
      }
      gsap.set(parts, from)
      el.style.visibility = 'visible'
      if (immediate) gsap.to(parts, to)
      else gsap.to(parts, { ...to, scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
    },
    { scope: ref },
  )

  const content =
    words && typeof children === 'string'
      ? children.split(/(\s+)/).map((w, i) =>
          /\s+/.test(w) ? (
            w
          ) : (
            <span key={i} data-reveal-part className="inline-block will-change-[filter,transform]">
              {w}
            </span>
          ),
        )
      : children

  return (
    <Tag ref={ref} id={id} data-reveal className={className}>
      {content}
    </Tag>
  )
}
