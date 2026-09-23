/** `next/dynamic` for the artifact build: React.lazy behind a silent Suspense. */
import { type ComponentType, Suspense, lazy } from 'react'

export default function dynamic<P extends object>(loader: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>, _opts?: unknown) {
  void _opts
  const Lazy = lazy(async () => {
    const m = await loader()
    return 'default' in m ? m : { default: m }
  })
  return function Dynamic(props: P) {
    return (
      <Suspense fallback={null}>
        <Lazy {...props} />
      </Suspense>
    )
  }
}
