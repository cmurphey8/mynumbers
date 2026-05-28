// ============================================================================
// Library entry — exposes the game + explainer for embedding in other apps.
//
// React consumers:   import { Arithmix } from "arithmix"
// Non-React consumers: import { mountArithmix } from "arithmix"
// ============================================================================

import { createRoot } from "react-dom/client"
import type { ReactElement } from "react"
import { Router, Routes, Route } from "../game/router"
import { GameProvider } from "../game/context/GameContext"
import { App } from "../game/App"
import { GlobalStyles } from "../game/GlobalStyles"
import { ExplainerPage as ExplainerPageInner } from "../game/components/ExplainerPage"

/**
 * Full self-contained app: the game at "/arithmix" and the explainer at "/arithmix/explainer",
 * wired together with the built-in router. Drop this in and the in-app links
 * (e.g. "How it works") navigate between the two pages automatically.
 *
 * Pass a different `basename` if the host mounts it under another URL prefix.
 */
export function Arithmix({ basename = "/arithmix" }: { basename?: string } = {}): ReactElement {
  return (
    <Router syncWithHistory basename={basename}>
      <GlobalStyles />
      <Routes>
        <Route
          path="/"
          element={
            <GameProvider>
              <App />
            </GameProvider>
          }
        />
        <Route path="/explainer" element={<ExplainerPageInner />} />
      </Routes>
    </Router>
  )
}

function resolveContainer(container: Element | string): Element {
  const el = typeof container === "string" ? document.querySelector(container) : container
  if (!el) {
    throw new Error(`Arithmix: mount container not found: ${String(container)}`)
  }
  return el
}

/** Mount a component into a DOM node. Returns a function that unmounts it. */
function mount(element: ReactElement, container: Element | string): () => void {
  const root = createRoot(resolveContainer(container))
  root.render(element)
  return () => root.unmount()
}

/** Mount the full game + explainer app. Returns an unmount function. */
export function mountArithmix(container: Element | string): () => void {
  return mount(<Arithmix />, container)
}
