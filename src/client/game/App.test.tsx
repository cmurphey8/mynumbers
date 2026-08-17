import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GameProvider } from "./context/GameContext"
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
