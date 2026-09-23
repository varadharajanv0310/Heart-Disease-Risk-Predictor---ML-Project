import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import type { ReactNode } from 'react'
import { Cursor } from '@/components/chrome/Cursor'
import { Footer } from '@/components/chrome/Footer'
import { Loader } from '@/components/chrome/Loader'
import { Nav } from '@/components/chrome/Nav'
import { SmoothScroll } from '@/components/chrome/SmoothScroll'
import { SceneHost } from '@/components/scene/SceneHost'
import { brand, nav } from '@/content/copy'
import { color, tokensToCss } from '@/design/tokens'
import './globals.css'

const interTight = localFont({
  src: '../../node_modules/@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-inter-tight',
  display: 'swap',
  preload: true,
  fallback: ['ui-sans-serif', 'system-ui', 'Helvetica Neue', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
})

const silkscreen = localFont({
  src: [
    { path: '../../node_modules/@fontsource/silkscreen/files/silkscreen-latin-400-normal.woff2', weight: '400' },
    { path: '../../node_modules/@fontsource/silkscreen/files/silkscreen-latin-700-normal.woff2', weight: '700' },
  ],
  variable: '--font-silkscreen',
  display: 'swap',
  preload: false,
  fallback: ['ui-monospace', 'monospace'],
})

export const metadata: Metadata = {
  title: { default: `${brand.name} — ${brand.tagline}`, template: `%s · ${brand.name}` },
  description: brand.description,
  applicationName: brand.name,
  robots: { index: true, follow: true },
  openGraph: { title: `${brand.name} — ${brand.tagline}`, description: brand.description, type: 'website' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: color.paper,
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
}

/** Runs before paint: marks JS, and hides the intro loader for returning sessions. */
const bootScript = `(function(){var d=document.documentElement;d.classList.add('js');try{if(sessionStorage.getItem('focal.intro'))d.classList.add('loader-seen')}catch(e){d.classList.add('loader-seen')}})();`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${interTight.variable} ${silkscreen.variable}`} suppressHydrationWarning>
      <head>
        <style id="focal-tokens" dangerouslySetInnerHTML={{ __html: tokensToCss() }} />
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <noscript>
          <style>{`[data-loader]{display:none!important}`}</style>
        </noscript>
      </head>
      <body className="bg-paper text-blood">
        <a href="#main" className="sr-only-focusable left-4 top-4 z-[90] rounded-pill bg-signal px-5 py-3 text-sm font-medium text-white">
          {nav.skip}
        </a>
        <SceneHost />
        <div className="grain" aria-hidden="true" />
        <Nav />
        <main id="main" tabIndex={-1} className="relative z-10 outline-none">
          {children}
        </main>
        <Footer />
        <Cursor />
        <SmoothScroll />
        <Loader />
      </body>
    </html>
  )
}
