/** `next/link` for the artifact build: a plain anchor pointing at a hash route. */
import { type AnchorHTMLAttributes, type ReactNode, type Ref } from 'react'
import { toHash } from './router'

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string
  children?: ReactNode
  ref?: Ref<HTMLAnchorElement>
  prefetch?: unknown
  replace?: unknown
  scroll?: unknown
  transitionTypes?: unknown
}

export default function Link({ href, prefetch, replace, scroll, transitionTypes, ...rest }: Props) {
  void prefetch
  void replace
  void scroll
  void transitionTypes
  return <a href={toHash(href)} {...rest} />
}
