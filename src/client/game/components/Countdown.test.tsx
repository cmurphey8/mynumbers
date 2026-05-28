import { screen } from "@testing-library/react"
import { Countdown } from "./Countdown"
import { renderWithGame } from "../testUtils"

describe("Countdown", () => {
  it("renders nothing when the countdown is hidden", () => {
    const { container } = renderWithGame(<Countdown />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders the countdown number when shown", () => {
    renderWithGame(<Countdown />, {
      actions: [
        { type: "SHOW_COUNTDOWN" },
        { type: "SET_COUNTDOWN_NUMBER", value: 2 },
      ],
    })
    expect(screen.getByText("2")).toBeInTheDocument()
  })
})
