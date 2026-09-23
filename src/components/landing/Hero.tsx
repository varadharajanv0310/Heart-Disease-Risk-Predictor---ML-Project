'use client'

import { hero } from '@/content/copy'
import { Arrow, ButtonLink } from '../ui/Button'
import { Frame } from '../ui/Frame'
import { Magnetic } from '../ui/Magnetic'
import { PixelDrift } from '../ui/PixelDrift'

/** Words run a pure-CSS blur→focus so the largest paint never waits for JS. */
function FocusWords({ text, start = 0, className = '' }: { text: string; start?: number; className?: string }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span key={i} className={`focus-word ${className}`} style={{ ['--i' as string]: start + i }}>
          {w}
          {' '}
        </span>
      ))}
    </>
  )
}

export function Hero() {
  const [first, second] = ['Your next ten years,', 'in focus.']
  return (
    <div className="gutter relative flex h-[100svh] min-h-[560px] flex-col pb-4 pt-20 md:pb-6 md:pt-24">
      <PixelDrift glyph="heart" blur={9} angle={-10} className="-left-[7vw] bottom-[3vh] h-[26vmin] w-[26vmin] md:h-[30vmin] md:w-[30vmin]" />
      <PixelDrift glyph="plus" blur={6} angle={8} delay={3} opacity={0.85} className="right-[26vw] top-[15vh] hidden h-[10vmin] w-[10vmin] md:block" />
      <Frame className="relative flex flex-1 flex-col justify-end" tl={hero.corners.tl} tr={hero.corners.tr} bl={hero.corners.bl} br={hero.corners.br} parallax>
        <div className="px-3 pb-20 md:px-8 md:pb-24 lg:px-12">
          <p className="micro mb-5 text-ink-red">
            <FocusWords text={hero.eyebrow} />
          </p>
          <h1 className="max-w-[12ch] text-[clamp(3.2rem,9.2vw,9.5rem)] font-medium display-tight text-blood">
            <FocusWords text={first} start={3} />
            <br />
            <FocusWords text={second} start={7} className="text-signal" />
          </h1>
          <div className="mt-7 flex flex-col gap-7 md:mt-9 md:flex-row md:items-end md:justify-between">
            <p className="max-w-[34rem] text-[clamp(1rem,1.3vw,1.2rem)] leading-snug text-blood/85">{hero.subhead}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Magnetic>
                <ButtonLink href="/check/" beat data-cursor="Begin">
                  {hero.cta}
                  <Arrow />
                </ButtonLink>
              </Magnetic>
              <ButtonLink href="#how" variant="ghost" className="bg-white/85 backdrop-blur-md">
                {hero.secondary}
              </ButtonLink>
            </div>
          </div>
        </div>
      </Frame>
      <div aria-hidden className="pointer-events-none absolute bottom-10 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-ink-red md:flex">
        <span className="micro text-[10px]">{hero.scroll}</span>
        <span className="relative h-10 w-px overflow-hidden bg-signal/20">
          <span className="cue-line absolute inset-0 bg-signal" />
        </span>
      </div>
    </div>
  )
}
