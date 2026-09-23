'use client'

/**
 * A small red cursor that morphs into a labelled pill over interactive
 * elements. Fine pointers only; the native caret stays on text inputs.
 * Purely decorative (aria-hidden).
 */
import { useEffect, useRef, useState } from 'react'
import { useFinePointer, useReducedMotion } from '@/hooks/use-media'

const INTERACTIVE = 'a, button, [role="button"], [role="radio"], [role="switch"], label, summary, select, input[type="range"], [data-cursor]'
const TEXT = 'input:not([type="range"]):not([type="radio"]):not([type="checkbox"]), textarea'

export function Cursor() {
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState<string | null>(null)
  const [mode, setMode] = useState<'idle' | 'hover' | 'text' | 'hidden'>('hidden')

  useEffect(() => {
    if (!fine) return
    document.documentElement.classList.add('has-custom-cursor')
    const pos = { x: -100, y: -100 }
    const lag = { x: -100, y: -100 }
    let raf = 0
    const loop = () => {
      const k = reduced ? 1 : 0.2
      lag.x += (pos.x - lag.x) * k
      lag.y += (pos.y - lag.y) * k
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
      if (ring.current) ring.current.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
      const el = e.target instanceof Element ? e.target : null
      if (!el) return
      if (el.closest(TEXT)) {
        setMode('text')
        setLabel(null)
        return
      }
      const hit = el.closest(INTERACTIVE)
      if (hit) {
        setMode('hover')
        setLabel(hit.getAttribute('data-cursor') || null)
      } else {
        setMode('idle')
        setLabel(null)
      }
    }
    const onLeave = () => setMode('hidden')
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      document.documentElement.classList.remove('has-custom-cursor')
    }
  }, [fine, reduced])

  if (!fine) return null
  const hidden = mode === 'hidden' || mode === 'text'
  return (
    <div data-cursor-root aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[70]">
      <div ref={dot} className="absolute left-0 top-0">
        <div
          className={`-translate-x-1/2 -translate-y-1/2 rounded-full bg-signal transition-[width,height,opacity] duration-300 ease-[var(--e-expo)] ${
            hidden ? 'h-0 w-0 opacity-0' : mode === 'hover' ? 'h-1.5 w-1.5' : 'h-2 w-2'
          }`}
        />
      </div>
      <div ref={ring} className="absolute left-0 top-0">
        <div
          className={`flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-all duration-500 ease-[var(--e-expo)] ${
            hidden
              ? 'h-0 w-0 border-transparent opacity-0'
              : mode === 'hover'
                ? label
                  ? 'h-9 border-signal bg-signal px-4 text-white'
                  : 'h-14 w-14 border-signal/70 bg-signal/5'
                : 'h-8 w-8 border-signal/40'
          }`}
        >
          {label && mode === 'hover' && <span className="micro whitespace-nowrap font-medium">{label}</span>}
        </div>
      </div>
    </div>
  )
}
