import { screen } from "@testing-library/react"
import { Countdown } from "./Countdown"
import { renderWithGame } from "../testUtils"

describe("Countdown", () => {
  it("renders nothing when the countdown is hidden", () => {
    const { container } = renderWithGame(<Countdown />)
    expect(container).toBeEmptyDOMElement()
  })

  it("counts a rush in instead of asking the player to confirm", () => {
    renderWithGame(<Countdown />, { actions: [{ type: "START_RUSH", minutes: 3 }] })
    expect(screen.getByText("Rush in...")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("renders the current countdown number", () => {
    renderWithGame(<Countdown />, {
      actions: [
        { type: "START_RUSH", minutes: 3 },
        { type: "SET_COUNTDOWN_NUMBER", value: 2 },
      ],
    })
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("clears once a restart ends the session", () => {
    const { container } = renderWithGame(<Countdown />, {
      actions: [{ type: "START_RUSH", minutes: 3 }, { type: "END_RUSH" }],
    })
    expect(container).toBeEmptyDOMElement()
  })
})
