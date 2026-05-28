// ============================================================================
// Explainer — Slide 2: Expression Tree (React)
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react"
import { reducedMotion } from "./motion"

interface TreeNode {
  id: string
  op?: string
  val?: number
  left?: string
  right?: string
  x: number
  y: number
}

const TREE: Record<string, TreeNode> = {
  n1: { id: "n1", op: "-", left: "n2", right: "n5", x: 280, y: 40 },
  n2: { id: "n2", op: "*", left: "n3", right: "n4", x: 160, y: 110 },
  n3: { id: "n3", op: "+", left: "n6", right: "n7", x: 90, y: 180 },
  n4: { id: "n4", val: 3, x: 230, y: 180 },
  n5: { id: "n5", op: "/", left: "n8", right: "n9", x: 400, y: 110 },
  n6: { id: "n6", val: 4, x: 50, y: 250 },
  n7: { id: "n7", val: 7, x: 130, y: 250 },
  n8: { id: "n8", val: 8, x: 360, y: 180 },
  n9: { id: "n9", val: 2, x: 440, y: 180 },
}

const BUILD_ORDER = ["n1", "n2", "n3", "n6", "n7", "n4", "n5", "n8", "n9"]

const NODES = Object.values(TREE)
const EDGES = NODES.flatMap((node) =>
  (["left", "right"] as const)
    .map((side) => node[side])
    .filter((childId): childId is string => Boolean(childId))
    .map((childId) => ({ from: node.id, to: childId, child: TREE[childId] }))
)

function evalNode(id: string): number {
  const node = TREE[id]
  if (node.val !== undefined) return node.val
  const leftValue = evalNode(node.left!)
  const rightValue = evalNode(node.right!)
  return node.op === "+" ? leftValue + rightValue
    : node.op === "-" ? leftValue - rightValue
    : node.op === "*" ? leftValue * rightValue
    : leftValue / rightValue
}

function subExpr(id: string, parentPrecedence: number): string {
  const node = TREE[id]
  if (node.val !== undefined) return String(node.val)
  const symbol = { "+": " + ", "-": " − ", "*": " × ", "/": " ÷ " }[node.op!]!
  const precedence = { "+": 1, "-": 1, "*": 2, "/": 2 }[node.op!]!
  const inner = subExpr(node.left!, precedence) + symbol + subExpr(node.right!, precedence)
  return precedence < parentPrecedence ? `(${inner})` : inner
}

function descendants(id: string, collected: string[] = []): string[] {
  collected.push(id)
  const node = TREE[id]
  if (node.left) descendants(node.left, collected)
  if (node.right) descendants(node.right, collected)
  return collected
}

function postOrder(rootId: string): string[] {
  const ordered: string[] = []
  ;(function visit(id: string) {
    const node = TREE[id]
    if (node.left) visit(node.left)
    if (node.right) visit(node.right)
    ordered.push(id)
  })(rootId)
  return ordered
}

function nodeLabel(node: TreeNode): string {
  return node.val !== undefined
    ? String(node.val)
    : ({ "*": "×", "/": "÷", "-": "−" }[node.op!] || node.op!)
}

interface ReadoutState {
  label: string
  expr: string
  val: string
}

interface AnimState {
  type: "tap-pulse" | "eval-pulse"
  key: number
}

const EMPTY_READOUT: ReadoutState = { label: "select a node to begin", expr: "", val: "" }

export function ExpressionTree({ active }: { active: boolean }) {
  const [visible, setVisible] = useState<Set<string>>(() => new Set())
  const [highlight, setHighlight] = useState<Set<string>>(() => new Set())
  const [badges, setBadges] = useState<Record<string, number>>({})
  const [anim, setAnim] = useState<Record<string, AnimState>>({})
  const [readout, setReadout] = useState<ReadoutState>(EMPTY_READOUT)

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const pulseSeq = useRef(0)

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  // Build animation runs each time the slide becomes active.
  useEffect(() => {
    if (!active) {
      clearTimers()
      return
    }
    clearTimers()
    setHighlight(new Set())
    setBadges({})
    setAnim({})
    setReadout(EMPTY_READOUT)

    if (reducedMotion) {
      setVisible(new Set(BUILD_ORDER))
      return
    }

    setVisible(new Set())
    const start = setTimeout(() => {
      BUILD_ORDER.forEach((id, index) => {
        timers.current.push(
          setTimeout(() => {
            setVisible((prev) => {
              const next = new Set(prev)
              next.add(id)
              return next
            })
          }, index * 180)
        )
      })
    }, 340)
    timers.current.push(start)

    return clearTimers
  }, [active, clearTimers])

  const evaluateSubtree = useCallback(
    (rootId: string) => {
      clearTimers()
      setVisible(new Set(BUILD_ORDER))

      const subtree = new Set(descendants(rootId))
      setHighlight(subtree)
      setBadges({})
      setReadout({ label: "Selected subtree", expr: subExpr(rootId, 0), val: "= " + evalNode(rootId) })

      // tap-pulse on the clicked node
      const tapKey = ++pulseSeq.current
      setAnim({ [rootId]: { type: "tap-pulse", key: tapKey } })

      const order = postOrder(rootId)
      if (reducedMotion) {
        const filled: Record<string, number> = {}
        order.forEach((id) => (filled[id] = evalNode(id)))
        setBadges(filled)
        setReadout({ label: "Selected subtree", expr: subExpr(rootId, 0), val: "= " + evalNode(rootId) })
        return
      }

      order.forEach((id, index) => {
        timers.current.push(
          setTimeout(() => {
            const value = evalNode(id)
            const key = ++pulseSeq.current
            setAnim((prev) => ({ ...prev, [id]: { type: "eval-pulse", key } }))
            setBadges((prev) => ({ ...prev, [id]: value }))
            setReadout({ label: "Selected subtree", expr: subExpr(id, 0), val: "= " + value })
          }, index * 480)
        )
      })
    },
    [clearTimers]
  )

  return (
    <div className="ex-tree-layout">
      <div className="ex-tree-col-visual">
        <div className="ex-tree-wrap">
          <svg className="ex-tree-svg" id="tree-svg" viewBox="0 0 560 300" aria-label="Expression tree">
            {EDGES.map((edge) => (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={TREE[edge.from].x}
                y1={TREE[edge.from].y}
                x2={edge.child.x}
                y2={edge.child.y}
                className={"tree-edge" + (highlight.has(edge.from) && highlight.has(edge.to) ? " is-hi" : "")}
                style={{ opacity: visible.has(edge.to) ? 1 : 0 }}
              />
            ))}
            {NODES.map((node) => {
              const a = anim[node.id]
              const classes = [
                "tree-node",
                node.val !== undefined ? "is-leaf" : "is-op",
                highlight.has(node.id) ? "is-hi" : "",
                badges[node.id] !== undefined ? "has-val" : "",
                a ? a.type : "",
              ]
                .filter(Boolean)
                .join(" ")
              return (
                <g
                  key={node.id}
                  className={classes}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ opacity: visible.has(node.id) ? 1 : 0 }}
                  role="button"
                  tabIndex={visible.has(node.id) ? 0 : -1}
                  aria-label={`Evaluate subtree at ${nodeLabel(node)}`}
                  onClick={() => evaluateSubtree(node.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      evaluateSubtree(node.id)
                    }
                  }}
                >
                  {/* key forces remount so the CSS pulse animation restarts on each trigger */}
                  <circle key={a ? a.key : "base"} r="22" />
                  <text>{nodeLabel(node)}</text>
                  <rect x="-18" y="18" width="36" height="18" rx="4" className="tree-badge-bg" />
                  <text y="27" className="tree-badge-text">
                    {badges[node.id] !== undefined ? String(badges[node.id]) : ""}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
      <div className="ex-tree-col-readout">
        <div className="ex-tree-readout">
          <div className="ex-readout-label" id="tree-readout-label">
            {readout.label}
          </div>
          <div className="ex-readout-line">
            <div className="ex-readout-expr" id="tree-sub-expr">
              {readout.expr}
            </div>
            <div className="ex-readout-val" id="tree-sub-val">
              {readout.val}
            </div>
          </div>
        </div>
        <Drawer label="Go deeper">
          <p>
            Internal nodes are operators in {"{+, −, ×, ÷}"} and leaves are integers. Evaluation is a post-order walk:
            compute the left and right children, then apply the operator. Pretty-printing only adds parentheses when a
            child's precedence is lower than the current operator's. That's why <code>(4 + 7) × 3</code> keeps its inner
            parens but <code>4 + 7</code> alone would not.
          </p>
        </Drawer>
      </div>
    </div>
  )
}

export function Drawer({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="ex-deeper" onClick={() => setOpen((v) => !v)}>
        {open ? `${label} ▴` : `${label} ▾`}
      </button>
      <div className="ex-drawer" hidden={!open}>
        {children}
      </div>
    </>
  )
}
