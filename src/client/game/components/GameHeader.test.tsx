import { screen } from "@testing-library/react"
import { GameHeader } from "./GameHeader"
import { renderWithGame } from "../testUtils"

describe("GameHeader", () => {
  it("names the current mode", () => {
    renderWithGame(<GameHeader />, { actions: [{ type: "START_PRACTICE" }] })
    expect(screen.getByText("Practice")).toBeInTheDocument()
  })

  it("shows the level as puzzlesSolved + 1", () => {
    renderWithGame(<GameHeader />, {
      actions: [
        { type: "START_RUSH", minutes: 5 },
        { type: "INCREMENT_SOLVED" },
        { type: "INCREMENT_SOLVED" },
      ],
    })
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("formats the remaining time as m:ss in rush mode", () => {
    renderWithGame(<GameHeader />, {
      actions: [{ type: "START_RUSH", minutes: 3 }],
    })
    // 3 minutes -> 180 seconds -> "3:00"
    expect(screen.getByRole("timer")).toHaveTextContent("3:00")
  })

  it("hides the timer in practice mode", () => {
    renderWithGame(<GameHeader />, { actions: [{ type: "START_PRACTICE" }] })
    expect(screen.queryByRole("timer")).not.toBeInTheDocument()
  })
})
