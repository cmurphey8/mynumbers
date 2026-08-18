import { act, render, screen } from "@testing-library/react"
import { useEffect, type Dispatch } from "react"
import { GameProvider, useGameState, useGameDispatch } from "../context/GameContext"
import { useTimer } from "./useTimer"
import type { GameAction } from "../types"

function Harness({ onDispatch }: { onDispatch: (d: Dispatch<GameAction>) => void }) {
  const state = useGameState()
  const dispatch = useGameDispatch()
  useTimer()

  onDispatch(dispatch)

  useEffect(() => {
    dispatch({ type: "START_RUSH", minutes: 3 })
    dispatch({ type: "SET_RUSH_STARTED", started: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <span
      data-testid="probe"
      data-time={state.timeRemaining}
      data-rush-started={String(state.rushStarted)}
    />
  )
}

function renderTimer() {
  let latest: Dispatch<GameAction> = () => {}
  render(
    <GameProvider>
      <Harness onDispatch={d => (latest = d)} />
    </GameProvider>,
  )
  return {
    dispatch: (action: GameAction) => act(() => latest(action)),
    tick: (ms: number) => act(() => vi.advanceTimersByTime(ms)),
    time: () => Number(screen.getByTestId("probe").getAttribute("data-time")),
    started: () => screen.getByTestId("probe").getAttribute("data-rush-started"),
  }
}

describe("useTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("counts down while the rush is live", () => {
    const { tick, time } = renderTimer()

    tick(3000)

    expect(time()).toBe(177)
  })

  // Restart raises the summary mid-rush. Time spent behind a dialog the player
  // cannot play through would be time taken from them.
  it("holds the clock while the summary is up and picks it up again after", () => {
    const { dispatch, tick, time, started } = renderTimer()

    tick(2000)
    expect(time()).toBe(178)

    dispatch({ type: "SHOW_GAME_OVER_MODAL" })
    tick(5000)
    expect(time()).toBe(178)

    dispatch({ type: "HIDE_GAME_OVER_MODAL" })
    expect(started()).toBe("true")
    tick(2000)
    expect(time()).toBe(176)
  })

  it("ends the rush when the clock runs out", () => {
    const { dispatch, tick, time, started } = renderTimer()

    dispatch({ type: "TICK_TIMER" })
    tick(180_000)

    expect(time()).toBe(0)
    expect(started()).toBe("false")
  })
})
