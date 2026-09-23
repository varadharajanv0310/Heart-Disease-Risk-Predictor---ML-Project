import { Hero } from '@/components/landing/Hero'
import { FinalCta, HeartAge, How, LandingScene, Measure, Why, WhyIntro } from '@/components/landing/Sections'
import { TornReveal } from '@/components/landing/TornReveal'

export default function Home() {
  return (
    <>
      <LandingScene />
      <TornReveal hero={<Hero />} reveal={<WhyIntro />} />
      {/* Without the tear (reduced motion), section 01 opens with the same statistic. */}
      <div aria-hidden className="h-[100svh] motion-safe:hidden">
        <WhyIntro />
      </div>
      <Why />
      <Measure />
      <How />
      <HeartAge />
      <FinalCta />
    </>
  )
}
