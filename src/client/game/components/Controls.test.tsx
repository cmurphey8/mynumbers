import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Controls } from "./Controls"
import { renderWithGame } from "../testUtils"

describe("Controls", () => {
  it("shows New Puzzle (and not End Rush) in practice mode", () => {
    renderWithGame(<Controls onNewPuzzle={vi.fn()} onEndRush={vi.fn()} />, {
      actions: [{ type: "START_PRACTICE" }],
    })
    expect(screen.getByRole("button", { name: "New Puzzle" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "End Rush" })).not.toBeInTheDocument()
  })

  it("calls onNewPuzzle when New Puzzle is clicked", async () => {
    const user = userEvent.setup()
    const onNewPuzzle = vi.fn()
    renderWithGame(
      <Controls onNewPuzzle={onNewPuzzle} onEndRush={vi.fn()} />,
      { actions: [{ type: "START_PRACTICE" }] },
    )

    await user.click(screen.getByRole("button", { name: "New Puzzle" }))
    expect(onNewPuzzle).toHaveBeenCalledTimes(1)
  })

  it("shows End Rush (and not New Puzzle) in rush mode", () => {
    renderWithGame(<Controls onNewPuzzle={vi.fn()} onEndRush={vi.fn()} />, {
      actions: [{ type: "START_RUSH", minutes: 3 }],
    })
    expect(screen.getByRole("button", { name: "End Rush" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "New Puzzle" })).not.toBeInTheDocument()
  })

  it("calls onEndRush only when the confirmation is accepted", async () => {
    const user = userEvent.setup()
    const onEndRush = vi.fn()
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false)

    renderWithGame(<Controls onNewPuzzle={vi.fn()} onEndRush={onEndRush} />, {
      actions: [{ type: "START_RUSH", minutes: 3 }],
    })

    await user.click(screen.getByRole("button", { name: "End Rush" }))
    expect(onEndRush).not.toHaveBeenCalled()

    confirmSpy.mockReturnValue(true)
    await user.click(screen.getByRole("button", { name: "End Rush" }))
    expect(onEndRush).toHaveBeenCalledTimes(1)

    confirmSpy.mockRestore()
  })

  it("always renders Reset and Menu buttons", () => {
    renderWithGame(<Controls onNewPuzzle={vi.fn()} onEndRush={vi.fn()} />, {
      actions: [{ type: "START_PRACTICE" }],
    })
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument()
  })
})
