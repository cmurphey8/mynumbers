import { puzzleRush, puzzleCheck } from "./generator"

describe("puzzleCheck", () => {
  it("marks an expression that reaches the target as correct", () => {
    const result = puzzleCheck({
      numbers: [2, 3, 4],
      expression: "2+3+4",
      target: 9,
    })
    expect(result.correct).toBe(true)
    expect(result.reason).toBe("correct")
    expect(result.evaluated).toBe(9)
    expect(result.evaluated_display).toBe("9")
  })

  it("marks an expression with the wrong value as incorrect", () => {
    const result = puzzleCheck({
      numbers: [2, 3, 4],
      expression: "2+3+4",
      target: 10,
    })
    expect(result.correct).toBe(false)
    expect(result.reason).toBe("wrong_value")
    expect(result.evaluated).toBe(9)
  })

  it("respects operator precedence", () => {
    const result = puzzleCheck({
      numbers: [2, 3, 4],
      expression: "2+3*4",
      target: 14,
    })
    expect(result.correct).toBe(true)
  })

  it("respects parentheses", () => {
    const result = puzzleCheck({
      numbers: [2, 3, 4],
      expression: "(2+3)*4",
      target: 20,
    })
    expect(result.correct).toBe(true)
  })

  it("rejects a number that is not in the bank", () => {
    const result = puzzleCheck({
      numbers: [2, 3],
      expression: "2+9",
      target: 11,
    })
    expect(result.correct).toBe(false)
    expect(result.reason).toBe("invalid_expression")
    expect(result.message).toMatch(/Number 9 not available/)
  })

  it("rejects reusing a number more times than it appears in the bank", () => {
    const result = puzzleCheck({
      numbers: [2, 3],
      expression: "2+2",
      target: 4,
    })
    expect(result.correct).toBe(false)
    expect(result.reason).toBe("invalid_expression")
    expect(result.message).toMatch(/Number 2 not available/)
  })

  it("reports division by zero", () => {
    const result = puzzleCheck({
      numbers: [4, 0],
      expression: "4/0",
      target: 1,
    })
    expect(result.correct).toBe(false)
    expect(result.reason).toBe("invalid_expression")
    expect(result.message).toBe("Division by zero")
  })

  it("rejects expressions with invalid characters", () => {
    const result = puzzleCheck({
      numbers: [2, 3],
      expression: "2^3",
      target: 8,
    })
    expect(result.correct).toBe(false)
    expect(result.reason).toBe("invalid_expression")
  })

  it("represents non-integer results as a fraction", () => {
    const result = puzzleCheck({
      numbers: [1, 2],
      expression: "1/2",
    })
    expect(result.reason).toBe("valid_expression")
    expect(result.evaluated).toBeCloseTo(0.5)
    expect(result.evaluated_display).toBe("1/2")
  })

  it("returns valid_expression when no target is provided", () => {
    const result = puzzleCheck({
      numbers: [5, 6],
      expression: "5+6",
    })
    expect(result.correct).toBe(false)
    expect(result.reason).toBe("valid_expression")
    expect(result.evaluated).toBe(11)
  })

  it("throws when numbers or expression are missing", () => {
    expect(() =>
      puzzleCheck({ numbers: [], expression: "" }),
    ).toThrow(/Missing numbers or expression/)
  })
})

describe("puzzleRush", () => {
  it("rejects difficulties outside the supported range", () => {
    expect(() => puzzleRush({ difficulty: 0 })).toThrow(/difficulty must be 1-12/)
    expect(() => puzzleRush({ difficulty: 13 })).toThrow(/difficulty must be 1-12/)
  })

  it("produces puzzles that satisfy their invariants", () => {
    for (let i = 0; i < 25; i++) {
      const decoys = 2
      const puzzle = puzzleRush({ difficulty: 5, decoys })

      expect(puzzle.used_numbers).toHaveLength(5)
      expect(new Set(puzzle.used_numbers).size).toBe(5)
      expect(puzzle.numbers).toHaveLength(5 + decoys)
      expect(puzzle.num_placeholders).toBe(5)
      expect(puzzle.solution_expr).toBeNull()
    }
  })

  it("only uses addition with no parentheses at difficulty 1", () => {
    for (let i = 0; i < 25; i++) {
      const puzzle = puzzleRush({ difficulty: 1 })
      const operators = puzzle.template_tokens.filter(t => /[+\-*/]/.test(t))
      expect(operators.every(op => op === "+")).toBe(true)
      expect(puzzle.template_tokens).not.toContain("(")
      expect(puzzle.target).toBeGreaterThanOrEqual(10)
      expect(puzzle.target).toBeLessThanOrEqual(25)
    }
  })

  it("includes at least one division at difficulty 7", () => {
    for (let i = 0; i < 25; i++) {
      const puzzle = puzzleRush({ difficulty: 7 })
      expect(puzzle.template_tokens).toContain("/")
    }
  })
})
