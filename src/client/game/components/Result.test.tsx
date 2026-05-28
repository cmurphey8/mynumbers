import { screen } from "@testing-library/react"
import { Result } from "./Result"
import { renderWithGame } from "../testUtils"

describe("Result", () => {
  it("renders an empty status region when there is no result", () => {
    renderWithGame(<Result />)
    const status = screen.getByRole("status")
    expect(status).toBeInTheDocument()
    expect(status).toHaveTextContent("")
  })

  it("shows the success message text when a result is set", () => {
    renderWithGame(<Result />, {
      actions: [
        { type: "SET_RESULT", result: { text: "Correct!", type: "success" } },
      ],
    })
    expect(screen.getByRole("status")).toHaveTextContent("Correct!")
  })

  it("shows the error message text when a result is set", () => {
    renderWithGame(<Result />, {
      actions: [
        { type: "SET_RESULT", result: { text: "Try again", type: "error" } },
      ],
    })
    expect(screen.getByRole("status")).toHaveTextContent("Try again")
  })
})
