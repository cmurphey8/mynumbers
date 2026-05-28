import { useEffect, type ReactElement, type ReactNode } from "react"
import { render, type RenderResult } from "@testing-library/react"
import {
  GameProvider,
  useGameState,
  useGameDispatch,
} from "./context/GameContext"
import { type GameAction } from "./types"

/**
 * Dispatches a list of setup actions once on mount so a component can be
 * rendered with a specific game state.
 */
function Seed({ actions }: { actions: GameAction[] }) {
  const dispatch = useGameDispatch()
  useEffect(() => {
    actions.forEach((action) => dispatch(action))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

/**
 * Renders the given UI inside a real GameProvider. Optional `actions` are
 * dispatched before assertions so state-dependent components can be tested.
 */
export function renderWithGame(
  ui: ReactNode,
  options: { actions?: GameAction[] } = {},
): RenderResult {
  const { actions = [] } = options
  return render(
    <GameProvider>
      <Seed actions={actions} />
      {ui}
    </GameProvider>,
  )
}

/** A probe component that exposes selected state values as data attributes. */
export function StateProbe(): ReactElement {
  const state = useGameState()
  return (
    <div
      data-testid="state-probe"
      data-mode={String(state.mode)}
      data-show-menu={String(state.showMenu)}
      data-time-remaining={String(state.timeRemaining)}
    />
  )
}
