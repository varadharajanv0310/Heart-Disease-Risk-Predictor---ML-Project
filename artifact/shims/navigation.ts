/** `next/navigation` for the artifact build, backed by the hash router. */
import { navigate, useRoutePath } from './router'

export const usePathname = useRoutePath

const router = {
  push: (href: string) => navigate(href),
  replace: (href: string) => navigate(href),
  back: () => window.history.back(),
  forward: () => window.history.forward(),
  refresh: () => undefined,
  prefetch: () => undefined,
}

export function useRouter() {
  return router
}
