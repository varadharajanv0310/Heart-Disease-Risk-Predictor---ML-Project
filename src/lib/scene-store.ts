'use client'

/**
 * Shared state between the DOM and the persistent 3D scene. Read inside
 * `useFrame` via `sceneState` (no React re-renders); written by pages.
 */
export type SceneMode = 'hero' | 'narrative' | 'assess' | 'calculating' | 'results' | 'quiet'

export interface SceneState {
  mode: SceneMode
  /** 0 = calm & bright (low risk) … 1 = deep & heavy (high risk). */
  intensity: number
  /** Landing-page scroll progress, 0…1. */
  scroll: number
  /** Normalised pointer, −1…1. */
  pointer: { x: number; y: number }
  /** Extra depth-of-field blur, 0 (sharp) … 1 (very soft). */
  blur: number
  /** Whether the canvas should render at all (paused when hidden). */
  visible: boolean
}

export const sceneState: SceneState = {
  mode: 'hero',
  intensity: 0.35,
  scroll: 0,
  pointer: { x: 0, y: 0 },
  blur: 0.6,
  visible: true,
}

const listeners = new Set<() => void>()

export function setScene(patch: Partial<SceneState>) {
  Object.assign(sceneState, patch)
  listeners.forEach((l) => l())
}

export function onSceneChange(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
