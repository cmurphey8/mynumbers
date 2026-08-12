export interface Puzzle {
  target: number
  numbers: number[]
  template_tokens: string[]
  num_placeholders: number
  solution_expr: string | null
}

export type GameMode = "practice" | "rush3" | "rush5" | null

export interface GameState {
  mode: GameMode
  puzzle: Puzzle | null
  puzzlesSolved: number
  /** Whether the puzzle on screen has already been counted toward the score. */
  puzzleSolved: boolean
  timeRemaining: number
  currentDifficulty: number
  maxDifficultyReached: number
  /** True once the countdown has handed over and the clock is running. */
  rushStarted: boolean
  slotValues: (number | null)[]
  bankItems: BankItem[]
  result: { text: string; type: "success" | "error" | "" } | null
  showGameOverModal: boolean
  showCountdown: boolean
  countdownNumber: number | string
}

export interface BankItem {
  id: string
  value: number
  placedInSlot: number | null
}

export type GameAction =
  | { type: "START_PRACTICE" }
  | { type: "START_RUSH"; minutes: number }
  | { type: "SET_PUZZLE"; puzzle: Puzzle; bankItems: BankItem[] }
  | { type: "PLACE_TILE"; tileId: string; slotIndex: number }
  | { type: "REMOVE_TILE"; slotIndex: number }
  | { type: "RESET_SLOTS" }
  | { type: "SET_RESULT"; result: GameState["result"] }
  | { type: "TICK_TIMER" }
  | { type: "END_RUSH" }
  | { type: "SET_RUSH_STARTED"; started: boolean }
  | { type: "SHOW_GAME_OVER_MODAL" }
  | { type: "HIDE_GAME_OVER_MODAL" }
  | { type: "SET_COUNTDOWN_NUMBER"; value: number | string }
  | { type: "HIDE_COUNTDOWN" }
  | { type: "INCREMENT_SOLVED" }
  | { type: "SET_DIFFICULTY"; difficulty: number }
