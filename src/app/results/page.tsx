import type { Metadata } from 'next'
import { Results } from '@/components/results/Results'

export const metadata: Metadata = {
  title: 'Your result',
  description: 'Your estimated 10-year risk, what drives it, and what would move it.',
  robots: { index: false },
}

export default function ResultsPage() {
  return <Results />
}
