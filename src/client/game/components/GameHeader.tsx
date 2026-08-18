import styled from "@emotion/styled"
import { useGameState } from "../context/GameContext"
import { Result } from "./Result"
import { Icon } from "./Icon"
import clockIconUrl from "../assets/icon-clock-lg.svg"

const Title = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  word-break: break-word;
`

// Spaced with a margin rather than a flex gap so the result line — which is
// empty most of the time — costs no vertical space until it has something to say.
const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 40px;
  margin-bottom: var(--am-title-gap);
  color: var(--am-text-primary);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
`

const MetaLabel = styled.span`
  color: var(--am-text-secondary);
  font-weight: 500;
`

const MetaStrong = styled.span`
  font-weight: 700;
`

const Time = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
`

const Instruction = styled.p`
  margin: 0;
  width: 100%;
  color: var(--am-text-secondary);
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  text-align: center;
`

const MODE_LABELS: Record<string, string> = {
  practice: "Practice",
  rush3: "3-Min Rush",
  rush5: "5-Min Rush",
}

export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

/**
 * The board's title block: mode, level and (in rush) the countdown clock,
 * above the one-line instruction.
 */
export function GameHeader() {
  const { mode, timeRemaining, puzzlesSolved, result } = useGameState()
  const isRush = mode === "rush3" || mode === "rush5"

  return (
    <Title>
      <MetaRow>
        <p style={{ margin: 0 }}>
          <MetaLabel>Mode: </MetaLabel>
          {mode ? MODE_LABELS[mode] : "—"}
        </p>
        <p style={{ margin: 0 }}>
          <MetaLabel>Level: </MetaLabel>
          {/* Only rush escalates difficulty as puzzles are solved; practice
              generates every puzzle at one fixed level. */}
          <MetaStrong>{isRush ? puzzlesSolved + 1 : 1}</MetaStrong>
        </p>
        {isRush && (
          <Time role="timer" aria-label="Time remaining">
            <Icon src={clockIconUrl} size={22} inset="8.33%" />
            {formatTime(timeRemaining)}
          </Time>
        )}
      </MetaRow>
      {!result && (
        <Instruction>
          Drag or tap the numbers to fill the slots and reach the target value
        </Instruction>
      )}
      <Result />
    </Title>
  )
}
