import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useSyncWithHistory, stripSegment } from "../router"
import { ExplainerContainer, ExplainerGlobalStyles } from "./ExplainerStyles"
import { useGameSize } from "../hooks/useGameSize"
import { ExpressionTree } from "./explainer/ExpressionTree"
import { RejectionSampler } from "./explainer/RejectionSampler"
import { PermutationVerifier } from "./explainer/PermutationVerifier"

const TOTAL_SLIDES = 5
const SWIPE_THRESHOLD = 0.2

const SUBTITLES: Record<number, string> = {
  1: "From random expression to playable challenge",
  2: "Recursion, evaluation, and pretty-printing",
  3: "Bernoulli trials and the geometric distribution",
  4: "Searching arrangements of the bank",
  5: "MIT Learn courses go deeper on these ideas and more",
}

export function ExplainerPage() {
  const navigate = useNavigate()
  const syncWithHistory = useSyncWithHistory()
  const size = useGameSize()
  const [current, setCurrent] = useState(1)
  const [jumpedSlide, setJumpedSlide] = useState<number | null>(null)

  const viewportRef = useRef<HTMLDivElement>(null)
  const jumpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goToSlide = useCallback((slideNumber: number, highlight = false) => {
    const target = Math.max(1, Math.min(TOTAL_SLIDES, slideNumber))
    setCurrent(target)
    if (highlight) {
      setJumpedSlide(null)
      // Re-apply on the next frame so the CSS highlight animation restarts.
      requestAnimationFrame(() => setJumpedSlide(target))
    }
  }, [])

  const goHome = useCallback(() => {
    if (syncWithHistory) {
      navigate("/")
    } else {
      window.location.assign(stripSegment(window.location.pathname, "explainer"))
    }
  }, [syncWithHistory, navigate])

  // Clear the transient "jumped" highlight after it has played.
  useEffect(() => {
    if (jumpedSlide === null) return
    if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current)
    jumpTimerRef.current = setTimeout(() => setJumpedSlide(null), 700)
    return () => {
      if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current)
    }
  }, [jumpedSlide])

  // Keyboard navigation.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const tag = (document.activeElement && document.activeElement.tagName) || ""
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return
      if (event.key === "ArrowRight") {
        setCurrent((c) => Math.min(TOTAL_SLIDES, c + 1))
        event.preventDefault()
      } else if (event.key === "ArrowLeft") {
        setCurrent((c) => Math.max(1, c - 1))
        event.preventDefault()
      } else if (event.key === "Escape") {
        goHome()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [goHome])

  // Swipe navigation.
  const swipe = useRef({ startX: null as number | null, deltaX: 0, dragging: false })
  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, select, input, a, svg .tree-node, .ex-pslot")) return
    swipe.current = { startX: event.clientX, deltaX: 0, dragging: true }
    try {
      viewportRef.current?.setPointerCapture(event.pointerId)
    } catch {
      /* ignore */
    }
  }, [])
  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (swipe.current.dragging && swipe.current.startX !== null) {
      swipe.current.deltaX = event.clientX - swipe.current.startX
    }
  }, [])
  const onPointerUp = useCallback(() => {
    if (!swipe.current.dragging) return
    swipe.current.dragging = false
    const width = viewportRef.current?.clientWidth || 1
    const ratio = swipe.current.deltaX / width
    if (ratio < -SWIPE_THRESHOLD) setCurrent((c) => Math.min(TOTAL_SLIDES, c + 1))
    else if (ratio > SWIPE_THRESHOLD) setCurrent((c) => Math.max(1, c - 1))
  }, [])
  const onPointerCancel = useCallback(() => {
    swipe.current.dragging = false
  }, [])

  function slideClass(slideNumber: number) {
    return "ex-slide" + (jumpedSlide === slideNumber ? " is-jumped" : "")
  }

  return (
    <>
      <ExplainerGlobalStyles />
      <ExplainerContainer data-am-size={size}>
        {/* Top bar */}
        <header className="ex-topbar" aria-label="Explainer navigation">
          <button className="ex-back" aria-label="Back to game" onClick={goHome}>
            ←
          </button>
          <div className="ex-title-block">
            <div className="ex-title">
              Inside <span className="ex-brand">ARITHMIX</span>
            </div>
            <div className="ex-subtitle" id="ex-slide-subtitle">
              {SUBTITLES[current]}
            </div>
          </div>
          <div className="ex-counter">
            <span id="ex-current">{current}</span>/<span id="ex-total">{TOTAL_SLIDES}</span>
          </div>
        </header>

        <div className="ex-progress" aria-hidden="true">
          <div
            className="ex-progress-fill"
            id="ex-progress-fill"
            style={{ width: ((current / TOTAL_SLIDES) * 100).toFixed(3) + "%" }}
          />
        </div>

        {/* Persistent puzzle strip */}
        <section className="ex-puzzle-strip" aria-label="Running example puzzle">
          <div className="ex-mini-target">
            <span className="ex-mini-label">Target</span>
            <span className="ex-mini-target-val">29</span>
          </div>
          <div className="ex-mini-template" aria-label="Template">
            <span className="ex-tok ex-tok-paren">(</span>
            <span className="ex-tok ex-tok-paren">(</span>
            <span className="ex-mini-slot">__</span>
            <span className="ex-tok ex-tok-op">+</span>
            <span className="ex-mini-slot">__</span>
            <span className="ex-tok ex-tok-paren">)</span>
            <span className="ex-tok ex-tok-op">×</span>
            <span className="ex-mini-slot">__</span>
            <span className="ex-tok ex-tok-paren">)</span>
            <span className="ex-tok ex-tok-op">−</span>
            <span className="ex-tok ex-tok-paren">(</span>
            <span className="ex-mini-slot">__</span>
            <span className="ex-tok ex-tok-op">÷</span>
            <span className="ex-mini-slot">__</span>
            <span className="ex-tok ex-tok-paren">)</span>
          </div>
          <div className="ex-mini-bank" aria-label="Bank">
            {[2, 3, 4, 5, 7, 8, 9].map((n) => (
              <span key={n} className="ex-mini-chip">
                {n}
              </span>
            ))}
          </div>
        </section>

        {/* Carousel */}
        <div
          className="ex-viewport"
          id="ex-viewport"
          role="region"
          aria-roledescription="carousel"
          aria-label="Explainer slides"
          tabIndex={0}
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          <div className="ex-track" id="ex-track" style={{ transform: `translateX(-${(current - 1) * 100}%)` }}>
            {/* Slide 1: Pipeline overview */}
            <section className={slideClass(1)} data-slide="1" data-tone="neutral" aria-label="Slide 1: Pipeline overview" inert={current === 1 ? undefined : true}>
              <h2 className="ex-h">Follow one puzzle from random expression to playable challenge!</h2>
              <p className="ex-sub">
                Every puzzle moves through four stages on the server before you ever see it. Tap a stage to jump there.
              </p>

              <div className="ex-pipeline" id="ex-pipeline" aria-label="Pipeline stages">
                <button className="ex-stage" data-tone="tree" aria-label="Build stage" onClick={() => goToSlide(2)}>
                  <div className="ex-stage-mini" data-stage="build">
                    <span className="ex-mini-node" />
                    <span className="ex-mini-edge" />
                    <span className="ex-mini-node" />
                    <span className="ex-mini-edge" />
                    <span className="ex-mini-node" />
                    <span className="ex-mini-ok">✓</span>
                  </div>
                  <div className="ex-stage-name">Build</div>
                  <div className="ex-stage-tag">expression tree</div>
                </button>
                <span className="ex-pipe-arrow">→</span>
                <button className="ex-stage" data-tone="prob" aria-label="Sample stage" onClick={() => goToSlide(3)}>
                  <div className="ex-stage-mini" data-stage="filter">
                    <span className="ex-mini-x">✕</span>
                    <span className="ex-mini-x">✕</span>
                    <span className="ex-mini-x">✕</span>
                    <span className="ex-mini-ok">✓</span>
                  </div>
                  <div className="ex-stage-name">Sample</div>
                  <div className="ex-stage-tag">accept / reject</div>
                </button>
                <span className="ex-pipe-arrow">→</span>
                <button className="ex-stage" data-tone="search" aria-label="Verify stage" onClick={() => goToSlide(4)}>
                  <div className="ex-stage-mini" data-stage="verify">
                    <span className="ex-mini-perm" />
                    <span className="ex-mini-perm" />
                    <span className="ex-mini-perm" />
                    <span className="ex-mini-ok">✓</span>
                  </div>
                  <div className="ex-stage-name">Verify</div>
                  <div className="ex-stage-tag">permutations</div>
                </button>
                <span className="ex-pipe-arrow">→</span>
                <button className="ex-stage" data-tone="connect" aria-label="Connect stage" onClick={() => goToSlide(5)}>
                  <div className="ex-stage-mini" data-stage="play">
                    <span className="ex-mini-chip">4</span>
                    <span className="ex-mini-chip">7</span>
                    <span className="ex-mini-ok">✓</span>
                  </div>
                  <div className="ex-stage-name">Connect</div>
                  <div className="ex-stage-tag">to the courses</div>
                </button>
              </div>
            </section>

            {/* Slide 2: Expression Trees */}
            <section className={slideClass(2)} data-slide="2" data-tone="tree" aria-label="Slide 2: Expression trees" inert={current === 2 ? undefined : true}>
              <div className="ex-row-head">
                <h2 className="ex-h">A puzzle begins as a tree</h2>
                <span className="ex-course-tag" data-course="cs">
                  6.100.2x · recursion &amp; trees
                </span>
              </div>
              <p className="ex-sub">
                The tree builds itself top-down on arrival. <strong>Tap any node</strong> to walk its subtree post-order
                and reveal each running value.
              </p>

              <ExpressionTree active={current === 2} />
            </section>

            {/* Slide 3: Rejection Sampling */}
            <section className={slideClass(3)} data-slide="3" data-tone="prob" aria-label="Slide 3: Rejection sampling" inert={current === 3 ? undefined : true}>
              <div className="ex-row-head">
                <h2 className="ex-h">Most random expressions are rejected</h2>
                <span className="ex-course-tag" data-course="prob">
                  Probability &amp; Statistical Data Analysis · PRIMARY
                </span>
              </div>
              <p className="ex-sub">
                The server keeps drawing random expressions until one lands an integer result inside the target band.
                Each attempt is a <strong>Bernoulli trial</strong>; the number of trials before the first success follows
                a <strong>geometric distribution</strong> with mean&nbsp;1/p.
              </p>

              <RejectionSampler active={current === 3} />
            </section>

            {/* Slide 4: Permutation Verification */}
            <section className={slideClass(4)} data-slide="4" data-tone="search" aria-label="Slide 4: Permutation verification" inert={current === 4 ? undefined : true}>
              <div className="ex-row-head">
                <h2 className="ex-h">Can the number bank actually solve the puzzle?</h2>
                <span className="ex-course-tag" data-course="prob">
                  Probability &amp; Statistical Data Analysis · PRIMARY
                </span>
              </div>
              <p className="ex-sub">
                Each verification step is the same routine: <strong>pick</strong> five distinct chips from the seven-chip
                bank in a chosen order, <strong>drop</strong> them into the slots, <strong>evaluate</strong> the
                expression, and <strong>compare</strong> against the target. A miss advances to the next arrangement; a
                hit stops the search.
              </p>

              <PermutationVerifier active={current === 4} />
            </section>

            {/* Slide 5: MIT Learn */}
            <section className={slideClass(5)} data-slide="5" data-tone="neutral" aria-label="Slide 5: MIT Learn connections" inert={current === 5 ? undefined : true}>
              <h2 className="ex-h">Go further with MIT courses!</h2>

              <div className="ex-courses">
                <article className="ex-course-card ex-course-primary">
                  <div className="ex-course-flag">PRIMARY</div>
                  <h3>Probability and Statistical Data Analysis</h3>
                  <p className="ex-course-blurb">
                    The math behind why some puzzles are easy to generate and others almost impossible.
                  </p>
                  <ul>
                    <li>Bernoulli trials</li>
                    <li>Geometric distribution</li>
                    <li>Expected value</li>
                    <li>Permutations and counting</li>
                  </ul>
                  <a href="#" className="ex-course-cta" data-cta="primary">
                    Explore the course →
                  </a>
                </article>

                <article className="ex-course-card ex-course-secondary">
                  <div className="ex-course-flag">SECONDARY · active on MITx</div>
                  <h3>6.100.2x: Introduction to Computational Thinking and Data Science</h3>
                  <p className="ex-course-blurb">
                    The data structures and algorithms that turn the math into running code.
                  </p>
                  <ul>
                    <li>Recursion &amp; trees</li>
                    <li>Simulation &amp; sampling</li>
                    <li>Search</li>
                    <li>Operator precedence &amp; parsing</li>
                  </ul>
                  <a
                    href="https://learn.mit.edu/search?q=computational+thinking&resource=2971"
                    className="ex-course-cta"
                    data-cta="secondary"
                  >
                    Explore the course →
                  </a>
                </article>
              </div>

              <div className="ex-concepts">
                <div className="ex-readout-label">Jump back to a concept</div>
                <div className="ex-chip-row">
                  <button className="ex-concept-chip" onClick={() => goToSlide(2, true)}>
                    Trees
                  </button>
                  <button className="ex-concept-chip" onClick={() => goToSlide(2, true)}>
                    Recursion
                  </button>
                  <button className="ex-concept-chip" onClick={() => goToSlide(3, true)}>
                    Rejection sampling
                  </button>
                  <button className="ex-concept-chip" onClick={() => goToSlide(3, true)}>
                    Geometric distribution
                  </button>
                  <button className="ex-concept-chip" onClick={() => goToSlide(4, true)}>
                    Permutations
                  </button>
                </div>
              </div>

              <div className="ex-final-cta">
                <a className="ex-cta ex-cta-primary" href="https://learn.mit.edu" target="_blank" rel="noopener">
                  Explore Courses
                </a>
                <button className="ex-cta ex-cta-secondary" onClick={goHome}>
                  Play ARITHMIX →
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* Navigation */}
        <nav className="ex-nav" aria-label="Slide controls">
          <button
            id="ex-prev"
            className="ex-nav-btn"
            disabled={current === 1}
            onClick={() => setCurrent((c) => Math.max(1, c - 1))}
          >
            ← Prev
          </button>
          <div className="ex-dots" id="ex-dots" role="tablist" aria-label="Slide indicators">
            {Array.from({ length: TOTAL_SLIDES }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className={"ex-dot" + (current === n ? " is-active" : "")}
                role="tab"
                aria-label={`Slide ${n}`}
                aria-selected={current === n}
                onClick={() => goToSlide(n)}
              />
            ))}
          </div>
          <button
            id="ex-next"
            className="ex-nav-btn ex-nav-btn-primary"
            disabled={current === TOTAL_SLIDES}
            onClick={() => setCurrent((c) => Math.min(TOTAL_SLIDES, c + 1))}
          >
            Next →
          </button>
        </nav>
        </ExplainerContainer>
    </>
  )
}
