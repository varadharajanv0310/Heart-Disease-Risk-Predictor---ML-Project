import type { Metadata } from 'next'
import { Report } from '@/components/results/Report'

export const metadata: Metadata = {
  title: 'Printable report',
  robots: { index: false },
}

export default function ReportPage() {
  return <Report />
}
