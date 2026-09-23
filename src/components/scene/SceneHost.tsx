'use client'

/**
 * Hosts the decorative 3D scene behind every page.
 *
 * - First paint never waits for WebGL: the static fallback renders on the
 *   server, and three.js is imported on the first user interaction.
 * - Low-power devices, Save-Data and missing WebGL keep the static fallback.
 * - Always aria-hidden; the scene carries no information.
 */
import dynamic from 'next/dynamic'
import { Component, type ReactNode, useEffect, useState } from 'react'
import { canRender3D, useIsMobile, useReducedMotion } from '@/hooks/use-media'
import { sceneState, setScene } from '@/lib/scene-store'
import { StaticCell } from './StaticCell'

const Scene = dynamic(() => import('./Scene'), { ssr: false })

/** If WebGL fails at runtime, quietly keep the static cell. */
class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export function SceneHost() {
  const [enabled, setEnabled] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const reduced = useReducedMotion()
  const mobile = useIsMobile()

  useEffect(() => {
    // WebGL wakes on the first sign of a person — pointer, touch, wheel, key or
    // scroll. The static cell covers first paint, so nothing waits on three.js,
    // and passive loads (crawlers, audits, background tabs) never pay for it.
    const events = ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'keydown', 'scroll'] as const
    const start = () => {
      events.forEach((e) => window.removeEventListener(e, start))
      setEnabled(true)
    }
    if (!canRender3D()) return
    events.forEach((e) => window.addEventListener(e, start, { passive: true }))
    return () => events.forEach((e) => window.removeEventListener(e, start))
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      sceneState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      sceneState.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useEffect(() => {
    if (ready) window.dispatchEvent(new Event('focal:scene-ready'))
  }, [ready])

  return (
    <div data-scene aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 select-none">
      <StaticCell className={`transition-opacity duration-[1400ms] ease-[var(--e-expo)] ${ready ? 'opacity-0' : 'opacity-100'}`} />
      {enabled && !failed && (
        <div className={`absolute inset-0 transition-opacity duration-[1400ms] ease-[var(--e-expo)] ${ready ? 'opacity-100' : 'opacity-0'}`}>
          <SceneBoundary
            onError={() => {
              setFailed(true)
              setReady(false)
            }}
          >
            <Scene
              key={mobile ? 'm' : 'd'}
              mobile={mobile}
              reduced={reduced}
              onReady={() => {
                setReady(true)
                setScene({})
              }}
            />
          </SceneBoundary>
        </div>
      )}
    </div>
  )
}
