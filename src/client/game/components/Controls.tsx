import styled from "@emotion/styled"
import { useGameState, useGameDispatch } from "../context/GameContext"
import { OutlineButton } from "./ui"
import { Icon } from "./Icon"
import clockIconUrl from "../assets/icon-clock.svg"
import practiceIconUrl from "../assets/icon-practice.svg"
import restartIconUrl from "../assets/icon-restart.svg"

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: var(--am-controls-pad);
  box-sizing: border-box;
  border-top: 1px solid var(--am-light-gray-2);
  border-radius: 0 0 var(--am-radius) var(--am-radius);
  background: linear-gradient(to top, var(--am-light-gray-0), var(--am-white));
  box-shadow: var(--am-card-shadow);
`

const Column = styled.div`
  display: flex;
  flex: 1 0 0;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
  min-width: 0;
`

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  line-height: 18px;
`

const MetaTitle = styled.span`
  color: var(--am-text-primary);
  font-weight: 500;
`

const MetaText = styled.span`
  color: var(--am-text-secondary);
  font-weight: 400;
`

const ButtonRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: 100%;

  [data-am-size="small"] & {
    flex-direction: column;
  }
`

const ModeGroup = styled.div`
  display: flex;
  flex: 1 0 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  min-width: 0;
`

const ModeButton = styled(OutlineButton)`
  width: var(--am-mode-btn-w);
`

interface ModeOption {
  key: string
  label: string
  icon: string
  /** Size of the exported icon artboard and the glyph's inset within it. */
  iconInset: string
  onSelect: () => void
}

/**
 * The bar beneath the board: a nudge toward the other modes, plus Restart.
 * Which modes are offered depends on the one currently being played.
 */
export function Controls() {
  const { mode } = useGameState()
  const dispatch = useGameDispatch()

  const isRush = mode === "rush3" || mode === "rush5"

  const practiceOption: ModeOption = {
    key: "practice",
    label: "Practice",
    icon: practiceIconUrl,
    iconInset: "4.17% 10.42%",
    onSelect: () => dispatch({ type: "START_PRACTICE" }),
  }

  const rushOption = (minutes: 3 | 5): ModeOption => ({
    key: `rush${minutes}`,
    label: `${minutes}-Min Rush`,
    icon: clockIconUrl,
    iconInset: "4.17% 12.5% 8.33% 12.5%",
    onSelect: () => dispatch({ type: "START_RUSH", minutes }),
  })

  let options: ModeOption[]
  if (mode === "rush3") options = [practiceOption, rushOption(5)]
  else if (mode === "rush5") options = [practiceOption, rushOption(3)]
  else options = [rushOption(3), rushOption(5)]

  // Restart closes out the current session and hands over to the
  // session-complete modal, which offers the replay. In rush that also has to
  // stop the clock, which END_RUSH does.
  function handleRestart() {
    if (isRush) {
      dispatch({ type: "END_RUSH" })
    } else {
      dispatch({ type: "SHOW_GAME_OVER_MODAL" })
    }
  }

  return (
    <Bar>
      <Column>
        <MetaRow>
          <MetaTitle>{isRush ? "Other Challenges" : "Timed Challenges"}</MetaTitle>
          <MetaText>-</MetaText>
          <MetaText>
            {isRush
              ? "Practice or try to beat your personal best!"
              : "Try to beat your personal best!"}
          </MetaText>
        </MetaRow>
        <ButtonRow>
          <ModeGroup>
            {options.map(option => (
              <ModeButton
                key={option.key}
                type="button"
                data-icon="leading"
                onClick={option.onSelect}
              >
                <Icon src={option.icon} size={20} inset={option.iconInset} />
                {option.label}
              </ModeButton>
            ))}
          </ModeGroup>
          <OutlineButton type="button" onClick={handleRestart}>
            <Icon src={restartIconUrl} size={20} inset="8.33%" />
            Restart
          </OutlineButton>
        </ButtonRow>
      </Column>
    </Bar>
  )
}
