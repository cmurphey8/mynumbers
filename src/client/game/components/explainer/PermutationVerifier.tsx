// ============================================================================
// Explainer — Slide 4: Permutation Verifier (React)
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { reducedMotion } from "./motion"
import { Drawer } from "./ExpressionTree"

const BANK = [2, 3, 4, 5, 7, 8, 9]
const TARGET = 29
const SLOT_COUNT = 5
const TOTAL_PERMS = 2520

const PERM_START_MS = 400
const PERM_MIN_MS = 8
const PERM_DECAY = 0.96

function* permGen(itemCount: number, selectCount: number): Generator<number[]> {
  const indices = Array.from({ length: itemCount }, (_, i) => i)
  function* recurse(items: number[], depth: number): Generator<number[]> {
    if (depth === selectCount) {
      yield items.slice(0, selectCount)
      return
    }
    for (let i = depth; i < items.length; i++) {
      ;[items[depth], items[i]] = [items[i], items[depth]]
      yield* recurse(items, depth + 1)
      ;[items[depth], items[i]] = [items[i], items[depth]]
    }
  }
  yield* recurse(indices, 0)
}

function evalTemplate(a: number, b: number, c: number, d: number, e: number): number {
  if (e === 0) return NaN
  return (a + b) * c - d / e
}

function countSolutions(): number {
  let count = 0
  for (const perm of permGen(BANK.length, SLOT_COUNT)) {
    if (evalTemplate(...(perm.map((i) => BANK[i]) as [number, number, number, number, number])) === TARGET) count++
  }
  return count
}

interface SlotState {
  value: number | null
  pulseKey: number
}

const EMPTY_SLOTS: SlotState[] = Array.from({ length: SLOT_COUNT }, () => ({ value: null, pulseKey: 0 }))

export function PermutationVerifier({ active }: { active: boolean }) {
  const [slots, setSlots] = useState<SlotState[]>(EMPTY_SLOTS)
  const [count, setCount] = useState(0)
  const [result, setResult] = useState("")
  const [hasResult, setHasResult] = useState(false)
  const [matched, setMatched] = useState(false)
  const [running, setRunning] = useState(false)

  const generatorRef = useRef<Generator<number[]> | null>(null)
  const doneRef = useRef(false)
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSpeedRef = useRef(0)
  const pulseSeq = useRef(0)

  const solutionsCount = useMemo(countSolutions, [])
  const expectedChecks = useMemo(
    () => Math.round((TOTAL_PERMS + 1) / (solutionsCount + 1)),
    [solutionsCount]
  )

  const fillSlots = useCallback((values: (number | null)[]) => {
    setSlots(
      values.map((value) => ({
        value: value ?? null,
        pulseKey: value === null || value === undefined ? 0 : ++pulseSeq.current,
      }))
    )
  }, [])

  const reset = useCallback(() => {
    generatorRef.current = permGen(BANK.length, SLOT_COUNT)
    doneRef.current = false
    autoSpeedRef.current = 0
    fillSlots([null, null, null, null, null])
    setCount(0)
    setResult("")
    setHasResult(false)
    setMatched(false)
  }, [fillSlots])

  // step returns true on a match, false when exhausted, null on a miss
  const step = useCallback((): boolean | null => {
    if (!generatorRef.current) reset()
    if (doneRef.current) return false
    const nextPerm = generatorRef.current!.next()
    if (nextPerm.done) {
      doneRef.current = true
      return false
    }
    const values = nextPerm.value.map((i) => BANK[i])
    fillSlots(values)
    setCount((c) => c + 1)
    const value = evalTemplate(...(values as [number, number, number, number, number]))
    setResult(Number.isInteger(value) ? String(value) : value.toFixed(2))
    setHasResult(true)
    if (value === TARGET) {
      setMatched(true)
      doneRef.current = true
      return true
    }
    setMatched(false)
    return null
  }, [fillSlots, reset])

  const stopAuto = useCallback(() => {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current)
      autoTimerRef.current = null
    }
    setRunning(false)
  }, [])

  const scheduleNextTick = useCallback(() => {
    autoTimerRef.current = setTimeout(() => {
      const stepResult = step()
      if (stepResult === true || doneRef.current) {
        stopAuto()
        return
      }
      autoSpeedRef.current = Math.max(reducedMotion ? 1 : PERM_MIN_MS, autoSpeedRef.current * PERM_DECAY)
      scheduleNextTick()
    }, autoSpeedRef.current)
  }, [step, stopAuto])

  const toggleAuto = useCallback(() => {
    if (autoTimerRef.current) {
      stopAuto()
      return
    }
    setRunning(true)
    if (autoSpeedRef.current === 0) autoSpeedRef.current = reducedMotion ? 1 : PERM_START_MS
    scheduleNextTick()
  }, [scheduleNextTick, stopAuto])

  // Initialize on mount.
  useEffect(() => {
    reset()
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
    }
  }, [reset])

  // Stop autoplay when the slide is left.
  useEffect(() => {
    if (!active) stopAuto()
  }, [active, stopAuto])

  return (
    <div className="ex-perm">
      <div className={"ex-perm-board" + (hasResult ? " has-result" : "")} aria-label="Template with slots">
        <span className="ex-paren">(</span>
        <span className="ex-paren">(</span>
        <PermSlot index={0} slot={slots[0]} />
        <span className="ex-op">+</span>
        <PermSlot index={1} slot={slots[1]} />
        <span className="ex-paren">)</span>
        <span className="ex-op">×</span>
        <PermSlot index={2} slot={slots[2]} />
        <span className="ex-paren">)</span>
        <span className="ex-op">−</span>
        <span className="ex-paren">(</span>
        <PermSlot index={3} slot={slots[3]} />
        <span className="ex-op">÷</span>
        <PermSlot index={4} slot={slots[4]} />
        <span className="ex-paren">)</span>
        <span className="ex-eq">=</span>
        <span className="ex-result" id="p-result">
          {result}
        </span>
        <span className={"ex-result-check" + (matched ? " is-visible" : "")} id="p-match" aria-hidden="true">
          ✓
        </span>
      </div>

      <div className="ex-perm-controls">
        <button id="p-step" className="ex-mini-btn" onClick={() => { stopAuto(); step() }}>
          Step
        </button>
        <button id="p-auto" className="ex-mini-btn ex-mini-btn-primary" onClick={toggleAuto}>
          {running ? "Pause" : "Autoplay"}
        </button>
        <button id="p-reset" className="ex-mini-btn" onClick={() => { stopAuto(); reset() }}>
          Reset
        </button>
        <div className="ex-counter-card">
          <span id="p-count">{count}</span> / <span id="p-total">{TOTAL_PERMS}</span> checked
        </div>
      </div>

      <div className="ex-formula-card">
        <div className="ex-formula-label">Permutations of 5 from a bank of 7</div>
        <div className="ex-formula">
          P(7, 5) = 7 × 6 × 5 × 4 × 3 = <strong>2520</strong>
        </div>
        <div className="ex-formula-label" style={{ marginTop: "8px" }}>
          Expected checks until a solution
        </div>
        <div className="ex-formula">
          <strong id="p-solutions">{solutionsCount}</strong> arrangements solve this puzzle &nbsp;→&nbsp; expect ≈{" "}
          <strong id="p-expected">{expectedChecks}</strong> checks
        </div>
      </div>

      <Drawer label="Go deeper">
        <p>
          Search stops at the first arrangement that hits the target, so verification cost depends on how many solutions{" "}
          <em>S</em> the puzzle has. If <em>S</em> successes are uniformly distributed across <em>N</em> = 2520
          arrangements, the expected position of the first hit is <em>E</em> = (<em>N</em> + 1) / (<em>S</em> + 1). A
          puzzle with many solutions resolves in a few hundred steps; a sparse puzzle (<em>S</em> = 1) climbs to ≈ 1260.
          That's why permutation verification stays cheap on the server: most puzzles short‑circuit long before scanning
          all 2520.
        </p>
      </Drawer>
    </div>
  )
}

function PermSlot({ index, slot }: { index: number; slot: SlotState }) {
  const filled = slot.value !== null
  return (
    <span
      key={slot.pulseKey}
      className={"ex-pslot" + (filled ? " is-filled is-pulse" : "")}
      data-slot={index}
    >
      {filled ? slot.value : "__"}
    </span>
  )
}
