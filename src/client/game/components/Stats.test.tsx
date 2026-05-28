import { screen } from "@testing-library/react"
import { PracticeStats, RushStats } from "./Stats"
import { renderWithGame } from "../testUtils"
import { type Puzzle } from "../types"

const puzzle: Puzzle = {
  target: 42,
  numbers: [1, 2, 3, 4, 5],
  template_tokens: ["{0}", "+", "{1}"],
  num_placeholders: 2,
  solution_expr: null,
}

describe("PracticeStats", () => {
  it("shows a placeholder target when no puzzle is loaded", () => {
    renderWithGame(<PracticeStats />)
    expect(screen.getByText("Target")).toBeInTheDocument()
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("shows the puzzle target once a puzzle is set", () => {
    renderWithGame(<PracticeStats />, {
      actions: [{ type: "SET_PUZZLE", puzzle, bankItems: [] }],
    })
    expect(screen.getByText("42")).toBeInTheDocument()
  })
})

describe("RushStats", () => {
  it("formats the remaining time as m:ss", () => {
    renderWithGame(<RushStats />, {
      actions: [{ type: "START_RUSH", minutes: 3 }],
    })
    // 3 minutes -> 180 seconds -> "3:00"
    expect(screen.getByText("3:00")).toBeInTheDocument()
  })

  it("shows the level as puzzlesSolved + 1", () => {
    renderWithGame(<RushStats />, {
      actions: [
        { type: "START_RUSH", minutes: 5 },
        { type: "INCREMENT_SOLVED" },
        { type: "INCREMENT_SOLVED" },
      ],
    })
    expect(screen.getByText("Level")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("displays the puzzle target", () => {
    renderWithGame(<RushStats />, {
      actions: [
        { type: "START_RUSH", minutes: 3 },
        { type: "SET_PUZZLE", puzzle, bankItems: [] },
      ],
    })
    expect(screen.getByText("42")).toBeInTheDocument()
  })
})
