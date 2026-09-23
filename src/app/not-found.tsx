import { QuietScene } from '@/components/chrome/QuietScene'
import { Arrow, ButtonLink } from '@/components/ui/Button'
import { Frame } from '@/components/ui/Frame'
import { notFound as copy } from '@/content/copy'

export default function NotFound() {
  return (
    <div className="gutter flex min-h-[100svh] flex-col pb-6 pt-20 md:pt-24">
      <QuietScene />
      <Frame className="flex flex-1 flex-col items-center justify-center text-center" tl={['Error', copy.code]} br={['Rhythm', 'Restoring…']}>
        <p aria-hidden className="pixel text-[clamp(7rem,28vw,22rem)] leading-none text-signal">
          {copy.code}
        </p>
        <h1 className="mt-4 text-[clamp(1.8rem,4vw,3rem)] font-medium tracking-[-0.03em]">{copy.title}</h1>
        <p className="mx-auto mt-3 max-w-md px-4 text-[17px] text-blood/85">{copy.body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">{copy.home}</ButtonLink>
          <ButtonLink href="/check/" variant="ghost">
            {copy.check}
            <Arrow />
          </ButtonLink>
        </div>
      </Frame>
    </div>
  )
}
