import { act, render, screen } from "@testing-library/react"
import { useEffect, type ReactNode } from "react"
import { GameProvider, useGameState, useGameDispatch } from "../context/GameContext"
import { useGameActions } from "./useGameActions"
import type { GameAction, GameMode, Puzzle } from "../types"

// 2 + 3 = 5, with 9 left over in the bank.
const PUZZLE: Puzzle = {
  target: 5,
  numbers: [2, 3, 9],
  template_tokens: ["{0}", "+", "{1}"],
  num_placeholders: 2,
  solution_expr: null,
}

const BANK = [2, 3, 9].map((value, i) => ({
  id: `t${i}`,
  value,
  placedInSlot: null,
}))

/**
 * Drives the hook the way the board does — seed a session, fill both slots
 * with the solution, then check — and exposes the resulting puzzle so a test
 * can tell whether a new one was handed out.
 */
function Harness({ mode }: { mode: GameAction }) {
  const state = useGameState()
  const dispatch = useGameDispatch()
  const { checkPuzzle } = useGameActions()

  useEffect(() => {
    dispatch(mode)
    dispatch({ type: "SET_PUZZLE", puzzle: PUZZLE, bankItems: BANK })
    dispatch({ type: "PLACE_TILE", tileId: "t0", slotIndex: 0 })
    dispatch({ type: "PLACE_TILE", tileId: "t1", slotIndex: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <button type="button" data-testid="probe" data-bank={state.bankItems[0]?.id} onClick={checkPuzzle}>
      {state.result?.text ?? ""}
    </button>
  )
}

/**
 * The seeded bank ids identify the seeded puzzle; a generated one always
 * carries freshly minted ids, so the board having moved on is unambiguous —
 * unlike a target, which a new puzzle could repeat by chance.
 */
function renderHarness(mode: GameAction): { solve: () => void; bankId: () => string | null } {
  render(
    <GameProvider>
      <Harness mode={mode} />
    </GameProvider>,
  )
  const probe = () => screen.getByTestId("probe")
  return {
    solve: () => act(() => probe().click()),
    bankId: () => probe().getAttribute("data-bank"),
  }
}

describe("useGameActions", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Practice is the mode the game opens in, so without this a session ends
  // after a single puzzle.
  it.each<[string, GameMode, GameAction]>([
    ["practice", "practice", { type: "START_PRACTICE" }],
    ["rush", "rush3", { type: "START_RUSH", minutes: 3 }],
  ])("hands out the next puzzle after a correct answer in %s", (_label, _mode, action) => {
    const { solve, bankId } = renderHarness(action)
    expect(bankId()).toBe("t0")

    solve()
    expect(screen.getByTestId("probe")).toHaveTextContent("Correct!")
    // Still the solved board: the answer stays up long enough to be read.
    expect(bankId()).toBe("t0")

    act(() => {
      vi.advanceTimersByTime(900)
    })
    expect(bankId()).not.toBe("t0")
  })
})
