import { useEffect, useRef, useCallback } from "react"
import { useGameState, useGameDispatch } from "../context/GameContext"

export function useTimer() {
  const { mode, rushStarted, timeRemaining, showGameOverModal } = useGameState()
  const dispatch = useGameDispatch()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isRush = mode === "rush3" || mode === "rush5"

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    timerRef.current = setInterval(() => {
      dispatch({ type: "TICK_TIMER" })
    }, 1000)
  }, [dispatch, stopTimer])

  // The clock runs while a rush is live and the summary is not covering it.
  // Restart opens that summary mid-rush, so the clock holds rather than being
  // spent behind a dialog the player cannot play through — and picks up again
  // if they dismiss it instead of starting something new.
  useEffect(() => {
    if (isRush && rushStarted && !showGameOverModal) {
      startTimer()
    } else {
      stopTimer()
    }
    return stopTimer
  }, [isRush, rushStarted, showGameOverModal, startTimer, stopTimer])

  // End rush when time runs out
  useEffect(() => {
    if (isRush && rushStarted && timeRemaining <= 0) {
      stopTimer()
      dispatch({ type: "END_RUSH" })
    }
  }, [isRush, rushStarted, timeRemaining, stopTimer, dispatch])

  return { startTimer, stopTimer }
}
