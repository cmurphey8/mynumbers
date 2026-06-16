import styled from "@emotion/styled"
import { useGameState, useGameDispatch } from "../context/GameContext"

const Wrapper = styled.div`
  display: flex;
  gap: var(--am-gap);
  justify-content: center;
  margin-top: 8px;
`

const Btn = styled.button<{ $caution?: boolean }>`
  padding: var(--am-btn-pad);
  border-radius: 8px;
  border: none;
  background: ${p => p.$caution ? "#92400e" : "#111827"};
  color: white;
  cursor: pointer;
  font-weight: 700;
  font-size: var(--am-btn-font);
  transition: opacity 150ms;

  &:hover {
    ${p => p.$caution ? "background: #78350f;" : ""}
  }
`

interface ControlsProps {
  onNewPuzzle: () => void
  onEndRush: () => void
}

export function Controls({ onNewPuzzle, onEndRush }: ControlsProps) {
  const { mode } = useGameState()
  const dispatch = useGameDispatch()

  const isRush = mode === "rush3" || mode === "rush5"

  return (
    <Wrapper>
      <Btn onClick={() => dispatch({ type: "RESET_SLOTS" })}>
        Reset
      </Btn>
      {!isRush && (
        <Btn onClick={onNewPuzzle}>
          New Puzzle
        </Btn>
      )}
      {isRush && (
        <Btn
          $caution
          onClick={() => {
            if (confirm("End this rush session?")) onEndRush()
          }}
        >
          End Rush
        </Btn>
      )}
      <Btn
        $caution
        onClick={() => dispatch({ type: "SHOW_MENU" })}
      >
        Menu
      </Btn>
    </Wrapper>
  )
}
