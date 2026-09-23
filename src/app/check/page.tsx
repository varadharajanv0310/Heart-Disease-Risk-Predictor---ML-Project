import type { Metadata } from 'next'
import { Assessment } from '@/components/assess/Assessment'

export const metadata: Metadata = {
  title: 'Heart check',
  description: 'Twelve questions, one at a time. Computed on your device.',
}

export default function CheckPage() {
  return <Assessment />
}
