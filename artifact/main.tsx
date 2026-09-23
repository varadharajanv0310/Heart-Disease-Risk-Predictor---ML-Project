/**
 * Single-page entry for the claude.ai artifact build.
 *
 * Mirrors src/app/layout.tsx, but renders the routes client-side from a hash
 * router (see ./shims), because an artifact is one sandboxed page. The app
 * code itself is shared unchanged with the Next.js site build.
 */
import { createRoot } from 'react-dom/client'
import Home from '@/app/page'
import MethodPage from '@/app/method/page'
import NotFound from '@/app/not-found'
import { Assessment } from '@/components/assess/Assessment'
import { Cursor } from '@/components/chrome/Cursor'
import { Footer } from '@/components/chrome/Footer'
import { Loader } from '@/components/chrome/Loader'
import { Nav } from '@/components/chrome/Nav'
import { SmoothScroll } from '@/components/chrome/SmoothScroll'
import { Report } from '@/components/results/Report'
import { Results } from '@/components/results/Results'
import { SceneHost } from '@/components/scene/SceneHost'
import { nav } from '@/content/copy'
import { tokensToCss } from '@/design/tokens'
import { useRoutePath } from './shims/router'

// Same boot as the layout's inline script: mark JS, skip the intro for returning sessions.
const html = document.documentElement
html.lang = 'en'
html.classList.add('js')
try {
  if (sessionStorage.getItem('focal.intro')) html.classList.add('loader-seen')
} catch {
  html.classList.add('loader-seen')
}
const tokens = document.createElement('style')
tokens.textContent = `${tokensToCss()}:root{--font-inter-tight:'Inter Tight';--font-silkscreen:'Silkscreen'}`
document.head.appendChild(tokens)

function Page({ path }: { path: string }) {
  switch (path) {
    case '/':
      return <Home />
    case '/check/':
      return <Assessment />
    case '/results/':
      return <Results />
    case '/method/':
      return <MethodPage />
    case '/report/':
      return <Report />
    default:
      return <NotFound />
  }
}

function App() {
  const path = useRoutePath()
  return (
    <>
      <a href="#main" className="sr-only-focusable left-4 top-4 z-[90] rounded-pill bg-signal px-5 py-3 text-sm font-medium text-white">
        {nav.skip}
      </a>
      <SceneHost />
      <div className="grain" aria-hidden="true" />
      <Nav />
      <main id="main" tabIndex={-1} className="relative z-10 outline-none">
        <Page key={path} path={path} />
      </main>
      <Footer />
      <Cursor />
      <SmoothScroll />
      <Loader />
    </>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
