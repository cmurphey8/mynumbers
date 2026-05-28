import styled from "@emotion/styled"
import { useGameState } from "../context/GameContext"

const StatsBar = styled.div`
  display: flex;
  align-items: stretch;
  margin-bottom: 12px;
  padding: var(--am-area-pad);
  background: linear-gradient(135deg, #750014 0%, #A31F34 100%);
  border-radius: 10px;
  color: white;
  gap: var(--am-gap);
`

const Stat = styled.div<{ $center?: boolean }>`
  flex: ${p => p.$center ? 1.6 : 1};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 10px 8px;
  background: ${p => p.$center ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.12)"};
  border-radius: 7px;
  ${p => p.$center ? "box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);" : ""}
`

const StatLabel = styled.span`
  display: block;
  font-size: var(--am-stat-label);
  opacity: 0.85;
  margin-bottom: 4px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
`

const StatValue = styled.span<{ $large?: boolean }>`
  display: block;
  font-size: ${p => p.$large ? "var(--am-stat-large)" : "var(--am-stat)"};
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
`

export function RushStats() {
  const { timeRemaining, puzzle, puzzlesSolved } = useGameState()
  const mins = Math.floor(timeRemaining / 60)
  const secs = timeRemaining % 60

  let timerColor = "#ffffff"
  if (timeRemaining <= 10) timerColor = "#dc2626"
  else if (timeRemaining <= 30) timerColor = "#f59e0b"

  return (
    <StatsBar>
      <Stat>
        <StatLabel>Time</StatLabel>
        <StatValue style={{ color: timerColor }}>
          {mins}:{secs.toString().padStart(2, "0")}
        </StatValue>
      </Stat>
      <Stat $center>
        <StatLabel>Target</StatLabel>
        <StatValue $large>
          {puzzle ? puzzle.target : "—"}
        </StatValue>
      </Stat>
      <Stat>
        <StatLabel>Level</StatLabel>
        <StatValue>{puzzlesSolved + 1}</StatValue>
      </Stat>
    </StatsBar>
  )
}

export function PracticeStats() {
  const { puzzle } = useGameState()

  return (
    <StatsBar>
      <Stat $center>
        <StatLabel>Target</StatLabel>
        <StatValue $large>
          {puzzle ? puzzle.target : "—"}
        </StatValue>
      </Stat>
    </StatsBar>
  )
}
