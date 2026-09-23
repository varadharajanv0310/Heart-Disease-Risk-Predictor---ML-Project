import { type ReactNode, ViewTransition } from 'react'

/** Every route change cross-blurs the page (see ::view-transition-*(.page) in globals.css). */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      <div>{children}</div>
    </ViewTransition>
  )
}
