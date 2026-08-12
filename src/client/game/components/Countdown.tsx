import styled from "@emotion/styled"
import { keyframes } from "@emotion/react"
import { useGameState } from "../context/GameContext"

const pop = keyframes`
  0%   { transform: scale(1.25); opacity: 0; }
  30%  { transform: scale(1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`

/**
 * Sits over the board (its nearest positioned ancestor), not the viewport —
 * the design shows the game still visible around it.
 */
const Panel = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: min(300px, 90%);
  height: min(269px, 90%);
  box-sizing: border-box;
  padding: 24px;
  border-radius: 32px;
  background: rgba(0, 0, 0, 0.8);
  color: var(--am-white);
  text-align: center;
  text-shadow: 0 6px 24px rgba(37, 38, 43, 0.24), 0 2px 4px rgba(37, 38, 43, 0.1);
  pointer-events: none;
`

/** Headline/H4, pinned to the panel's top-left corner as in the design. */
const Label = styled.p`
  position: absolute;
  top: 21px;
  left: 27px;
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 30px;
`

const Value = styled.p<{ $long: boolean }>`
  margin: 0;
  font-size: ${p => (p.$long ? "64px" : "96px")};
  font-weight: 700;
  line-height: 60px;
  animation: ${pop} 300ms ease-out both;
`

export function Countdown() {
  const { showCountdown, countdownNumber } = useGameState()

  if (!showCountdown) return null

  const text = String(countdownNumber)

  return (
    <Panel role="status" aria-live="assertive">
      <Label>Rush in...</Label>
      <Value key={text} $long={text.length > 1}>
        {text}
      </Value>
    </Panel>
  )
}
