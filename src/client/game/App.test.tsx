import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GameProvider } from "./context/GameContext"
import { renderWithGame } from "./testUtils"
import { App } from "./App"
import { puzzleRush } from "./generator"

vi.mock("./generator", async importOriginal => {
  const actual = await importOriginal<typeof import("./generator")>()
  return { ...actual, puzzleRush: vi.fn(actual.puzzleRush) }
})

const generate = vi.mocked(puzzleRush)

function renderApp() {
  render(
    <GameProvider>
      <App />
    </GameProvider>,
  )
}

describe("App puzzle generation", () => {
  beforeEach(() => {
    generate.mockReset()
  })

  describe("when the generator cannot produce a puzzle", () => {
    let consoleError: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
      generate.mockImplementation(() => {
        throw new Error("Failed to generate puzzle")
      })
    })

    afterEach(() => {
      consoleError.mockRestore()
    })

    it("reports the failure once instead of retrying in a loop", () => {
      renderApp()

      expect(screen.getByText("Failed to generate puzzle.")).toBeInTheDocument()
      expect(generate).toHaveBeenCalledTimes(1)
    })

    it("tries again when the player starts another session", async () => {
      const user = userEvent.setup()
      renderApp()
      expect(generate).toHaveBeenCalledTimes(1)

      // The board it failed to fill is the mode the game opens in, so the
      // retry has to be reachable from the controls bar.
      await user.click(screen.getByRole("button", { name: "3-Min Rush" }))

      expect(generate).toHaveBeenCalledTimes(2)
    })
  })

  it("fills the board when the generator succeeds", () => {
    renderApp()

    expect(generate).toHaveBeenCalledTimes(1)
    expect(screen.queryByText("Failed to generate puzzle.")).not.toBeInTheDocument()
    expect(screen.queryByText("Loading puzzle…")).not.toBeInTheDocument()
  })
})

/** The board is the region holding the rush clock. */
function lockedRegion(container: HTMLElement): Element | null {
  return container.querySelector("[inert]")
}

describe("App board locking", () => {
  it("leaves the board in play while a rush is running", () => {
    const { container } = renderWithGame(<App />, {
      actions: [
        { type: "START_RUSH", minutes: 3 },
        { type: "HIDE_COUNTDOWN" },
        { type: "SET_RUSH_STARTED", started: true },
      ],
    })

    expect(lockedRegion(container)).toBeNull()
  })

  // A dismissed summary is how the player looks the final board over; the
  // score it reported has to still describe that board afterwards.
  it("keeps an ended rush locked once its summary is dismissed", () => {
    const { container } = renderWithGame(<App />, {
      actions: [
        { type: "START_RUSH", minutes: 3 },
        { type: "HIDE_COUNTDOWN" },
        { type: "SET_RUSH_STARTED", started: true },
        { type: "END_RUSH" },
        { type: "HIDE_GAME_OVER_MODAL" },
      ],
    })

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(lockedRegion(container)).toContainElement(screen.getByRole("timer"))
  })

  // Restart opens the summary mid-rush; closing it is the player deciding not
  // to restart, so they get the rush back rather than a stopped one. Driven
  // through the real controls, since what Restart itself dispatches is the
  // difference between resuming and being stranded.
  it("returns the board to play when a restart's summary is closed", async () => {
    const user = userEvent.setup()
    const { container } = renderWithGame(<App />, {
      actions: [
        { type: "START_RUSH", minutes: 3 },
        { type: "HIDE_COUNTDOWN" },
        { type: "SET_RUSH_STARTED", started: true },
      ],
    })

    await user.click(screen.getByRole("button", { name: "Restart" }))
    expect(screen.getByRole("dialog", { name: "Rush Complete!" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Close" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(lockedRegion(container)).toBeNull()
  })

  it("returns the board to play when a dismissed practice summary leaves it running", () => {
    const { container } = renderWithGame(<App />, {
      actions: [
        { type: "START_PRACTICE" },
        { type: "SHOW_GAME_OVER_MODAL" },
        { type: "HIDE_GAME_OVER_MODAL" },
      ],
    })

    expect(lockedRegion(container)).toBeNull()
  })
})
