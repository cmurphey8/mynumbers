import styled from "@emotion/styled"
import { Icon } from "./Icon"
import howToPlayIconUrl from "../assets/icon-how-to-play.svg"

const Card = styled.aside`
  display: flex;
  flex: 1 0 0;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
  min-width: 0;
  padding: 24px;
  box-sizing: border-box;
  border-radius: var(--am-radius);
  background: var(--am-white);
  box-shadow: var(--am-card-shadow);
`

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`

const TitleText = styled.h2`
  flex: 1 0 0;
  min-width: 0;
  margin: 0;
  color: var(--am-text-primary);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
`

const Body = styled.div`
  width: 100%;
  color: var(--am-text-primary);
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  word-break: break-word;

  p {
    margin: 0;
  }

  p + p {
    margin-top: 22px;
  }

  strong {
    font-weight: 700;
  }
`

export function HowToPlay() {
  return (
    <Card>
      <TitleRow>
        <Icon src={howToPlayIconUrl} size={24} inset="16.67% 4.17%" />
        <TitleText>How to play</TitleText>
      </TitleRow>
      <Body>
        <p>
          In <strong>Practice Mode</strong>, take as much time as you need.
        </p>
        <p>
          In <strong>Rush Mode</strong>, solve as many puzzles as you can before
          the timer runs out!
        </p>
      </Body>
      <Body>
        <p>
          Arrange the given numbers using basic math operations (+, −, ×, ÷) to
          reach the target value.
        </p>
        <p>Use each number only once unless the puzzle says otherwise.</p>
      </Body>
    </Card>
  )
}
