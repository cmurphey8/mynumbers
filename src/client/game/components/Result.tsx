import styled from "@emotion/styled"
import { useGameState } from "../context/GameContext"

// Always mounted so the live region exists before a message lands in it; with
// no message it collapses to zero height rather than reserving a blank line.
const ResultMessage = styled.div<{ $type?: string }>`
  width: 100%;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  line-height: 26px;
  word-break: break-word;
  color: ${p =>
    p.$type === "success" ? "var(--am-green)" :
    p.$type === "error" ? "var(--am-mit-red)" :
    "var(--am-text-primary)"
  };
`

export function Result() {
  const { result } = useGameState()

  if (!result) return <ResultMessage role="status" />

  return (
    <ResultMessage $type={result.type} role="status">
      {result.text}
    </ResultMessage>
  )
}
