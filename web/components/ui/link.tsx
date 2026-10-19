import { createContext, useContext, type ComponentProps } from 'react'
import { Link as RouterLink, useNavigation, useResolvedPath } from 'react-router'

const LinkPendingContext = createContext(false)

/** True inside a `<Link>` while the navigation it started is still loading. */
export function useLinkPending(): boolean {
  return useContext(LinkPendingContext)
}

const EXTERNAL = /^([a-z][a-z0-9+.-]*:|\/\/)/i

type LinkProps = Omit<ComponentProps<typeof RouterLink>, 'to'> & { href: string }

/** In-app links navigate client-side; absolute URLs render a plain anchor. */
export function Link({ href, children, ...props }: LinkProps) {
  if (EXTERNAL.test(href)) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
  return (
    <InternalLink href={href} {...props}>
      {children}
    </InternalLink>
  )
}

function InternalLink({ href, children, ...props }: LinkProps) {
  const navigation = useNavigation()
  const target = useResolvedPath(href)
  const pending =
    navigation.state === 'loading' &&
    navigation.location?.pathname === target.pathname &&
    navigation.location.search === target.search

  return (
    <RouterLink to={href} {...props}>
      <LinkPendingContext.Provider value={pending}>{children}</LinkPendingContext.Provider>
    </RouterLink>
  )
}
