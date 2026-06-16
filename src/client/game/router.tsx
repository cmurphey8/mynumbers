import { createContext, useContext, useState, useEffect, useCallback, ReactNode, AnchorHTMLAttributes } from "react"

interface RouterContextValue {
  path: string
  navigate: (to: string) => void
  basename: string
  syncWithHistory: boolean
}

const RouterContext = createContext<RouterContextValue>({
  path: "/",
  navigate: () => {},
  basename: "",
  syncWithHistory: false,
})

/** Append a path segment to a pathname, e.g. ("/games", "explainer") -> "/games/explainer". */
export function appendSegment(pathname: string, segment: string): string {
  const base = pathname.replace(/\/+$/, "")
  return `${base}/${segment}`
}

/** Remove a trailing path segment from a pathname, e.g. ("/games/explainer", "explainer") -> "/games". */
export function stripSegment(pathname: string, segment: string): string {
  const base = pathname.replace(/\/+$/, "")
  const suffix = `/${segment}`
  return (base.endsWith(suffix) ? base.slice(0, -suffix.length) : base) || "/"
}

/** Join a basename with an app-relative path, e.g. ("/arithmix", "/explainer") -> "/arithmix/explainer". */
function withBasename(basename: string, to: string): string {
  if (!basename) return to
  return `${basename}${to === "/" ? "" : to}` || "/"
}

/** Strip a basename from an absolute pathname, returning the app-relative path. */
function stripBasename(pathname: string, basename: string): string {
  if (!basename) return pathname
  if (pathname === basename) return "/"
  if (pathname.startsWith(`${basename}/`)) return pathname.slice(basename.length)
  return pathname
}

interface RouterProps {
  children: ReactNode
  /**
   * Starting app-relative path. In the default (embedding-safe) mode this is
   * the initial in-memory route. When `syncWithHistory` is set the initial
   * path is read from the URL instead and this is ignored.
   */
  initialPath?: string
  /**
   * URL prefix the app lives under when `syncWithHistory` is enabled, e.g.
   * "/arithmix". Route paths and navigation targets are always app-relative
   * ("/", "/explainer"); the basename is only used to read/write the browser
   * URL. Ignored in the default in-memory mode.
   */
  basename?: string
  /**
   * When true the router reads from and writes to `window.location`/history,
   * for use as a standalone app that owns the page URL. When false (default)
   * the router keeps its path purely in memory, so embedding it never depends
   * on — or mutates — the host page's URL.
   */
  syncWithHistory?: boolean
}

export function Router({
  children,
  initialPath = "/",
  basename = "",
  syncWithHistory = false,
}: RouterProps) {
  const [path, setPath] = useState(() =>
    syncWithHistory ? stripBasename(window.location.pathname, basename) : initialPath
  )

  useEffect(() => {
    if (!syncWithHistory) return
    const onPop = () => setPath(stripBasename(window.location.pathname, basename))
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [syncWithHistory, basename])

  const navigate = useCallback((to: string) => {
    if (syncWithHistory) {
      window.history.pushState(null, "", withBasename(basename, to))
    }
    setPath(to)
  }, [syncWithHistory, basename])

  return (
    <RouterContext.Provider value={{ path, navigate, basename, syncWithHistory }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useNavigate() {
  return useContext(RouterContext).navigate
}

export function usePath() {
  return useContext(RouterContext).path
}

/** Whether the enclosing router owns the browser URL (standalone) or the host app does (embedded). */
export function useSyncWithHistory() {
  return useContext(RouterContext).syncWithHistory
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string
  children?: ReactNode
}

export function Link({ to, children, onClick, ...rest }: LinkProps) {
  const { navigate, basename } = useContext(RouterContext)
  return (
    <a
      href={withBasename(basename, to)}
      onClick={(e) => {
        e.preventDefault()
        onClick?.(e)
        navigate(to)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}

interface RouteProps {
  path: string
  element: ReactNode
}

export function Route(_props: RouteProps): null {
  return null
}

export function Routes({ children }: { children: ReactNode }) {
  const { path } = useContext(RouterContext)
  const routes = (Array.isArray(children) ? children : [children])
    .filter(Boolean)
    .map((child: any) => ({ path: child.props.path, element: child.props.element }))
  // Match the current path exactly, then fall back to an explicit catch-all
  // (`path="*"`) if one is provided. Unmatched paths render nothing rather than
  // silently showing the first route, which would otherwise make the rendered
  // page depend on the host's URL when embedded.
  const match =
    routes.find((r: RouteProps) => r.path === path) ??
    routes.find((r: RouteProps) => r.path === "*")
  return <>{match?.element ?? null}</>
}
