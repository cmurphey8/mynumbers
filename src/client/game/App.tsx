import { useEffect, useRef } from "react"
import styled from "@emotion/styled"
import { useGameState } from "./context/GameContext"
import { GameHeader } from "./components/GameHeader"
import { TemplateArea } from "./components/TemplateArea"
import { Bank } from "./components/Bank"
import { Controls } from "./components/Controls"
import { HowToPlay } from "./components/HowToPlay"
import { GameOverModal } from "./components/Modals"
import { Countdown } from "./components/Countdown"
import { useTimer } from "./hooks/useTimer"
import { useGameActions } from "./hooks/useGameActions"
import { useGameSize } from "./hooks/useGameSize"

const Page = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--am-page-pad);
  box-sizing: border-box;
`

/** Board on the left, "How to play" on the right; stacked on small screens. */
const Container = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--am-col-gap);
  width: 100%;
  max-width: var(--am-container-max);
  margin: var(--am-container-margin) auto;

  [data-am-size="small"] & {
    flex-direction: column;
  }
`

const Left = styled.div`
  display: flex;
  flex: 1 0 0;
  flex-direction: column;
  min-width: 0;
  width: 100%;
`

const Sidebar = styled.div`
  display: flex;
  flex: none;
  width: var(--am-sidebar-w);
`

/** Positioning context for the countdown, which sits over the board. */
const BoardWrapper = styled.div`
  position: relative;
  width: 100%;
`

const Board = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--am-board-gap);
  width: 100%;
  padding: var(--am-board-pad-y) var(--am-board-pad-x);
  box-sizing: border-box;
  border-radius: var(--am-radius) var(--am-radius) 0 0;
  background: var(--am-white);
  box-shadow: var(--am-card-shadow);
`

export function App() {
  const state = useGameState()
  useTimer()
  const size = useGameSize()
  const { generatePuzzle, checkPuzzle, startCountdown, playAgain } = useGameActions()

  const prevSlotValuesRef = useRef(state.slotValues)

  // Generate a puzzle whenever a mode is active but has none — on entering a
  // mode, and again after switching or restarting (both clear the puzzle).
  // The ref keeps a failed generation from retrying in a loop; it clears as
  // soon as a puzzle lands.
  const hasGenerated = useRef(false)
  useEffect(() => {
    if (state.mode && !state.puzzle && !hasGenerated.current) {
      hasGenerated.current = true
      generatePuzzle()
    }
    if (state.puzzle || !state.mode) {
      hasGenerated.current = false
    }
  }, [state.mode, state.puzzle, generatePuzzle])

  // Auto-check when all slots are filled
  useEffect(() => {
    if (prevSlotValuesRef.current !== state.slotValues) {
      prevSlotValuesRef.current = state.slotValues
      const allFilled = state.slotValues.length > 0 && state.slotValues.every(v => v !== null)
      if (allFilled && !state.showCountdown) {
        checkPuzzle()
      }
    }
  }, [state.slotValues, state.showCountdown, checkPuzzle])

  // START_RUSH raises showCountdown, which is the single trigger for the
  // countdown overlay; running it from the flag rather than from the click
  // keeps every entry point (mode buttons, Play Again) on the same path. The
  // cleanup cancels a countdown that is torn down early, e.g. by Restart.
  useEffect(() => {
    if (!state.showCountdown) return
    return startCountdown()
  }, [state.showCountdown, startCountdown])

  return (
    <Page data-am-size={size}>
      <Container inert={state.showGameOverModal ? true : undefined}>
        <Left>
          <BoardWrapper>
            {/* Locked while the countdown runs: no tiles move before "GO!". */}
            <Board inert={state.showCountdown ? true : undefined}>
              <GameHeader />
              <TemplateArea />
              <Bank />
            </Board>
            <Countdown />
          </BoardWrapper>

          <Controls />
        </Left>

        <Sidebar>
          <HowToPlay />
        </Sidebar>
      </Container>

      <GameOverModal onPlayAgain={playAgain} />
    </Page>
  )
}
