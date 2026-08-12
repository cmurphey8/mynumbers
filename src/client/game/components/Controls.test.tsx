import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Controls } from "./Controls"
import { renderWithGame, StateProbe } from "../testUtils"

describe("Controls", () => {
  it("offers both rush lengths in practice mode", () => {
    renderWithGame(<Controls />, { actions: [{ type: "START_PRACTICE" }] })
    expect(screen.getByRole("button", { name: "3-Min Rush" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "5-Min Rush" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Practice" })).not.toBeInTheDocument()
  })

  it("offers practice and the other rush length while in a rush", () => {
    renderWithGame(<Controls />, { actions: [{ type: "START_RUSH", minutes: 3 }] })
    expect(screen.getByRole("button", { name: "Practice" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "5-Min Rush" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "3-Min Rush" })).not.toBeInTheDocument()
  })

  it("switches mode when another challenge is picked", async () => {
    const user = userEvent.setup()
    renderWithGame(
      <>
        <Controls />
        <StateProbe />
      </>,
      { actions: [{ type: "START_PRACTICE" }] },
    )

    await user.click(screen.getByRole("button", { name: "5-Min Rush" }))
    expect(screen.getByTestId("state-probe")).toHaveAttribute("data-mode", "rush5")
  })

  it("opens the session-complete modal on Restart in practice mode", async () => {
    const user = userEvent.setup()
    renderWithGame(
      <>
        <Controls />
        <StateProbe />
      </>,
      { actions: [{ type: "START_PRACTICE" }] },
    )

    await user.click(screen.getByRole("button", { name: "Restart" }))
    const probe = screen.getByTestId("state-probe")
    expect(probe).toHaveAttribute("data-game-over", "true")
    expect(probe).toHaveAttribute("data-mode", "practice")
  })

  it("stops the clock and opens the modal on Restart in rush mode", async () => {
    const user = userEvent.setup()
    renderWithGame(
      <>
        <Controls />
        <StateProbe />
      </>,
      {
        actions: [
          { type: "START_RUSH", minutes: 3 },
          { type: "SET_RUSH_STARTED", started: true },
        ],
      },
    )

    await user.click(screen.getByRole("button", { name: "Restart" }))
    const probe = screen.getByTestId("state-probe")
    expect(probe).toHaveAttribute("data-game-over", "true")
    expect(probe).toHaveAttribute("data-rush-started", "false")
  })
})
