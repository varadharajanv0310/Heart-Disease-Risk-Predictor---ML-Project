'use client'

/**
 * Answers live only in this browser's localStorage — never on a server.
 * A tiny external store so every component reads the same snapshot.
 */
import { useSyncExternalStore } from 'react'
import type { Answers } from './risk/assess'

export type CholUnit = 'mgdl' | 'mmol'
export type BodyUnit = 'metric' | 'imperial'
export type CreatUnit = 'mgdl' | 'umol'

export interface Prefs {
  chol: CholUnit
  body: BodyUnit
  creat: CreatUnit
}

export interface StoredState {
  v: 1
  answers: Answers
  prefs: Prefs
  step: number
}

const KEY = 'focal.v1'
const EMPTY: StoredState = { v: 1, answers: {}, prefs: { chol: 'mgdl', body: 'metric', creat: 'mgdl' }, step: 0 }

let state: StoredState = EMPTY
let hydrated = false
const listeners = new Set<() => void>()

function read(): StoredState {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as StoredState
    if (parsed?.v !== 1) return EMPTY
    return { ...EMPTY, ...parsed, prefs: { ...EMPTY.prefs, ...parsed.prefs } }
  } catch {
    return EMPTY
  }
}

function write(next: StoredState) {
  state = next
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* private mode or storage full — keep working in memory */
  }
  listeners.forEach((l) => l())
}

function ensureHydrated() {
  if (!hydrated && typeof window !== 'undefined') {
    hydrated = true
    state = read()
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) {
        state = read()
        listeners.forEach((l) => l())
      }
    })
  }
}

function subscribe(cb: () => void) {
  ensureHydrated()
  listeners.add(cb)
  return () => listeners.delete(cb)
}

const getSnapshot = () => {
  ensureHydrated()
  return state
}
const getServerSnapshot = () => EMPTY

export function useStored(): StoredState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** True once the browser snapshot has been read (avoids flashing empty states). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}

export const store = {
  get: getSnapshot,
  setAnswer<K extends keyof Answers>(key: K, value: Answers[K]) {
    write({ ...getSnapshot(), answers: { ...getSnapshot().answers, [key]: value } })
  },
  patchAnswers(patch: Partial<Answers>) {
    write({ ...getSnapshot(), answers: { ...getSnapshot().answers, ...patch } })
  },
  setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    write({ ...getSnapshot(), prefs: { ...getSnapshot().prefs, [key]: value } })
  },
  setStep(step: number) {
    write({ ...getSnapshot(), step })
  },
  replaceAnswers(answers: Answers) {
    write({ ...getSnapshot(), answers })
  },
  clear() {
    try {
      window.localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
    state = EMPTY
    listeners.forEach((l) => l())
  },
}
