'use client'

import { useEffect } from 'react'
import { setScene } from '@/lib/scene-store'

/** Puts the 3D scene into its quiet, heavily blurred state for reading pages. */
export function QuietScene() {
  useEffect(() => {
    setScene({ mode: 'quiet', blur: 1, intensity: 0.3, visible: true })
  }, [])
  return null
}
