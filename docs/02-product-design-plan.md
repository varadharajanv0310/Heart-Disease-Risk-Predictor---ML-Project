# Phase 2 — Product & design plan

## Name

| Candidate | Read | Verdict |
|---|---|---|
| **Focal** | Blur resolving into focus, the core visual idea. Also "the focal point": one number, clearly seen. | **Chosen** |
| Systole | Precise and clinical, but sounds like a device | — |
| Decade | Honest about the 10-year horizon, but flat | — |
| Cadence | Heartbeat rhythm; calm, but generic | — |
| Redline | Striking, but it means "danger". Too alarmist for this voice | — |

**Why Focal:** the art direction *is* the name. Everything starts soft and out of focus, then resolves when the user acts, and the risk number is literally the focal point of the results screen. The name is short, sayable, and carries no fear.

- **Tagline:** *Your heart, in focus.*
- **Positioning:** Focal is a private, five-minute heart check that turns the American Heart Association's PREVENT equations into a number you can read and a plan you can act on.

## Sitemap

```
/            Landing: loader → hero → torn-paper reveal → 01 Why → 02 What we measure → 03 How it works → 04 Heart age → CTA → footer
/check       Assessment: safety → eligibility → 12 questions (one per screen) → review
/results     Calculating → results (hero %, category, heart age, 10/30-yr, drivers, what-if, next steps, QR)
/report      Print layout (reads the URL #fragment or local answers; nothing is sent)
/method      Methodology, sources, validity, limitations, changelog
/*           404: "This page skipped a beat."
```

**User flow:** land → "Check your heart" → symptom check (yes → emergency screen) → heart-disease history (yes → "not the right tool" screen plus next steps) → questions → review → calculating (≈1.6 s) → results → what-ifs → print / QR.

**Branches:**
- **Unknown numbers** → Framingham estimate path, clearly labelled.
- **Out-of-range values** → "not computable" for the affected outputs only.

## Design system (single source: `src/design/tokens.ts`)

**Colour.** Near-monochrome. Every red was checked for contrast.

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `signal` | #E3000F | display type, graphics, active pill | 4.91:1 on white; large text only on paper (4.43) |
| `ink-red` | #C4000D | small red text on paper or blush | 5.65:1 on paper · 6.26:1 white-on-it |
| `crimson` | #9E0012 | shadows, pressed states, deep gradient | 8.53:1 on white |
| `blood` | #1A0004 | body text | 18.1:1 on paper |
| `muted` | #6B4A4D | secondary text | 6.98:1 on paper |
| `paper` | #F4F3F1 | page | — |
| `white` | #FFFFFF | glass fill, cards | — |
| `blush` | #FBE4E5 | smoke gradients, tints | — |

**Focus ring:** 2 px `blood` outline plus a 4 px white halo, which passes 3:1 on every surface without adding a hue.

**Type.**
- **Faces:** Inter Tight (variable) for UI and headlines. Silkscreen (pixel) only for counters, readouts, step numbers and micro-accents.
- **Scale (fluid):** `micro` 11 · `xs` 12 · `sm` 14 · `base` 17 · `lg` 20 · `xl` 24 · `2xl` 28→40 · `3xl` 40→72 · `display` 56→160 · `mega` 140→420 (the giant %).
- **Tracking:** −0.04em on display sizes; +0.08em on micro caps.

**Spacing:** 4-pt base (4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192). Page gutter 16 px on mobile, 40 px on desktop.

**Radii:** `hairline` 6 (the ref 1 frame) · `card` 24 · `glass` 44 (ref 3) · `pill` 999.

**Glass:** fill `rgba(255,255,255,.34)` · `backdrop-filter: blur(28px) saturate(140%)` · 1 px border `rgba(255,255,255,.65)` · inset highlight `0 1px 0 rgba(255,255,255,.8)` · drop shadow `0 40px 80px -40px rgba(158,0,18,.35)`.

**Blur scale:** 0 · 4 · 12 · 24 · 48 px.

**Grain:** SVG turbulence at 7% opacity with `mix-blend-mode: multiply`, 8-step jitter at 12 fps. Static when motion is reduced.

**Motion.**
- **Durations:** `instant` 120 · `fast` 240 · `base` 480 · `slow` 900 · `cinematic` 1400 · `beat` 1000 (60 bpm).
- **Easings:** `expo` cubic-bezier(.16,1,.3,1) · `quint` cubic-bezier(.22,1,.36,1) · `inOut` cubic-bezier(.65,0,.35,1). No springs with overshoot.

## Motion storyboard

1. **Loader (≤2.5 s, once per session, skippable).**
   - A 1 px red hairline frame draws in.
   - An ECG trace draws across it at 60 bpm, and the pixel counter runs 000→100, tied to real readiness (fonts plus the 3D chunk) and clamped to 1.5–2.5 s.
   - A red cell sharpens from 24 px blur to 0.
   - The frame then irises open onto the hero. The page underneath is already rendered and interactive; the loader never gates content.
2. **Hero.**
   - The 3D red blood cell (Evans–Fung biconcave profile, clearcoat and sheen) sits in heavy depth of field. It drifts and tilts toward the cursor.
   - The headline resolves word by word from blur.
   - Corner micro-labels parallax at different depths.
   - The magnetic CTA pulses once per beat, every 4th beat.
3. **Torn-paper reveal.** Pinned. As you scroll, a jagged hole tears open in the hero paper, and its white ragged rim casts a soft shadow. Section 01 is visible through the hole, then the tear widens to full bleed.
4. **Narrative (01–04).**
   - Each heading goes blur → focus, and body copy fades up by line.
   - "What we measure" cards drift in on a slight stagger.
   - The "How it works" privacy line types in pixel.
   - Heart age uses two counters that slide against each other.
5. **Assessment.**
   - Frosted glass card over drifting blurred spheres; the 3D scene switches to the "spheres" state.
   - Next and back cross-blur the card (outgoing blurs and slides 24 px; incoming sharpens).
   - A thin red progress line eases with expo; the pixel step counter ticks.
6. **Calculating (≈1.6 s).**
   - The cell pulses at 60 bpm and the scene blur racks from 24 px to 0.
   - The number is counted up only once focus lands.
7. **Results.**
   - Giant % counts up in 1.4 s (expo), set inside a hairline frame (ref 1).
   - The category chip, heart-age pair and driver bars stagger in.
   - What-if sliders recompute instantly. The scene calms as risk falls (slower drift, brighter and pinker light) and deepens as it rises (crimson, heavier shadow).
8. **Reduced motion.** Every transform becomes an opacity fade. The 3D renders a single still frame, and the torn reveal is a static composed image.

## Stack (confirmed)

| Layer | Choice |
|---|---|
| Framework | Next.js 16.3 (App Router, static export, so no server ever sees data), React 19.3, TypeScript 5.9 |
| Styling | Tailwind CSS 4.3; tokens injected as CSS variables from `tokens.ts` |
| 3D | three 0.186, @react-three/fiber 9, drei 10, @react-three/postprocessing 3 (DOF, bloom, noise, vignette) |
| Motion | GSAP 3.15 + ScrollTrigger (@gsap/react), Lenis 1.3, View Transitions API (with a progressive fallback) |
| Other | `qrcode` (SVG QR), Vitest 5 (engine), Playwright (QA screenshots, keyboard pass) |
| Fonts | @fontsource-variable/inter-tight and @fontsource/silkscreen, self-hosted through next/font/local |
