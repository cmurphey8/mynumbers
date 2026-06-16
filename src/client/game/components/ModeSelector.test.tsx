import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ModeSelector } from "./ModeSelector"
import { renderWithGame, StateProbe } from "../testUtils"

describe("ModeSelector", () => {
  it("renders the three mode buttons", () => {
    renderWithGame(<ModeSelector />)
    expect(screen.getByRole("button", { name: "Practice" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "3-Min Rush" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "5-Min Rush" })).toBeInTheDocument()
  })

  it("starts practice mode when Practice is clicked", async () => {
    const user = userEvent.setup()
    renderWithGame(
      <>
        <ModeSelector />
        <StateProbe />
      </>,
    )

    await user.click(screen.getByRole("button", { name: "Practice" }))

    const probe = screen.getByTestId("state-probe")
    expect(probe).toHaveAttribute("data-mode", "practice")
    expect(probe).toHaveAttribute("data-show-menu", "false")
  })

  it("starts a 3-minute rush when 3-Min Rush is clicked", async () => {
    const user = userEvent.setup()
    renderWithGame(
      <>
        <ModeSelector />
        <StateProbe />
      </>,
    )

    await user.click(screen.getByRole("button", { name: "3-Min Rush" }))

    const probe = screen.getByTestId("state-probe")
    expect(probe).toHaveAttribute("data-mode", "rush3")
    expect(probe).toHaveAttribute("data-time-remaining", "180")
  })

  it("starts a 5-minute rush when 5-Min Rush is clicked", async () => {
    const user = userEvent.setup()
    renderWithGame(
      <>
        <ModeSelector />
        <StateProbe />
      </>,
    )

    await user.click(screen.getByRole("button", { name: "5-Min Rush" }))

    const probe = screen.getByTestId("state-probe")
    expect(probe).toHaveAttribute("data-mode", "rush5")
    expect(probe).toHaveAttribute("data-time-remaining", "300")
  })
})
