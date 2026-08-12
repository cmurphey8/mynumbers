import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GameOverModal } from "./Modals"
import { renderWithGame, StateProbe } from "../testUtils"

describe("GameOverModal", () => {
  it("renders nothing while the session is still running", () => {
    renderWithGame(<GameOverModal onPlayAgain={vi.fn()} />, {
      actions: [{ type: "START_PRACTICE" }],
    })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("titles itself for practice and offers both rush lengths", () => {
    renderWithGame(<GameOverModal onPlayAgain={vi.fn()} />, {
      actions: [{ type: "START_PRACTICE" }, { type: "SHOW_GAME_OVER_MODAL" }],
    })
    expect(screen.getByRole("dialog", { name: "Practice Complete!" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Play Again" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "3-Min Rush" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "5-Min Rush" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Practice" })).not.toBeInTheDocument()
  })

  it("titles itself for rush and offers practice plus the other length", () => {
    renderWithGame(<GameOverModal onPlayAgain={vi.fn()} />, {
      actions: [{ type: "START_RUSH", minutes: 3 }, { type: "END_RUSH" }],
    })
    expect(screen.getByRole("dialog", { name: "Rush Complete!" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Practice" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "5-Min Rush" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "3-Min Rush" })).not.toBeInTheDocument()
  })

  it("reports the number of puzzles solved as the final score", () => {
    renderWithGame(<GameOverModal onPlayAgain={vi.fn()} />, {
      actions: [
        { type: "START_PRACTICE" },
        { type: "INCREMENT_SOLVED" },
        { type: "SHOW_GAME_OVER_MODAL" },
      ],
    })
    expect(screen.getByText("Final Score")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()
  })

  it("closes without changing mode when dismissed", async () => {
    const user = userEvent.setup()
    renderWithGame(
      <>
        <GameOverModal onPlayAgain={vi.fn()} />
        <StateProbe />
      </>,
      { actions: [{ type: "START_PRACTICE" }, { type: "SHOW_GAME_OVER_MODAL" }] },
    )

    await user.click(screen.getByRole("button", { name: "Close" }))
    const probe = screen.getByTestId("state-probe")
    expect(probe).toHaveAttribute("data-game-over", "false")
    expect(probe).toHaveAttribute("data-mode", "practice")
  })

  it("switches mode when one of the other challenges is picked", async () => {
    const user = userEvent.setup()
    renderWithGame(
      <>
        <GameOverModal onPlayAgain={vi.fn()} />
        <StateProbe />
      </>,
      { actions: [{ type: "START_PRACTICE" }, { type: "SHOW_GAME_OVER_MODAL" }] },
    )

    await user.click(screen.getByRole("button", { name: "3-Min Rush" }))
    const probe = screen.getByTestId("state-probe")
    expect(probe).toHaveAttribute("data-mode", "rush3")
    expect(probe).toHaveAttribute("data-game-over", "false")
  })
})
