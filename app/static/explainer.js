/* ============================================================
   ARITHMIX Explainer — carousel + per-slide interactives
   5 slides:
     1 hero / pipeline
     2 expression trees (build / evaluate)
     3 rejection sampling (real random expressions)
     4 search space & expected effort (solution rarity)
     5 MIT Learn connections
   ============================================================ */

/* History seeding — runs synchronously before any other explainer code so
   the first browser Back from /explainer is guaranteed to land on a /
   entry in menu state. Idempotent: a `seeded` marker on history.state
   prevents re-seeding across refresh, bfcache restore, or repeat visits. */
(function seedHistoryIfNeeded() {
  if (history.state && history.state.seeded === true) return;

  const params = new URLSearchParams(window.location.search);
  const fromApp = params.get("from") === "app";

  if (fromApp) {
    // In-app push from game.js — a menu entry already sits behind us.
    // Strip the query and mark this entry seeded.
    history.replaceState(
      { arithmix: "explainer", seeded: true },
      "",
      "/explainer"
    );
  } else {
    // Direct load (typed URL, bookmark, external link). Synthesize a menu
    // entry behind us by replacing the current entry with `/` then pushing
    // `/explainer` back on top. URL ends back at /explainer; history has
    // [{/,menu}, {/explainer,seeded}].
    history.replaceState({ arithmix: "menu" }, "", "/");
    history.pushState(
      { arithmix: "explainer", seeded: true },
      "",
      "/explainer"
    );
  }
})();

/* Companion to the seeding IIFE above. In the direct-load branch the
   synthesized menu entry is same-document with /explainer, so a browser/
   in-app Back fires popstate but does NOT load game.html — the user stays
   visually on the explainer. Force a real load of `/` when popstate lands
   on the seeded menu state so the first Back from /explainer actually
   reaches the menu.

   In the in-app branch the menu entry belongs to a different document
   (game.html) so popstate doesn't fire on this document — the handler is
   inert there, which is what we want. */
window.addEventListener("popstate", (e) => {
  if (e.state && e.state.arithmix === "menu") {
    window.location.replace("/");
  }
});

(function () {
  const TOTAL_SLIDES = 5;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const SUBTITLES = {
    1: "From random expression to playable challenge",
    2: "Recursion, evaluation, and pretty-printing",
    3: "Bernoulli trials and the geometric distribution",
    4: "Searching arrangements of the bank",
    5: "MIT Learn courses go deeper on these ideas and more",
  };

  /* ──────────────── Carousel ──────────────── */
  const track = document.getElementById("ex-track");
  const viewport = document.getElementById("ex-viewport");
  const dotsHost = document.getElementById("ex-dots");
  const prevBtn = document.getElementById("ex-prev");
  const nextBtn = document.getElementById("ex-next");
  const progressFill = document.getElementById("ex-progress-fill");
  const counter = document.getElementById("ex-current");
  const subtitle = document.getElementById("ex-slide-subtitle");
  document.getElementById("ex-total").textContent = TOTAL_SLIDES;

  let current = 1;

  for (let i = 1; i <= TOTAL_SLIDES; i++) {
    const b = document.createElement("button");
    b.className = "ex-dot";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", `Slide ${i}`);
    b.dataset.target = i;
    b.addEventListener("click", () => goTo(i));
    dotsHost.appendChild(b);
  }

  // Slide 4 registers its animation stopper here so goTo() can halt it on nav-away.
  let s4StopAnim = function () {};

  function goTo(n, opts) {
    n = Math.max(1, Math.min(TOTAL_SLIDES, n));
    const previous = current;
    current = n;
    track.style.transform = `translateX(-${(n - 1) * 100}%)`;
    counter.textContent = n;
    progressFill.style.width = (n / TOTAL_SLIDES * 100).toFixed(3) + "%";
    subtitle.textContent = SUBTITLES[n] || "";
    [...dotsHost.children].forEach((d, i) => d.classList.toggle("is-active", i === n - 1));
    prevBtn.disabled = n === 1;
    nextBtn.disabled = n === TOTAL_SLIDES;
    if (opts && opts.highlight) {
      const slide = track.children[n - 1];
      slide.classList.remove("is-jumped");
      void slide.offsetWidth;
      slide.classList.add("is-jumped");
    }
    // Stop background activity when leaving slides that run timers
    if (n !== 4) s4StopAnim();
    if (n !== 3) stopStream();
    if (n !== 2) cancelTreeAnims();
    if (n === 2 && previous !== 2) resetTreeAndAnimate();
  }

  prevBtn.addEventListener("click", () => goTo(current - 1));
  nextBtn.addEventListener("click", () => goTo(current + 1));

  // Return to the homepage. Uses history.back() so this in-app control
  // behaves IDENTICALLY to the browser Back button. The seeding IIFE at the
  // top of this file guarantees that a `/` entry in menu state always sits
  // immediately behind /explainer, so back() always lands on the menu.
  function returnToGame() {
    window.history.back();
  }

  document.addEventListener("keydown", (e) => {
    const tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (e.key === "ArrowRight") { goTo(current + 1); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { goTo(current - 1); e.preventDefault(); }
    else if (e.key === "Escape") { returnToGame(); }
  });

  // Swipe (pointer) — drag >20% of viewport to advance
  (function bindSwipe() {
    let startX = null, dx = 0, dragging = false;
    const SWIPE_THRESH = 0.20;
    viewport.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button, select, input, a, svg .tree-node, .ex-pslot")) return;
      startX = e.clientX; dx = 0; dragging = true;
      try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
    });
    viewport.addEventListener("pointermove", (e) => { if (dragging) dx = e.clientX - startX; });
    viewport.addEventListener("pointerup", () => {
      if (!dragging) return;
      dragging = false;
      const ratio = dx / viewport.clientWidth;
      if (ratio < -SWIPE_THRESH) goTo(current + 1);
      else if (ratio > SWIPE_THRESH) goTo(current - 1);
    });
    viewport.addEventListener("pointercancel", () => { dragging = false; });
  })();

  // Click-to-jump (pipeline + concept chips)
  document.addEventListener("click", (e) => {
    const j = e.target.closest("[data-jump]");
    if (j) {
      const target = parseInt(j.dataset.jump, 10);
      goTo(target, { highlight: !!j.dataset.highlight });
    }
  });

  // Intercept explainer→home navigations and route them through returnToGame()
  // so the visit uses replace (no new history entry). Covers both anchor links
  // to "/" and any button with [data-go-home]. Bail on modifier/middle-click so
  // "Open in new tab" still works as expected.
  document.addEventListener("click", (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const t = e.target.closest('a[href="/"], [data-go-home]');
    if (!t) return;
    e.preventDefault();
    returnToGame();
  });

  // "Go deeper" drawers
  document.querySelectorAll(".ex-deeper").forEach((btn) => {
    btn.addEventListener("click", () => {
      const drawer = document.getElementById(btn.dataset.drawer);
      const open = !drawer.hidden;
      drawer.hidden = open;
      btn.textContent = open ? "Go deeper ▾" : "Go deeper ▴";
    });
  });

  /* ──────────────── Slide 2: Expression tree ──────────────── */
  // Hardcoded tree for ((4 + 7) × 3) - (8 ÷ 2)
  //          -
  //        /   \
  //       ×     ÷
  //      / \   / \
  //     +   3 8   2
  //    / \
  //   4   7
  const TREE = {
    n1: { id: "n1", op: "-",  l: "n2", r: "n5", x: 280, y: 40 },
    n2: { id: "n2", op: "*",  l: "n3", r: "n4", x: 160, y: 110 },
    n3: { id: "n3", op: "+",  l: "n6", r: "n7", x: 90,  y: 180 },
    n4: { id: "n4", val: 3,                     x: 230, y: 180 },
    n5: { id: "n5", op: "/",  l: "n8", r: "n9", x: 400, y: 110 },
    n6: { id: "n6", val: 4,                     x: 50,  y: 250 },
    n7: { id: "n7", val: 7,                     x: 130, y: 250 },
    n8: { id: "n8", val: 8,                     x: 360, y: 180 },
    n9: { id: "n9", val: 2,                     x: 440, y: 180 },
  };
  const POST_ORDER = ["n6", "n7", "n3", "n4", "n2", "n8", "n9", "n5", "n1"];
  // Pre-order DFS — mirrors a recursive build(node) call stack: visit the
  // node, recurse left, recurse right. The reveal walks down the left
  // spine first, then unwinds to fill right subtrees.
  const BUILD_ORDER = ["n1", "n2", "n3", "n6", "n7", "n4", "n5", "n8", "n9"];

  function evalNode(id) {
    const n = TREE[id];
    if (n.val !== undefined) return n.val;
    const a = evalNode(n.l), b = evalNode(n.r);
    return n.op === "+" ? a + b : n.op === "-" ? a - b : n.op === "*" ? a * b : a / b;
  }

  function subExpr(id, parentPrec) {
    const n = TREE[id];
    if (n.val !== undefined) return String(n.val);
    const sym = { "+": " + ", "-": " − ", "*": " × ", "/": " ÷ " }[n.op];
    const prec = { "+": 1, "-": 1, "*": 2, "/": 2 }[n.op];
    const inner = subExpr(n.l, prec) + sym + subExpr(n.r, prec);
    return prec < parentPrec ? `(${inner})` : inner;
  }

  function descendants(id, acc) {
    acc.push(id);
    const n = TREE[id];
    if (n.l) descendants(n.l, acc);
    if (n.r) descendants(n.r, acc);
    return acc;
  }

  const SVG_NS = "http://www.w3.org/2000/svg";
  function renderTree() {
    const svg = document.getElementById("tree-svg");
    svg.innerHTML = "";

    // edges first
    Object.values(TREE).forEach((n) => {
      ["l", "r"].forEach((side) => {
        if (!n[side]) return;
        const c = TREE[n[side]];
        const line = document.createElementNS(SVG_NS, "line");
        line.setAttribute("x1", n.x); line.setAttribute("y1", n.y);
        line.setAttribute("x2", c.x); line.setAttribute("y2", c.y);
        line.setAttribute("class", "tree-edge");
        line.dataset.from = n.id; line.dataset.to = c.id;
        svg.appendChild(line);
      });
    });

    // nodes
    Object.values(TREE).forEach((n) => {
      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", "tree-node " + (n.val !== undefined ? "is-leaf" : "is-op"));
      g.setAttribute("transform", `translate(${n.x}, ${n.y})`);
      g.dataset.id = n.id;

      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("r", 22);
      const t = document.createElementNS(SVG_NS, "text");
      t.textContent = n.val !== undefined
        ? String(n.val)
        : ({ "*": "×", "/": "÷", "-": "−" }[n.op] || n.op);

      // value badge — rendered but hidden until "has-val" is applied
      const badgeBg = document.createElementNS(SVG_NS, "rect");
      badgeBg.setAttribute("x", -18); badgeBg.setAttribute("y", 18);
      badgeBg.setAttribute("width", 36); badgeBg.setAttribute("height", 18);
      badgeBg.setAttribute("rx", 4);
      badgeBg.setAttribute("class", "tree-badge-bg");
      const badgeText = document.createElementNS(SVG_NS, "text");
      badgeText.setAttribute("y", 27);
      badgeText.setAttribute("class", "tree-badge-text");
      badgeText.dataset.role = "badge";

      g.appendChild(c);
      g.appendChild(t);
      g.appendChild(badgeBg);
      g.appendChild(badgeText);

      g.addEventListener("click", () => {
        g.classList.remove("tap-pulse");
        void g.offsetWidth;
        g.classList.add("tap-pulse");
        animateEvaluateSubtree(n.id);
      });
      svg.appendChild(g);
    });
  }

  function highlightSubtree(id) {
    const svg = document.getElementById("tree-svg");
    svg.querySelectorAll(".tree-node.is-hi").forEach(el => el.classList.remove("is-hi"));
    svg.querySelectorAll(".tree-edge.is-hi").forEach(el => el.classList.remove("is-hi"));
    const ids = descendants(id, []);
    ids.forEach((nid) => {
      const node = svg.querySelector(`.tree-node[data-id="${nid}"]`);
      if (node) node.classList.add("is-hi");
    });
    svg.querySelectorAll(".tree-edge").forEach((e) => {
      if (ids.includes(e.dataset.from) && ids.includes(e.dataset.to)) e.classList.add("is-hi");
    });
    document.getElementById("tree-readout-label").textContent = "Selected subtree";
    document.getElementById("tree-sub-expr").textContent = subExpr(id, 0);
    document.getElementById("tree-sub-val").textContent = "= " + evalNode(id);
  }

  function clearAllBadges() {
    document.querySelectorAll("#tree-svg .tree-node").forEach((el) => {
      el.classList.remove("has-val", "eval-pulse", "is-hi");
      const bt = el.querySelector('text[data-role="badge"]');
      if (bt) bt.textContent = "";
    });
    document.querySelectorAll("#tree-svg .tree-edge.is-hi").forEach((e) => e.classList.remove("is-hi"));
  }

  // Timer registries so we can cancel pending build/eval frames when the
  // user leaves slide 2 mid-animation or clicks a node during a build.
  let buildTimers = [];
  let evalTimers = [];

  function cancelTreeAnims() {
    buildTimers.forEach(clearTimeout);
    buildTimers = [];
    evalTimers.forEach(clearTimeout);
    evalTimers = [];
  }

  // Called when the carousel arrives on slide 2. Recreates the SVG (which
  // also reattaches click handlers) and plays the build animation from a
  // clean slate so each visit feels like a fresh start.
  function resetTreeAndAnimate() {
    cancelTreeAnims();
    renderTree();
    clearAllBadges();
    document.getElementById("tree-readout-label").textContent = "select a node to begin";
    document.getElementById("tree-sub-expr").textContent = "";
    document.getElementById("tree-sub-val").textContent = "";
    // Hide the tree immediately so it doesn't pop in during the slide
    // transition, then defer the build animation until the slide has
    // finished sliding into view (CSS transition is 320ms). Without this
    // delay, n1 fades in while the slide is still mid-transition and
    // looks pre-rendered by the time the user can focus on it.
    const svg = document.getElementById("tree-svg");
    svg.querySelectorAll(".tree-node").forEach((el) => (el.style.opacity = "0"));
    svg.querySelectorAll(".tree-edge").forEach((el) => (el.style.opacity = "0"));
    if (reducedMotion) { animateBuild(); return; }
    buildTimers.push(setTimeout(animateBuild, 340));
  }

  // Build animation: reveal nodes top-down, mirrors recursive construction.
  function animateBuild() {
    const svg = document.getElementById("tree-svg");
    const allNodes = [...svg.querySelectorAll(".tree-node")];
    const allEdges = [...svg.querySelectorAll(".tree-edge")];
    allNodes.forEach((el) => (el.style.opacity = "0"));
    allEdges.forEach((el) => (el.style.opacity = "0"));
    if (reducedMotion) {
      allNodes.forEach((el) => (el.style.opacity = "1"));
      allEdges.forEach((el) => (el.style.opacity = "1"));
      return;
    }
    BUILD_ORDER.forEach((id, i) => {
      buildTimers.push(setTimeout(() => {
        const el = svg.querySelector(`.tree-node[data-id="${id}"]`);
        if (el) el.style.opacity = "1";
        svg.querySelectorAll(`.tree-edge[data-to="${id}"]`).forEach((e) => (e.style.opacity = "1"));
      }, i * 180));
    });
  }

  function postOrder(rootId) {
    const out = [];
    (function visit(id) {
      const n = TREE[id];
      if (n.l) visit(n.l);
      if (n.r) visit(n.r);
      out.push(id);
    })(rootId);
    return out;
  }

  // Evaluate animation for the subtree rooted at rootId. Cancels any in-flight
  // build/eval timers and forces all nodes visible — covers mid-build clicks
  // where some nodes/edges still have opacity 0.
  function animateEvaluateSubtree(rootId) {
    cancelTreeAnims();
    const svg = document.getElementById("tree-svg");
    svg.querySelectorAll(".tree-node").forEach((el) => (el.style.opacity = "1"));
    svg.querySelectorAll(".tree-edge").forEach((el) => (el.style.opacity = "1"));
    clearAllBadges();
    highlightSubtree(rootId);
    const order = postOrder(rootId);
    if (reducedMotion) {
      order.forEach((id) => {
        const el = svg.querySelector(`.tree-node[data-id="${id}"]`);
        if (!el) return;
        const bt = el.querySelector('text[data-role="badge"]');
        if (bt) bt.textContent = String(evalNode(id));
        el.classList.add("has-val");
      });
      document.getElementById("tree-sub-expr").textContent = subExpr(rootId, 0);
      document.getElementById("tree-sub-val").textContent = "= " + evalNode(rootId);
      return;
    }
    order.forEach((id, i) => {
      evalTimers.push(setTimeout(() => {
        const el = svg.querySelector(`.tree-node[data-id="${id}"]`);
        if (!el) return;
        const v = evalNode(id);
        el.classList.remove("eval-pulse");
        void el.offsetWidth;
        el.classList.add("eval-pulse");
        const bt = el.querySelector('text[data-role="badge"]');
        if (bt) bt.textContent = String(v);
        el.classList.add("has-val");
        document.getElementById("tree-sub-expr").textContent = subExpr(id, 0);
        document.getElementById("tree-sub-val").textContent = "= " + v;
      }, i * 480));
    });
  }

  /* ──────────────── Slide 3: Sampler ──────────────── */
  // Generate real random expressions and evaluate them client-side so the
  // user sees what the server is actually rejecting.
  const TARGET_BANDS = {
    wide:   [10, 99],
    mid:    [20, 60],
    narrow: [25, 35],
  };
  const OP_SETS = {
    add:    ["+"],
    addsub: ["+", "-"],
    all:    ["+", "-", "*", "/"],
  };

  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  // Random expression of 3 distinct integers in [1..15] with random ops.
  // Form: a op1 b op2 c, evaluated with standard precedence so that
  // operator precedence is part of what the user sees.
  function genExpression(ops) {
    const pool = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
    // pick 3 distinct
    const picks = [];
    for (let i = 0; i < 3; i++) {
      const j = randInt(0, pool.length - 1);
      picks.push(pool.splice(j, 1)[0]);
    }
    const o1 = ops[randInt(0, ops.length - 1)];
    const o2 = ops[randInt(0, ops.length - 1)];
    return { a: picks[0], b: picks[1], c: picks[2], o1, o2 };
  }

  function evalExpr(e) {
    // honor precedence: × ÷ before + −
    const isMul = (op) => op === "*" || op === "/";
    const apply = (x, op, y) => op === "+" ? x + y : op === "-" ? x - y : op === "*" ? x * y : y === 0 ? NaN : x / y;
    if (isMul(e.o1) && !isMul(e.o2)) return apply(apply(e.a, e.o1, e.b), e.o2, e.c);
    if (!isMul(e.o1) && isMul(e.o2)) return apply(e.a, e.o1, apply(e.b, e.o2, e.c));
    // same precedence — left to right
    return apply(apply(e.a, e.o1, e.b), e.o2, e.c);
  }

  const OP_DISPLAY = { "+": "+", "-": "−", "*": "×", "/": "÷" };
  function fmtExpr(e) {
    return `${e.a} ${OP_DISPLAY[e.o1]} ${e.b} ${OP_DISPLAY[e.o2]} ${e.c}`;
  }

  // Classify each attempt against the difficulty config
  function classify(e, ops, band) {
    const v = evalExpr(e);
    if (!Number.isFinite(v)) return { ok: false, val: v, reason: "div by zero" };
    if (!Number.isInteger(v)) return { ok: false, val: v, reason: "non-integer" };
    if (v < band[0] || v > band[1]) return { ok: false, val: v, reason: `out of [${band[0]},${band[1]}]` };
    return { ok: true, val: v, reason: "accepted ✓" };
  }

  // Monte-Carlo estimate of p using N quick trials with the current settings.
  // Pure client-side; never calls the backend.
  function estimateP(opsKey, bandKey, samples = 4000) {
    const ops = OP_SETS[opsKey];
    const band = TARGET_BANDS[bandKey];
    let ok = 0;
    for (let i = 0; i < samples; i++) {
      if (classify(genExpression(ops), ops, band).ok) ok++;
    }
    return Math.max(1e-6, ok / samples);
  }

  function fmtPct(x) {
    if (x >= 0.001) return (x * 100).toFixed(1) + "%";
    return x.toExponential(2);
  }
  function fmtExpected(p) { return (1 / p).toFixed(1); }
  function fmtFail(p) {
    if (p >= 0.02) return "≈ 0";
    const q = Math.pow(1 - p, 2000);
    if (q < 1e-6) return "< 1e−6";
    return q.toExponential(2);
  }

  function refreshSamplerStats() {
    const opsKey = document.getElementById("s-ops").value;
    const bandKey = document.getElementById("s-range").value;
    const p = estimateP(opsKey, bandKey);
    document.getElementById("s-p").textContent = fmtPct(p);
    document.getElementById("s-exp").textContent = fmtExpected(p);
    document.getElementById("s-fail").textContent = fmtFail(p);
    return p;
  }

  let streamTimer = null;
  function stopStream() {
    if (streamTimer) { clearInterval(streamTimer); streamTimer = null; }
  }

  function runStream() {
    stopStream();
    const opsKey = document.getElementById("s-ops").value;
    const bandKey = document.getElementById("s-range").value;
    const ops = OP_SETS[opsKey];
    const band = TARGET_BANDS[bandKey];
    refreshSamplerStats();

    const stream = document.getElementById("s-stream");
    stream.innerHTML = "";
    let n = 0;
    const MAX = 60;
    streamTimer = setInterval(() => {
      n++;
      const expr = genExpression(ops);
      const verdict = classify(expr, ops, band);
      const row = document.createElement("div");
      row.className = "ex-attempt " + (verdict.ok ? "is-ok" : "is-bad");
      row.innerHTML = `
        <div class="ex-attempt-num">#${n}</div>
        <div class="ex-attempt-expr">${fmtExpr(expr)}</div>
        <div class="ex-attempt-val">= ${Number.isFinite(verdict.val) ? (Number.isInteger(verdict.val) ? verdict.val : verdict.val.toFixed(2)) : "NaN"}</div>
        <div class="ex-attempt-reason">${verdict.reason}</div>
      `;
      stream.appendChild(row);
      stream.scrollTop = stream.scrollHeight;
      if (verdict.ok) {
        stopStream();
      } else if (n >= MAX) {
        stopStream();
        const note = document.createElement("div");
        note.className = "ex-attempt is-bad";
        note.style.gridTemplateColumns = "1fr";
        note.textContent = `…gave up after ${MAX} attempts. Loosen the band or simplify operators.`;
        stream.appendChild(note);
      }
    }, reducedMotion ? 30 : 90);
  }

  ["s-ops", "s-range"].forEach((id) =>
    document.getElementById(id).addEventListener("change", refreshSamplerStats)
  );
  document.getElementById("s-run").addEventListener("click", runStream);
  refreshSamplerStats();

  // Populate the "Go deeper" drawer's narrow-band reference numbers. Uses an
  // exhaustive enumeration over the 43,680 (15·14·13 ordered triples × 4·4
  // operator pairs) expressions rather than a Monte Carlo estimate so the
  // value the drawer cites is exact and identical across reloads — and lines
  // up with the live stat card when the user actually picks the narrow band.
  (function populateNarrowDeepDive() {
    const band = TARGET_BANDS.narrow;
    const ops = OP_SETS.all;
    let total = 0, ok = 0;
    for (let i = 1; i <= 15; i++) {
      for (let j = 1; j <= 15; j++) {
        if (j === i) continue;
        for (let k = 1; k <= 15; k++) {
          if (k === i || k === j) continue;
          for (const o1 of ops) {
            for (const o2 of ops) {
              total++;
              if (classify({ a: i, b: j, c: k, o1, o2 }, ops, band).ok) ok++;
            }
          }
        }
      }
    }
    const p = ok / total;
    document.getElementById("d3-narrow-p").textContent = fmtPct(p);
    document.getElementById("d3-narrow-exp").textContent = fmtExpected(p);
    document.getElementById("d3-narrow-fail").textContent = fmtFail(p);
  })();

  /* ──────────────── Slide 4: Search space & expected effort ──────────────── */
  (function slide4() {
    const N = 2520; // P(7,5) — arrangements of 5 chips from the 7-chip bank

    // Measured median solution count S per difficulty level (out of N),
    // from 300 generated puzzles/level against the shipped rush configs.
    const MEDIAN_S = { 1:240, 2:120, 3:72, 4:84, 5:48, 6:28, 7:12, 8:16, 9:12, 10:8, 11:8 };
    const LEVELS = Object.keys(MEDIAN_S).map(Number);
    const Efor = (s) => Math.round((N + 1) / (s + 1)); // exact mean first-hit

    // Exact first-hit position under a random search order: the minimum of a
    // uniformly random S-subset of {1..N}. Its mean is exactly (N+1)/(S+1).
    // Sample by walking the survival function P(min > k).
    function sampleFirstHit(s) {
      const v = Math.random();
      let surv = 1;
      for (let k = 1; k <= N; k++) {
        surv *= (N - k + 1 - s) / (N - k + 1);
        if (surv <= v) return k;
      }
      return N - s + 1;
    }

    function niceCeil(x) {
      const pow = Math.pow(10, Math.floor(Math.log10(x)));
      const n = x / pow;
      const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
      return step * pow;
    }

    const GOLD = "#a16207", GOLD_FILL = "rgba(161,98,7,0.30)", BLUE = "#1E63D8",
          INK = "#0f172a", MUTE = "#9ca3af", GRID = "#ececec";

    const canvas = document.getElementById("s4-dist");
    const ctx = canvas.getContext("2d");

    let level = 7, S = MEDIAN_S[level], E = Efor(S);
    let xMax = 100, bins = 44, binW = 1, hist = [], trials = 0, sum = 0, pmf = [], yMax = 1;

    function configureBins() {
      xMax = Math.min(N, niceCeil(Math.max(40, E * 6)));
      binW = xMax / bins;
      hist = new Array(bins).fill(0);
      pmf = new Array(bins).fill(0);
      trials = 0; sum = 0;
      let surv = 1, prev = 1;
      for (let k = 1; k <= xMax; k++) {
        surv *= (N - k + 1 - S) / (N - k + 1);
        const p = Math.max(0, prev - surv); // P(first hit = k)
        prev = surv;
        const b = Math.min(bins - 1, Math.floor((k - 1) / binW));
        pmf[b] += p;
      }
      yMax = (Math.max.apply(null, pmf) || 1) * 1.5;
    }

    function addSamples(n) {
      for (let i = 0; i < n; i++) {
        const k = sampleFirstHit(S);
        trials++; sum += k;
        const b = Math.floor((k - 1) / binW);
        if (b >= 0 && b < bins) hist[b]++;
      }
    }

    // ── distribution rendering (DPR-aware canvas) ──
    let cssW = 520; const cssH = 190;
    const PAD = { l: 30, r: 12, t: 12, b: 26 };
    const xToPx = (x) => PAD.l + (x / xMax) * (cssW - PAD.l - PAD.r);
    const yToPx = (p) => cssH - PAD.b - (Math.min(p, yMax) / yMax) * (cssH - PAD.t - PAD.b);

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      cssW = Math.max(240, Math.round(rect.width) || 520);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawDist();
    }

    function vline(xVal, color, dashed, label, labelY) {
      const px = Math.min(cssW - PAD.r, Math.max(PAD.l, xToPx(xVal)));
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.setLineDash(dashed ? [4, 3] : []);
      ctx.beginPath(); ctx.moveTo(px, PAD.t); ctx.lineTo(px, cssH - PAD.b); ctx.stroke();
      ctx.setLineDash([]);
      const right = px > cssW - 78;
      ctx.fillStyle = color; ctx.font = "600 11px system-ui, sans-serif";
      ctx.textAlign = right ? "right" : "left";
      ctx.fillText(label, px + (right ? -4 : 4), labelY);
      ctx.textAlign = "left";
    }

    function drawDist() {
      ctx.clearRect(0, 0, cssW, cssH);
      // baseline + x ticks
      ctx.strokeStyle = GRID; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD.l, cssH - PAD.b); ctx.lineTo(cssW - PAD.r, cssH - PAD.b); ctx.stroke();
      ctx.fillStyle = MUTE; ctx.font = "11px system-ui, sans-serif";
      [[0, "left"], [xMax / 2, "center"], [xMax, "right"]].forEach(([tx, al]) => {
        ctx.textAlign = al;
        ctx.fillText(String(Math.round(tx)), xToPx(tx), cssH - PAD.b + 15);
      });
      ctx.textAlign = "left";
      // empirical bars (relative frequency)
      if (trials > 0) {
        ctx.fillStyle = GOLD_FILL;
        for (let b = 0; b < bins; b++) {
          if (!hist[b]) continue;
          const y = yToPx(hist[b] / trials);
          const x0 = xToPx(b * binW), x1 = xToPx((b + 1) * binW);
          ctx.fillRect(x0 + 0.5, y, Math.max(1, x1 - x0 - 1), (cssH - PAD.b) - y);
        }
      }
      // theoretical curve
      ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.beginPath();
      for (let b = 0; b < bins; b++) {
        const x = xToPx((b + 0.5) * binW), y = yToPx(pmf[b]);
        b === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      // markers: expected value E (blue, dashed) then running average (ink),
      // labels staggered in Y so they don't collide when avg is near E.
      vline(E, BLUE, true, "E ≈ " + E, PAD.t + 9);
      if (trials > 0) vline(sum / trials, INK, false, "avg " + Math.round(sum / trials), PAD.t + 22);
    }

    function updateReadout() {
      document.getElementById("s4-trials").textContent = trials;
      document.getElementById("s4-avg").textContent = trials ? Math.round(sum / trials) : "—";
    }

    // ── run controls ──
    let animTimer = null;
    function stopAnim() { if (animTimer) { clearInterval(animTimer); animTimer = null; } }
    s4StopAnim = stopAnim; // expose to goTo() for nav-away cleanup
    function runBatch(total) {
      stopAnim();
      if (reducedMotion || total <= 1) { addSamples(total); updateReadout(); drawDist(); return; }
      let done = 0; const chunk = Math.max(1, Math.round(total / 20));
      animTimer = setInterval(() => {
        const n = Math.min(chunk, total - done);
        addSamples(n); done += n; updateReadout(); drawDist();
        if (done >= total) stopAnim();
      }, 45);
    }

    // ── effort curve (SVG across levels) ──
    const effortSvg = document.getElementById("s4-effort");
    // W is re-measured to the SVG's pixel width so the chart draws 1:1 (no
    // aspect-scaling); H is fixed to match the distribution canvas height.
    const eP = { l: 34, r: 16, t: 14, b: 26, W: 560, H: 190 }, eYMax = 300;
    const eX = (L) => eP.l + (L - 1) / (LEVELS.length - 1) * (eP.W - eP.l - eP.r);
    const eY = (v) => eP.H - eP.b - (v / eYMax) * (eP.H - eP.t - eP.b);

    let tip = document.createElement("div");
    tip.className = "ex-tooltip"; document.body.appendChild(tip);
    const moveTip = (e) => { tip.style.left = (e.clientX + 12) + "px"; tip.style.top = (e.clientY - 12) + "px"; };
    const hideTip = () => tip.classList.remove("is-visible");

    function layoutEffort() {
      const w = Math.round(effortSvg.getBoundingClientRect().width);
      eP.W = Math.max(260, w || eP.W);
      buildEffort();
      highlightEffort(level);
    }

    function buildEffort() {
      effortSvg.setAttribute("viewBox", `0 0 ${eP.W} ${eP.H}`);
      const pts = LEVELS.map((L) => [eX(L), eY(Efor(MEDIAN_S[L]))]);
      const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
      const area = "M" + eX(1).toFixed(1) + " " + eY(0).toFixed(1) + " " +
        pts.map((p) => "L" + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ") +
        " L" + eX(11).toFixed(1) + " " + eY(0).toFixed(1) + " Z";
      let s = "";
      [0, 100, 200, 300].forEach((g) => {
        const y = eY(g);
        s += `<line x1="${eP.l}" y1="${y}" x2="${eP.W - eP.r}" y2="${y}" stroke="${GRID}"/>`;
        s += `<text x="${eP.l - 6}" y="${y + 3}" text-anchor="end" font-size="10" fill="${MUTE}">${g}</text>`;
      });
      s += `<path d="${area}" fill="rgba(161,98,7,0.10)"/>`;
      s += `<path d="${line}" fill="none" stroke="${GOLD}" stroke-width="2"/>`;
      LEVELS.forEach((L) => {
        const x = eX(L), y = eY(Efor(MEDIAN_S[L]));
        s += `<text x="${x}" y="${eP.H - eP.b + 14}" text-anchor="middle" font-size="10" fill="${MUTE}">${L}</text>`;
        s += `<circle class="ex-effort-dot" data-level="${L}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${GOLD}" stroke="#fff" stroke-width="1.5"/>`;
      });
      s += `<text x="${eP.l}" y="9" font-size="10" fill="${MUTE}">expected checks E</text>`;
      effortSvg.innerHTML = s;
      effortSvg.querySelectorAll(".ex-effort-dot").forEach((dot) => {
        const L = parseInt(dot.dataset.level, 10);
        dot.addEventListener("click", () => { document.getElementById("s4-level").value = L; stopAnim(); setLevel(L); });
        dot.addEventListener("mouseenter", (e) => { tip.textContent = `Level ${L} · S ≈ ${MEDIAN_S[L]} · E ≈ ${Efor(MEDIAN_S[L])}`; tip.classList.add("is-visible"); moveTip(e); });
        dot.addEventListener("mousemove", moveTip);
        dot.addEventListener("mouseleave", hideTip);
      });
    }
    function highlightEffort(L) {
      effortSvg.querySelectorAll(".ex-effort-dot").forEach((dot) => {
        const on = parseInt(dot.dataset.level, 10) === L;
        dot.setAttribute("r", on ? "6" : "4");
        dot.setAttribute("fill", on ? BLUE : GOLD);
      });
    }

    function setLevel(L) {
      level = L; S = MEDIAN_S[L]; E = Efor(S);
      document.getElementById("s4-level-val").textContent = L;
      document.getElementById("s4-s").textContent = S;
      document.getElementById("s4-e").textContent = E;
      configureBins(); updateReadout(); drawDist(); highlightEffort(L);
    }

    document.getElementById("s4-run100").addEventListener("click", () => runBatch(100));
    document.getElementById("s4-reset").addEventListener("click", () => { stopAnim(); configureBins(); updateReadout(); drawDist(); });
    document.getElementById("s4-level").addEventListener("input", (e) => { stopAnim(); setLevel(parseInt(e.target.value, 10)); });

    layoutEffort();
    setLevel(7);
    if (window.ResizeObserver) {
      new ResizeObserver(resizeCanvas).observe(canvas);
      new ResizeObserver(layoutEffort).observe(effortSvg);
    }
    window.addEventListener("resize", () => { resizeCanvas(); layoutEffort(); });
    resizeCanvas();
  })();

  /* ──────────────── Init ──────────────── */
  goTo(1);
})();
