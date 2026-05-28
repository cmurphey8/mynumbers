// ============================================================================
// HOME LIGHTBOARD
// ============================================================================

interface LightboardItem {
  text: string
  color: string
  glow: string
}

interface LightboardFont {
  family: string
  weight: number
}

interface DoodleParams {
  [key: string]: any
}

interface Doodle {
  type: string
  cx: number
  cy: number
  pctCX: number
  pctCY: number
  params: DoodleParams
  showMs: number
}

interface LightboardConfig {
  doodles: Doodle[]
}

const measureCanvas = document.createElement("canvas")
const measureContext = measureCanvas.getContext("2d")!

const EQUATION_POOL: LightboardItem[] = [
  { text: "e<sup>iπ</sup> + 1 = 0", color: "#ff6ec7", glow: "rgba(255,110,199,0.5)" },
  { text: "π ≈ 3.14159",          color: "#00d4ff", glow: "rgba(0,212,255,0.5)"   },
  { text: "E = mc²",              color: "#ffe033", glow: "rgba(255,224,51,0.5)"  },
  { text: "√2 ≈ 1.414",           color: "#ff9d00", glow: "rgba(255,157,0,0.5)"   },
  { text: "F = ma",               color: "#39ff14", glow: "rgba(57,255,20,0.5)"   },
  { text: "Est. 1861",            color: "#c77dff", glow: "rgba(199,125,255,0.5)" },
  { text: "∑ 1/n² = π²/6",       color: "#00d4ff", glow: "rgba(0,212,255,0.5)"   },
  { text: "ℏω = E",               color: "#ffe033", glow: "rgba(255,224,51,0.5)"  },
  { text: "∇²ψ = 0",              color: "#39ff14", glow: "rgba(57,255,20,0.5)"   },
  { text: "PV = nRT",             color: "#ff9d00", glow: "rgba(255,157,0,0.5)"   },
  { text: "i² = −1",              color: "#c77dff", glow: "rgba(199,125,255,0.5)" },
  { text: "a² + b² = c²",        color: "#ff6ec7", glow: "rgba(255,110,199,0.5)" },
  { text: "det(A) ≠ 0",          color: "#00d4ff", glow: "rgba(0,212,255,0.5)"   },
  { text: "lim 1/n → 0",         color: "#ffe033", glow: "rgba(255,224,51,0.5)"  },
  { text: "∫eˣ dx = eˣ + C",    color: "#39ff14", glow: "rgba(57,255,20,0.5)"   },
  { text: "φ = (1+√5)/2",        color: "#ff9d00", glow: "rgba(255,157,0,0.5)"   },
  { text: "H|ψ⟩ = E|ψ⟩",        color: "#c77dff", glow: "rgba(199,125,255,0.5)" },
  { text: "Cambridge, MA",        color: "#ff6ec7", glow: "rgba(255,110,199,0.5)" },
  { text: "n! ~ (n/e)ⁿ√(2πn)",  color: "#00d4ff", glow: "rgba(0,212,255,0.5)"   },
]

const HANDWRITING_FONTS: LightboardFont[] = [
  { family: "'Caveat'",              weight: 600 },
  { family: "'Patrick Hand'",        weight: 400 },
  { family: "'Architects Daughter'", weight: 400 },
  { family: "'Kalam'",               weight: 700 },
  { family: "'Kalam'",               weight: 400 },
]
const FONT_SIZE_OPTIONS = [17, 21, 25, 30, 36]

function pickTextStyle(text: string): { family: string; weight: number; size: number; widthPct: number; heightPct: number } {
  const font = HANDWRITING_FONTS[Math.floor(Math.random() * HANDWRITING_FONTS.length)]
  const boardElement = document.getElementById("home-lightboard")
  const boardWidth = boardElement ? boardElement.offsetWidth : 640
  const boardHeight = boardElement ? boardElement.offsetHeight : 300
  const scale = Math.min(1, boardWidth / 640)
  const maxSize = Math.floor((text.length > 15 ? 25 : text.length > 11 ? 30 : 36) * scale)
  const allowedSizes = FONT_SIZE_OPTIONS.filter(size => size <= maxSize)
  const size = allowedSizes.length ? allowedSizes[Math.floor(Math.random() * allowedSizes.length)] : FONT_SIZE_OPTIONS[0]
  const plainText = text.replace(/[<>]/g, "")
  measureContext.font = `${font.weight} ${size}px ${font.family}`
  const widthPct = (measureContext.measureText(plainText).width + 12) / boardWidth * 100
  const heightPct = (size * 1.75) / boardHeight * 100
  return { family: font.family, weight: font.weight, size, widthPct, heightPct }
}

const DOODLE_TYPES = ['gear', 'sine', 'helix', 'matrix', 'atom', 'fibonacci', 'venn', 'triangle', 'star', 'numberLine', 'rocket', 'dna', 'lightbulb', 'numtiles']
const DOODLE_SIZE_PCT: Record<string, { radiusWidthPct: number; radiusHeightPct: number }> = {
  gear:       { radiusWidthPct: 9,  radiusHeightPct: 10 },
  sine:       { radiusWidthPct: 14, radiusHeightPct: 22 },
  helix:      { radiusWidthPct: 10, radiusHeightPct: 22 },
  matrix:     { radiusWidthPct: 17, radiusHeightPct: 13 },
  atom:       { radiusWidthPct: 11, radiusHeightPct: 11 },
  fibonacci:  { radiusWidthPct: 12, radiusHeightPct: 12 },
  venn:       { radiusWidthPct: 16, radiusHeightPct: 10 },
  triangle:   { radiusWidthPct: 10, radiusHeightPct: 10 },
  star:       { radiusWidthPct:  7, radiusHeightPct:  7 },
  numberLine: { radiusWidthPct: 17, radiusHeightPct:  6 },
  rocket:     { radiusWidthPct:  7, radiusHeightPct: 16 },
  dna:        { radiusWidthPct:  9, radiusHeightPct: 19 },
  lightbulb:  { radiusWidthPct: 10, radiusHeightPct: 14 },
  numtiles:   { radiusWidthPct: 17, radiusHeightPct: 12 },
}

let animationFrameId: number | null = null
let mutationTimer: ReturnType<typeof setTimeout> | null = null
let currentFirework: any = null
let animationStartTimestamp: number | null = null
export let lightboardConfig: LightboardConfig | null = null

const DOODLE_PARAM_AXES: Record<string, Record<string, string>> = {
  gear:       { radius: "h" },
  sine:       { graphWidth: "w", graphHeight: "h" },
  helix:      { graphWidth: "w", graphHeight: "h" },
  matrix:     { cellWidth: "w", cellHeight: "h" },
  atom:       { radius: "h" },
  fibonacci:  { radius: "h" },
  venn:       { radius: "w" },
  triangle:   { size: "h" },
  star:       { radius: "h" },
  numberLine: { lineLength: "w" },
  rocket:     { rocketHeight: "h" },
  dna:        { graphWidth: "w", graphHeight: "h" },
  lightbulb:  { radius: "h" },
  numtiles:   { tileWidth: "w" },
}

export function scaleDoodleParams(type: string, params: DoodleParams, widthRatio: number, heightRatio: number): void {
  const axes = DOODLE_PARAM_AXES[type]
  if (!axes) return
  for (const key in axes) {
    if (typeof params[key] !== "number") continue
    params[key] *= (axes[key] === "w" ? widthRatio : heightRatio)
  }
}

function buildDoodleParams(type: string, width: number, height: number): DoodleParams {
  switch (type) {
    case 'gear':       return { radius: height * (0.060 + Math.random() * 0.035) }
    case 'sine':       return { graphWidth: width * (0.110 + Math.random() * 0.050), graphHeight: height * (0.24 + Math.random() * 0.10) }
    case 'helix':      return { graphWidth: width * (0.080 + Math.random() * 0.040), graphHeight: height * (0.24 + Math.random() * 0.12) }
    case 'matrix':     return { cellWidth: width * (0.048 + Math.random() * 0.018), cellHeight: height * (0.10 + Math.random() * 0.04) }
    case 'atom':       return { radius: height * (0.070 + Math.random() * 0.030) }
    case 'fibonacci':  return { radius: height * (0.090 + Math.random() * 0.030) }
    case 'venn':       return { radius: width * (0.055 + Math.random() * 0.020) }
    case 'triangle':   return { size: height * (0.110 + Math.random() * 0.040) }
    case 'star':       return { radius: height * (0.055 + Math.random() * 0.025) }
    case 'numberLine': return { lineLength: width * (0.140 + Math.random() * 0.070) }
    case 'rocket':     return { rocketHeight: height * (0.130 + Math.random() * 0.040) }
    case 'dna':        return { graphWidth: width * (0.050 + Math.random() * 0.022), graphHeight: height * (0.22 + Math.random() * 0.08) }
    case 'lightbulb':  return { radius: height * (0.075 + Math.random() * 0.030) }
    case 'numtiles': {
      const tileWidth = width * (0.028 + Math.random() * 0.010)
      const order = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5)
      const colorIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(() => Math.floor(Math.random() * TILE_COLORS.length))
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5)
      return { tileWidth, order, colorIndices, numbers }
    }
    default: return {}
  }
}

function buildConfig(width: number, height: number): LightboardConfig {
  const types = [...DOODLE_TYPES].sort(() => Math.random() - 0.5).slice(0, 4 + Math.floor(Math.random() * 2))
  const doodles: Doodle[] = []

  for (const type of types) {
    const size = DOODLE_SIZE_PCT[type]
    let placed = false

    for (let attempt = 0; attempt < 80; attempt++) {
      let pctX: number, pctY: number
      const zone = Math.random()
      if (zone < 0.55) {
        pctX = size.radiusWidthPct + Math.random() * Math.max(1, 95 - size.radiusWidthPct * 2)
        pctY = size.radiusHeightPct + Math.random() * Math.max(1, 44 - size.radiusHeightPct * 2)
      } else {
        pctX = size.radiusWidthPct + Math.random() * Math.max(1, 95 - size.radiusWidthPct * 2)
        pctY = 50 + size.radiusHeightPct + Math.random() * Math.max(1, 38 - size.radiusHeightPct * 2)
      }

      const overlaps = doodles.some(other => {
        const otherSize = DOODLE_SIZE_PCT[other.type]
        const deltaX = (pctX - other.pctCX) / (size.radiusWidthPct + otherSize.radiusWidthPct)
        const deltaY = (pctY - other.pctCY) / (size.radiusHeightPct + otherSize.radiusHeightPct)
        return deltaX * deltaX + deltaY * deltaY < 1
      })

      if (!overlaps) {
        doodles.push({ type, cx: pctX / 100 * width, cy: pctY / 100 * height, pctCX: pctX, pctCY: pctY,
          params: buildDoodleParams(type, width, height), showMs: 0 })
        placed = true
        break
      }
    }

    if (!placed) {
      const pctX = size.radiusWidthPct + Math.random() * Math.max(1, 95 - size.radiusWidthPct * 2)
      const pctY = size.radiusHeightPct + Math.random() * Math.max(1, 90 - size.radiusHeightPct * 2)
      doodles.push({ type, cx: pctX / 100 * width, cy: pctY / 100 * height, pctCX: pctX, pctCY: pctY,
        params: buildDoodleParams(type, width, height), showMs: 0 })
    }
  }

  let elapsedMs = 0
  doodles.forEach(doodle => { doodle.showMs = elapsedMs; elapsedMs += (3 + Math.random() * 4) * 1000 })
  return { doodles }
}

function findRandomPositions(
  entries: { widthPct?: number; heightPct?: number }[],
  reservedZones: { cx: number; cy: number; halfWidthPct: number; halfHeightPct: number }[],
  alreadyPlaced: { x: number; y: number; wPct?: number; hPct?: number }[] = []
): { x: number; y: number; wPct: number; hPct: number }[] {
  const count = entries.length
  const placed = [...alreadyPlaced]
  const newItems: { x: number; y: number; wPct: number; hPct: number }[] = []
  const MIN_DIST = 22
  const MAX_TRIES = 120

  function conflicts(x: number, y: number, wPct: number, hPct: number): boolean {
    if (x < 1 || x + wPct > 95 || y < 1 || y + hPct > 94) return true
    for (const testX of [x, x + wPct * 0.5, x + wPct]) {
      for (const zone of reservedZones) {
        const deltaX = (testX - zone.cx) / zone.halfWidthPct, deltaY = (y - zone.cy) / zone.halfHeightPct
        if (deltaX * deltaX + deltaY * deltaY < 1) return true
      }
    }
    for (const placedItem of placed) {
      const placedWidth = placedItem.wPct ?? 20
      for (const offsetX of [0, placedWidth * 0.5, placedWidth]) {
        const deltaX = (x + wPct * 0.5) - (placedItem.x + offsetX), deltaY = (y - placedItem.y) * 1.6
        if (deltaX * deltaX + deltaY * deltaY < MIN_DIST * MIN_DIST) return true
      }
    }
    return false
  }

  for (let i = 0; i < count; i++) {
    const wPct = entries[i].widthPct ?? 20
    const hPct = entries[i].heightPct ?? 10
    const maxX = Math.max(2, 95 - wPct)
    const maxY = Math.max(2, 94 - hPct)
    let position: { x: number; y: number; wPct: number; hPct: number } | null = null
    for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
      let x: number, y: number
      const zoneRoll = Math.random()
      if (zoneRoll < 0.55) {
        x = 2 + Math.random() * Math.min(80, maxX - 2)
        y = 2 + Math.random() * Math.min(42, maxY - 2)
      } else {
        x = 2 + Math.random() * (maxX - 2)
        y = Math.min(48, maxY - 2) + Math.random() * Math.max(0, maxY - Math.min(48, maxY - 2))
      }
      x = Math.min(x, maxX)
      y = Math.min(y, maxY)
      if (!conflicts(x, y, wPct, hPct)) { position = { x, y, wPct, hPct }; break }
    }
    if (position) { placed.push(position); newItems.push(position) }
  }
  return newItems
}

// ── Firework ──────────────────────────────────────────────────────────────────
const FIREWORK_COLORS = ["#ff1423", "#ff6ec7", "#ffe033", "#00d4ff", "#c77dff", "#39ff14", "#ff9d00"]

function createFirework(width: number, height: number): any {
  const launchFromLeft = Math.random() > 0.5
  const startX = launchFromLeft ? width * 0.07 : width * 0.93
  const endX = startX + (launchFromLeft ? 1 : -1) * width * (0.04 + Math.random() * 0.10)
  const endY = height * (0.10 + Math.random() * 0.28)
  return { phase: "launch", startX, x: startX, y: height, endX, endY, startTimestamp: null, launchDurationMs: 900, explodeTimestamp: null, particles: [] }
}

function updateFirework(context: CanvasRenderingContext2D, firework: any, timestamp: number): boolean {
  if (!firework.startTimestamp) firework.startTimestamp = timestamp
  if (firework.phase === "launch") {
    const progress = Math.min((timestamp - firework.startTimestamp) / firework.launchDurationMs, 1)
    firework.x = firework.startX + (firework.endX - firework.startX) * progress
    firework.y = firework.y + (firework.endY - firework.y) * (progress < 1 ? 0.08 : 1)
    context.save(); context.globalAlpha = 0.9; context.fillStyle = "#fff"
    context.shadowColor = "#fff"; context.shadowBlur = 8
    context.beginPath(); context.arc(firework.x, firework.y, 2, 0, Math.PI * 2); context.fill(); context.restore()
    if (progress >= 1) {
      firework.phase = "explode"; firework.explodeTimestamp = timestamp; firework.x = firework.endX; firework.y = firework.endY
      for (let i = 0; i < 32; i++) {
        const angle = (i / 32) * Math.PI * 2 + (Math.random() - 0.5) * 0.4, speed = 1 + Math.random() * 2.2
        firework.particles.push({ x: firework.x, y: firework.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          color: FIREWORK_COLORS[i % FIREWORK_COLORS.length], r: 1.5 + Math.random() * 1.5 })
      }
    }
  } else {
    const progress = (timestamp - firework.explodeTimestamp) / 2300
    if (progress >= 1) return true
    firework.particles.forEach((particle: any) => {
      particle.x += particle.vx; particle.y += particle.vy; particle.vy += 0.05
      context.save(); context.globalAlpha = 1 - progress; context.fillStyle = particle.color
      context.shadowColor = particle.color; context.shadowBlur = 5
      context.beginPath(); context.arc(particle.x, particle.y, particle.r * (1 - progress * 0.5), 0, Math.PI * 2)
      context.fill(); context.restore()
    })
  }
  return false
}

// ── Doodle draw functions ─────────────────────────────────────────────────────

function doodleGear(context: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, timestamp: number, fade: number) {
  const teeth = 8, inner = radius * 0.68, tooth = radius * 0.38, hole = radius * 0.28, angle = timestamp * 0.0004
  context.save()
  context.translate(centerX, centerY); context.rotate(angle)
  context.globalAlpha = 0.45 * fade; context.strokeStyle = "#c77dff"
  context.fillStyle = "rgba(199,125,255,0.12)"; context.lineWidth = 1.5
  context.shadowColor = "#c77dff"; context.shadowBlur = 7
  context.beginPath()
  for (let i = 0; i < teeth; i++) {
    const a1 = (i / teeth) * Math.PI * 2, a2 = ((i + 0.4) / teeth) * Math.PI * 2,
      a3 = ((i + 0.6) / teeth) * Math.PI * 2, a4 = ((i + 1) / teeth) * Math.PI * 2
    context.lineTo(Math.cos(a1) * inner, Math.sin(a1) * inner)
    context.lineTo(Math.cos(a2) * (inner + tooth), Math.sin(a2) * (inner + tooth))
    context.lineTo(Math.cos(a3) * (inner + tooth), Math.sin(a3) * (inner + tooth))
    context.lineTo(Math.cos(a4) * inner, Math.sin(a4) * inner)
  }
  context.closePath(); context.fill(); context.stroke()
  context.beginPath(); context.arc(0, 0, hole, 0, Math.PI * 2)
  context.globalAlpha = 0.7 * fade; context.stroke()
  context.restore()
}

function doodleSineGraph(context: CanvasRenderingContext2D, centerX: number, centerY: number, graphWidth: number, graphHeight: number, timestamp: number, fade: number) {
  context.save()
  context.globalAlpha = 0.55 * fade; context.strokeStyle = "#39ff14"
  context.lineWidth = 1.3; context.shadowColor = "#39ff14"; context.shadowBlur = 5
  context.beginPath(); context.moveTo(centerX - graphWidth / 2, centerY); context.lineTo(centerX + graphWidth / 2, centerY); context.stroke()
  context.beginPath(); context.moveTo(centerX, centerY - graphHeight / 2); context.lineTo(centerX, centerY + graphHeight / 2); context.stroke()
  const arrowSize = 5; context.beginPath()
  context.moveTo(centerX + graphWidth / 2, centerY); context.lineTo(centerX + graphWidth / 2 - arrowSize, centerY - 3)
  context.moveTo(centerX + graphWidth / 2, centerY); context.lineTo(centerX + graphWidth / 2 - arrowSize, centerY + 3)
  context.moveTo(centerX, centerY - graphHeight / 2); context.lineTo(centerX - 3, centerY - graphHeight / 2 + arrowSize)
  context.moveTo(centerX, centerY - graphHeight / 2); context.lineTo(centerX + 3, centerY - graphHeight / 2 + arrowSize); context.stroke()
  context.globalAlpha = 0.9 * fade; context.strokeStyle = "#ff6ec7"
  context.lineWidth = 2; context.shadowColor = "#ff6ec7"; context.shadowBlur = 7
  context.beginPath()
  for (let i = 0; i <= 80; i++) {
    const t = i / 80, x = centerX - graphWidth / 2 + 4 + t * (graphWidth - 8), y = centerY - (graphHeight / 2 - 7) * Math.sin(t * Math.PI * 2 + timestamp * 0.001)
    i === 0 ? context.moveTo(x, y) : context.lineTo(x, y)
  }
  context.stroke()
  context.globalAlpha = 0.35 * fade; context.strokeStyle = "#39ff14"; context.lineWidth = 1; context.shadowBlur = 0
  ;[0.25, 0.5, 0.75].forEach(fraction => {
    const tickX = centerX - graphWidth / 2 + fraction * graphWidth
    context.beginPath(); context.moveTo(tickX, centerY - 3); context.lineTo(tickX, centerY + 3); context.stroke()
  })
  context.restore()
}

function doodleHelix(context: CanvasRenderingContext2D, centerX: number, centerY: number, graphWidth: number, graphHeight: number, timestamp: number, fade: number) {
  const turns = 3.5, top = centerY - graphHeight / 2, totalAngle = turns * Math.PI * 2
  const segments = turns * 36 | 0
  const animationOffset = timestamp * 0.00025
  context.save()
  context.globalAlpha = 0.35 * fade; context.strokeStyle = "#00d4ff"
  context.lineWidth = 1; context.shadowColor = "#00d4ff"; context.shadowBlur = 3
  context.beginPath(); context.moveTo(centerX, top - 4); context.lineTo(centerX, top + graphHeight + 4); context.stroke()
  context.strokeStyle = "#00d4ff"; context.shadowColor = "#00d4ff"
  for (let i = 0; i < segments; i++) {
    const angle1 = (i / segments) * totalAngle, angle2 = ((i + 1) / segments) * totalAngle
    const cos1 = Math.cos(angle1 + animationOffset), cos2 = Math.cos(angle2 + animationOffset)
    const depth = ((cos1 + cos2) * 0.5 + 1) * 0.5
    context.globalAlpha = (0.15 + depth * 0.75) * fade
    context.lineWidth = 0.8 + depth * 1.5
    context.shadowBlur = 2 + depth * 7
    context.setLineDash(depth < 0.3 ? [2, 3] : [])
    context.beginPath()
    context.moveTo(centerX + (graphWidth / 2) * cos1, top + (angle1 / totalAngle) * graphHeight)
    context.lineTo(centerX + (graphWidth / 2) * cos2, top + (angle2 / totalAngle) * graphHeight)
    context.stroke()
  }
  context.setLineDash([])
  context.restore()
}

function doodleMatrix(context: CanvasRenderingContext2D, centerX: number, centerY: number, cellWidth: number, cellHeight: number, fade: number) {
  const values = [[2, -1, 0], [-1, 2, -1], [0, -1, 2]]
  const matrixWidth = cellWidth * 3, matrixHeight = cellHeight * 3, left = centerX - matrixWidth / 2, top = centerY - matrixHeight / 2
  context.save()
  context.globalAlpha = 0.78 * fade; context.fillStyle = "#c77dff"
  context.shadowColor = "#c77dff"; context.shadowBlur = 8
  context.font = `600 ${Math.round(cellHeight * 0.72)}px 'Caveat', cursive`
  context.textAlign = "center"; context.textBaseline = "middle"
  values.forEach((row, rowIndex) => row.forEach((value, columnIndex) =>
    context.fillText(String(value), left + columnIndex * cellWidth + cellWidth / 2, top + rowIndex * cellHeight + cellHeight / 2)
  ))
  context.strokeStyle = "#c77dff"; context.lineWidth = 2; context.shadowBlur = 6
  const bracketWidth = 7, pad = 4
  ;[[left - pad, left - pad + bracketWidth], [left + matrixWidth + pad - bracketWidth, left + matrixWidth + pad]].forEach(([x0, x1]) => {
    const isLeft = x1 < centerX
    context.beginPath()
    context.moveTo(isLeft ? x1 : x0, top - pad); context.lineTo(isLeft ? x0 : x1, top - pad)
    context.lineTo(isLeft ? x0 : x1, top + matrixHeight + pad); context.lineTo(isLeft ? x1 : x0, top + matrixHeight + pad)
    context.stroke()
  })
  context.restore()
}

function doodleAtom(context: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, timestamp: number, fade: number) {
  context.save()
  context.globalAlpha = 0.85 * fade; context.fillStyle = "#ffe033"
  context.shadowColor = "#ffe033"; context.shadowBlur = 12
  context.beginPath(); context.arc(centerX, centerY, radius * 0.16, 0, Math.PI * 2); context.fill()
  ;[0, Math.PI / 3, -Math.PI / 3].forEach((tilt, orbitIndex) => {
    context.save()
    context.translate(centerX, centerY); context.rotate(tilt)
    context.globalAlpha = 0.30 * fade; context.strokeStyle = "#ffe033"
    context.lineWidth = 1; context.shadowColor = "#ffe033"; context.shadowBlur = 3
    context.beginPath(); context.ellipse(0, 0, radius, radius * 0.32, 0, 0, Math.PI * 2); context.stroke()
    const electronAngle = timestamp * 0.0015 + orbitIndex * (Math.PI * 2 / 3)
    context.globalAlpha = 0.9 * fade; context.fillStyle = "#ff6ec7"
    context.shadowColor = "#ff6ec7"; context.shadowBlur = 8
    context.beginPath(); context.arc(radius * Math.cos(electronAngle), radius * 0.32 * Math.sin(electronAngle), radius * 0.09, 0, Math.PI * 2); context.fill()
    context.restore()
  })
  context.restore()
}

function doodleFibonacci(context: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, fade: number) {
  context.save()
  context.globalAlpha = 0.65 * fade; context.strokeStyle = "#ff9d00"
  context.lineWidth = 1.5; context.shadowColor = "#ff9d00"; context.shadowBlur = 6
  context.beginPath()
  const growthRate = 0.25, baseRadius = radius * 0.05
  for (let i = 0; i <= 320; i++) {
    const theta = (i / 320) * Math.PI * 4, spiralRadius = baseRadius * Math.exp(growthRate * theta)
    if (spiralRadius > radius) break
    i === 0 ? context.moveTo(centerX + spiralRadius * Math.cos(theta), centerY + spiralRadius * Math.sin(theta))
      : context.lineTo(centerX + spiralRadius * Math.cos(theta), centerY + spiralRadius * Math.sin(theta))
  }
  context.stroke()
  context.restore()
}

function doodleVenn(context: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, fade: number) {
  context.save()
  const offset = radius * 0.55, color = "#ff6ec7"
  context.globalAlpha = 0.18 * fade; context.fillStyle = color
  context.beginPath(); context.arc(centerX - offset * 0.5, centerY, radius, 0, Math.PI * 2); context.fill()
  context.beginPath(); context.arc(centerX + offset * 0.5, centerY, radius, 0, Math.PI * 2); context.fill()
  context.globalAlpha = 0.55 * fade; context.strokeStyle = color
  context.lineWidth = 1.5; context.shadowColor = color; context.shadowBlur = 6
  context.beginPath(); context.arc(centerX - offset * 0.5, centerY, radius, 0, Math.PI * 2); context.stroke()
  context.beginPath(); context.arc(centerX + offset * 0.5, centerY, radius, 0, Math.PI * 2); context.stroke()
  context.restore()
}

function doodleTriangle(context: CanvasRenderingContext2D, centerX: number, centerY: number, size: number, fade: number) {
  context.save()
  const half = size * 0.5, color = "#ffe033"
  const points: [number, number][] = [[centerX - half, centerY + half], [centerX + half, centerY + half], [centerX - half, centerY - half]]
  context.globalAlpha = 0.7 * fade; context.strokeStyle = color
  context.lineWidth = 1.8; context.shadowColor = color; context.shadowBlur = 7
  context.beginPath(); context.moveTo(...points[0]); context.lineTo(...points[1]); context.lineTo(...points[2]); context.closePath(); context.stroke()
  const markSize = size * 0.12, [baseX, baseY] = points[0]
  context.globalAlpha = 0.5 * fade; context.lineWidth = 1.2; context.shadowBlur = 4
  context.beginPath(); context.moveTo(baseX + markSize, baseY); context.lineTo(baseX + markSize, baseY - markSize); context.lineTo(baseX, baseY - markSize); context.stroke()
  context.globalAlpha = 0.45 * fade; context.lineWidth = 1; context.shadowBlur = 3
  context.beginPath(); context.arc(points[1][0], points[1][1], size * 0.18, Math.PI, Math.PI + Math.PI / 4); context.stroke()
  context.restore()
}

function doodleStar(context: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, fade: number) {
  context.save()
  context.globalAlpha = 0.55 * fade; context.strokeStyle = "#ffe033"
  context.lineWidth = 1.5; context.shadowColor = "#ffe033"; context.shadowBlur = 8
  context.fillStyle = "rgba(255,224,51,0.08)"
  const inner = radius * 0.38
  context.beginPath()
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2, pointRadius = i % 2 === 0 ? radius : inner
    i === 0 ? context.moveTo(centerX + pointRadius * Math.cos(angle), centerY + pointRadius * Math.sin(angle))
      : context.lineTo(centerX + pointRadius * Math.cos(angle), centerY + pointRadius * Math.sin(angle))
  }
  context.closePath(); context.fill(); context.stroke()
  context.restore()
}

function doodleNumberLine(context: CanvasRenderingContext2D, centerX: number, centerY: number, lineLength: number, fade: number) {
  context.save()
  const color = "#c77dff"
  context.globalAlpha = 0.6 * fade; context.strokeStyle = color
  context.lineWidth = 1.5; context.shadowColor = color; context.shadowBlur = 5
  context.beginPath(); context.moveTo(centerX - lineLength / 2, centerY); context.lineTo(centerX + lineLength / 2, centerY); context.stroke()
  const arrowSize = 5; context.beginPath()
  context.moveTo(centerX + lineLength / 2, centerY); context.lineTo(centerX + lineLength / 2 - arrowSize, centerY - 3)
  context.moveTo(centerX + lineLength / 2, centerY); context.lineTo(centerX + lineLength / 2 - arrowSize, centerY + 3)
  context.moveTo(centerX - lineLength / 2, centerY); context.lineTo(centerX - lineLength / 2 + arrowSize, centerY - 3)
  context.moveTo(centerX - lineLength / 2, centerY); context.lineTo(centerX - lineLength / 2 + arrowSize, centerY + 3)
  context.stroke()
  context.globalAlpha = 0.5 * fade; context.lineWidth = 1; context.shadowBlur = 3
  context.fillStyle = color; context.font = `600 10px 'Caveat', cursive`
  context.textAlign = "center"; context.textBaseline = "top"
  for (let value = -2; value <= 2; value++) {
    const x = centerX + value * (lineLength / 4)
    context.beginPath(); context.moveTo(x, centerY - (value === 0 ? 7 : 5)); context.lineTo(x, centerY + (value === 0 ? 7 : 5)); context.stroke()
    context.fillText(String(value), x, centerY + 8)
  }
  context.restore()
}

function doodleRocket(context: CanvasRenderingContext2D, centerX: number, centerY: number, rocketHeight: number, timestamp: number, fade: number) {
  const bodyWidth = rocketHeight * 0.32
  const bodyTop = centerY - rocketHeight * 0.46
  const bodyBottom = centerY + rocketHeight * 0.18
  const noseHeight = rocketHeight * 0.38
  const finHeight = rocketHeight * 0.26
  const finWidth = bodyWidth * 1.6
  context.save()

  context.globalAlpha = 0.55 * fade
  context.strokeStyle = "#FF7043"; context.fillStyle = "rgba(255,112,67,0.18)"
  context.lineWidth = 1.3; context.shadowColor = "#FF7043"; context.shadowBlur = 6
  context.beginPath()
  context.moveTo(centerX - bodyWidth, bodyBottom - finHeight)
  context.lineTo(centerX - bodyWidth - finWidth, bodyBottom + rocketHeight * 0.10)
  context.lineTo(centerX - bodyWidth, bodyBottom)
  context.closePath(); context.fill(); context.stroke()
  context.beginPath()
  context.moveTo(centerX + bodyWidth, bodyBottom - finHeight)
  context.lineTo(centerX + bodyWidth + finWidth, bodyBottom + rocketHeight * 0.10)
  context.lineTo(centerX + bodyWidth, bodyBottom)
  context.closePath(); context.fill(); context.stroke()

  context.globalAlpha = 0.50 * fade
  context.fillStyle = "rgba(255,112,67,0.15)"; context.strokeStyle = "#FF7043"
  context.lineWidth = 1.5; context.shadowBlur = 8
  context.beginPath()
  context.moveTo(centerX - bodyWidth, bodyBottom)
  context.lineTo(centerX - bodyWidth, bodyTop)
  context.quadraticCurveTo(centerX - bodyWidth, bodyTop - noseHeight * 0.4, centerX, bodyTop - noseHeight)
  context.quadraticCurveTo(centerX + bodyWidth, bodyTop - noseHeight * 0.4, centerX + bodyWidth, bodyTop)
  context.lineTo(centerX + bodyWidth, bodyBottom)
  context.closePath(); context.fill(); context.stroke()

  context.globalAlpha = 0.70 * fade
  context.strokeStyle = "#FFD740"; context.fillStyle = "rgba(255,215,64,0.18)"
  context.lineWidth = 1.2; context.shadowColor = "#FFD740"; context.shadowBlur = 7
  context.beginPath(); context.arc(centerX, centerY - rocketHeight * 0.08, bodyWidth * 0.55, 0, Math.PI * 2)
  context.fill(); context.stroke()

  const flicker = 0.85 + 0.15 * Math.sin(timestamp * 0.014)
  const innerFlicker = 0.72 + 0.28 * Math.sin(timestamp * 0.018 + 1.2)
  const flameHeight = rocketHeight * 0.32 * flicker
  const flameWidth = bodyWidth * 0.75
  context.globalAlpha = 0.80 * fade
  context.strokeStyle = "#FF7043"; context.lineWidth = 1.4
  context.shadowColor = "#FF7043"; context.shadowBlur = 8
  context.lineCap = "round"
  context.beginPath()
  context.moveTo(centerX - flameWidth, bodyBottom)
  context.quadraticCurveTo(centerX - flameWidth * 0.3, bodyBottom + flameHeight * 0.5, centerX, bodyBottom + flameHeight)
  context.quadraticCurveTo(centerX + flameWidth * 0.3, bodyBottom + flameHeight * 0.5, centerX + flameWidth, bodyBottom)
  context.stroke()
  context.globalAlpha = 0.90 * fade
  context.strokeStyle = "#FFD740"; context.lineWidth = 1.1
  context.shadowColor = "#FFD740"; context.shadowBlur = 7
  context.beginPath()
  context.moveTo(centerX - flameWidth * 0.38, bodyBottom)
  context.quadraticCurveTo(centerX, bodyBottom + flameHeight * innerFlicker, centerX + flameWidth * 0.38, bodyBottom)
  context.stroke()
  context.globalAlpha = 0.60 * fade
  context.strokeStyle = "#FFD740"; context.lineWidth = 0.8; context.shadowBlur = 5
  context.beginPath()
  context.moveTo(centerX, bodyBottom)
  context.lineTo(centerX, bodyBottom + flameHeight * 1.12 * flicker)
  context.stroke()

  context.shadowBlur = 0
  for (let i = 0; i < 3; i++) {
    const phase = (timestamp * 0.0012 + i * 0.9) % 1
    const sparkY = bodyBottom + flameHeight + phase * rocketHeight * 0.5
    const sparkX = centerX + Math.sin(timestamp * 0.003 + i * 2.1) * bodyWidth * 0.4
    const sparkRadius = bodyWidth * 0.22 * (1 - phase * 0.5)
    context.globalAlpha = 0.25 * (1 - phase) * fade
    context.fillStyle = "#FFB74D"
    context.beginPath(); context.arc(sparkX, sparkY, sparkRadius, 0, Math.PI * 2); context.fill()
  }
  context.restore()
}

function doodleDNA(context: CanvasRenderingContext2D, centerX: number, centerY: number, graphWidth: number, graphHeight: number, timestamp: number, fade: number) {
  const top = centerY - graphHeight / 2
  const segments = 60
  const twists = 3.0
  const animationOffset = timestamp * 0.0007
  context.save()

  context.lineWidth = 0.9; context.shadowBlur = 3
  for (let i = 0; i <= segments; i++) {
    const fraction = i / segments
    const y = top + fraction * graphHeight
    const angle = fraction * Math.PI * 2 * twists + animationOffset
    const x1 = centerX + (graphWidth / 2) * Math.cos(angle)
    const x2 = centerX + (graphWidth / 2) * Math.cos(angle + Math.PI)
    const crossness = Math.abs(Math.sin(angle))
    if (crossness > 0.55 && i % 3 === 0) {
      context.globalAlpha = crossness * 0.45 * fade
      context.strokeStyle = "#f48fb1"; context.shadowColor = "#f48fb1"
      context.beginPath(); context.moveTo(x1, y); context.lineTo(x2, y); context.stroke()
    }
  }

  for (let i = 0; i < segments; i++) {
    const fraction1 = i / segments, fraction2 = (i + 1) / segments
    const angle1 = fraction1 * Math.PI * 2 * twists + animationOffset
    const angle2 = fraction2 * Math.PI * 2 * twists + animationOffset
    const depth = (Math.cos(angle1) + 1) * 0.5
    context.globalAlpha = (0.15 + depth * 0.70) * fade
    context.strokeStyle = "#ff6ec7"; context.shadowColor = "#ff6ec7"
    context.lineWidth = 0.8 + depth * 1.8
    context.shadowBlur = 2 + depth * 9
    context.setLineDash(depth < 0.25 ? [2, 3] : [])
    context.beginPath()
    context.moveTo(centerX + (graphWidth / 2) * Math.cos(angle1), top + fraction1 * graphHeight)
    context.lineTo(centerX + (graphWidth / 2) * Math.cos(angle2), top + fraction2 * graphHeight)
    context.stroke()
  }

  for (let i = 0; i < segments; i++) {
    const fraction1 = i / segments, fraction2 = (i + 1) / segments
    const angle1 = fraction1 * Math.PI * 2 * twists + animationOffset + Math.PI
    const angle2 = fraction2 * Math.PI * 2 * twists + animationOffset + Math.PI
    const depth = (Math.cos(angle1) + 1) * 0.5
    context.globalAlpha = (0.15 + depth * 0.70) * fade
    context.strokeStyle = "#00d4ff"; context.shadowColor = "#00d4ff"
    context.lineWidth = 0.8 + depth * 1.8
    context.shadowBlur = 2 + depth * 9
    context.setLineDash(depth < 0.25 ? [2, 3] : [])
    context.beginPath()
    context.moveTo(centerX + (graphWidth / 2) * Math.cos(angle1), top + fraction1 * graphHeight)
    context.lineTo(centerX + (graphWidth / 2) * Math.cos(angle2), top + fraction2 * graphHeight)
    context.stroke()
  }

  const beadFractionA = ((timestamp * 0.0004) % 1)
  const beadAngleA = beadFractionA * Math.PI * 2 * twists + animationOffset
  context.setLineDash([])
  context.globalAlpha = 0.90 * fade
  context.fillStyle = "#ff6ec7"; context.shadowColor = "#ff6ec7"; context.shadowBlur = 10
  context.beginPath(); context.arc(centerX + (graphWidth / 2) * Math.cos(beadAngleA), top + beadFractionA * graphHeight, 2.5, 0, Math.PI * 2); context.fill()

  const beadFractionB = ((timestamp * 0.0004 + 0.5) % 1)
  const beadAngleB = beadFractionB * Math.PI * 2 * twists + animationOffset + Math.PI
  context.fillStyle = "#00d4ff"; context.shadowColor = "#00d4ff"
  context.beginPath(); context.arc(centerX + (graphWidth / 2) * Math.cos(beadAngleB), top + beadFractionB * graphHeight, 2.5, 0, Math.PI * 2); context.fill()

  context.restore()
}

function doodleLightbulb(context: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, timestamp: number, fade: number) {
  const baseTop = centerY + radius * 0.55
  const baseHeight = radius * 0.28
  const baseWidth = radius * 0.62
  const filamentHeight = radius * 0.35
  const pulse = 0.80 + 0.20 * Math.sin(timestamp * 0.004)
  context.save()

  context.globalAlpha = 0.10 * pulse * fade
  const glowGradient = context.createRadialGradient(centerX, centerY - radius * 0.1, radius * 0.2, centerX, centerY - radius * 0.1, radius * 1.55)
  glowGradient.addColorStop(0, "#FFD740"); glowGradient.addColorStop(1, "transparent")
  context.fillStyle = glowGradient
  context.beginPath(); context.arc(centerX, centerY - radius * 0.1, radius * 1.55, 0, Math.PI * 2); context.fill()

  context.globalAlpha = 0.55 * fade
  context.strokeStyle = "#FFD740"; context.lineWidth = 1.5
  context.shadowColor = "#FFD740"; context.shadowBlur = 8 + 6 * pulse
  context.fillStyle = `rgba(255,215,64,${0.08 * pulse})`
  context.beginPath(); context.arc(centerX, centerY, radius, 0, Math.PI * 2); context.fill(); context.stroke()

  context.globalAlpha = 0.80 * pulse * fade
  context.strokeStyle = "#FFD740"; context.lineWidth = 1.2; context.shadowBlur = 10
  context.beginPath()
  context.moveTo(centerX - baseWidth * 0.55, centerY + radius * 0.25)
  context.lineTo(centerX - baseWidth * 0.55, centerY + radius * 0.25 - filamentHeight * 0.4)
  context.quadraticCurveTo(centerX - baseWidth * 0.2, centerY - filamentHeight * 0.2, centerX, centerY - filamentHeight * 0.5)
  context.quadraticCurveTo(centerX + baseWidth * 0.2, centerY - filamentHeight * 0.2, centerX + baseWidth * 0.55, centerY + radius * 0.25 - filamentHeight * 0.4)
  context.lineTo(centerX + baseWidth * 0.55, centerY + radius * 0.25)
  context.stroke()

  context.globalAlpha = 0.55 * fade
  context.lineWidth = 1.3; context.shadowBlur = 5
  ;[0, 1, 2].forEach(i => {
    const bandY = baseTop + i * (baseHeight / 2.5)
    const bandHalfWidth = baseWidth * (1 - i * 0.12)
    context.beginPath(); context.moveTo(centerX - bandHalfWidth, bandY); context.lineTo(centerX + bandHalfWidth, bandY); context.stroke()
  })

  context.lineWidth = 1.0; context.shadowBlur = 4
  const rayCount = 8
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2 + timestamp * 0.0008
    const innerRadius = radius * 1.15
    const outerRadius = radius * (1.45 + 0.12 * Math.sin(timestamp * 0.005 + i))
    context.globalAlpha = 0.30 * pulse * fade
    context.beginPath()
    context.moveTo(centerX + innerRadius * Math.cos(angle), centerY + innerRadius * Math.sin(angle))
    context.lineTo(centerX + outerRadius * Math.cos(angle), centerY + outerRadius * Math.sin(angle))
    context.stroke()
  }
  context.restore()
}

const TILE_COLORS: [string, string][] = [
  ["#ff6ec7", "rgba(255,110,199,0.20)"],
  ["#39ff14", "rgba(57,255,20,0.20)"],
  ["#ffe033", "rgba(255,224,51,0.20)"],
  ["#00d4ff", "rgba(0,212,255,0.20)"],
  ["#ff9d00", "rgba(255,157,0,0.20)"],
  ["#c77dff", "rgba(199,125,255,0.20)"],
]

function doodleNumtiles(context: CanvasRenderingContext2D, centerX: number, centerY: number, tileWidth: number, _timestamp: number, fade: number, order: number[], colorIndices: number[], numbers: number[]) {
  const columns = 3, rows = 3
  const gap = tileWidth * 0.18
  const totalWidth = columns * tileWidth + (columns - 1) * gap
  const totalHeight = rows * tileWidth + (rows - 1) * gap
  const left = centerX - totalWidth / 2
  const top = centerY - totalHeight / 2
  context.save()
  context.font = `700 ${Math.round(tileWidth * 0.55)}px 'Caveat', cursive`
  context.textAlign = "center"; context.textBaseline = "middle"

  for (let i = 0; i < 9; i++) {
    const idx = order[i]
    const row = (idx / columns) | 0, col = idx % columns
    const [stroke, fill] = TILE_COLORS[colorIndices[idx]]
    const number = numbers[idx]
    const x = left + col * (tileWidth + gap)
    const y = top + row * (tileWidth + gap)
    const cornerRadius = tileWidth * 0.22

    context.globalAlpha = 0.62 * fade
    context.fillStyle = fill
    context.strokeStyle = stroke
    context.lineWidth = 1.3
    context.shadowColor = stroke; context.shadowBlur = 6
    context.beginPath()
    context.moveTo(x + cornerRadius, y)
    context.lineTo(x + tileWidth - cornerRadius, y); context.arcTo(x + tileWidth, y, x + tileWidth, y + cornerRadius, cornerRadius)
    context.lineTo(x + tileWidth, y + tileWidth - cornerRadius); context.arcTo(x + tileWidth, y + tileWidth, x + tileWidth - cornerRadius, y + tileWidth, cornerRadius)
    context.lineTo(x + cornerRadius, y + tileWidth); context.arcTo(x, y + tileWidth, x, y + tileWidth - cornerRadius, cornerRadius)
    context.lineTo(x, y + cornerRadius); context.arcTo(x, y, x + cornerRadius, y, cornerRadius)
    context.closePath()
    context.fill(); context.stroke()

    context.globalAlpha = 0.85 * fade
    context.fillStyle = stroke
    context.shadowBlur = 9
    context.fillText(String(number), x + tileWidth / 2, y + tileWidth / 2)
  }
  context.restore()
}

function drawDoodle(context: CanvasRenderingContext2D, doodle: Doodle, timestamp: number, fade: number) {
  const params = doodle.params
  switch (doodle.type) {
    case 'gear':       doodleGear(context, doodle.cx, doodle.cy, params.radius, timestamp, fade); break
    case 'sine':       doodleSineGraph(context, doodle.cx, doodle.cy, params.graphWidth, params.graphHeight, timestamp, fade); break
    case 'helix':      doodleHelix(context, doodle.cx, doodle.cy, params.graphWidth, params.graphHeight, timestamp, fade); break
    case 'matrix':     doodleMatrix(context, doodle.cx, doodle.cy, params.cellWidth, params.cellHeight, fade); break
    case 'atom':       doodleAtom(context, doodle.cx, doodle.cy, params.radius, timestamp, fade); break
    case 'fibonacci':  doodleFibonacci(context, doodle.cx, doodle.cy, params.radius, fade); break
    case 'venn':       doodleVenn(context, doodle.cx, doodle.cy, params.radius, fade); break
    case 'triangle':   doodleTriangle(context, doodle.cx, doodle.cy, params.size, fade); break
    case 'star':       doodleStar(context, doodle.cx, doodle.cy, params.radius, fade); break
    case 'numberLine': doodleNumberLine(context, doodle.cx, doodle.cy, params.lineLength, fade); break
    case 'rocket':     doodleRocket(context, doodle.cx, doodle.cy, params.rocketHeight, timestamp, fade); break
    case 'dna':        doodleDNA(context, doodle.cx, doodle.cy, params.graphWidth, params.graphHeight, timestamp, fade); break
    case 'lightbulb':  doodleLightbulb(context, doodle.cx, doodle.cy, params.radius, timestamp, fade); break
    case 'numtiles':   doodleNumtiles(context, doodle.cx, doodle.cy, params.tileWidth, timestamp, fade, params.order, params.colorIndices, params.numbers); break
  }
}

// ── Orchestration ─────────────────────────────────────────────────────────────
export function showHomeLightboard(): void {
  if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null }
  if (mutationTimer) { clearTimeout(mutationTimer); mutationTimer = null }
  currentFirework = null; animationStartTimestamp = null

  const canvas = document.getElementById("home-lb-canvas") as HTMLCanvasElement | null
  const lightboardElement = document.getElementById("home-lightboard")
  if (!canvas || !lightboardElement) return

  canvas.width = lightboardElement.offsetWidth || 640
  canvas.height = lightboardElement.offsetHeight || 300
  const width = canvas.width, height = canvas.height

  lightboardConfig = buildConfig(width, height)
  const config = lightboardConfig

  const doodleReserved = () => config.doodles.map(d => {
    const size = DOODLE_SIZE_PCT[d.type]
    return { cx: d.pctCX, cy: d.pctCY, halfWidthPct: size.radiusWidthPct * 1.4, halfHeightPct: size.radiusHeightPct * 1.4 }
  })

  const poolOrder = EQUATION_POOL.map((_, i) => i).sort(() => Math.random() - 0.5)
  const count = 9 + Math.floor(Math.random() * 4)
  const selectedIndices = poolOrder.slice(0, count)
  const selected = selectedIndices.map(i => EQUATION_POOL[i])
  const styles = selected.map(item => pickTextStyle(item.text))
  const positions = findRandomPositions(styles, doodleReserved())
  const actual = positions.length

  interface TextEntry {
    kind: "text"
    item: LightboardItem
    pos: { x: number; y: number; wPct: number; hPct: number }
    delay: number
    poolIndex: number
    fontFamily: string
    fontWeight: number
    fontSize: number
  }

  const textEntries: TextEntry[] = selected.slice(0, actual).map((item, i) => ({
    kind: "text" as const, item, pos: positions[i], delay: 0, poolIndex: selectedIndices[i],
    fontFamily: styles[i].family, fontWeight: styles[i].weight, fontSize: styles[i].size,
  }))
  const doodleEntries = config.doodles.map(d => ({ kind: "doodle" as const, d }))
  const allEntries = [...textEntries, ...doodleEntries].sort(() => Math.random() - 0.5)
  let delaySeconds = 1 + Math.random() * 2
  allEntries.forEach(entry => {
    if (entry.kind === "text") { (entry as TextEntry).delay = delaySeconds }
    else { entry.d.showMs = delaySeconds * 1000 }
    delaySeconds += 3 + Math.random() * 4
  })

  const surface = document.getElementById("home-lb-surface")
  if (!surface) return
  surface.innerHTML = ""

  const activeItems: { item: LightboardItem; pos: { x: number; y: number; wPct?: number; hPct?: number }; el: HTMLElement; poolIndex: number }[] = []
  const usedPool = new Set(selectedIndices.slice(0, actual))

  function createTextElement(item: LightboardItem, pos: { x: number; y: number }, delaySec: number, fontFamily: string, fontWeight: number, fontSize: number): HTMLElement {
    const el = document.createElement("div")
    el.className = "home-lb-item"
    el.innerHTML = item.text + " "
    el.style.left = pos.x.toFixed(1) + "%"
    el.style.top = pos.y.toFixed(1) + "%"
    el.style.color = item.color
    el.style.textShadow = `0 0 8px ${item.glow}, 0 0 18px ${item.glow}`
    el.style.fontFamily = fontFamily + ", cursive"
    el.style.fontWeight = String(fontWeight)
    el.style.fontSize = fontSize + "px"
    el.style.animationDelay = delaySec.toFixed(2) + "s"
    const lbEl = document.getElementById("home-lightboard")
    el.dataset.origFontPx = String(fontSize)
    el.dataset.origBoardW = String(lbEl ? lbEl.offsetWidth : 640)
    return el
  }

  textEntries.forEach(({ item, pos, delay, fontFamily, fontWeight, fontSize, poolIndex }) => {
    const el = createTextElement(item, pos, delay, fontFamily, fontWeight, fontSize)
    surface.appendChild(el)
    activeItems.push({ item, pos, el, poolIndex })
  })

  function addItem() {
    const available = EQUATION_POOL.map((_, i) => i).filter(i => !usedPool.has(i))
    if (!available.length) return
    const poolIndex = available[Math.floor(Math.random() * available.length)]
    const item = EQUATION_POOL[poolIndex]
    const style = pickTextStyle(item.text)
    const spots = findRandomPositions([style], doodleReserved(), activeItems.map(a => a.pos))
    if (!spots.length) return
    const pos = spots[0]
    const el = createTextElement(item, pos, 0, style.family, style.weight, style.size)
    surface!.appendChild(el)
    activeItems.push({ item, pos, el, poolIndex })
    usedPool.add(poolIndex)
  }

  function removeItem() {
    if (activeItems.length <= 4) return
    const idx = Math.floor(Math.random() * activeItems.length)
    const { el, poolIndex } = activeItems.splice(idx, 1)[0]
    usedPool.delete(poolIndex)
    el.style.transition = "opacity 1.8s ease"
    el.style.opacity = "0"
    setTimeout(() => el.remove(), 1800)
  }

  function scheduleMutation() {
    mutationTimer = setTimeout(() => {
      if (Math.random() < 0.6 || activeItems.length < 5) addItem()
      else removeItem()
      scheduleMutation()
    }, 6000 + Math.random() * 9000)
  }
  scheduleMutation()

  let nextFireworkAt = Infinity

  function frame(timestamp: number) {
    animationFrameId = requestAnimationFrame(frame)
    if (!animationStartTimestamp) { animationStartTimestamp = timestamp; nextFireworkAt = timestamp + 4500 }
    const elapsed = timestamp - animationStartTimestamp
    const context = canvas!.getContext("2d")!
    const canvasWidth = canvas!.width, canvasHeight = canvas!.height
    context.clearRect(0, 0, canvasWidth, canvasHeight)

    config.doodles.forEach(d => {
      const fade = Math.min(1, Math.max(0, (elapsed - d.showMs) / 2500))
      if (fade > 0) drawDoodle(context, d, timestamp, fade)
    })

    if (!currentFirework && timestamp >= nextFireworkAt) { currentFirework = createFirework(canvasWidth, canvasHeight); nextFireworkAt = timestamp + 9000 + Math.random() * 5000 }
    if (currentFirework && updateFirework(context, currentFirework, timestamp)) currentFirework = null
  }

  animationFrameId = requestAnimationFrame(frame)
}

export function hideHomeLightboard(): void {
  if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null }
  if (mutationTimer) { clearTimeout(mutationTimer); mutationTimer = null }
  currentFirework = null
}
