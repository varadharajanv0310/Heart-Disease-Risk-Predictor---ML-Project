# Focal — *Your heart, in focus.*

A private heart-risk check built on the American Heart Association's **PREVENT** equations. It answers three questions: what is your 10-year chance of a heart attack or stroke, what is driving it, and what would move it. Everything is computed in the browser; nothing is sent to a server.

| | |
|---|---|
| **Headline** | 10-yr ASCVD risk, from the AHA PREVENT base equations (Khan et al., *Circulation* 2024), implemented from the published coefficients |
| **Also shown** | 10- and 30-yr total CVD and heart failure; 2026 ACC/AHA risk category; heart age (Framingham, D'Agostino 2008); counterfactual drivers; live what-ifs |
| **Honesty** | Values outside the validated ranges show *not computable*, never an extrapolated number. Unknown labs never fall back to PREVENT: they get a clearly labelled Framingham estimate instead. Symptoms, known CVD and pregnancy stop the flow with guidance |
| **Privacy** | Static export, no backend, no analytics on health inputs. Answers stay in `localStorage`. The report link and QR code carry data only in the URL `#fragment` |

## Docs
- [`docs/01-research-brief.md`](docs/01-research-brief.md): model comparison, datasets, recommendation, clinical context, competitive scan, formula and reference cases.
- [`docs/02-product-design-plan.md`](docs/02-product-design-plan.md): naming, sitemap, design tokens, motion storyboard, stack.
- `/method` in the app: the patient-facing methodology, limitations, sources and changelog.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest: risk engine + report link (82 tests)
npm run typecheck
npm run lint
npm run build      # static export → ./out  (serve with any static host)
```

Node 22+. There are no environment variables and no server.

### Claude artifact build

```bash
npm run build:artifact   # → artifact/dist/focal.html (one self-contained page)
```

The same `src/` code is bundled as a single-page app for a claude.ai artifact. Small shims in `artifact/shims` stand in for `next/link`, `next/navigation` and `next/dynamic`, and routes become hash tokens: `#check`, `#results`, `#method`, `#method.privacy`. The artifact sandbox can't print, and its URL can't be shared by QR, so that build hides the Print button and QR codes. Everything else is identical.

## Structure

```
src/
  app/                    routes: / · /check · /results · /report · /method · 404
  components/
    chrome/               nav, footer, loader, cursor, smooth scroll
    landing/              hero, torn-paper reveal, narrative sections
    assess/               one-question-per-screen flow, fields, units
    results/              results, printable report, parts
    scene/                R3F red-blood-cell scene (lazy), static fallback
    ui/                   Frame, Button, Reveal, Magnetic, QrCode
  content/                ALL copy (copy.ts, method.ts)
  design/tokens.ts        ALL design tokens → CSS variables → Tailwind
  lib/risk/               the risk engine: pure, typed, documented, tested
```

## Risk engine (`src/lib/risk`)

| File | What |
|---|---|
| `prevent-coefficients.ts` | All 12 PREVENT base-model coefficient sets (Suppl. Tables S12A–H) |
| `prevent.ts` | Transforms, linear predictor, logistic risk, range validation |
| `framingham.ts` | Framingham lab and office models; heart age solved in closed form |
| `ckd-epi.ts` | CKD-EPI 2021 race-free eGFR (helper for people who only have creatinine) |
| `categories.ts` | 2026 ACC/AHA categories (applied to the displayed value); 2025 BP-guideline threshold |
| `drivers.ts` | Counterfactual drivers and what-if limits (the "insights" layer; no ML) |
| `assess.ts` | Answers → blocked / PREVENT / estimate, with notes |

**Verification.**
- **Coefficients:** all 234 were matched as float64 against an independent implementation (`pyprevent` 0.1.6).
- **Oracle agreement:** all 12 equations agree to <1e-13 percentage points on 240k random profiles.
- **Test suite:** reproduces the published worked example (F 50 y → 10-yr CVD 14.7%, ASCVD 9.2%, HF 8.1%; 30-yr 53.0 / 35.4 / 39.0%), both published Framingham examples (10.48%, 15.62%), 129 oracle profiles, and every range boundary.

## Quality bar (checked on the production build)
- **Lighthouse (mobile, simulated throttling):** Performance 92–93, Accessibility 100, Best Practices 100, SEO 100 (`/results` and `/report` are `noindex` on purpose).
- **Keyboard-only:** the full assessment completes with Enter / Esc / arrows. Focus moves to each new question, and the result matches the published reference case.
- **Accessibility:**
  - Risk level is conveyed by label, position and glyph, never by colour alone.
  - Every input has an accessible name.
  - The 3D canvas is `aria-hidden`.
  - Contrast was checked: small red text uses `ink-red` #C4000D (5.65:1 on paper).
- **Reduced motion:** transforms become fades, the 3D scene freezes, and there is no pinned tear.
- **3D performance:**
  - Lazy-loaded on first interaction, over a server-rendered static cell.
  - DPR clamped, with a `PerformanceMonitor` step-down.
  - Paused when the tab is hidden or the scene is fully covered.
  - Static fallback for Save-Data, low-memory devices or no WebGL; errors are caught by a boundary.

## Not medical advice
Focal is an educational tool. It is not a diagnosis and not a substitute for a clinician. It is valid only for adults aged 30–79 without known cardiovascular disease. It is not affiliated with or endorsed by the American Heart Association.
