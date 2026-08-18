import { useEffect, useRef, type ReactNode } from "react"
import styled from "@emotion/styled"
import { useGameState, useGameDispatch } from "../context/GameContext"
import type { GameAction, GameMode } from "../types"
import { PrimaryButton, OutlineButtonL } from "./ui"
import { Icon } from "./Icon"
import closeIconUrl from "../assets/icon-close.svg"
import timFullUrl from "../assets/tim-full.svg"

/**
 * Fills the game frame rather than the viewport, so the dialog dims the game
 * and nothing else — it belongs to the game, not to the page hosting it. Sits
 * above the countdown, which covers the board within the same frame.
 */
const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  z-index: 20;
  box-sizing: border-box;
  padding: 8px;
  overflow: auto;
  border-radius: var(--am-radius);
  background: rgba(0, 0, 0, 0.4);
`

/**
 * `margin: auto` centres the card in the frame while leaving it fully
 * reachable when the frame is shorter than the card — flex centring would clip
 * the overflowing edge instead of letting the frame scroll to it.
 */
const Card = styled.div`
  display: flex;
  flex-direction: column;
  margin: auto;
  width: 516px;
  max-width: 100%;
  border-radius: 8px;
  background: var(--am-white);
  box-shadow: var(--am-modal-shadow);
`

/**
 * Below the large tier the board frame is shorter than the card's designed
 * height, so its spacing and figures tighten up to keep the whole dialog inside
 * the frame.
 */
const COMPACT = '[data-am-size="medium"] &, [data-am-size="small"] &'

const TitleBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 28px;
  border-bottom: 1px solid var(--am-light-gray-2);
  background: var(--am-light-gray-1);

  ${COMPACT} {
    padding: 14px 20px;
  }
`

const Title = styled.h2`
  flex: 1 0 0;
  min-width: 0;
  margin: 0;
  color: #000;
  font-size: 18px;
  font-weight: 700;
  line-height: 26px;
`

const CloseButton = styled.button`
  display: block;
  flex: none;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  border-radius: var(--am-radius);

  &:focus-visible {
    outline: 2px solid var(--am-text-primary);
    outline-offset: 2px;
  }
`

const Content = styled.div`
  padding: 28px;

  ${COMPACT} {
    padding: 16px 20px;
  }
`

const CtaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 16px;
  padding: 0 28px 28px;

  ${COMPACT} {
    gap: 12px;
    padding: 0 20px 20px;
  }
`

const ScoreRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;

  ${COMPACT} {
    gap: 16px;
  }
`

const ScoreBox = styled.div`
  flex: none;
  width: 223px;
  max-width: 100%;
  padding: 32px;
  box-sizing: border-box;
  border: 1px solid var(--am-light-silver-gray);
  border-radius: var(--am-radius);
  color: var(--am-text-primary);
  text-align: center;
  word-break: break-word;

  ${COMPACT} {
    width: 180px;
    padding: 16px;
  }
`

const ScoreValue = styled.div`
  font-size: 52px;
  font-weight: 700;
  line-height: 60px;

  ${COMPACT} {
    font-size: 40px;
    line-height: 48px;
  }
`

const ScoreLabel = styled.div`
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
`

const Beaver = styled.img`
  flex: none;
  display: block;
  width: 120.051px;
  height: 160px;

  ${COMPACT} {
    width: 84.036px;
    height: 112px;
  }
`

/**
 * Fills the leftover space on a row it shares, but sized from its content so a
 * row too narrow for all three CTAs wraps instead of overflowing the card.
 */
const GrowButton = styled(PrimaryButton)`
  flex: 1 1 auto;
  min-width: 0;
`

interface ModalsProps {
  onPlayAgain: () => void
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'


function ModalDialog({
  labelledBy,
  onDismiss,
  dismissOnBackdrop = false,
  children,
}: {
  labelledBy: string
  onDismiss?: () => void
  dismissOnBackdrop?: boolean
  children: ReactNode
}) {
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const box = boxRef.current

    const firstFocusable = box?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    ;(firstFocusable ?? box)?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && onDismiss) {
        e.preventDefault()
        onDismiss()
        return
      }
      if (e.key !== "Tab" || !box) return
      const items = Array.from(
        box.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(el => el.offsetParent !== null)
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      // Restore focus to whatever was focused before the dialog opened.
      previouslyFocused?.focus?.()
    }
  }, [onDismiss])

  // Rendered in place rather than portalled to document.body: the dialog
  // belongs to the game, so it must stay inside the game's own bounds.
  return (
    <Overlay
      onClick={
        dismissOnBackdrop && onDismiss
          ? (e) => {
              if (e.target === e.currentTarget) onDismiss()
            }
          : undefined
      }
    >
      <Card ref={boxRef} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}>
        {children}
      </Card>
    </Overlay>
  )
}

/** Every mode, in CTA order — the finished one is filtered out. */
const MODES: { key: GameMode; label: string; start: GameAction }[] = [
  { key: "practice", label: "Practice", start: { type: "START_PRACTICE" } },
  { key: "rush3", label: "3-Min Rush", start: { type: "START_RUSH", minutes: 3 } },
  { key: "rush5", label: "5-Min Rush", start: { type: "START_RUSH", minutes: 5 } },
]

/**
 * The session summary, shown when a rush timer expires and when Restart ends
 * the current session. Titled for the mode that just finished; offers a replay
 * of it plus the two modes not just played.
 */
export function GameOverModal({ onPlayAgain }: ModalsProps) {
  const { showGameOverModal, puzzlesSolved, mode } = useGameState()
  const dispatch = useGameDispatch()

  if (!showGameOverModal) return null

  const title = mode === "practice" ? "Practice Complete!" : "Rush Complete!"
  const otherModes = MODES.filter(m => m.key !== mode)

  function handleDismiss() {
    dispatch({ type: "HIDE_GAME_OVER_MODAL" })
  }

  return (
    <ModalDialog labelledBy="game-over-title" onDismiss={handleDismiss} dismissOnBackdrop>
      <TitleBar>
        <Title id="game-over-title">{title}</Title>
        <CloseButton type="button" aria-label="Close" onClick={handleDismiss}>
          <Icon src={closeIconUrl} size={24} inset="23.49% 23.48% 23.48% 23.48%" />
        </CloseButton>
      </TitleBar>
      <Content>
        <ScoreRow>
          <ScoreBox>
            <ScoreValue>{puzzlesSolved}</ScoreValue>
            <ScoreLabel>Final Score</ScoreLabel>
          </ScoreBox>
          <Beaver src={timFullUrl} alt="Tim the Beaver" />
        </ScoreRow>
      </Content>
      <CtaRow>
        <GrowButton type="button" onClick={onPlayAgain}>
          Play Again
        </GrowButton>
        {otherModes.map(m => (
          <OutlineButtonL key={m.label} type="button" onClick={() => dispatch(m.start)}>
            {m.label}
          </OutlineButtonL>
        ))}
      </CtaRow>
    </ModalDialog>
  )
}
