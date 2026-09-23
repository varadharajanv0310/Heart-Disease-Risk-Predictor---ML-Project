/**
 * Encodes answers into a URL *fragment* (after "#"). Browsers never send the
 * fragment to a server, so the printable report link — and its QR code —
 * carries the data without it ever leaving the devices that open it.
 *
 * Format (kept short so the QR code stays easy to scan):
 *   "2." + unit flags + positional fields, joined by "~"
 * Choices use one letter; numbers keep two decimals (≤0.005 mg/dL — far below
 * anything that could move a displayed result).
 */
import type { Prefs } from './answers-store'
import type { Answers } from './risk/assess'

type Field = { key: keyof Answers; kind: 'num' | 'choice' }

const FIELDS: Field[] = [
  { key: 'symptoms', kind: 'choice' },
  { key: 'history', kind: 'choice' },
  { key: 'age', kind: 'num' },
  { key: 'sex', kind: 'choice' },
  { key: 'pregnant', kind: 'choice' },
  { key: 'sbp', kind: 'num' },
  { key: 'bpTreated', kind: 'choice' },
  { key: 'totalCholesterol', kind: 'num' },
  { key: 'hdl', kind: 'num' },
  { key: 'statin', kind: 'choice' },
  { key: 'diabetes', kind: 'choice' },
  { key: 'smoker', kind: 'choice' },
  { key: 'heightCm', kind: 'num' },
  { key: 'weightKg', kind: 'num' },
  { key: 'egfr', kind: 'num' },
  { key: 'southAsian', kind: 'choice' },
  { key: 'familyHistory', kind: 'choice' },
]

const CHOICE: Record<string, string> = { yes: 'y', no: 'n', unsure: 'u', skip: 's', female: 'f', male: 'm' }
const UNCHOICE: Record<string, string> = Object.fromEntries(Object.entries(CHOICE).map(([k, v]) => [v, k]))

export function encodeReport(answers: Answers, prefs: Prefs): string {
  const parts = FIELDS.map(({ key, kind }) => {
    const v = answers[key]
    if (v === undefined) return ''
    if (v === 'unknown') return '?'
    if (typeof v === 'number') return String(Math.round(v * 100) / 100)
    return kind === 'choice' ? (CHOICE[v] ?? '') : ''
  })
  const units = `${prefs.chol === 'mmol' ? 'o' : 'g'}${prefs.body === 'imperial' ? 'i' : 'm'}`
  return `2.${units}~${parts.join('~')}`.replace(/~+$/, '')
}

export function decodeReport(hash: string): { answers: Answers; prefs: Partial<Prefs> } | null {
  let raw: string
  try {
    raw = decodeURIComponent(hash.replace(/^#/, ''))
  } catch {
    return null
  }
  if (!raw.startsWith('2.')) return null
  const [units = '', ...parts] = raw.slice(2).split('~')
  if (!/^[go][mi]$/.test(units)) return null
  const answers: Record<string, unknown> = {}
  for (let i = 0; i < FIELDS.length; i++) {
    const { key, kind } = FIELDS[i]!
    const p = parts[i]
    if (p === undefined || p === '') continue
    if (p === '?') {
      answers[key] = 'unknown'
      continue
    }
    if (kind === 'choice') {
      const c = UNCHOICE[p]
      if (!c) return null
      answers[key] = c
    } else {
      const n = Number(p)
      if (!Number.isFinite(n)) return null
      answers[key] = n
    }
  }
  return {
    answers: answers as Answers,
    prefs: { chol: units[0] === 'o' ? 'mmol' : 'mgdl', body: units[1] === 'i' ? 'imperial' : 'metric' },
  }
}
