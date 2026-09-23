'use client'

/*
 * three.js objects are mutated imperatively inside useFrame — the idiomatic
 * React Three Fiber pattern, which the React Compiler's immutability rules
 * don't model. Rendering stays pure; only per-frame callbacks mutate.
 */
/* eslint-disable react-hooks/immutability */

/**
 * The persistent 3D scene: a glossy red blood cell in heavy depth of field,
 * with a drifting field of smaller cells. Loaded lazily after first paint.
 */
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, DepthOfField, EffectComposer, Vignette } from '@react-three/postprocessing'
import type { DepthOfFieldEffect } from 'postprocessing'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { color } from '@/design/tokens'
import { type SceneMode, onSceneChange, sceneState } from '@/lib/scene-store'
import { seeded } from '@/lib/random'
import { createCellGeometry } from './cell-geometry'

interface Target {
  pos: [number, number, number]
  rot: [number, number, number]
  scale: number
  /** Field (background cells) presence 0…1. */
  field: number
  /** Max bokeh for this mode; multiplied by sceneState.blur. */
  bokeh: number
}

const DESKTOP: Record<SceneMode, Target> = {
  hero: { pos: [2.75, -0.85, -0.5], rot: [1.22, 0.25, 0.62], scale: 2.3, field: 0.55, bokeh: 13 },
  narrative: { pos: [-3.4, -1.2, -3], rot: [0.5, 0.6, -0.4], scale: 2.6, field: 0.8, bokeh: 16 },
  assess: { pos: [3.8, 2.4, -4], rot: [0.9, 0.3, 0.9], scale: 2.4, field: 1, bokeh: 18 },
  calculating: { pos: [0, 0, 0], rot: [1.15, 0, 0.35], scale: 2.1, field: 0.35, bokeh: 18 },
  results: { pos: [3.9, 0.6, -2.5], rot: [1.1, 0.25, 0.7], scale: 2.3, field: 0.28, bokeh: 16 },
  quiet: { pos: [3.4, -2.2, -4], rot: [0.7, 0.4, 0.2], scale: 2.4, field: 0.6, bokeh: 16 },
}

const MOBILE: Record<SceneMode, Target> = {
  // No depth of field on phones, so background cells stay sparse and away from text.
  hero: { pos: [1.35, 2.6, -2], rot: [1.12, 0.2, 0.55], scale: 1.55, field: 0, bokeh: 0 },
  narrative: { pos: [-1.4, -2.8, -5], rot: [0.5, 0.6, -0.4], scale: 1.8, field: 0.3, bokeh: 0 },
  assess: { pos: [1.6, 3.4, -5], rot: [0.9, 0.3, 0.9], scale: 1.8, field: 0.45, bokeh: 0 },
  calculating: { pos: [0, 0.4, 0], rot: [1.15, 0, 0.35], scale: 1.5, field: 0.2, bokeh: 0 },
  results: { pos: [1.7, 3.1, -3.5], rot: [1.0, 0.25, 0.7], scale: 1.6, field: 0.12, bokeh: 0 },
  quiet: { pos: [1.6, -3, -5], rot: [0.7, 0.4, 0.2], scale: 1.8, field: 0.3, bokeh: 0 },
}

const CALM = new THREE.Color('#e8001c')
const DEEP = new THREE.Color('#6a000b')
const SHEEN_CALM = new THREE.Color('#ff8c9a')
const SHEEN_DEEP = new THREE.Color('#b0001a')

/** Double-bump heartbeat envelope at 60 bpm (lub-dub). */
function heartbeat(t: number): number {
  const ph = t % 1
  const bump = (c: number, w: number) => Math.exp(-(((ph - c) / w) ** 2))
  return bump(0.08, 0.045) + 0.6 * bump(0.26, 0.05)
}

function useCellMaterial() {
  return useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: CALM.clone(),
        roughness: 0.16,
        metalness: 0.05,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        sheen: 1,
        sheenRoughness: 0.35,
        sheenColor: SHEEN_CALM.clone(),
        iridescence: 0.35,
        iridescenceIOR: 1.35,
        iridescenceThicknessRange: [120, 420],
        envMapIntensity: 1.25,
      }),
    [],
  )
}

function Cells({ mobile, reduced }: { mobile: boolean; reduced: boolean }) {
  const geometry = useMemo(() => createCellGeometry(mobile ? 40 : 72, mobile ? 64 : 112), [mobile])
  const material = useCellMaterial()
  const hero = useRef<THREE.Mesh>(null)
  const field = useRef<THREE.InstancedMesh>(null)
  const count = mobile ? 10 : 22
  const seeds = useMemo(() => {
    const rnd = seeded(7)
    return Array.from({ length: count }, () => ({
      // Most cells sit behind the focal plane (soft), a few float in front (bokeh).
      p: new THREE.Vector3((rnd() - 0.5) * 20, (rnd() - 0.5) * 11, rnd() < 0.22 ? 4.2 + rnd() * 2.2 : -13 + rnd() * 9),
      r: new THREE.Euler(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI),
      spin: new THREE.Vector3((rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.2),
      s: 0.45 + rnd() * 1.05,
      drift: rnd() * Math.PI * 2,
    }))
  }, [count])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const fieldAmount = useRef(0.5)
  const intensity = useRef(sceneState.intensity)
  const { invalidate } = useThree()

  useEffect(() => onSceneChange(() => invalidate()), [invalidate])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const target = (mobile ? MOBILE : DESKTOP)[sceneState.mode]
    const k = reduced ? 1 : 1 - Math.exp(-dt * 2.2) // expo-like damping
    const ki = reduced ? 1 : 1 - Math.exp(-dt * 1.4)

    intensity.current += (sceneState.intensity - intensity.current) * ki
    const I = intensity.current
    material.color.copy(CALM).lerp(DEEP, I)
    material.sheenColor.copy(SHEEN_CALM).lerp(SHEEN_DEEP, I)
    material.envMapIntensity = 1.35 - 0.55 * I

    const m = hero.current
    if (m) {
      const speed = 0.12 + 0.35 * I
      const px = sceneState.pointer.x
      const py = sceneState.pointer.y
      const scrollLift = sceneState.mode === 'hero' ? sceneState.scroll * 2.5 : 0
      const bob = reduced ? 0 : Math.sin(t * 0.5) * 0.12
      m.position.x += (target.pos[0] + px * 0.18 - m.position.x) * k
      m.position.y += (target.pos[1] + py * 0.12 + bob + scrollLift - m.position.y) * k
      m.position.z += (target.pos[2] - m.position.z) * k
      const rx = target.rot[0] + py * 0.28 + (reduced ? 0 : Math.sin(t * speed) * 0.08)
      const ry = target.rot[1] + px * 0.35 + (reduced ? 0 : t * speed * 0.35)
      const rz = target.rot[2] + (reduced ? 0 : Math.cos(t * speed * 0.8) * 0.06)
      m.rotation.x += (rx - m.rotation.x) * k
      m.rotation.y += (ry - m.rotation.y) * k
      m.rotation.z += (rz - m.rotation.z) * k
      const pulse =
        sceneState.mode === 'calculating' && !reduced
          ? 1 + 0.05 * heartbeat(t)
          : sceneState.mode === 'results' && !reduced
            ? 1 + 0.012 * heartbeat(t * (0.8 + 0.5 * I))
            : 1
      const base = (m.userData.base as number | undefined) ?? target.scale
      const s = base + (target.scale - base) * k
      m.userData.base = s
      m.scale.setScalar(s * pulse)
    }

    fieldAmount.current += (target.field - fieldAmount.current) * k
    const f = field.current
    if (f) {
      for (let i = 0; i < seeds.length; i++) {
        const sd = seeds[i]!
        const drift = reduced ? 0 : t * (0.05 + 0.08 * I)
        dummy.position.set(
          sd.p.x + Math.sin(drift + sd.drift) * 0.6 + sceneState.pointer.x * 0.25 * (sd.p.z + 11) * 0.06,
          sd.p.y + Math.cos(drift * 0.8 + sd.drift) * 0.5 + (sceneState.mode === 'narrative' ? -sceneState.scroll * 2 : 0),
          sd.p.z,
        )
        dummy.rotation.set(
          sd.r.x + (reduced ? 0 : t * sd.spin.x),
          sd.r.y + (reduced ? 0 : t * sd.spin.y),
          sd.r.z + (reduced ? 0 : t * sd.spin.z),
        )
        dummy.scale.setScalar(Math.max(0.0001, sd.s * fieldAmount.current))
        dummy.updateMatrix()
        f.setMatrixAt(i, dummy.matrix)
      }
      f.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
      <mesh ref={hero} geometry={geometry} material={material} position={[2.3, -0.1, 0]} scale={2.7} />
      <instancedMesh ref={field} args={[geometry, material, count]} frustumCulled={false} />
    </>
  )
}

function Focus({ mobile }: { mobile: boolean }) {
  const dof = useRef<DepthOfFieldEffect>(null)
  const bokeh = useRef(4)
  useFrame((state, dt) => {
    const e = dof.current
    if (!e) return
    const target = (mobile ? MOBILE : DESKTOP)[sceneState.mode]
    const want = target.bokeh * sceneState.blur
    bokeh.current += (want - bokeh.current) * (1 - Math.exp(-dt * 3))
    e.bokehScale = bokeh.current
    // Keep the hero cell's depth in focus; blur pulls the focal plane forward.
    const dist = state.camera.position.z - target.pos[2]
    e.cocMaterial.focusDistance = dist - sceneState.blur * 2.4
    e.cocMaterial.focusRange = 1.4
  })
  if (mobile) return null
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <DepthOfField ref={dof} focusDistance={10} focusRange={2.2} bokehScale={4} resolutionScale={0.5} />
      <Bloom mipmapBlur intensity={0.28} luminanceThreshold={0.86} luminanceSmoothing={0.2} />
      <Vignette eskil={false} offset={0.2} darkness={0.35} />
    </EffectComposer>
  )
}

/** Pauses rendering when the tab is hidden or the scene isn't visible. */
function Lifecycle({ reduced }: { reduced: boolean }) {
  const { setFrameloop, invalidate } = useThree()
  useEffect(() => {
    const update = () => {
      const active = !document.hidden && sceneState.visible
      setFrameloop(!active ? 'never' : reduced ? 'demand' : 'always')
      if (active) invalidate()
    }
    update()
    document.addEventListener('visibilitychange', update)
    const off = onSceneChange(update)
    return () => {
      document.removeEventListener('visibilitychange', update)
      off()
    }
  }, [setFrameloop, invalidate, reduced])
  return null
}

export default function Scene({
  mobile,
  reduced,
  onReady,
}: {
  mobile: boolean
  reduced: boolean
  onReady?: () => void
}) {
  const [dpr, setDpr] = useState<number>(mobile ? 1.25 : 1.5)
  return (
    <Canvas
      dpr={dpr}
      frameloop={reduced ? 'demand' : 'always'}
      camera={{ position: [0, 0, 10], fov: 30, near: 0.1, far: 60 }}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.95
        onReady?.()
      }}
      aria-hidden
      tabIndex={-1}
    >
      <color attach="background" args={[color.paper]} />
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(mobile ? 1.25 : 1.75)} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 6]} intensity={1.6} />
      <spotLight position={[-6, 2, -6]} intensity={40} angle={0.6} penumbra={1} color="#ff5a6e" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3.2} color="#ffffff" position={[0, 5, 3]} rotation-x={Math.PI / 2} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={4} color="#ffffff" position={[6, 0.5, 4]} rotation-y={-Math.PI / 2.5} scale={[2.5, 7, 1]} />
        <Lightformer form="ring" intensity={2.2} color="#ff9aaa" position={[-6, 1, 3]} rotation-y={Math.PI / 2.5} scale={3.5} />
        <Lightformer form="rect" intensity={1.6} color="#ff2a40" position={[0, -5, -2]} rotation-x={-Math.PI / 2} scale={[14, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffe6ea" position={[0, 0, -8]} scale={[16, 10, 1]} />
      </Environment>
      <Cells mobile={mobile} reduced={reduced} />
      <Focus mobile={mobile} />
      <Lifecycle reduced={reduced} />
    </Canvas>
  )
}
