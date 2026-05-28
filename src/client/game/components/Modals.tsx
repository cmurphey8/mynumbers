import { createPortal } from "react-dom"
import { useEffect, useRef, type ReactNode } from "react"
import styled from "@emotion/styled"
import { useGameState, useGameDispatch } from "../context/GameContext"
import timWaveUrl from "../assets/tim-wave.svg"
import timFrontUrl from "../assets/tim-front.svg"

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
`

const Box = styled.div`
  position: relative;
  z-index: 0;
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

  h2 {
    margin: 0 0 24px;
    text-align: center;
    font-size: 28px;
  }

  @media (max-width: 600px) {
    padding: 20px;
  }
`

const CloseBtn = styled.button`
  position: absolute;
  top: 10px;
  right: 12px;
  background: none;
  border: none;
  font-size: 20px;
  line-height: 1;
  color: #9ca3af;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;

  &:hover {
    color: #374151;
    background: #f3f4f6;
  }
`

const TimImg = styled.img`
  display: block;
  width: 120px;
  height: 120px;
  margin: 0 auto 12px;
  object-fit: contain;
`

const ModalStats = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 600px) {
    gap: 8px;
  }
`

const ModalStat = styled.div`
  flex: 1;
  text-align: center;
  padding: 16px;
  background: #f3f4f6;
  border-radius: 8px;
`

const ModalStatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #A31F34;
  margin-bottom: 4px;

  @media (max-width: 600px) {
    font-size: 24px;
  }
`

const ModalStatLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 600;
`

const Desc = styled.p`
  text-align: center;
  color: #374151;
  margin: 0 0 20px;
  line-height: 1.5;
  font-size: 15px;
`

const Buttons = styled.div`
  display: flex;
  gap: 12px;
`

const ModalBtn = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 100ms;
  background: ${p => p.$primary ? "#750014" : "#e5e7eb"};
  color: ${p => p.$primary ? "white" : "#374151"};

  &:active {
    transform: scale(0.98);
  }
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

  return createPortal(
    <Overlay
      onClick={
        dismissOnBackdrop && onDismiss
          ? (e) => {
              if (e.target === e.currentTarget) onDismiss()
            }
          : undefined
      }
    >
      <Box ref={boxRef} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}>
        {children}
      </Box>
    </Overlay>,
    document.body,
  )
}

export function RushReadyModal({ onStart }: { onStart: () => void }) {
  const { showRushReadyModal } = useGameState()
  const dispatch = useGameDispatch()

  if (!showRushReadyModal) return null

  return (
    <ModalDialog labelledBy="rush-ready-title">
      <h2 id="rush-ready-title">Ready to Rush?</h2>
      <Desc>
        Arrange the numbers to hit the <strong>Target</strong>. Solve as many
        puzzles as you can before time runs out!
      </Desc>
      <Buttons>
        <ModalBtn
          $primary
          onClick={() => {
            dispatch({ type: "HIDE_RUSH_READY_MODAL" })
            onStart()
          }}
        >
          Let&apos;s Go!
        </ModalBtn>
      </Buttons>
    </ModalDialog>
  )
}

export function GameOverModal({ onPlayAgain }: ModalsProps) {
  const { showGameOverModal, puzzlesSolved } = useGameState()
  const dispatch = useGameDispatch()

  if (!showGameOverModal) return null

  const timSrc = puzzlesSolved >= 5
    ? timWaveUrl
    : timFrontUrl

  function handleDismiss() {
    dispatch({ type: "HIDE_GAME_OVER_MODAL" })
  }

  return (
    <ModalDialog labelledBy="game-over-title" onDismiss={handleDismiss} dismissOnBackdrop>
      <CloseBtn aria-label="Close" onClick={handleDismiss}>
        &#x2715;
      </CloseBtn>
      <TimImg src={timSrc} alt="Tim" />
      <h2 id="game-over-title">Rush Complete!</h2>
      <ModalStats>
        <ModalStat>
          <ModalStatValue>{puzzlesSolved}</ModalStatValue>
          <ModalStatLabel>Puzzles Solved</ModalStatLabel>
        </ModalStat>
      </ModalStats>
      <Buttons>
        <ModalBtn $primary onClick={onPlayAgain}>
          Play Again
        </ModalBtn>
        <ModalBtn onClick={() => dispatch({ type: "SHOW_MENU" })}>
          Back to Menu
        </ModalBtn>
      </Buttons>
    </ModalDialog>
  )
}
