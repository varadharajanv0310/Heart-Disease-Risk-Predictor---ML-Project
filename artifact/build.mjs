/**
 * Builds Focal as one self-contained HTML page for a claude.ai artifact:
 *   1. Tailwind compiles src/app/globals.css (scanning src/ and artifact/)
 *   2. esbuild bundles artifact/main.tsx with Next.js shims
 *   3. both are inlined into artifact/dist/focal.html
 *
 * Usage: npm run build:artifact
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { build } from 'esbuild'

const dist = 'artifact/dist'
mkdirSync(dist, { recursive: true })

execFileSync('npx', ['@tailwindcss/cli', '-i', 'src/app/globals.css', '-o', `${dist}/app.css`, '--minify'], { stdio: 'inherit' })

await build({
  entryPoints: ['artifact/main.tsx'],
  outfile: `${dist}/app.js`,
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2022',
  jsx: 'automatic',
  legalComments: 'none',
  logOverride: { 'module-level-directive': 'silent' },
  alias: {
    'next/link': './artifact/shims/link.tsx',
    'next/navigation': './artifact/shims/navigation.ts',
    'next/dynamic': './artifact/shims/dynamic.tsx',
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.NEXT_PUBLIC_FOCAL_TARGET': '"artifact"',
  },
})

const css = readFileSync(`${dist}/app.css`, 'utf8')
// esbuild escapes "</script" in strings; guard the raw bundle anyway.
const js = readFileSync(`${dist}/app.js`, 'utf8').replace(/<\/script/gi, '<\\/script')
const page = readFileSync('artifact/page.html', 'utf8').replace('/*__CSS__*/', () => css).replace('/*__JS__*/', () => js)
writeFileSync(`${dist}/focal.html`, page)
console.log(`artifact/dist/focal.html  ${(page.length / 1024).toFixed(0)} KB`)
