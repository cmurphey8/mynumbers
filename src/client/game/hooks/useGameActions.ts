import { useCallback, useEffect, useRef } from "react"
import {
  useGameState,
  useGameDispatch,
  calculateDifficulty,
  isSessionOver,
} from "../context/GameContext"
import { puzzleRush, puzzleCheck, type PuzzleOut, type CheckResult } from "../generator"
import type { BankItem, Puzzle } from "../types"

export function useGameActions() {
  const state = useGameState()
  const dispatch = useGameDispatch()
  const autoCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const generatePuzzle = useCallback(() => {
    let difficulty = 3
    if (state.mode === "rush3" || state.mode === "rush5") {
      difficulty = calculateDifficulty(state.puzzlesSolved)
      dispatch({ type: "SET_DIFFICULTY", difficulty })
    }

    let data: PuzzleOut
    try {
      data = puzzleRush({ difficulty, decoys: 2 })
    } catch (e) {
      console.error("Generate puzzle error", e)
      dispatch({ type: "GENERATE_FAILED" })
      return
    }

    const bankItems: BankItem[] = data.numbers.map((n, i) => ({
      id: `bank-${i}-${n}-${Math.random().toString(36).slice(2, 8)}`,
      value: n,
      placedInSlot: null,
    }))

    dispatch({
      type: "SET_PUZZLE",
      puzzle: data as Puzzle,
      bankItems,
    })
  }, [state.mode, state.puzzlesSolved, dispatch])

  const checkPuzzle = useCallback(() => {
    const { puzzle, bankItems, slotValues } = state
    if (!puzzle) return

    const allFilled = slotValues.every(v => v !== null)
    if (!allFilled) return

    // Build expression from template
    const parts: string[] = []
    for (const tok of puzzle.template_tokens) {
      const isSlot = tok.startsWith("{") && tok.endsWith("}")
      if (isSlot) {
        const idx = parseInt(tok.slice(1, -1), 10)
        const tile = bankItems.find(item => item.placedInSlot === idx)
        if (!tile) return
        parts.push(String(tile.value))
      } else {
        parts.push(tok)
      }
    }

    const expression = parts.join("")

    const result: CheckResult = puzzleCheck({
      numbers: puzzle.numbers,
      expression,
      target: puzzle.target,
    })

    const evalDisplay = result.evaluated_display || String(result.evaluated)

    if (result.reason === "invalid_expression") {
      dispatch({
        type: "SET_RESULT",
        result: { text: `Invalid: ${result.message || "expression invalid"}`, type: "error" },
      })
      return
    }

    if (result.reason === "correct") {
      // Count the solve once per puzzle, in every mode — the session-complete
      // modal reports it as the final score. Re-filling an already-solved
      // board must not inflate it.
      if (!state.puzzleSolved) {
        dispatch({ type: "INCREMENT_SOLVED" })
      }
      dispatch({
        type: "SET_RESULT",
        result: { text: "Correct!", type: "success" },
      })
      return
    }

    if (result.reason === "wrong_value") {
      dispatch({
        type: "SET_RESULT",
        result: { text: `Incorrect. Got ${evalDisplay}, need ${puzzle.target}`, type: "error" },
      })
      return
    }

    dispatch({
      type: "SET_RESULT",
      result: { text: `Result: ${evalDisplay}`, type: "" },
    })
  }, [state, dispatch])

  /**
   * A solved board hands out the next puzzle after a pause long enough for its
   * green "solved" state to register. This is an effect rather than a timeout
   * fired from the check so that the pending advance belongs to the session
   * that scheduled it: React clears it whenever that session goes away — the
   * mode changes, the session ends, or the game unmounts — and a puzzle built
   * for the session being left can never land in the one being entered, nor
   * replace the final board of one that has finished. Re-checking an
   * already-solved board does not restart the pause either, since nothing it
   * touches is a dependency here.
   */
  const sessionOver = isSessionOver(state)
  useEffect(() => {
    if (!state.puzzleSolved || sessionOver) return
    const timer = setTimeout(generatePuzzle, 900)
    return () => clearTimeout(timer)
  }, [state.puzzleSolved, sessionOver, generatePuzzle])

  const scheduleAutoCheck = useCallback(() => {
    if (autoCheckRef.current) {
      clearTimeout(autoCheckRef.current)
    }
    autoCheckRef.current = setTimeout(() => {
      autoCheckRef.current = null
      checkPuzzle()
    }, 300)
  }, [checkPuzzle])

  const endRush = useCallback(() => {
    dispatch({ type: "END_RUSH" })
  }, [dispatch])

  /**
   * Steps the pre-rush countdown 3 → 2 → 1 → GO!, then hands over to the clock.
   * Returns a cancel function: the caller runs it when the countdown is torn
   * down early (mode switch, restart, unmount) so no later step lands.
   */
  const startCountdown = useCallback(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = []
    let count = 3

    function tick() {
      dispatch({ type: "SET_COUNTDOWN_NUMBER", value: count })
      if (count === 1) {
        timeouts.push(
          setTimeout(() => {
            dispatch({ type: "SET_COUNTDOWN_NUMBER", value: "GO!" })
            timeouts.push(
              setTimeout(() => {
                dispatch({ type: "HIDE_COUNTDOWN" })
                dispatch({ type: "SET_RUSH_STARTED", started: true })
              }, 700),
            )
          }, 750),
        )
        return
      }
      count--
      timeouts.push(setTimeout(tick, 750))
    }
    tick()

    return () => timeouts.forEach(clearTimeout)
  }, [dispatch])

  /** Replay whichever mode just finished. */
  const playAgain = useCallback(() => {
    dispatch({ type: "HIDE_GAME_OVER_MODAL" })
    if (state.mode === "practice") {
      dispatch({ type: "START_PRACTICE" })
      return
    }
    dispatch({ type: "START_RUSH", minutes: state.mode === "rush3" ? 3 : 5 })
  }, [dispatch, state.mode])

  // Drop a pending check when the mode changes or the game unmounts, so it
  // cannot run against the session being entered, or against a gone component.
  useEffect(() => {
    return () => {
      if (autoCheckRef.current) {
        clearTimeout(autoCheckRef.current)
        autoCheckRef.current = null
      }
    }
  }, [state.mode])

  return {
    generatePuzzle,
    checkPuzzle,
    scheduleAutoCheck,
    endRush,
    startCountdown,
    playAgain,
  }
}
