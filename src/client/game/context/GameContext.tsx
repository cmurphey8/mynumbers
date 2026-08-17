import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react"
import { type GameState, type GameAction } from "../types"

export function calculateDifficulty(solved: number): number {
  if (solved <= 1) return 1
  if (solved <= 2) return 2
  if (solved <= 4) return 3
  if (solved <= 6) return 4
  if (solved <= 8) return 5
  if (solved <= 10) return 6
  if (solved <= 12) return 7
  if (solved <= 13) return 8
  if (solved <= 14) return 9
  if (solved <= 15) return 10
  if (solved <= 16) return 11
  return 12
}

// There is no mode-selection screen: the game opens straight into practice and
// the controls bar switches modes from there.
const initialState: GameState = {
  mode: "practice",
  puzzle: null,
  puzzlesSolved: 0,
  puzzleSolved: false,
  timeRemaining: 0,
  currentDifficulty: 1,
  maxDifficultyReached: 1,
  rushStarted: false,
  slotValues: [],
  bankItems: [],
  result: null,
  showGameOverModal: false,
  showCountdown: false,
  countdownNumber: 3,
  generateFailed: false,
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_PRACTICE":
      return {
        ...state,
        mode: "practice",
        showGameOverModal: false,
        showCountdown: false,
        puzzlesSolved: 0,
        puzzleSolved: false,
        rushStarted: false,
        // Cleared so the app generates a fresh puzzle for the new mode, and
        // tries again even if generating for the last one failed.
        puzzle: null,
        generateFailed: false,
        slotValues: [],
        bankItems: [],
        result: null,
      }

    case "START_RUSH": {
      const mode = action.minutes === 3 ? "rush3" : "rush5"
      return {
        ...state,
        mode: mode as "rush3" | "rush5",
        showGameOverModal: false,
        puzzlesSolved: 0,
        puzzleSolved: false,
        currentDifficulty: 1,
        maxDifficultyReached: 1,
        timeRemaining: action.minutes * 60,
        rushStarted: false,
        // Every rush opens with the countdown, which is what starts the clock.
        showCountdown: true,
        countdownNumber: 3,
        // Cleared so the app generates a fresh puzzle for the new session, and
        // tries again even if generating for the last one failed.
        puzzle: null,
        generateFailed: false,
        slotValues: [],
        bankItems: [],
        result: null,
      }
    }

    case "SET_PUZZLE": {
      const slotValues = new Array(action.puzzle.num_placeholders).fill(null)
      return {
        ...state,
        puzzle: action.puzzle,
        generateFailed: false,
        slotValues,
        bankItems: action.bankItems,
        puzzleSolved: false,
        result: null,
      }
    }

    // Latches until the next session so the failure is reported once rather
    // than retried on every render.
    case "GENERATE_FAILED":
      return {
        ...state,
        generateFailed: true,
        result: { text: "Failed to generate puzzle.", type: "error" },
      }

    case "PLACE_TILE": {
      const bankItems = state.bankItems.map(item =>
        item.id === action.tileId
          ? { ...item, placedInSlot: action.slotIndex }
          : item.placedInSlot === action.slotIndex
            ? { ...item, placedInSlot: null }
            : item
      )
      const slotValues = [...state.slotValues]
      const tile = state.bankItems.find(i => i.id === action.tileId)
      if (tile) slotValues[action.slotIndex] = tile.value
      return { ...state, bankItems, slotValues, result: null }
    }

    case "REMOVE_TILE": {
      const bankItems = state.bankItems.map(item =>
        item.placedInSlot === action.slotIndex
          ? { ...item, placedInSlot: null }
          : item
      )
      const slotValues = [...state.slotValues]
      slotValues[action.slotIndex] = null
      return { ...state, bankItems, slotValues, result: null }
    }

    case "RESET_SLOTS": {
      const bankItems = state.bankItems.map(item => ({ ...item, placedInSlot: null }))
      const slotValues = new Array(state.slotValues.length).fill(null)
      return { ...state, bankItems, slotValues, result: null }
    }

    case "SET_RESULT":
      return { ...state, result: action.result }

    case "TICK_TIMER":
      return { ...state, timeRemaining: Math.max(0, state.timeRemaining - 1) }

    // Clearing showCountdown also cancels a countdown still in flight, so a
    // restart mid-countdown cannot start the clock behind the summary modal.
    case "END_RUSH":
      return { ...state, rushStarted: false, showCountdown: false, showGameOverModal: true }

    case "SET_RUSH_STARTED":
      return { ...state, rushStarted: action.started }

    case "SHOW_GAME_OVER_MODAL":
      return { ...state, showGameOverModal: true }

    case "HIDE_GAME_OVER_MODAL":
      return { ...state, showGameOverModal: false }

    case "SET_COUNTDOWN_NUMBER":
      return { ...state, countdownNumber: action.value }

    case "HIDE_COUNTDOWN":
      return { ...state, showCountdown: false }

    case "INCREMENT_SOLVED":
      return { ...state, puzzlesSolved: state.puzzlesSolved + 1, puzzleSolved: true }

    case "SET_DIFFICULTY": {
      const maxD = Math.max(state.maxDifficultyReached, action.difficulty)
      return { ...state, currentDifficulty: action.difficulty, maxDifficultyReached: maxD }
    }

    default:
      return state
  }
}


const GameStateContext = createContext<GameState | null>(null)
const GameDispatchContext = createContext<Dispatch<GameAction> | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameStateContext.Provider>
  )
}

export function useGameState(): GameState {
  const state = useContext(GameStateContext)
  if (state === null) {
    throw new Error("useGameState must be used within a GameProvider")
  }
  return state
}

export function useGameDispatch(): Dispatch<GameAction> {
  const dispatch = useContext(GameDispatchContext)
  if (dispatch === null) {
    throw new Error("useGameDispatch must be used within a GameProvider")
  }
  return dispatch
}
