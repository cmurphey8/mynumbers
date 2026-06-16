// ============================================================================
// Explainer — Slide 3: Rejection Sampler (React)
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { reducedMotion } from "./motion"
import { Drawer } from "./ExpressionTree"

const TARGET_VALUE_RANGES: Record<string, [number, number]> = {
  wide: [10, 99],
  mid: [20, 60],
  narrow: [25, 35],
}
const OPERATOR_SETS: Record<string, string[]> = {
  add: ["+"],
  addsub: ["+", "-"],
  all: ["+", "-", "*", "/"],
}

function randomIntInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

interface Expression {
  operandA: number
  operandB: number
  operandC: number
  firstOperator: string
  secondOperator: string
}

function generateRandomExpression(operators: string[]): Expression {
  const operandPool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
  const chosenOperands: number[] = []
  for (let i = 0; i < 3; i++) {
    const poolIndex = randomIntInRange(0, operandPool.length - 1)
    chosenOperands.push(operandPool.splice(poolIndex, 1)[0])
  }
  const firstOperator = operators[randomIntInRange(0, operators.length - 1)]
  const secondOperator = operators[randomIntInRange(0, operators.length - 1)]
  return {
    operandA: chosenOperands[0],
    operandB: chosenOperands[1],
    operandC: chosenOperands[2],
    firstOperator,
    secondOperator,
  }
}

function evaluateExpression(expression: Expression): number {
  const isMultiplicative = (operator: string) => operator === "*" || operator === "/"
  const applyOperator = (left: number, operator: string, right: number) =>
    operator === "+" ? left + right
      : operator === "-" ? left - right
      : operator === "*" ? left * right
      : right === 0 ? NaN : left / right
  if (isMultiplicative(expression.firstOperator) && !isMultiplicative(expression.secondOperator)) {
    return applyOperator(applyOperator(expression.operandA, expression.firstOperator, expression.operandB), expression.secondOperator, expression.operandC)
  }
  if (!isMultiplicative(expression.firstOperator) && isMultiplicative(expression.secondOperator)) {
    return applyOperator(expression.operandA, expression.firstOperator, applyOperator(expression.operandB, expression.secondOperator, expression.operandC))
  }
  return applyOperator(applyOperator(expression.operandA, expression.firstOperator, expression.operandB), expression.secondOperator, expression.operandC)
}

const OPERATOR_SYMBOLS: Record<string, string> = { "+": "+", "-": "−", "*": "×", "/": "÷" }
function formatExpression(expression: Expression): string {
  return `${expression.operandA} ${OPERATOR_SYMBOLS[expression.firstOperator]} ${expression.operandB} ${OPERATOR_SYMBOLS[expression.secondOperator]} ${expression.operandC}`
}

interface ClassificationResult {
  accepted: boolean
  value: number
  reason: string
}

function classifyExpression(expression: Expression, valueRange: [number, number]): ClassificationResult {
  const value = evaluateExpression(expression)
  if (!Number.isFinite(value)) return { accepted: false, value, reason: "div by zero" }
  if (!Number.isInteger(value)) return { accepted: false, value, reason: "non-integer" }
  if (value < valueRange[0] || value > valueRange[1]) return { accepted: false, value, reason: `out of [${valueRange[0]},${valueRange[1]}]` }
  return { accepted: true, value, reason: "accepted ✓" }
}

function estimateAcceptanceProbability(operatorSetKey: string, rangeKey: string, sampleCount = 4000): number {
  const operators = OPERATOR_SETS[operatorSetKey]
  const valueRange = TARGET_VALUE_RANGES[rangeKey]
  let acceptedCount = 0
  for (let i = 0; i < sampleCount; i++) {
    if (classifyExpression(generateRandomExpression(operators), valueRange).accepted) acceptedCount++
  }
  return Math.max(1e-6, acceptedCount / sampleCount)
}

function formatPercent(probability: number): string {
  if (probability >= 0.001) return (probability * 100).toFixed(1) + "%"
  return probability.toExponential(2)
}
function formatExpectedAttempts(probability: number): string {
  return (1 / probability).toFixed(1)
}
function formatFailureProbability(probability: number): string {
  if (probability >= 0.02) return "≈ 0"
  const failureProbability = Math.pow(1 - probability, 2000)
  if (failureProbability < 1e-6) return "< 1e−6"
  return failureProbability.toExponential(2)
}

function exhaustiveNarrowProbability(): number {
  const valueRange = TARGET_VALUE_RANGES.narrow
  const operators = OPERATOR_SETS.all
  let totalCount = 0
  let acceptedCount = 0
  for (let a = 1; a <= 15; a++) {
    for (let b = 1; b <= 15; b++) {
      if (b === a) continue
      for (let c = 1; c <= 15; c++) {
        if (c === a || c === b) continue
        for (const firstOperator of operators) {
          for (const secondOperator of operators) {
            totalCount++
            if (classifyExpression({ operandA: a, operandB: b, operandC: c, firstOperator, secondOperator }, valueRange).accepted) {
              acceptedCount++
            }
          }
        }
      }
    }
  }
  return acceptedCount / totalCount
}

const MAX_ATTEMPTS = 60

interface AttemptRow {
  attempt: number
  expr: string
  value: number
  reason: string
  accepted: boolean
}

function formatValue(value: number): string {
  return Number.isFinite(value) ? (Number.isInteger(value) ? String(value) : value.toFixed(2)) : "NaN"
}

export function RejectionSampler({ active }: { active: boolean }) {
  const [operatorSetKey, setOperatorSetKey] = useState("add")
  const [rangeKey, setRangeKey] = useState("wide")
  const [rows, setRows] = useState<AttemptRow[]>([])
  const [gaveUp, setGaveUp] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<HTMLDivElement>(null)

  const probability = useMemo(
    () => estimateAcceptanceProbability(operatorSetKey, rangeKey),
    [operatorSetKey, rangeKey]
  )

  const narrow = useMemo(() => {
    const p = exhaustiveNarrowProbability()
    return {
      p: formatPercent(p),
      exp: formatExpectedAttempts(p),
      fail: formatFailureProbability(p),
    }
  }, [])

  const stopStream = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Stop streaming when the slide is left.
  useEffect(() => {
    if (!active) stopStream()
  }, [active, stopStream])

  useEffect(() => stopStream, [stopStream])

  // Keep the stream scrolled to the newest row.
  useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight
  }, [rows])

  const runStream = useCallback(() => {
    stopStream()
    setRows([])
    setGaveUp(false)
    const operators = OPERATOR_SETS[operatorSetKey]
    const valueRange = TARGET_VALUE_RANGES[rangeKey]
    let attemptCount = 0
    intervalRef.current = setInterval(() => {
      attemptCount++
      const expression = generateRandomExpression(operators)
      const verdict = classifyExpression(expression, valueRange)
      setRows((prev) => [
        ...prev,
        {
          attempt: attemptCount,
          expr: formatExpression(expression),
          value: verdict.value,
          reason: verdict.reason,
          accepted: verdict.accepted,
        },
      ])
      if (verdict.accepted) {
        stopStream()
      } else if (attemptCount >= MAX_ATTEMPTS) {
        stopStream()
        setGaveUp(true)
      }
    }, reducedMotion ? 30 : 90)
  }, [operatorSetKey, rangeKey, stopStream])

  return (
    <div className="ex-sampler">
      <div className="ex-sampler-controls">
        <div className="ex-control">
          <label htmlFor="s-ops">Operators</label>
          <select id="s-ops" value={operatorSetKey} onChange={(e) => setOperatorSetKey(e.target.value)}>
            <option value="add">+ only</option>
            <option value="addsub">+ and −</option>
            <option value="all">+ − × ÷</option>
          </select>
        </div>
        <div className="ex-control">
          <label htmlFor="s-range">Target band</label>
          <select id="s-range" value={rangeKey} onChange={(e) => setRangeKey(e.target.value)}>
            <option value="wide">10 – 99 (wide)</option>
            <option value="mid">20 – 60 (mid)</option>
            <option value="narrow">25 – 35 (narrow)</option>
          </select>
        </div>
        <button id="s-run" className="ex-mini-btn ex-mini-btn-primary" onClick={runStream}>
          Run sampler
        </button>
        <p className="ex-tip">
          Each row is a real random expression generated client-side. Green is accepted; red shows why it failed.
        </p>
      </div>

      <div className="ex-sampler-out">
        <div className="ex-stream" id="s-stream" aria-live="polite" ref={streamRef}>
          {rows.map((row) => (
            <div key={row.attempt} className={"ex-attempt " + (row.accepted ? "is-ok" : "is-bad")}>
              <div className="ex-attempt-num">#{row.attempt}</div>
              <div className="ex-attempt-expr">{row.expr}</div>
              <div className="ex-attempt-val">= {formatValue(row.value)}</div>
              <div className="ex-attempt-reason">{row.reason}</div>
            </div>
          ))}
          {gaveUp && (
            <div className="ex-attempt is-bad" style={{ gridTemplateColumns: "1fr" }}>
              …gave up after {MAX_ATTEMPTS} attempts. Loosen the band or simplify operators.
            </div>
          )}
        </div>
        <div className="ex-stats">
          <div className="ex-stat-card">
            <div className="ex-stat-name">
              Acceptance rate <em>p</em>
            </div>
            <div className="ex-stat-val" id="s-p">
              {formatPercent(probability)}
            </div>
          </div>
          <div className="ex-stat-card">
            <div className="ex-stat-name">
              Expected attempts 1/<em>p</em>
            </div>
            <div className="ex-stat-val" id="s-exp">
              {formatExpectedAttempts(probability)}
            </div>
          </div>
          <div className="ex-stat-card">
            <div className="ex-stat-name">
              P(fail in 2000) = (1−<em>p</em>)<sup>2000</sup>
            </div>
            <div className="ex-stat-val" id="s-fail">
              {formatFailureProbability(probability)}
            </div>
          </div>
        </div>
      </div>

      <Drawer label="Go deeper">
        <p>
          <strong>
            Why the (1−p)<sup>2000</sup> matters.
          </strong>{" "}
          ARITHMIX caps generation at 2000 attempts per request. For the wide band with all four operators, p stays high
          enough that the cap is effectively never reached. Tighten the band above to <strong>25 – 35 (narrow)</strong>{" "}
          with all four operators and acceptance drops to p ≈ <strong>{narrow.p}</strong>. Expected wait climbs to{" "}
          <strong>{narrow.exp}</strong> attempts and (1−p)<sup>2000</sup> = <strong>{narrow.fail}</strong>. The difficulty
          configs in <code>puzzles.py</code> stay on the safe side of that curve.
        </p>
      </Drawer>
    </div>
  )
}
